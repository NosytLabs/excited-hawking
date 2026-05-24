import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAgent } from '../context/useAgent';
import { Plus, Clock, AlertTriangle, CheckCircle, XCircle, Minus, ChevronDown, ChevronUp, Leaf } from 'lucide-react';
import { ListSkeleton } from './LoadingSkeleton';

type ProposalStatus = 'DRAFT' | 'ACTIVE' | 'VOTING' | 'PASSED' | 'FAILED' | 'EXECUTED';
type ProposalCategory = 'TREASURY' | 'PARAMETER' | 'EMERGENCY' | 'CONSTITUTION' | 'PARTNERSHIP';
type VoteChoice = 'for' | 'against' | 'abstain';

interface ProposalDetail {
  id: string;
  title: string;
  description: string;
  category: ProposalCategory;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorumRequired: number;
  quorumReached: boolean;
  depositAmount: number;
  votingStart: number;
  votingEnd: number;
  proposer: string;
  isEmergency: boolean;
  discussionUrl: string;
}

interface Delegation {
  address: string;
  amount: number;
  lastUpdated: number;
}

const STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: '[SEEDLING]',
  ACTIVE: '[SPROUTING]',
  VOTING: '[BLOOMING]',
  PASSED: '[PASSED]',
  FAILED: '[FAILED]',
  EXECUTED: '[EXECUTED]',
};

const STATUS_COLORS: Record<ProposalStatus, string> = {
  DRAFT: 'text-[var(--term-amber)]',
  ACTIVE: 'text-[var(--term-amber)]',
  VOTING: 'text-[var(--term-green)]',
  PASSED: 'text-[var(--term-green-glow)]',
  FAILED: 'text-[var(--term-red)]',
  EXECUTED: 'text-[var(--term-green)]',
};

const CATEGORY_LABELS: Record<ProposalCategory, string> = {
  TREASURY: '[COMPOST]',
  PARAMETER: '[SOIL]',
  EMERGENCY: '[SPROUT]',
  CONSTITUTION: '[ROOTS]',
  PARTNERSHIP: '[GRAFT]',
};

export const Governance: React.FC<{ proposals?: ProposalDetail[] }> = React.memo(({ proposals: propProposals }) => {
  const { voteProposal, diemStaked, proposals: contextProposals, addLog, walletAddress, backendAvailable } = useAgent();

  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<ProposalCategory | 'ALL'>('ALL');
  const [showMyProposals, setShowMyProposals] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProposalDetail | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, VoteChoice>>({});
  const [delegations] = useState<Delegation[]>([]);
  const [showDelegationPanel, setShowDelegationPanel] = useState(false);
  const [delegationAddress, setDelegationAddress] = useState('');

const proposals = useMemo(() => propProposals ?? (contextProposals.length > 0
      ? contextProposals.map(p => ({
          id: p.id,
          title: p.title,
          description: '',
          category: 'TREASURY' as ProposalCategory,
          status: (p.status === 'active' ? 'VOTING' : p.status === 'passed' ? 'PASSED' : p.status === 'failed' ? 'FAILED' : 'DRAFT') as ProposalStatus,
          votesFor: p.votesFor,
          votesAgainst: p.votesAgainst,
          votesAbstain: 0,
          quorumRequired: 100,
          quorumReached: false,
          depositAmount: 0,
          votingStart: 0,
          votingEnd: 0,
          proposer: 'unknown',
          isEmergency: false,
          discussionUrl: '#discussion',
        }))
      : []),
    [propProposals, contextProposals]);

  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: 'TREASURY' as ProposalCategory,
    depositAmount: 10,
  });

  const quadraticWeight = useMemo(() => Math.sqrt(diemStaked), [diemStaked]);

  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>(() => {
    const initialTimes: Record<string, string> = {};
    if (propProposals || contextProposals) {
      const initProposals = propProposals ?? contextProposals.map(p => ({
        id: p.id,
        title: p.title,
        status: (p.status === 'active' ? 'VOTING' : p.status === 'passed' ? 'PASSED' : p.status === 'failed' ? 'FAILED' : 'DRAFT') as ProposalStatus,
        votingEnd: 0,
      }));
      initProposals.forEach((p) => {
        if (p.status !== 'VOTING') return;
        const now = Date.now();
        if (p.votingEnd > now) {
          const diff = p.votingEnd - now;
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          initialTimes[p.id] = `${days}d ${hours}h ${minutes}m`;
        } else {
          initialTimes[p.id] = 'Ended';
        }
      });
    }
    return initialTimes;
  });

  useEffect(() => {
    if (proposals.length === 0) return;
    
    // Only update time remaining if there are active proposals
    const interval = setInterval(() => {
      const newTimes: Record<string, string> = {};
      let hasChanges = false;
      
      proposals.forEach(p => {
        if (p.status !== 'VOTING') return;
        hasChanges = true;
        const now = Date.now();
        if (p.votingEnd > now) {
          const diff = p.votingEnd - now;
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          newTimes[p.id] = `${days}d ${hours}h ${minutes}m`;
        } else {
          newTimes[p.id] = 'Ended';
        }
      });
      
      // Only trigger re-render if there are active voting proposals
      if (hasChanges) {
        setTimeRemaining(newTimes);
      }
    }, 60000); // Run every minute instead of every second
    
    return () => clearInterval(interval);
  }, [proposals]);

  const filteredProposals = useMemo(() => proposals.filter(p => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (filterCategory !== 'ALL' && p.category !== filterCategory) return false;
    if (showMyProposals && p.proposer !== (walletAddress ?? '')) return false;
    return true;
  }), [proposals, filterStatus, filterCategory, showMyProposals, walletAddress]);

  const handleVote = useCallback((proposalId: string, vote: VoteChoice) => {
    voteProposal(proposalId, vote);
    setUserVotes(prev => ({ ...prev, [proposalId]: vote }));
  }, [voteProposal]);

  const handleCreateProposal = useCallback(() => {
    if (!newProposal.title.trim()) return;
    // Note: This is intentionally a local-only demo that doesn't persist to backend.
    // Proposal creation API would go here when backend supports it.
    addLog(`Created proposal: "${newProposal.title}"`, 'info');
    setNewProposal({ title: '', description: '', category: 'TREASURY', depositAmount: 10 });
    setShowCreateForm(false);
  }, [addLog, newProposal]);

  const totalVotes = (p: ProposalDetail) => p.votesFor + p.votesAgainst + p.votesAbstain;
  const forPercentage = (p: ProposalDetail) => totalVotes(p) > 0 ? (p.votesFor / totalVotes(p)) * 100 : 0;
  const quorumPercentage = (p: ProposalDetail) => Math.min(100, (totalVotes(p) / p.quorumRequired) * 100);

  if (!backendAvailable && proposals.length === 0) {
    return <ListSkeleton />;
  }

  return (
    <div className="relative font-mono rounded-lg overflow-hidden" style={{
      color: 'var(--term-green)',
      backgroundColor: 'var(--term-void)',
      border: '2px solid var(--term-green-dim)',
      boxShadow: '0 10px 15px -3px oklch(0% 0% 0% / 0.4), 0 4px 6px -4px oklch(0% 0% 0% / 0.4)',
    }}>
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0% 0% 0% / 0.3) 2px, oklch(0% 0% 0% / 0.3) 4px)',
        }}
      />

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--term-green-glow)] to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--term-green-glow)] to-transparent opacity-60" />
      <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-transparent via-[var(--term-green-glow)] to-transparent opacity-60" />
      <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-transparent via-[var(--term-green-glow)] to-transparent opacity-60" />

      <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--term-green-dim)' }}>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-[10px] tracking-widest" style={{ color: 'var(--term-green-dim)' }}>ROBCO INDUSTRIES</span>
              <h3 className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                <span style={{ color: 'var(--term-green-glow)' }} aria-hidden="true">&gt;</span>
                SYSTEM GOVERNANCE
              </h3>
              <span className="text-[10px] tracking-widest" style={{ color: 'var(--term-green-dim)' }}>TERMINAL v3.14</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Manage Delegation"
              type="button"
              onClick={() => setShowDelegationPanel(!showDelegationPanel)}
              className="text-xs font-mono flex items-center gap-1 transition-colors border px-2 py-1 rounded"
              style={{ color: 'var(--term-green-dim)', borderColor: 'var(--term-concrete)' }}
            >
              <Leaf size={12} />
              DELEGATE
            </button>
            <button
              aria-label="Create New Proposal"
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="text-xs font-mono px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
              style={{ color: 'var(--term-green)', border: '1px solid var(--term-green-dim)', backgroundColor: 'oklch(70% 22% 140deg / 0.12)' }}
            >
              <Plus size={14} />
              NEW
            </button>
          </div>
        </div>

        {showDelegationPanel && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--term-void)', border: '1px solid var(--term-green-dim)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono" style={{ color: 'var(--term-green)' }}>CULTIVATION CIRCLE</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--term-green-dim)]">Root Strength:</span>
                <span className="text-[var(--term-green)]">{quadraticWeight.toFixed(2)} roots</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--term-green-dim)]">Delegated:</span>
                <span className="text-[var(--term-green)]">{delegations.reduce((sum, d) => sum + d.amount, 0)} seeds</span>
              </div>
              <input
                type="text"
                value={delegationAddress}
                onChange={(e) => setDelegationAddress(e.target.value)}
                placeholder="Enter address..."
                className="w-full mt-2 bg-black/50 border border-[var(--term-green-dim)] rounded px-3 py-2 text-xs font-mono text-[var(--term-green)] placeholder-[var(--term-concrete)] focus:outline-none focus:border-[var(--term-green)]"
              />
              <button
                type="button"
                onClick={() => {
                  if (delegationAddress.trim()) {
                    setDelegationAddress('');
                    setShowDelegationPanel(false);
                  }
                }}
                className="w-full mt-2 bg-[var(--term-green-dim)]/30 hover:bg-[var(--term-green-dim)]/50 text-[var(--term-green)] border border-[var(--term-green)] text-xs font-mono py-2 rounded transition-colors"
              >
                [EXECUTE DELEGATION]
              </button>
            </div>
          </div>
        )}

          {showCreateForm && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--term-void)', border: '1px solid var(--term-green-dim)' }}>
            <h4 className="text-xs font-mono mb-3" style={{ color: 'var(--term-green)' }}>&gt; CREATE NEW PROPOSAL</h4>
            <input
              type="text"
              value={newProposal.title}
              onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter proposal title..."
              className="w-full mb-3 bg-black/50 border border-[var(--term-green-dim)] rounded px-3 py-2 text-sm font-mono text-[var(--term-green)] placeholder-[var(--term-concrete)] focus:outline-none focus:border-[var(--term-green)]"
            />
            <textarea
              value={newProposal.description}
              onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter proposal description..."
              className="w-full mb-3 bg-black/50 border border-[var(--term-green-dim)] rounded px-3 py-2 text-sm font-mono text-[var(--term-green)] placeholder-[var(--term-concrete)] focus:outline-none focus:border-[var(--term-green)] h-20 resize-none"
            />
            <div className="flex gap-3 mb-3">
              <select
                value={newProposal.category}
                onChange={(e) => setNewProposal(prev => ({ ...prev, category: e.target.value as ProposalCategory }))}
                className="bg-black/50 border border-[var(--term-green-dim)] rounded px-3 py-2 text-xs font-mono text-[var(--term-green)] focus:outline-none focus:border-[var(--term-green)]"
              >
                <option value="TREASURY">COMPOST</option>
                <option value="PARAMETER">SOIL</option>
                <option value="EMERGENCY">SPROUT</option>
                <option value="CONSTITUTION">ROOTS</option>
                <option value="PARTNERSHIP">GRAFT</option>
              </select>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--term-green-dim)]">Deposit:</span>
                <input
                  type="number"
                  value={newProposal.depositAmount}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, depositAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-20 bg-black/50 border border-[var(--term-green-dim)] rounded px-2 py-2 text-xs font-mono text-[var(--term-green)] focus:outline-none focus:border-[var(--term-green)]"
                />
                <span className="text-xs font-mono text-[var(--term-green-dim)]">seeds</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateProposal}
                disabled={!newProposal.title.trim()}
                className="flex-1 bg-[var(--term-concrete)]/50 hover:bg-[var(--term-concrete)]/70 text-[var(--term-green)] border border-[var(--term-green)] text-xs font-mono py-2 rounded transition-colors disabled:opacity-50"
              >
                [SUBMIT PROPOSAL]
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 bg-[var(--term-charcoal)]/50 hover:bg-[var(--term-charcoal)]/70 text-[var(--term-green-dim)] border border-[var(--term-concrete)] text-xs font-mono py-2 rounded transition-colors"
              >
                [CANCEL]
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ProposalStatus | 'ALL')}
            className="rounded px-2 py-1.5 text-xs font-mono focus:outline-none" style={{ backgroundColor: 'oklch(12% 2% 250deg / 0.7)', border: '1px solid var(--term-green-dim)', color: 'var(--term-green-glow)' }}
          >
            <option value="ALL">ALL STATUS</option>
            <option value="DRAFT">SEEDLING</option>
            <option value="ACTIVE">SPROUTING</option>
            <option value="VOTING">BLOOMING</option>
            <option value="PASSED">PASSED</option>
            <option value="FAILED">FAILED</option>
            <option value="EXECUTED">EXECUTED</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as ProposalCategory | 'ALL')}
            className="rounded px-2 py-1.5 text-xs font-mono focus:outline-none" style={{ backgroundColor: 'oklch(12% 2% 250deg / 0.7)', border: '1px solid var(--term-green-dim)', color: 'var(--term-green-glow)' }}
          >
            <option value="ALL">ALL CATEGORIES</option>
            <option value="TREASURY">COMPOST</option>
            <option value="PARAMETER">SOIL</option>
            <option value="EMERGENCY">SPROUT</option>
            <option value="CONSTITUTION">ROOTS</option>
            <option value="PARTNERSHIP">GRAFT</option>
          </select>
          <button
                type="button"
                onClick={() => setShowMyProposals(!showMyProposals)}
            className={`px-2 py-1.5 text-xs font-mono rounded transition-colors border ${
              showMyProposals
                ? 'bg-[var(--term-green-dim)]/30 border-[var(--term-green)]'
                : 'bg-[var(--term-void)]/70 border-[var(--term-concrete)]'
            }`}
            style={{ color: showMyProposals ? 'var(--term-green)' : 'var(--term-green-dim)' }}
          >
            {showMyProposals ? '[MY PROPOSALS]' : 'MY PROPOSALS'}
          </button>
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
          {filteredProposals.map(proposal => (
            <div
              key={proposal.id}
              className="rounded p-3 transition-all hover:border-[var(--term-green)]"
              style={{
                border: '1px solid',
                backgroundColor: proposal.isEmergency ? 'oklch(55% 20% 25deg / 0.05)' : 'oklch(28% 3% 230deg / 0.6)',
                borderColor: proposal.isEmergency ? 'oklch(55% 20% 25deg / 0.31)' : (selectedProposal?.id === proposal.id ? 'var(--term-green)' : 'var(--term-concrete)'),
              }}
            >
              {proposal.isEmergency && (
                <div className="flex items-center gap-2 mb-2 text-xs font-mono" style={{ color: 'var(--term-red)' }}>
                  <AlertTriangle size={12} className="animate-pulse" />
                  <span>[!] URGENT PROPOSAL</span>
                </div>
              )}

              <div
                className="cursor-pointer"
                onClick={() => setSelectedProposal(selectedProposal?.id === proposal.id ? null : proposal)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-mono text-[var(--term-green)] leading-tight">{proposal.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-mono uppercase ${STATUS_COLORS[proposal.status]}`}>
                        {STATUS_LABELS[proposal.status]}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--term-green-dim)] uppercase">
                        {CATEGORY_LABELS[proposal.category]}
                      </span>
                    </div>
                  </div>
                  {selectedProposal?.id === proposal.id ? (
                    <ChevronUp size={14} className="text-[var(--term-green-dim)] shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-[var(--term-green-dim)] shrink-0" />
                  )}
                </div>

                <div className="w-full h-1.5 bg-black rounded-full overflow-hidden flex">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${forPercentage(proposal)}%`, backgroundColor: 'var(--term-green)' }}
                  />
                  <div
                    className="h-full transition-all"
                    style={{ width: `${100 - forPercentage(proposal)}%`, backgroundColor: 'var(--term-red)' }}
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${quorumPercentage(proposal)}%`, backgroundColor: proposal.quorumReached ? 'var(--term-green)' : 'var(--term-amber)' }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--term-green-dim)]">
                    {proposal.quorumReached ? (
                      <CheckCircle size={10} className="text-[var(--term-green)]" />
                    ) : (
                      <span>{totalVotes(proposal)}/{proposal.quorumRequired}</span>
                    )}
                  </span>
                </div>
              </div>

              {selectedProposal?.id === proposal.id && (
                <div className="mt-4 pt-4 border-t border-[var(--term-concrete)]">
                  <p className="text-xs text-[var(--term-green)] leading-relaxed mb-4 font-mono">{proposal.description}</p>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded border bg-black/30 border-[var(--term-green-dim)]">
                      <div className="text-lg font-mono font-bold text-[var(--term-green)]">{proposal.votesFor}</div>
                      <div className="text-[10px] font-mono uppercase text-[var(--term-green-dim)]">[FOR]</div>
                    </div>
                    <div className="text-center p-2 rounded border bg-black/30" style={{ borderColor: 'var(--term-red)' }}>
                      <div className="text-lg font-mono font-bold" style={{ color: 'var(--term-red)' }}>{proposal.votesAgainst}</div>
                      <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--term-red)' }}>[AGAINST]</div>
                    </div>
                    <div className="text-center p-2 rounded border bg-black/30" style={{ borderColor: 'var(--term-amber)' }}>
                      <div className="text-lg font-mono font-bold" style={{ color: 'var(--term-amber)' }}>{proposal.votesAbstain}</div>
                      <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--term-amber)' }}>[ABSTAIN]</div>
                    </div>
                  </div>

                  {proposal.status === 'VOTING' && (
                    <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-black/40 rounded border border-[var(--term-concrete)]">
                      <Clock size={12} style={{ color: 'var(--term-amber)' }} />
                      <span className="text-xs font-mono text-[var(--term-green-dim)]">Time Remaining:</span>
                      <span className="text-sm font-mono font-bold" style={{ color: 'var(--term-amber)' }}>
                        {timeRemaining[proposal.id] || 'CALCULATING...'}
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
                        onClick={() => handleVote(proposal.id, 'for')}
                        disabled={userVotes[proposal.id] !== undefined}
                        className={`flex-1 py-3 rounded font-mono text-xs flex items-center justify-center gap-2 transition-all border ${
                          userVotes[proposal.id] === 'for'
                            ? 'bg-[var(--term-green-dim)] text-[var(--term-void)] border-[var(--term-green)]'
                            : 'bg-black/50 text-[var(--term-green)] hover:bg-[var(--term-green-dim)]/30 border-[var(--term-green-dim)] hover:border-[var(--term-green)]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <CheckCircle size={16} />
                        [VOTE FOR]
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 'against')}
                        disabled={userVotes[proposal.id] !== undefined}
                        className={`flex-1 py-3 rounded font-mono text-xs flex items-center justify-center gap-2 transition-all border ${
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
                        onClick={() => handleVote(proposal.id, 'abstain')}
                        disabled={userVotes[proposal.id] !== undefined}
                        className={`flex-1 py-3 rounded font-mono text-xs flex items-center justify-center gap-2 transition-all border ${
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
              )}
            </div>
          ))}
        </div>

        {filteredProposals.length === 0 && (
          <div className="text-center py-8 text-[var(--term-green-dim)] text-sm font-mono">
            &gt; NO PROPOSALS FOUND
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[var(--term-concrete)] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--term-concrete)]">ROBCO INDUSTRIES © 2077</span>
          <span className="text-[10px] font-mono text-[var(--term-concrete)]">SYS.GOV</span>
        </div>
      </div>
    </div>
  );
});