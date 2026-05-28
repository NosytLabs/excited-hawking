/* Hallmark · component: governance-proposal · genre: terminal-aesthetic · theme: Terminal */
import React from 'react';
import { Clock, CheckCircle, XCircle, Minus } from 'lucide-react';
import type { ProposalDetail, VoteChoice } from './Governance';

interface GovernanceProposalProps {
  proposal: ProposalDetail;
  userVotes: Record<string, VoteChoice>;
  quadraticWeight: number;
  timeRemaining: string;
  onVote: (proposalId: string, vote: VoteChoice) => void;
}

export const GovernanceProposal: React.FC<GovernanceProposalProps> = ({
  proposal,
  userVotes,
  quadraticWeight,
  timeRemaining,
  onVote,
}) => {
  return (
    <div className="mt-4 pt-4 border-t border-[var(--paper-muted)]">
      <p className="text-base text-[var(--accent-primary)] leading-relaxed mb-4 font-mono">{proposal.description}</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded border bg-[var(--accent-dim)]/20 border-[var(--accent-primary)] col-span-2">
          <div className="text-xl font-mono font-bold text-[var(--accent-primary)]">{proposal.votesFor}</div>
          <div className="text-base font-mono uppercase text-[var(--accent-dim)]">[FOR]</div>
          <div className="text-base font-mono" style={{ color: 'var(--accent-primary)' }}>✓</div>
        </div>
        <div className="text-center p-3 rounded border bg-black/30" style={{ borderColor: 'var(--danger)' }}>
          <div className="text-lg font-mono font-bold" style={{ color: 'var(--danger)' }}>{proposal.votesAgainst}</div>
          <div className="text-base font-mono uppercase" style={{ color: 'var(--danger)' }}>[AGAINST]</div>
          <div className="text-base font-mono" style={{ color: 'var(--danger)' }}>✗</div>
        </div>
      </div>
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border bg-black/30" style={{ borderColor: 'var(--warning)' }}>
          <div className="text-base font-mono font-bold" style={{ color: 'var(--warning)' }}>{proposal.votesAbstain}</div>
          <div className="text-base font-mono uppercase" style={{ color: 'var(--warning)' }}>[ABSTAIN]</div>
        </div>
      </div>

      {proposal.status === 'VOTING' && (
        <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-black/40 rounded border border-[var(--paper-muted)]">
          <Clock size={12} style={{ color: 'var(--warning)' }} />
          <span className="text-base font-mono text-[var(--accent-dim)]">Time Remaining:</span>
          <span className="text-base font-mono font-bold" style={{ color: 'var(--warning)' }}>
            {timeRemaining || 'CALCULATING...'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 p-2 bg-black/40 rounded border border-[var(--paper-muted)]">
        <span className="text-base font-mono text-[var(--accent-dim)]">Voting Weight:</span>
        <span className="text-base font-mono font-bold text-[var(--accent-primary)]">
          {quadraticWeight.toFixed(2)} roots
        </span>
      </div>

      {proposal.status === 'VOTING' && (
        <div className="flex gap-2">
          <button
            onClick={() => onVote(proposal.id, 'for')}
            disabled={userVotes[proposal.id] !== undefined}
            className={`flex-1 py-3 rounded font-mono text-base flex items-center justify-center gap-2 border ${
              userVotes[proposal.id] === 'for'
                ? 'bg-[var(--accent-dim)] text-[var(--paper-void)] border-[var(--accent-primary)]'
                : 'bg-black/50 text-[var(--accent-primary)] hover:bg-[var(--accent-dim)]/30 border-[var(--accent-dim)] hover:border-[var(--accent-primary)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Vote for this proposal"
          >
            <CheckCircle size={16} />
            [VOTE FOR]
          </button>
          <button
            onClick={() => onVote(proposal.id, 'against')}
            disabled={userVotes[proposal.id] !== undefined}
            className={`flex-1 py-3 rounded font-mono text-base flex items-center justify-center gap-2 border ${
              userVotes[proposal.id] === 'against'
                ? 'border-[var(--danger)]'
                : 'bg-black/50 hover:bg-[var(--danger)]/30 border-[var(--danger)] hover:border-[var(--danger)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              color: userVotes[proposal.id] === 'against' ? 'var(--paper-void)' : 'var(--danger)',
              backgroundColor: userVotes[proposal.id] === 'against' ? 'var(--danger)' : undefined,
            }}
            aria-label="Vote against this proposal"
          >
            <XCircle size={16} />
            [VOTE AGAINST]
          </button>
          <button
            onClick={() => onVote(proposal.id, 'abstain')}
            disabled={userVotes[proposal.id] !== undefined}
            className={`flex-1 py-3 rounded font-mono text-base flex items-center justify-center gap-2 border ${
              userVotes[proposal.id] === 'abstain'
                ? 'border-[var(--warning)]'
                : 'bg-black/50 hover:bg-[var(--warning)]/30 border-[var(--warning)] hover:border-[var(--warning)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              color: userVotes[proposal.id] === 'abstain' ? 'var(--paper-void)' : 'var(--warning)',
              backgroundColor: userVotes[proposal.id] === 'abstain' ? 'var(--warning)' : undefined,
            }}
            aria-label="Abstain from voting on this proposal"
          >
            <Minus size={16} />
            [ABSTAIN]
          </button>
        </div>
      )}

      {userVotes[proposal.id] && (
        <div className="mt-3 text-center text-base font-mono text-[var(--accent-dim)]">
          Recorded: <span className="text-[var(--accent-primary)] uppercase">{userVotes[proposal.id]}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-base font-mono text-[var(--paper-muted)] border-t border-[var(--paper-void)] pt-3">
        <span>Proposer: {proposal.proposer}</span>
        <span>Deposit: {proposal.depositAmount}</span>
      </div>
    </div>
  );
};
