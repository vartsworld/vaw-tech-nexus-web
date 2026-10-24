import { toPaise } from '@vawpay/common';
import { extractIntelligentAmount } from './bank-sms-parser.js';

export { extractIntelligentAmount };

/**
 * Bank email parser for extracting UPI credit alerts across Indian banks:
 * HDFC, ICICI, SBI, Axis, Kotak, Paytm Payments Bank, custom alt-account transfers, etc.
 */
export class BankEmailParser {
  /**
   * Parses raw email subject and body text into a canonical observation payload.
   * @param {{
   *   subject: string,
   *   body: string,
   *   from?: string,
   *   date?: Date | string
   * }} email
   * @returns {{
   *   amountPaise: bigint,
   *   amount: string,
   *   bankReferenceNumber?: string,
   *   senderVpa?: string,
   *   observedAt: Date,
   *   rawSnippet: string
   * } | null}
   */
  static parse(email) {
    if (!email) return null;
    const combinedText = `${email.subject || ''} ${email.body || ''}`.trim();
    if (!combinedText) return null;

    // Check if email represents an incoming credit/payment. A bare "payment" or "transferred"
    // without credit context is rejected, but "transferred to your account" and "payment of
    // Rs 500" are genuine credits and must still be recognised.
    const creditKeywords = new RegExp(
      '\\b(?:credited|credit|received|deposit(?:ed)?|payment\\s+received|upi\\/cr' +
      '|transferred\\s+to\\s+(?:your\\s+)?(?:a\\/c|account|wallet)' +
      '|payment\\s+of\\s+(?:(?:rs\\b\\.?|inr\\b)\\s*)?[\\d,.]+\\s+(?:has\\s+been\\s+)?made\\s+to\\s+(?:your\\s+)?(?:a\\/c|account|wallet)' +
      '|added\\s+to\\s+(?:your\\s+)?(?:account|wallet))\\b',
      'i'
    );
    if (!creditKeywords.test(combinedText)) {
      return null; // Ignore non-credit alerts
    }

    // Reject debit notifications. A debit that appears before any credit means the message is
    // about money leaving the account; a debit mentioned after a credit (e.g. "Rs 500 credited.
    // Rs 10 debited for charges") must not cancel the credit.
    const debitIdx = combinedText.search(/\b(?:debited|withdrawn|deducted|spent|paid rs|sent rs)\b/i);
    const creditIdx = combinedText.search(/\b(?:credited|credit|received|deposit|deposited)\b/i);
    if (debitIdx !== -1 && (creditIdx === -1 || debitIdx < creditIdx)) {
      return null;
    }

    // 1. Extract Monetary Amount using Intelligent Multi-Pattern Extractor
    const extractedAmount = extractIntelligentAmount(combinedText);
    if (!extractedAmount) {
      return null;
    }

    // 2. Extract Bank Reference / UTR Number
    // Matches: UTR: 123456789012, Ref no: UTR-HDFC-9911, Ref: UTR-GMAIL-777, UPI/CR/123456789/, 12-digit UTR
    let bankRef;
    const refMatch = combinedText.match(/(?:utr|ref(?:\s*no)?|txn(?:\s*id)?|rrn)[:\s#]+([a-zA-Z0-9\-_]{6,35})/i);
    if (refMatch && refMatch[1]) {
      bankRef = refMatch[1].trim();
    } else {
      const upiCrMatch = combinedText.match(/UPI\/CR\/([a-zA-Z0-9\-_]+)/i);
      if (upiCrMatch && upiCrMatch[1]) {
        bankRef = upiCrMatch[1].trim();
      } else {
        const d12Match = combinedText.match(/\b([0-9]{12})\b/);
        if (d12Match && d12Match[1]) {
          bankRef = d12Match[1].trim();
        }
      }
    }

    // 3. Extract Sender VPA
    let senderVpa;
    const vpaMatch = combinedText.match(/(?:from|by|vpa)\s+([a-zA-Z0-9.\-_]{2,100}@[a-zA-Z0-9.\-_]{2,64})/i);
    if (vpaMatch && vpaMatch[1]) {
      senderVpa = vpaMatch[1].trim().replace(/[.,;]+$/, '');
    }

    // 4. Timestamp
    let observedAt = new Date();
    if (email.date) {
      const parsedDate = new Date(email.date);
      if (!isNaN(parsedDate.getTime())) {
        observedAt = parsedDate;
      }
    }

    return {
      amountPaise: extractedAmount.amountPaise,
      amount: extractedAmount.amountStr,
      bankReferenceNumber: bankRef,
      senderVpa,
      observedAt,
      rawSnippet: combinedText.substring(0, 300)
    };
  }
}
