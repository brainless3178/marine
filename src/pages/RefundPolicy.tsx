export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-[var(--primary-bg)]">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="font-display text-3xl font-extrabold text-[var(--text-primary)] mb-8">Refund Policy</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Last updated: July 15, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-[var(--text-secondary)]">
          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">1. Refund Eligibility</h2>
            <p className="text-sm leading-relaxed">We offer refunds under the following conditions:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Item received is significantly different from the description</li>
              <li>Item arrives damaged or defective</li>
              <li>Item was never shipped due to our error</li>
              <li>Duplicate charges on your account</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">2. Refund Process</h2>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Contact us within 14 days of delivery at <a href="mailto:returns@alkatraders.com" className="text-[var(--accent-primary)] hover:underline">returns@alkatraders.com</a></li>
              <li>Provide your order number, item description, and reason for return</li>
              <li>Our team will review and respond within 2 business days</li>
              <li>If approved, you will receive return shipping instructions</li>
              <li>Refund is processed within 5-10 business days of receiving the return</li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">3. Non-Refundable Items</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Items used, installed, or modified after delivery</li>
              <li>Items returned without original packaging</li>
              <li>Custom or specially sourced items</li>
              <li>Items damaged due to buyer misuse</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">4. Refund Methods</h2>
            <p className="text-sm leading-relaxed">Refunds are issued to the original payment method:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>PayPal:</strong> Refunded to your PayPal account</li>
              <li><strong>Bank Transfer:</strong> Refunded via wire transfer to your account</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">5. Cancellations</h2>
            <p className="text-sm leading-relaxed">Orders may be cancelled before shipment for a full refund. Once shipped, the return process above applies. Contact us immediately if you need to cancel an order.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">6. Contact</h2>
            <p className="text-sm leading-relaxed">For refund requests, contact us at <a href="mailto:returns@alkatraders.com" className="text-[var(--accent-primary)] hover:underline">returns@alkatraders.com</a> or visit our <a href="/contact" className="text-[var(--accent-primary)] hover:underline">contact page</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
