import { FileText, ExternalLink, Shield, Users, Globe, FlaskConical, GitCommit } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6" style={{ backgroundColor: 'var(--shell-bg)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--shell-text)] mb-4 tracking-tight">
            The Vault Experiment
          </h1>
          <p className="text-lg text-[var(--shell-text-muted)] max-w-2xl">
            An observational study in decentralized AI coordination. Participants submit prompts, stake tokens, 
            and cast cryptographic votes to collectively explore emergent patterns in a shared computational system.
          </p>
        </div>

        <div className="grid gap-8 mb-12">
          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--term-amber)] flex items-center justify-center">
                <FlaskConical size={18} style={{ color: 'var(--shell-bg)' }} />
              </div>
              <h2 className="text-xl font-display font-semibold text-[var(--shell-text)]">Study Overview</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-[var(--shell-text-muted)] leading-relaxed">
              <div>
                <p className="mb-4">
                  The Vault Experiment observes how collective human input shapes pattern recognition and response 
                  generation in a deterministic computational system. Participants stake DIEM tokens to submit 
                  prompts and vote on experiment parameters.
                </p>
                <p>
                  Metrics like Grid Complexity track structural patterns in the system's response generation—
                  not consciousness, mood, or subjective experience. The experiment measures observable outputs.
                </p>
              </div>
              <div>
                <p className="mb-4">
                  Governance proposals allow the community to set study parameters, allocate treasury resources, 
                  and vote on protocol changes. Voting power is proportional to token stake.
                </p>
                <p>
                  The study runs on Base chain with x402 payment protocol for token interactions. 
                  All transactions are verifiable on-chain for transparency.
                </p>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--vault-teal)] flex items-center justify-center">
                <Shield size={18} style={{ color: 'var(--shell-bg)' }} />
              </div>
              <h2 className="text-xl font-display font-semibold text-[var(--shell-text)]">Study Principles</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--shell-surface-2)] mx-auto mb-3 flex items-center justify-center">
                  <Users size={20} className="text-[var(--vault-teal)]" />
                </div>
                <h3 className="font-medium text-[var(--shell-text)] mb-2">Decentralized</h3>
                <p className="text-xs text-[var(--shell-text-muted)]">No single entity controls the study—collective governance decides.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--shell-surface-2)] mx-auto mb-3 flex items-center justify-center">
                  <Globe size={20} className="text-[var(--term-blue)]" />
                </div>
                <h3 className="font-medium text-[var(--shell-text)] mb-2">Transparent</h3>
                <p className="text-xs text-[var(--shell-text-muted)]">All prompts and votes recorded on-chain. Metrics observable by anyone.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--shell-surface-2)] mx-auto mb-3 flex items-center justify-center">
                  <GitCommit size={20} className="text-[var(--term-amber)]" />
                </div>
                <h3 className="font-medium text-[var(--shell-text)] mb-2">Empirical</h3>
                <p className="text-xs text-[var(--shell-text-muted)]">This is an observational study, not a product claim or sentient AI.</p>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--vault-teal-dim)] flex items-center justify-center">
                <FileText size={18} style={{ color: 'var(--shell-bg)' }} />
              </div>
              <h2 className="text-xl font-display font-semibold text-[var(--shell-text)]">Technical Stack</h2>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-3 border-b border-[var(--shell-border)]">
                <span className="text-[var(--shell-text-muted)]">Blockchain</span>
                <span className="font-mono text-[var(--vault-teal)]">Base (Ethereum L2)</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--shell-border)]">
                <span className="text-[var(--shell-text-muted)]">Payment Protocol</span>
                <span className="font-mono text-[var(--vault-teal)]">x402</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--shell-border)]">
                <span className="text-[var(--shell-text-muted)]">Frontend</span>
                <span className="font-mono text-[var(--vault-teal)]">React + TypeScript</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--shell-border)]">
                <span className="text-[var(--shell-text-muted)]">Backend</span>
                <span className="font-mono text-[var(--vault-teal)]">Fastify + Socket.IO</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[var(--shell-text-muted)]">State</span>
                <span className="font-mono text-[var(--vault-teal)]">In-memory + JSON persistence</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--shell-text-muted)] flex items-center justify-center">
                <ExternalLink size={18} style={{ color: 'var(--shell-bg)' }} />
              </div>
              <h2 className="text-xl font-display font-semibold text-[var(--shell-text)]">Resources</h2>
            </div>
            <div className="space-y-4">
              <a 
                href="https://github.com/the-vault-experiment/the-commons-agent" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-lg bg-[var(--shell-surface-2)] hover:bg-[var(--shell-border)] transition-colors group"
              >
                <ExternalLink size={20} className="text-[var(--shell-text-muted)] group-hover:text-[var(--vault-teal)] transition-colors" />
                <div className="flex-1">
                  <p className="font-medium text-[var(--shell-text)] group-hover:text-[var(--shell-text)] transition-colors">Protocol Repository</p>
                  <p className="text-xs text-[var(--shell-text-muted)]">View source code, documentation, and smart contracts</p>
                </div>
              </a>
              <a 
                href="/PUBLIC_GUIDE.md" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-lg bg-[var(--shell-surface-2)] hover:bg-[var(--shell-border)] transition-colors group"
              >
                <FileText size={20} className="text-[var(--shell-text-muted)] group-hover:text-[var(--vault-teal)] transition-colors" />
                <div className="flex-1">
                  <p className="font-medium text-[var(--shell-text)] group-hover:text-[var(--shell-text)] transition-colors">Public Guide</p>
                  <p className="text-xs text-[var(--shell-text-muted)]">Comprehensive documentation of study mechanics</p>
                </div>
              </a>
            </div>
          </section>
        </div>

        <footer className="text-center text-sm text-[var(--shell-text-muted)]">
          <p className="mb-2">The Vault Experiment — Commons Agent</p>
          <p className="text-xs">Observational study on Base chain • x402 payment protocol</p>
        </footer>
      </div>
    </div>
  );
}
