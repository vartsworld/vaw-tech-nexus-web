// --- STATE MANAGEMENT ---
let currentAmount = 1.00;
const photos = [
  {
    url: '/assets/gateway_pc_checkout.png?v=2',
    badge: '💻 Desktop 2-Column Checkout',
    title: 'Desktop 2-Column Checkout',
    desc: 'Authentic desktop 2-column checkout frame with real-time dynamic QR, clean card at counter, live order summary, and verified merchant branding.'
  },
  {
    url: '/assets/gateway_mobile_checkout.png?v=2',
    badge: '📱 Mobile Instant Sheet & UPI Intent',
    title: 'Mobile Instant Sheet & UPI Intent',
    desc: 'Native fluid mobile checkout bottom sheet with instant UPI app deep-linking (GPay, PhonePe, Paytm, CRED).'
  },
  {
    url: '/assets/gateway_merchant_operations.png?v=2',
    badge: '📊 Merchant Operations & Live Slots Hub',
    title: 'Merchant Operations & Live Slots Hub',
    desc: 'Crisp bright white operations dashboard with real-time slot allocation, floating cashier till dock, and observers status.'
  },
  {
    url: '/assets/gateway_developer_dark_hub.png?v=2',
    badge: '🌙 Developer Hub (Real Dark Mode)',
    title: 'Developer Hub (Real Dark Mode)',
    desc: 'Authentic obsidian real dark mode with multi-service supervisor, live host ports, and aggregate streaming terminal.'
  },
  {
    url: '/assets/gateway_whitelabel_customizer.png?v=2',
    badge: '🎨 White-Label Customizer & Mockup',
    title: 'White-Label Customizer & Mockup',
    desc: 'Live smartphone reflection with instant brand logo, custom color palette, trust seals, and conversion banners.'
  }
];
let currentPhotoIndex = 0;

// --- GALLERY CONTROLLER ---
function switchGalleryPhoto(index, url, title, desc) {
  currentPhotoIndex = index;
  const mainImg = document.getElementById('mainGalleryImg');
  const badgeText = document.getElementById('galleryBadgeText');

  if (mainImg) {
    mainImg.style.opacity = '0.3';
    mainImg.src = url;
    setTimeout(() => { mainImg.style.opacity = '1'; }, 100);
  }
  if (badgeText) badgeText.textContent = title;

  // Update thumbnails active state
  document.querySelectorAll('.thumb-card').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
}

function openLightbox() {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  if (modal && img) {
    img.src = photos[currentPhotoIndex].url;
    modal.classList.add('active');
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// --- AMOUNT MODIFIER & BUY BOX ---
function selectAmount(amt, chipEl) {
  currentAmount = Number(amt);
  updateAmountUI();

  document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
  if (chipEl) chipEl.classList.add('active');
  const customInput = document.getElementById('customAmountInput');
  if (customInput) customInput.value = currentAmount.toFixed(2);
}

function handleCustomAmountInput(val) {
  const num = parseFloat(val);
  if (!isNaN(num) && num >= 1) {
    currentAmount = num;
    updateAmountUI();
  }
  // Unset active chips if not exact match
  document.querySelectorAll('.chip-btn').forEach(b => {
    const chipVal = parseFloat(b.innerText.replace(/[^0-9.]/g, ''));
    b.classList.toggle('active', chipVal === currentAmount);
  });
}

function updateAmountUI() {
  const formatted = '₹' + currentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dispEl = document.getElementById('displayPrice');
  const btnDisp = document.getElementById('btnAmountDisplay');
  if (dispEl) dispEl.textContent = formatted;
  if (btnDisp) btnDisp.textContent = formatted;
}

// --- PURCHASE INITIATION (Using Official Universal VAW Pay Integration) ---
async function startGatewayPurchase() {
  const btn = document.getElementById('btnInitiateCheckout');
  const oldHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Preparing Gateway Session...</span>';

  try {
    const orderId = `COIN-ORD-${Date.now()}`;
    btn.setAttribute('data-amount', currentAmount.toFixed(2));
    btn.setAttribute('data-order-id', orderId);

    // 1. Create order on store backend via VawPayClient
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price: currentAmount,
        productName: 'VAW Pay Enterprise Gateway Suite',
        coins: Math.round(currentAmount)
      })
    });

    const data = await res.json();
    if (!res.ok || !data.checkoutUrl) {
      alert(data.error || 'Failed to initiate checkout session.');
      btn.disabled = false;
      btn.innerHTML = oldHtml;
      return;
    }

    // 2. Launch checkout modal using official VawPay.pay() SDK
    window.VawPay.pay({
      checkoutUrl: data.checkoutUrl,
      order_id: data.orderId,
      amount: currentAmount,
      currency: 'INR',
      name: 'VAW Pay Store',
      description: 'VAW Pay Enterprise Suite Top-Up',
      successUrl: `/order-success?order_id=${encodeURIComponent(data.orderId)}&amount=${encodeURIComponent(currentAmount)}`,
      failedUrl: `/order-failed?order_id=${encodeURIComponent(data.orderId)}`,
      suspiciousUrl: `/order-suspicious?order_id=${encodeURIComponent(data.orderId)}`,
      expiredUrl: `/order-expired?order_id=${encodeURIComponent(data.orderId)}`,
      cancelledUrl: `/order-cancelled?order_id=${encodeURIComponent(data.orderId)}`,
      handler: function(paymentResponse) {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
        showCelebrationModal(data.orderId, paymentResponse.utr || paymentResponse.paymentId || data.paymentId, currentAmount);
      },
      onClose: function() {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
      }
    });
  } catch (err) {
    alert('Error launching VAW Pay Gateway: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = oldHtml;
  }
}

// --- OFFICIAL BROWSER PAYMENT EVENT LISTENERS ---
window.addEventListener('vawpay:payment:success', function(e) {
  console.log('[VAW Pay Event] vawpay:payment:success', e.detail);
  const res = e.detail;
  fetch('/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: res.order_id,
      amount: res.amount_received || currentAmount,
      coins: Math.round(res.amount_received || currentAmount),
      paymentId: res.utr || res.order_id
    })
  }).then(r => r.json()).then(d => {
    if (d.coins !== undefined) {
      const el = document.getElementById('topWalletBalance');
      if (el) el.textContent = d.coins;
    }
  }).catch(() => {});
});

window.addEventListener('vawpay:payment:failed', function(e) {
  console.warn('[VAW Pay Event] vawpay:payment:failed', e.detail);
});

window.addEventListener('vawpay:payment:suspicious', function(e) {
  console.warn('[VAW Pay Event] vawpay:payment:suspicious', e.detail);
});

window.addEventListener('vawpay:payment:expired', function(e) {
  console.warn('[VAW Pay Event] vawpay:payment:expired', e.detail);
});

window.addEventListener('vawpay:payment:cancelled', function(e) {
  console.log('[VAW Pay Event] vawpay:payment:cancelled', e.detail);
});

function showCelebrationModal(orderId, paymentId, amount) {
  const modal = document.getElementById('celebrationModal');
  const elOrder = document.getElementById('receiptOrderId');
  const elPayment = document.getElementById('receiptPaymentId');
  const elAmount = document.getElementById('receiptAmountPaid');

  if (elOrder) elOrder.textContent = orderId || 'VAW Pay-ORD-LIVE';
  if (elPayment) elPayment.textContent = paymentId || 'pay_verified';
  if (elAmount) elAmount.textContent = '₹' + Number(amount).toFixed(2);
  if (modal) modal.classList.add('active');
}

function closeCelebrationModal() {
  const modal = document.getElementById('celebrationModal');
  if (modal) modal.classList.remove('active');
}

// Keydown ESC to close modals
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeCelebrationModal();
  }
});

// Initialize UI on load
document.addEventListener('DOMContentLoaded', () => {
  updateAmountUI();
});
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  updateAmountUI();
}
