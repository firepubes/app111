
export default function Terms() {
  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: 'var(--space-4)' }}>
      <main style={{ padding: 'var(--space-8) 0' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: 'var(--space-6)' }}>Terms of Service</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>1. Acceptance of Terms</h2>
          <p>
            By accessing and using MailTune, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </p>

          <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>2. Description of Service</h2>
          <p>
            MailTune provides temporary, disposable email addresses ("Service"). The Service is provided "as is" and "as available". We make no guarantees regarding the reliability, timeliness, or security of the Service. Emails may be delayed, lost, or deleted without warning.
          </p>

          <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>3. Acceptable Use</h2>
          <p>
            You agree not to use the Service for any unlawful or abusive purpose. This includes, but is not limited to:
          </p>
          <ul style={{ paddingLeft: 'var(--space-6)' }}>
            <li>Sending or receiving illegal content.</li>
            <li>Harassing, threatening, or defrauding others.</li>
            <li>Attempting to bypass security measures or reverse engineer the platform.</li>
            <li>Using the service for automated bulk registrations or spamming.</li>
          </ul>

          <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>4. Termination</h2>
          <p>
            We reserve the right to terminate or restrict access to our Service at any time, without notice, for any conduct that we, in our sole discretion, believe violates these Terms or is harmful to other users, us, or third parties.
          </p>

          <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>5. Limitation of Liability</h2>
          <p>
            In no event shall MailTune or its creators be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the Service. You use the service entirely at your own risk.
          </p>
        </div>
      </main>
    </div>
  );
}
