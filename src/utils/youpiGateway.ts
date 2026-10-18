/**
 * YouPI UPI Payment Gateway Integration Client
 * Self-Hosted White-Label UPI Payment Rails for VAW Tech Nexus
 */

export interface YoupiPaymentOptions {
  orderId: string;
  amount: number | string; // In Rupees, e.g. 10.00 or "10.00"
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  description?: string;
  gatewayApiUrl?: string; // Defaults to http://localhost:6100
  checkoutBaseUrl?: string; // Defaults to http://localhost:7000
  onSuccess?: (result: YoupiPaymentResult) => void;
  onFailed?: (error: Error | { message: string }) => void;
  onClose?: () => void;
}

export interface YoupiPaymentResult {
  paymentId: string;
  orderId: string;
  amount: string;
  amountPaise: string;
  status: 'SUCCESS' | 'PROCESSING' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  utr?: string;
}

export interface YoupiSessionResponse {
  paymentId: string;
  orderId: string;
  amount: string;
  amountPaise: string;
  currency: string;
  status: string;
  checkoutUrl: string;
  qrData?: string;
  activeWindowMs?: number;
}

/**
 * Creates a new payment session on the self-hosted YouPI Payment API.
 */
export async function createYoupiPaymentSession(
  options: YoupiPaymentOptions
): Promise<YoupiSessionResponse> {
  const apiUrl = (options.gatewayApiUrl || 'http://localhost:6100').replace(/\/+$/, '');

  const payload: Record<string, unknown> = {
    orderId: options.orderId,
    amount: String(options.amount),
    currency: options.currency || 'INR'
  };

  if (options.customerName || options.customerPhone || options.customerEmail) {
    payload.customer = {
      name: options.customerName || 'Guest Payer',
      email: options.customerEmail || '',
      mobileNumber: options.customerPhone || ''
    };
  }

  const response = await fetch(`${apiUrl}/api/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `Payment session creation failed (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data;
}

/**
 * Checks the real-time status of a payment session.
 */
export async function checkYoupiPaymentStatus(
  paymentId: string,
  apiUrl = 'http://localhost:6100'
): Promise<YoupiPaymentResult> {
  const cleanApiUrl = apiUrl.replace(/\/+$/, '');
  const response = await fetch(`${cleanApiUrl}/api/v1/payments/${encodeURIComponent(paymentId)}`);

  if (!response.ok) {
    throw new Error(`Failed to check payment status (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Launches the YouPI Checkout Modal or redirects to the checkout portal.
 * Embeds a full-screen or centered modal with the responsive payment interface.
 */
export async function openYoupiCheckout(options: YoupiPaymentOptions): Promise<void> {
  try {
    const session = await createYoupiPaymentSession(options);
    const checkoutUrl = session.checkoutUrl || `http://localhost:7000/checkout/${session.paymentId}`;

    // If running in browser, create an elegant overlay iframe modal
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const modalId = `youpi-checkout-modal-${Date.now()}`;

      const overlay = document.createElement('div');
      overlay.id = modalId;
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '999999';
      overlay.style.background = 'rgba(0, 0, 0, 0.75)';
      overlay.style.backdropFilter = 'blur(6px)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '16px';
      overlay.style.animation = 'fadeIn 0.2s ease-out';

      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.maxWidth = '460px';
      container.style.height = '680px';
      container.style.maxHeight = '92vh';
      container.style.background = '#0b0f19';
      container.style.borderRadius = '24px';
      container.style.overflow = 'hidden';
      container.style.boxShadow = '0 25px 60px rgba(0,0,0,0.6)';
      container.style.position = 'relative';
      container.style.border = '1px solid rgba(255, 255, 255, 0.1)';

      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '12px';
      closeButton.style.right = '16px';
      closeButton.style.zIndex = '10';
      closeButton.style.background = 'rgba(255,255,255,0.15)';
      closeButton.style.color = '#fff';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '50%';
      closeButton.style.width = '32px';
      closeButton.style.height = '32px';
      closeButton.style.fontSize = '20px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.display = 'flex';
      closeButton.style.alignItems = 'center';
      closeButton.style.justifyContent = 'center';

      const iframe = document.createElement('iframe');
      iframe.src = checkoutUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';

      const cleanup = () => {
        if (document.getElementById(modalId)) {
          document.body.removeChild(overlay);
        }
        window.removeEventListener('message', handleMessage);
        if (options.onClose) options.onClose();
      };

      closeButton.onclick = cleanup;
      overlay.onclick = (e) => {
        if (e.target === overlay) cleanup();
      };

      const handleMessage = (event: MessageEvent) => {
        if (!event.data) return;
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg.event === 'SUCCESS' || msg.status === 'SUCCESS') {
          if (options.onSuccess) {
            options.onSuccess({
              paymentId: session.paymentId,
              orderId: options.orderId,
              amount: String(options.amount),
              amountPaise: session.amountPaise,
              status: 'SUCCESS',
              utr: msg.utr
            });
          }
          setTimeout(cleanup, 2000);
        } else if (msg.event === 'CLOSE' || msg.event === 'CANCELLED') {
          cleanup();
        }
      };

      window.addEventListener('message', handleMessage);

      container.appendChild(closeButton);
      container.appendChild(iframe);
      overlay.appendChild(container);
      document.body.appendChild(overlay);
    } else {
      // Fallback
      window.location.href = checkoutUrl;
    }
  } catch (err) {
    if (options.onFailed) {
      options.onFailed(err as Error);
    } else {
      throw err;
    }
  }
}
