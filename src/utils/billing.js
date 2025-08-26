// src/utils/billing.js
/**
 * Stub for paid creator checkout.
 * Replace with your real Stripe/Paddle/Chargebee integration.
 * Return a promise that resolves after redirect trigger.
 */
export async function beginCreatorCheckout({ uid, email }) {
  // Example: call your server to create a checkout session and redirect
  try {
    const res = await fetch("/admin/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ uid, email }),
    });
    if (!res.ok) throw new Error("Failed to create checkout session.");
    const { url } = await res.json();
    if (url) window.location.assign(url);
  } catch (e) {
    // Fallback: until billing is ready, just guide user
    console.warn("beginCreatorCheckout stub:", e);
    alert(
      "Checkout is not wired up yet. After you connect billing, this will send users to the payment page."
    );
  }
}
