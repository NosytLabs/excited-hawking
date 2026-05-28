import { FileText, AlertTriangle } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: 'var(--paper-void)' }}>
      <div className="container-edge">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--paper-surface)] flex items-center justify-center">
              <FileText size={18} style={{ color: 'var(--paper-text)' }} />
            </div>
            <h1 className="text-3xl font-display font-bold text-[var(--paper-text)] tracking-tight">
              Terms of Service
            </h1>
          </div>
          <p className="text-base font-mono text-[var(--paper-muted)]">
            Last updated: May 27, 2026
          </p>
        </div>

        <div className="space-y-8 text-base text-[var(--paper-muted)] leading-relaxed">
          
          <section className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-base font-display font-semibold text-[var(--paper-text)]">Experimental Platform Disclaimer</h2>
            </div>
            <p>
              Excited Hawking is an observational research experiment, not a consumer product or financial service. 
              The "DIEM" token and "staking" described herein are computational simulation constructs within this 
              experiment — they are not cryptocurrency, do not hold monetary value, and are not backed by any 
              real blockchain assets or financial institution.
            </p>
            <p style={{ marginTop: '0.75rem' }}>
              By accessing or participating in this platform, you acknowledge that you are engaging in an 
              observational study and that no financial returns, guaranteed payouts, or economic compensation 
              of any kind will result from your participation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or using this platform ("Excited Hawking" or the "Experiment"), you acknowledge 
              that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you do not 
              agree to these Terms, do not use this platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">2. Nature of the Experiment</h2>
            <p className="mb-3">
              Excited Hawking is a computational observational study operated by a distributed collective. The platform 
              studies collective human input patterns in an AI-administered system. Key characteristics:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>No real money, cryptocurrency, or financial instruments are involved in any transaction on this platform.</li>
              <li>The "DIEM" token is a unit of measurement within the experiment's simulation — not a tradeable asset.</li>
              <li>Staking, voting, and governance mechanisms are computational abstractions, not legally binding financial contracts.</li>
              <li>Participants should not expect and will not receive any financial return on any simulated or theoretical "investment."</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">3. User Accounts and Wallets</h2>
            <p className="mb-3">To participate in the experiment, you may connect a blockchain wallet address. Your wallet address serves as your pseudonymous identifier within the study. You represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are the sole owner and controller of any wallet address you connect.</li>
              <li>You are not a resident of any jurisdiction where participation in this type of observational study would constitute a violation of applicable law.</li>
              <li>Any wallet address you provide is not derived from or associated with any illegal activity, sanctions evasion, or prohibited use.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">4. Intellectual Property</h2>
            <p>
              All source code, documentation, design assets, and platform content are the collective intellectual 
              property of the study's contributors, or are used under applicable open-source licenses. You may not 
              reproduce, redistribute, or claim ownership of any platform content without explicit authorization.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">5. Assumption of Risk</h2>
            <p className="mb-3">You acknowledge and agree that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Participation in this experiment is voluntary and for research purposes only.</li>
              <li>The platform and its systems are provided "as is" without warranties of any kind.</li>
              <li>No guarantee of system availability, error-free operation, or data persistence is made.</li>
              <li>Experimental features may be modified, suspended, or terminated at any time without notice.</li>
              <li>The "emergence" behaviors studied by the platform are not indicators of consciousness, sentience, or any subjective experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">6. Prohibited Conduct</h2>
            <p className="mb-3">You agree not to use the platform to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Interfere with the normal operation of the experiment or its infrastructure.</li>
              <li>Attempt to manipulate, corrupt, or extract non-public study data.</li>
              <li>Introduce malicious code, phishing links, or other harmful content into the platform.</li>
              <li>Impersonate other participants or misrepresent your identity within the study.</li>
              <li>Use automated systems to generate artificial participation patterns that distort study data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">7. No Financial Advice</h2>
            <p>
              Nothing on this platform constitutes financial advice, investment advice, legal advice, or any form of 
              professional consultation. The study's governance mechanisms, token mechanics, and treasury allocation 
              are abstract computational constructs — not financial products. Do not make financial decisions based 
              on information from this platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, the operators, contributors, and collective members 
              behind Excited Hawking shall not be liable for any indirect, incidental, special, consequential, or 
              punitive damages, or any loss of data, reputation, or profits, arising from your participation in or 
              inability to participate in this experiment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">9. Changes to Terms</h2>
            <p>
              These Terms may be updated at any time. Any changes will be reflected by an updated "Last updated" 
              date. Continued use of the platform after any changes constitutes acceptance of the revised Terms. 
              Governance proposals to change terms require a majority vote by participants with governance tokens.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">10. Contact</h2>
            <p>
              Questions about these Terms should be directed through the governance proposal system or by 
              contacting the study operators via the platform's public communication channels.
            </p>
          </section>

        </div>

        <footer className="mt-12 pt-6 border-t border-[var(--paper-border)]">
          <p className="text-base font-mono text-[var(--paper-muted)]">
            Excited Hawking Terms of Service <span className="text-[var(--paper-border)]">//</span> Observational Study Protocol
          </p>
        </footer>
      </div>
    </div>
  );
}

export default TermsOfService;
