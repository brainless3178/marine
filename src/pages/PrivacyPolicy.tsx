export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--primary-bg)]">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="font-display text-3xl font-extrabold text-[var(--text-primary)] mb-8">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Last updated: July 15, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-[var(--text-secondary)]">
          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed">When you use Alka Traders, we collect information you provide directly, including:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Name, email address, phone number, and company information</li>
              <li>Shipping and billing addresses</li>
              <li>Payment information (processed securely via PayPal — we do not store card details)</li>
              <li>RFQ submissions, product inquiries, and support messages</li>
              <li>Order history and account preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Process orders and deliver products</li>
              <li>Respond to RFQs, inquiries, and support requests</li>
              <li>Send order confirmations, shipping updates, and account notifications</li>
              <li>Improve our products, services, and website experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">3. Information Sharing</h2>
            <p className="text-sm leading-relaxed">We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Payment processors (PayPal) to complete transactions</li>
              <li>Shipping carriers to deliver orders</li>
              <li>Email service providers to send transactional emails</li>
              <li>Analytics tools to improve our website</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">4. Data Security</h2>
            <p className="text-sm leading-relaxed">We implement industry-standard security measures including encrypted connections (HTTPS), secure authentication with JWT tokens and httpOnly cookies, and regular security audits. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">5. Your Rights</h2>
            <p className="text-sm leading-relaxed">You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:privacy@alkatraders.com" className="text-[var(--accent-blue)] hover:underline">privacy@alkatraders.com</a>.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">6. Cookies</h2>
            <p className="text-sm leading-relaxed">We use essential cookies for authentication and session management. These cookies are strictly necessary for the website to function. We do not use third-party tracking cookies without your consent.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">7. Contact</h2>
            <p className="text-sm leading-relaxed">For privacy-related inquiries, contact us at <a href="mailto:privacy@alkatraders.com" className="text-[var(--accent-blue)] hover:underline">privacy@alkatraders.com</a> or visit our <a href="/contact" className="text-[var(--accent-blue)] hover:underline">contact page</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
