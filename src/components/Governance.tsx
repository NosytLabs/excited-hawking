/* Hallmark · component: governance-panel · genre: terminal-aesthetic · theme: Terminal */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAgent } from '../context/useAgent';
import { Plus, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Leaf } from 'lucide-react';
import { api } from '../services/api';
import { DelegationPanel } from './DelegationPanel';
import { GovernanceProposal } from './GovernanceProposal';
import { ListSkeleton } from './LoadingSkeleton';

type ProposalStatus = 'DRAFT' | 'ACTIVE' | 'VOTING' | 'PASSED' | 'FAILED' | 'EXECUTED';
export type ProposalCategory = 'TREASURY' | 'PARAMETER' | 'EMERGENCY' | 'CONSTITUTION' | 'PARTNERSHIP';
export type VoteChoice = 'for' | 'against' | 'abstain';

export interface ProposalDetail {
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

const STATUS_COLORS: Record<ProposalStatus, React.CSSProperties['color']> = {
  DRAFT: 'var(--term-amber)',
  ACTIVE: 'var(--term-amber)',
  VOTING: 'var(--term-green)',
  PASSED: 'var(--term-green-glow)',
  FAILED: 'var(--term-red)',
  EXECUTED: 'var(--term-green)',
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

  const [localProposals, setLocalProposals] = useState<ProposalDetail[]>([]);

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
      : localProposals),
    [propProposals, contextProposals, localProposals]);

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

  const handleCreateProposal = useCallback(async () => {
    if (!newProposal.title.trim()) return;
    addLog(`Creating proposal: "${newProposal.title}"`, 'info');
    try {
      const result = await api.createProposal(
        newProposal.title,
        newProposal.description,
        newProposal.category,
        newProposal.depositAmount
      );
      addLog(`Proposal created: "${newProposal.title}" (ID: ${result.proposalId})`, 'success');
      setLocalProposals(prev => [{
        id: result.proposalId,
        title: newProposal.title,
        description: newProposal.description,
        category: newProposal.category,
        status: 'VOTING' as const,
        votesFor: 0,
        votesAgainst: 0,
        votesAbstain: 0,
        quorumRequired: 100,
        quorumReached: false,
        depositAmount: newProposal.depositAmount,
        votingStart: Date.now(),
        votingEnd: Date.now() + 86400000 * 7,
        proposer: walletAddress ?? '0x0000...0000',
        isEmergency: false,
        discussionUrl: `/forum/proposal/${result.proposalId}`,
      }, ...prev]);
    } catch (err) {
      addLog(`Failed to create proposal: "${newProposal.title}"`, 'error');
      return;
    }
    setNewProposal({ title: '', description: '', category: 'TREASURY', depositAmount: 10 });
    setShowCreateForm(false);
  }, [addLog, newProposal, walletAddress]);

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
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--term-scanline) 2px, var(--term-scanline) 4px)',
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
              style={{ color: 'var(--term-green)', border: '1px solid var(--term-green-dim)', backgroundColor: 'var(--term-cta-bg)' }}
            >
              <Plus size={14} />
              NEW
            </button>
          </div>
        </div>

        {showDelegationPanel && (
          <DelegationPanel
            quadraticWeight={quadraticWeight}
            delegations={delegations}
            delegationAddress={delegationAddress}
            onDelegationAddressChange={setDelegationAddress}
            onDelegate={async () => {
              if (delegationAddress.trim()) {
                try {
                  await api.delegateStake(delegationAddress);
                  setDelegationAddress('');
                  setShowDelegationPanel(false);
                } catch (err) {
                  console.error('Delegation failed:', err);
                }
              }
            }}
            onClose={() => setShowDelegationPanel(false)}
          />
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
            style={{ color: showMyProposals ? 'var(--term-green)' : 'var(--term-green-dim)', whiteSpace: 'nowrap' }}
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
                backgroundColor: proposal.isEmergency ? 'var(--term-emergency-bg)' : 'var(--term-ash)',
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
                      <span className="text-[10px] font-mono uppercase" style={{ color: STATUS_COLORS[proposal.status] }}>
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
                    className="h-full"
                    style={{ width: `${forPercentage(proposal)}%`, backgroundColor: 'var(--term-green)', transition: 'width 200ms var(--ease-out)' }}
                  />
                  <div
                    className="h-full"
                    style={{ width: `${100 - forPercentage(proposal)}%`, backgroundColor: 'var(--term-red)', transition: 'width 200ms var(--ease-out)' }}
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{ width: `${quorumPercentage(proposal)}%`, backgroundColor: proposal.quorumReached ? 'var(--term-green)' : 'var(--term-amber)', transition: 'width 200ms var(--ease-out)' }}
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
                <GovernanceProposal
                  proposal={proposal}
                  userVotes={userVotes}
                  quadraticWeight={quadraticWeight}
                  timeRemaining={timeRemaining[proposal.id] || 'CALCULATING...'}
                  onVote={handleVote}
                />
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