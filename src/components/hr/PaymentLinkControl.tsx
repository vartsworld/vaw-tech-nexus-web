import { useState } from "react";
import { Copy, ExternalLink, IndianRupee, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentRequestRow } from "@/hooks/usePaymentRequests";
import { formatPrice } from "@/lib/pricing";

interface Props {
  inquiryId: string;
  customerName: string;
  phone: string | null;
  defaultAmount: number | null;
  payment: PaymentRequestRow | undefined;
  onCreated: (row: PaymentRequestRow) => void;
}

const waDigits = (phone: string | null) => {
  const d = (phone || "").replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
};

/** Creates a VAW Pay link for a request and lets HR share it. Paid state comes from the gateway webhook, not from here. */
const PaymentLinkControl = ({ inquiryId, customerName, phone, defaultAmount, payment, onCreated }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  if (payment?.status === "paid") return null;

  const link = payment?.status === "pending" ? payment.checkout_url : null;
  const waText = (url: string, rupees: number) =>
    `Hi ${customerName}, here is your secure payment link for VAW Technologies (${formatPrice(rupees)}):\n${url}\n\nPay with any UPI app. You will get a confirmation once it's received.`;

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Payment link copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const create = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("vaw-pay-create", { body: { inquiryId, amount: value } });
    setBusy(false);
    if (error || !data?.paymentRequest) {
      let message = "Check that the payment gateway is online and configured.";
      try {
        const ctx = (error as { context?: Response } | null)?.context;
        const body = ctx ? await ctx.json() : data;
        if (body?.error) message = body.error;
      } catch {
        /* keep default */
      }
      toast({ title: "Couldn't create payment link", description: message, variant: "destructive" });
      return;
    }
    const pr = data.paymentRequest;
    onCreated({
      id: pr.id, inquiry_id: inquiryId, order_id: pr.orderId, gateway_payment_id: null, amount_paise: pr.amountPaise, currency: "INR",
      checkout_url: pr.checkoutUrl, status: pr.status, utr: null, paid_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    setOpen(false);
    toast({ title: data.reused ? "Existing payment link reused" : "Payment link created", description: formatPrice(pr.amountPaise / 100) });
  };

  return (
    <>
      {link && payment ? (
        <>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => copy(link)}>
            <Copy className="h-4 w-4" /> Copy pay link
          </Button>
          {waDigits(phone) && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <a href={`https://wa.me/${waDigits(phone)}?text=${encodeURIComponent(waText(link, payment.amount_paise / 100))}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Send link
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <a href={link} target="_blank" rel="noopener noreferrer" aria-label="Open payment page"><ExternalLink className="h-4 w-4" /></a>
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setAmount(defaultAmount ? String(Math.round(defaultAmount)) : "");
            setOpen(true);
          }}
        >
          <IndianRupee className="h-4 w-4" /> {payment ? "New pay link" : "Request payment"}
        </Button>
      )}

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request payment from {customerName}</DialogTitle>
            <DialogDescription>
              Creates a secure UPI payment link. The request is marked paid automatically when the bank credit is detected. Always confirm against the bank statement too.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`pay-amount-${inquiryId}`}>Amount to collect (₹, incl. GST)</Label>
            <Input id={`pay-amount-${inquiryId}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="e.g. 14999" autoFocus />
            {defaultAmount ? <p className="text-xs text-muted-foreground">Request total: {formatPrice(defaultAmount)}. Change it to collect an advance instead.</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={create} disabled={busy} className="gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentLinkControl;
