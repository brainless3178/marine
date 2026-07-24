export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[var(--primary-bg)]">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="font-display text-3xl font-extrabold text-[var(--text-primary)] mb-8">Terms of Service</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Last updated: July 15, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-[var(--text-secondary)]">
          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed">By accessing or using Alka Traders (alkatraders.com), you agree to these Terms of Service. If you do not agree, please do not use our website or services.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">2. Products and Pricing</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>All product descriptions, images, and specifications are provided in good faith</li>
              <li>Prices are listed in USD unless otherwise specified</li>
              <li>We reserve the right to correct pricing errors</li>
              <li>Product availability is subject to change without notice</li>
              <li>Make-offer prices are not binding until accepted by both parties</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">3. Orders and Payment</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Orders are subject to availability and confirmation</li>
              <li>Payment must be received before order processing (except bank transfer)</li>
              <li>We accept PayPal and bank transfers</li>
              <li>Orders placed with incorrect information may be delayed or cancelled</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">4. Shipping and Delivery</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Delivery times are estimates and not guaranteed</li>
              <li>Risk of loss transfers to you upon delivery</li>
              <li>You are responsible for inspecting goods upon receipt</li>
              <li>International shipments may be subject to customs duties and taxes</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">5. Returns and Refunds</h2>
            <p className="text-sm leading-relaxed">Returns are handled on a case-by-case basis. Contact us within 14 days of delivery for return requests. Used marine equipment is sold as-is unless explicitly stated otherwise. See our <a href="/refund-policy" className="text-[var(--accent-primary)] hover:underline">Refund Policy</a> for details.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">6. Intellectual Property</h2>
            <p className="text-sm leading-relaxed">All content on this website, including text, images, logos, and design, is the property of Alka Traders and protected by intellectual property laws. You may not reproduce or distribute without written permission.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">7. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed">Alka Traders shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our total liability shall not exceed the purchase price of the product in question.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">8. Contact</h2>
            <p className="text-sm leading-relaxed">For questions about these terms, contact us at <a href="mailto:legal@alkatraders.com" className="text-[var(--accent-primary)] hover:underline">legal@alkatraders.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
