import { FileText, ExternalLink, Shield, Users, Globe, FlaskConical, GitCommit, Terminal } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: 'var(--paper-void)' }}>
      <div className="container-edge">
        {/* Hero Section */}
        <div className="mb-12 py-12 border-b border-[var(--paper-border)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)', border: '2px solid var(--accent-primary)' }}>
              <FlaskConical size={20} style={{ color: 'var(--paper-void)' }} />
            </div>
            <div>
              <span className="font-mono text-xs text-[var(--accent-primary)] uppercase tracking-widest block">Public Experiment</span>
              <span className="font-mono text-xs text-[var(--paper-muted)] uppercase tracking-wider">Est. Cycle 0</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--paper-text)] mb-4 tracking-tight">
            The Vault Experiment
          </h1>
          <p className="text-lg text-[var(--paper-muted)] max-w-2xl leading-relaxed">
            An observational study in decentralized AI coordination. Participants submit prompts, stake tokens, 
            and cast cryptographic votes to collectively explore emergent patterns in a shared computational system.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <a href="#/" className="btn-bloom text-sm">
              <Terminal size={14} />
              Enter the Vault
            </a>
            <span className="font-mono text-sm text-[var(--paper-muted)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              System Active — 127 observers
            </span>
          </div>
        </div>

        <div className="grid gap-8 mb-12">
          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center">
                <FlaskConical size={18} style={{ color: 'var(--paper-void)' }} />
              </div>
              <h2 className="text-xl font-display font-semibold text-[var(--paper-text)]">Study Overview</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-base text-[var(--paper-muted)] leading-relaxed">
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
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center">
                <Shield size={18} style={{ color: 'var(--paper-void)' }} />
              </div>
              <h2 className="text-xl font-display font-semibold text-[var(--paper-text)]">Study Principles</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--paper-surface)] shrink-0 flex items-center justify-center">
                  <Users size={18} className="text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--paper-text)] mb-1">Decentralized</h3>
                  <p className="text-base text-[var(--paper-muted)]">No single entity controls the study—collective governance decides.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--paper-surface)] shrink-0 flex items-center justify-center">
                  <Globe size={18} className="text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--paper-text)] mb-1">Transparent</h3>
                  <p className="text-base text-[var(--paper-muted)]">All prompts and votes recorded on-chain. Metrics observable by anyone.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--paper-surface)] shrink-0 flex items-center justify-center">
                  <GitCommit size={18} className="text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--paper-text)] mb-1">Empirical</h3>
                  <p className="text-base text-[var(--paper-muted)]">This is an observational study, not a product claim or sentient AI.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--paper-elevated)] flex items-center justify-center">
                <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h2 className="text-xl font-display font-semibold text-[var(--paper-text)]">Technical Stack</h2>
            </div>
            <div className="space-y-4 text-base">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-[var(--paper-border)] gap-1">
                <span className="text-[var(--paper-muted)]">Blockchain</span>
                <span className="font-mono text-[var(--accent-primary)]">Base (Ethereum L2)</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-[var(--paper-border)] gap-1">
                <span className="text-[var(--paper-muted)]">Payment Protocol</span>
                <span className="font-mono text-[var(--accent-primary)]">x402</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-[var(--paper-border)] gap-1">
                <span className="text-[var(--paper-muted)]">Frontend</span>
                <span className="font-mono text-[var(--accent-primary)]">React + TypeScript</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-[var(--paper-border)] gap-1">
                <span className="text-[var(--paper-muted)]">Backend</span>
                <span className="font-mono text-[var(--accent-primary)]">Fastify + Socket.IO</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-1">
                <span className="text-[var(--paper-muted)]">State</span>
                <span className="font-mono text-[var(--accent-primary)]">In-memory + JSON persistence</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--paper-surface)] flex items-center justify-center">
                <ExternalLink size={18} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h2 className="text-xl font-display font-semibold text-[var(--paper-text)]">Resources</h2>
            </div>
            <div className="space-y-4">
              <a 
                href="https://github.com/the-vault-experiment/the-commons-agent" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-lg bg-[var(--paper-surface)] hover:bg-[var(--paper-elevated)] transition-colors group"
              >
                <ExternalLink size={20} className="text-[var(--paper-muted)] group-hover:text-[var(--accent-primary)] transition-colors shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-[var(--paper-text)] transition-colors">Protocol Repository</p>
                  <p className="text-base text-[var(--paper-muted)]">View source code, documentation, and smart contracts</p>
                </div>
              </a>
              <a 
                href="/PUBLIC_GUIDE.md" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-lg bg-[var(--paper-surface)] hover:bg-[var(--paper-elevated)] transition-colors group"
              >
                <FileText size={20} className="text-[var(--paper-muted)] group-hover:text-[var(--accent-primary)] transition-colors shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-[var(--paper-text)] transition-colors">Public Guide</p>
                  <p className="text-base text-[var(--paper-muted)]">Comprehensive documentation of study mechanics</p>
                </div>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
