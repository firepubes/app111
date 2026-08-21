
export default function Privacy() {
  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: 'var(--space-4)' }}>
      <main style={{ padding: 'var(--space-8) 0' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: 'var(--space-6)' }}>Privacy Policy</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>1. Information We Collect</h2>
          <p>
            MailTune is designed to be privacy-first. We do not require you to create an account, provide a personal email address, or share any personally identifiable information to use our service. We only process incoming emails addressed to the temporary addresses you generate.
          </p>

          <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>2. Data Retention</h2>
          <p>
            All received emails and generated inboxes are securely stored in our database. Depending on our server configuration (usually within 24 hours to 7 days), emails are permanently and automatically deleted. We do not keep backups of expired emails.
          </p>

          <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>3. Analytics & Tracking</h2>
          <p>
            We do not use tracking cookies or invasive third-party analytics. We may log basic, anonymized request data (such as IP addresses and browser agents) purely for security purposes, to prevent abuse, and to ensure the stability of the Cloudflare Workers infrastructure.
          </p>

          <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>4. Third-Party Services</h2>
          <p>
            Our infrastructure is powered by Cloudflare. By using this service, your traffic is routed through Cloudflare's network, which may apply its own security filtering.
          </p>

          <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>5. Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. Any changes will be reflected on this page. By continuing to use MailTune after those changes become effective, you agree to be bound by the revised Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
}
