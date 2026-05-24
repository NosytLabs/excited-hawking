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
    <div className="mt-4 pt-4 border-t border-[var(--term-concrete)]">
      <p className="text-xs text-[var(--term-green)] leading-relaxed mb-4 font-mono">{proposal.description}</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded border bg-[var(--term-green-dim)]/20 border-[var(--term-green)] col-span-2">
          <div className="text-xl font-mono font-bold text-[var(--term-green)]">{proposal.votesFor}</div>
          <div className="text-[10px] font-mono uppercase text-[var(--term-green-glow)]">[FOR]</div>
        </div>
        <div className="text-center p-3 rounded border bg-black/30" style={{ borderColor: 'var(--term-red)' }}>
          <div className="text-lg font-mono font-bold" style={{ color: 'var(--term-red)' }}>{proposal.votesAgainst}</div>
          <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--term-red)' }}>[AGAINST]</div>
        </div>
      </div>
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border bg-black/30" style={{ borderColor: 'var(--term-amber)' }}>
          <div className="text-sm font-mono font-bold" style={{ color: 'var(--term-amber)' }}>{proposal.votesAbstain}</div>
          <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--term-amber)' }}>[ABSTAIN]</div>
        </div>
      </div>

      {proposal.status === 'VOTING' && (
        <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-black/40 rounded border border-[var(--term-concrete)]">
          <Clock size={12} style={{ color: 'var(--term-amber)' }} />
          <span className="text-xs font-mono text-[var(--term-green-dim)]">Time Remaining:</span>
          <span className="text-sm font-mono font-bold" style={{ color: 'var(--term-amber)' }}>
            {timeRemaining || 'CALCULATING...'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 p-2 bg-black/40 rounded border border-[var(--term-concrete)]">
        <span className="text-xs font-mono text-[var(--term-green-dim)]">Voting Weight:</span>
        <span className="text-sm font-mono font-bold text-[var(--term-green)]">
          {quadraticWeight.toFixed(2)} roots
        </span>
      </div>

      {proposal.status === 'VOTING' && (
        <div className="flex gap-2">
          <button
            onClick={() => onVote(proposal.id, 'for')}
            disabled={userVotes[proposal.id] !== undefined}
            className={`flex-1 py-3 rounded font-mono text-xs flex items-center justify-center gap-2 border ${
              userVotes[proposal.id] === 'for'
                ? 'bg-[var(--term-green-dim)] text-[var(--term-void)] border-[var(--term-green)]'
                : 'bg-black/50 text-[var(--term-green)] hover:bg-[var(--term-green-dim)]/30 border-[var(--term-green-dim)] hover:border-[var(--term-green)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <CheckCircle size={16} />
            [VOTE FOR]
          </button>
          <button
            onClick={() => onVote(proposal.id, 'against')}
            disabled={userVotes[proposal.id] !== undefined}
            className={`flex-1 py-3 rounded font-mono text-xs flex items-center justify-center gap-2 border ${
              userVotes[proposal.id] === 'against'
                ? 'border-[var(--term-red)]'
                : 'bg-black/50 hover:bg-[var(--term-red)]/30 border-[var(--term-red)] hover:border-[var(--term-red)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              color: userVotes[proposal.id] === 'against' ? 'var(--term-void)' : 'var(--term-red)',
              backgroundColor: userVotes[proposal.id] === 'against' ? 'var(--term-red)' : undefined,
            }}
          >
            <XCircle size={16} />
            [VOTE AGAINST]
          </button>
          <button
            onClick={() => onVote(proposal.id, 'abstain')}
            disabled={userVotes[proposal.id] !== undefined}
            className={`flex-1 py-3 rounded font-mono text-xs flex items-center justify-center gap-2 border ${
              userVotes[proposal.id] === 'abstain'
                ? 'border-[var(--term-amber)]'
                : 'bg-black/50 hover:bg-[var(--term-amber)]/30 border-[var(--term-amber)] hover:border-[var(--term-amber)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              color: userVotes[proposal.id] === 'abstain' ? 'var(--term-void)' : 'var(--term-amber)',
              backgroundColor: userVotes[proposal.id] === 'abstain' ? 'var(--term-amber)' : undefined,
            }}
          >
            <Minus size={16} />
            [ABSTAIN]
          </button>
        </div>
      )}

      {userVotes[proposal.id] && (
        <div className="mt-3 text-center text-xs font-mono text-[var(--term-green-dim)]">
          Recorded: <span className="text-[var(--term-green)] uppercase">{userVotes[proposal.id]}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-[var(--term-concrete)] border-t border-[var(--term-void)] pt-3">
        <span>Proposer: {proposal.proposer}</span>
        <span>Deposit: {proposal.depositAmount}</span>
      </div>
    </div>
  );
};