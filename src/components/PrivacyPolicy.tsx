import { Shield, AlertTriangle } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: 'var(--paper-void)' }}>
      <div className="container-edge">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--paper-surface)] flex items-center justify-center">
              <Shield size={18} style={{ color: 'var(--paper-text)' }} />
            </div>
            <h1 className="text-3xl font-display font-bold text-[var(--paper-text)] tracking-tight">
              Privacy Policy
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
              <h2 className="text-base font-display font-semibold text-[var(--paper-text)]">Key Principle</h2>
            </div>
            <p>
              Excited Hawking is an observational research experiment. All data collected is used solely for the 
              purpose of studying collective human computational interaction patterns. No data is sold, rented, 
              or used for advertising, profiling, or commercial purposes of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-[var(--paper-text)] mb-2">1.1 Wallet Address</h3>
                <p>
                  When you connect a blockchain wallet to the platform, your public wallet address is recorded 
                  as your pseudonymous identifier within the study. This address is publicly visible on the blockchain 
                  and is not itself personal information, but it may be linkable to your blockchain activity.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--paper-text)] mb-2">1.2 Prompt Submissions</h3>
                <p>
                  Any text prompts you submit to the experiment are recorded, timestamped, and associated with your 
                  wallet address. These become part of the study's data corpus and may be displayed publicly in 
                  aggregated or anonymized form, or visible on-chain depending on the governance parameters active 
                  at the time of submission.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--paper-text)] mb-2">1.3 Voting and Governance Data</h3>
                <p>
                  Your votes on governance proposals, delegation of voting power, and any governance-related activity 
                  are recorded persistently as part of the study's record. This data is stored on-chain for 
                  transparency and auditability and is publicly visible.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--paper-text)] mb-2">1.4 Transaction Records</h3>
                <p>
                  All interactions with the platform's simulated staking, treasury, and token systems generate 
                  records that are stored in the experiment's state. These are internal records 
                  and may not be broadcast to external blockchains unless specifically noted in a governance proposal.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--paper-text)] mb-2">1.5 Technical Logs</h3>
                <p>
                  Standard server-side logs record IP addresses (hashed for privacy), user agent strings, API 
                  call timestamps, and error events. These logs are used for platform stability and security 
                  monitoring and are not shared with third parties.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">2. How We Use Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To maintain the experiment's persistent state (wallet balances, governance records, prompt history).</li>
              <li>To display your wallet address, stake amounts, and governance activity within the platform interface.</li>
              <li>To aggregate participant behavior for research metrics (e.g., participation rates, voting patterns).</li>
              <li>To detect and prevent fraud, abuse, or attempts to artificially influence the study's data integrity.</li>
              <li>To respond to technical support requests submitted through the platform.</li>
            </ul>
            <p className="mt-4">
              <strong className="text-[var(--paper-text)]">We do not use your information to:</strong> profile you for advertising, 
              make automated decisions that affect your legal rights, sell or share your data with third-party data brokers, 
              or contact you for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">3. Data Retention and Deletion</h2>
            <p className="mb-3">
              Study data is retained persistently as part of the experiment's cumulative record. Because this is an 
              observational study with an immutable on-chain governance layer, certain data (votes, transactions, 
              proposals) cannot be retroactively deleted. You can request deletion of non-essential data 
              (e.g., your prompt submissions from replay mechanisms) through a governance proposal or by contacting 
              the study operators directly.
            </p>
            <p>
              Experimental state snapshots are persisted in JSON format. Deletion requests should specify which 
              data categories you wish to have removed from future snapshots. Historical blockchain transactions 
              are governed by the immutability properties of the relevant chain.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">4. Third-Party Services</h2>
            <p className="mb-3">The platform may interact with the following external services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-[var(--paper-text)]">Blockchain RPC providers</strong> — Wallet addresses 
                and transaction hashes may be submitted to external blockchain nodes for on-chain verification of 
                governance actions.
              </li>
              <li>
                <strong className="text-[var(--paper-text)]">LLM API providers</strong> — Prompt text is 
                submitted to OpenAI, Anthropic, or similar API endpoints for processing. Each provider's privacy 
                policy governs their handling of your submitted prompt content.
              </li>
              <li>
                <strong className="text-[var(--paper-text)]">WebSocket infrastructure</strong> — Real-time 
                platform updates are delivered via Socket.IO. Connection metadata (IP, session tokens) may be 
                temporarily logged by the hosting infrastructure.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">5. Cookies and Local Storage</h2>
            <p className="mb-3">
              The platform uses browser local storage and session cookies for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Remembering your interface preferences (e.g., collapsed panels, theme settings)</li>
              <li>Maintaining WebSocket session state for real-time platform updates</li>
              <li>Storing a temporary anonymous session identifier for rate limiting purposes</li>
            </ul>
            <p className="mt-4">
              We do not use tracking cookies, advertising cookies, or cross-site tracking of any kind. 
              Session data is automatically cleared when you close your browser tab.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">6. Data Security</h2>
            <p>
              The platform employs standard security practices including HTTPS/TLS encryption for all traffic, 
              hashed IP addresses in rate-limiting logs, input sanitization for all user-submitted content, and 
              role-based access controls on administrative backend functions. No system is impenetrable — if you 
              discover a security vulnerability, please responsibly disclose it through the platform's governance 
              communication channels or via a security advisory.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">7. Data Minimization</h2>
            <p>
              We collect only what is necessary for the function of the experiment. Wallet addresses are collected 
              because they serve as pseudonymous identifiers within the governance system. Prompt text is collected 
              because it is the primary input being studied. We do not collect government-issued identification, 
              biometric data, device fingerprints beyond standard web analytics, or any data unnecessary to the 
              study's stated purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">8. International Participants</h2>
            <p>
              The platform is operated from within the United States. If you are accessing from outside the US, 
              please note that your information will be transferred to and processed in the US, which may have 
              different data protection regulations than your jurisdiction. By using the platform, you consent 
              to such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">9. Children's Privacy</h2>
            <p>
              The platform is not intended for use by individuals under the age of 18. We do not knowingly collect 
              data from minors. If we become aware that data has been collected from a minor without parental 
              consent, we will take steps to delete that data as promptly as possible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">10. Changes to This Policy</h2>
            <p>
              This Privacy Policy may be updated to reflect changes in data handling practices or platform 
              architecture. Any material changes will be announced through the governance proposal system. 
              An updated "Last updated" date will be posted at the top of this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-[var(--paper-text)] mb-3">11. Contact</h2>
            <p>
              Questions or concerns about this Privacy Policy or the handling of your data should be raised 
              through the platform's governance communication channels or submitted as a governance proposal 
              for transparency.
            </p>
          </section>

        </div>

        <footer className="mt-12 pt-6 border-t border-[var(--paper-border)]">
          <p className="text-base font-mono text-[var(--paper-muted)]">
            Excited Hawking Privacy Policy <span className="text-[var(--paper-border)]">//</span> Observational Study Protocol
          </p>
        </footer>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
