import React, { useState, useEffect, useCallback } from 'react';
import { useAgent } from '../context/useAgent';
import { Vote, Plus, Clock, AlertTriangle, CheckCircle, XCircle, Minus, ChevronDown, ChevronUp, Users, Shield } from 'lucide-react';

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

const STATUS_COLORS: Record<ProposalStatus, string> = {
  DRAFT: 'bg-zinc-500/20 text-zinc-400',
  ACTIVE: 'bg-blue-500/20 text-blue-400',
  VOTING: 'bg-purple-500/20 text-purple-400',
  PASSED: 'bg-green-500/20 text-green-400',
  FAILED: 'bg-red-500/20 text-red-400',
  EXECUTED: 'bg-emerald-500/20 text-emerald-400',
};

const CATEGORY_LABELS: Record<ProposalCategory, string> = {
  TREASURY: 'Treasury',
  PARAMETER: 'Parameter',
  EMERGENCY: 'Emergency',
  CONSTITUTION: 'Constitution',
  PARTNERSHIP: 'Partnership',
};

export const Governance: React.FC<{ proposals?: ProposalDetail[] }> = ({ proposals: propProposals }) => {
  const { voteProposal, diemStaked, proposals: contextProposals, addLog } = useAgent();
  
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<ProposalCategory | 'ALL'>('ALL');
  const [showMyProposals, setShowMyProposals] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProposalDetail | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userVote, setUserVote] = useState<VoteChoice | null>(null);
  const [delegations] = useState<Delegation[]>([]);
  const [showDelegationPanel, setShowDelegationPanel] = useState(false);
  const [delegationAddress, setDelegationAddress] = useState('');
  
  const defaultProposals: ProposalDetail[] = [
    {
      id: '0',
      title: 'Loading proposals from network...',
      description: 'Awaiting governance data from the blockchain.',
      category: 'TREASURY',
      status: 'DRAFT',
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      quorumRequired: 100,
      quorumReached: false,
      depositAmount: 0,
      votingStart: 0,
      votingEnd: 0,
      proposer: '0x0000...0000',
      isEmergency: false,
      discussionUrl: '#',
    },
  ];

  const proposals = propProposals || contextProposals.length > 0 
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
        proposer: '0x0000...0000',
        isEmergency: false,
        discussionUrl: '#',
      }))
    : defaultProposals;

  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: 'TREASURY' as ProposalCategory,
    depositAmount: 10,
  });

  // Quadratic voting calculation
  const quadraticWeight = Math.sqrt(diemStaked);
  
  // Time remaining countdown
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimes: Record<string, string> = {};
      proposals.forEach(p => {
        if (p.status === 'VOTING') {
          const remaining = p.votingEnd - Date.now();
          if (remaining > 0) {
            const days = Math.floor(remaining / 86400000);
            const hours = Math.floor((remaining % 86400000) / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            newTimes[p.id] = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
          } else {
            newTimes[p.id] = 'Ended';
          }
        }
      });
      setTimeRemaining(newTimes);
    }, 1000);
    return () => clearInterval(interval);
  }, [proposals]);

  const filteredProposals = proposals.filter(p => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (filterCategory !== 'ALL' && p.category !== filterCategory) return false;
    if (showMyProposals && p.proposer !== '0x12..34') return false;
    return true;
  });

  const handleVote = useCallback((proposalId: string, vote: VoteChoice) => {
    voteProposal(proposalId, vote === 'for' ? 'for' : 'against');
    setUserVote(vote);
  }, [voteProposal]);

  const handleCreateProposal = useCallback(() => {
    if (!newProposal.title.trim()) return;
    // In production, this would call an API to create the proposal
    // For now, we just log the intent
    addLog(`Created proposal: "${newProposal.title}"`, 'info');
    setNewProposal({ title: '', description: '', category: 'TREASURY', depositAmount: 10 });
    setShowCreateForm(false);
  }, [newProposal]);

  const totalVotes = (p: ProposalDetail) => p.votesFor + p.votesAgainst + p.votesAbstain;
  const forPercentage = (p: ProposalDetail) => totalVotes(p) > 0 ? (p.votesFor / totalVotes(p)) * 100 : 0;
  const quorumPercentage = (p: ProposalDetail) => Math.min(100, (totalVotes(p) / p.quorumRequired) * 100);

  return (
    <div className="glass-panel flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
        <h3 className="font-mono text-sm uppercase tracking-wider flex items-center gap-2 text-zinc-300">
          <Vote size={16} className="text-purple-400" />
          Governance
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDelegationPanel(!showDelegationPanel)}
            className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
          >
            <Shield size={12} />
            Delegate
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-[#00d992]/20 hover:bg-[#00d992]/30 text-[#00d992] text-xs font-mono px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
          >
            <Plus size={14} />
            New
          </button>
        </div>
      </div>

      {/* Delegation Panel */}
      {showDelegationPanel && (
        <div className="mb-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-zinc-400" />
            <span className="text-sm font-mono text-zinc-300">Delegation Management</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-500">Your voting power:</span>
              <span className="text-white">{quadraticWeight.toFixed(2)} sqrt(DIEM)</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-500">Delegated to you:</span>
              <span className="text-white">{delegations.reduce((sum, d) => sum + d.amount, 0)} DIEM</span>
            </div>
            <input
              type="text"
              value={delegationAddress}
              onChange={(e) => setDelegationAddress(e.target.value)}
              placeholder="Enter address to delegate to..."
              className="w-full mt-2 bg-black/50 border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-[#00d992]"
            />
            <button
              onClick={() => {
                if (delegationAddress.trim()) {
                  addLog(`Delegated votes to ${delegationAddress.slice(0, 10)}...`, 'info');
                  setDelegationAddress('');
                  setShowDelegationPanel(false);
                }
              }}
              className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono py-2 rounded transition-colors"
            >
              Delegate Votes
            </button>
          </div>
        </div>
      )}

      {/* Create Proposal Form */}
      {showCreateForm && (
        <div className="mb-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <h4 className="text-sm font-mono text-zinc-300 mb-3">Create New Proposal</h4>
          <input
            type="text"
            value={newProposal.title}
            onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Proposal title..."
            className="w-full mb-3 bg-black/50 border border-zinc-700 rounded px-3 py-2 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00d992]"
          />
          <textarea
            value={newProposal.description}
            onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detailed description..."
            className="w-full mb-3 bg-black/50 border border-zinc-700 rounded px-3 py-2 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00d992] h-20 resize-none"
          />
          <div className="flex gap-3 mb-3">
            <select
              value={newProposal.category}
              onChange={(e) => setNewProposal(prev => ({ ...prev, category: e.target.value as ProposalCategory }))}
              className="bg-black/50 border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#00d992]"
            >
              <option value="TREASURY">Treasury</option>
              <option value="PARAMETER">Parameter</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="CONSTITUTION">Constitution</option>
              <option value="PARTNERSHIP">Partnership</option>
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-500">Deposit:</span>
              <input
                type="number"
                value={newProposal.depositAmount}
                onChange={(e) => setNewProposal(prev => ({ ...prev, depositAmount: parseFloat(e.target.value) || 0 }))}
                className="w-20 bg-black/50 border border-zinc-700 rounded px-2 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#00d992]"
              />
              <span className="text-xs font-mono text-zinc-500">DIEM</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateProposal}
              disabled={!newProposal.title.trim()}
              className="flex-1 bg-[#00d992] hover:bg-[#00bf80] text-black text-xs font-mono py-2 rounded transition-colors disabled:opacity-50"
            >
              Submit Proposal
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-mono py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ProposalStatus | 'ALL')}
          className="bg-zinc-900/70 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-zinc-400 focus:outline-none focus:border-[#00d992]"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="VOTING">Voting</option>
          <option value="PASSED">Passed</option>
          <option value="FAILED">Failed</option>
          <option value="EXECUTED">Executed</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ProposalCategory | 'ALL')}
          className="bg-zinc-900/70 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-zinc-400 focus:outline-none focus:border-[#00d992]"
        >
          <option value="ALL">All Categories</option>
          <option value="TREASURY">Treasury</option>
          <option value="PARAMETER">Parameter</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="CONSTITUTION">Constitution</option>
          <option value="PARTNERSHIP">Partnership</option>
        </select>
        <button
          onClick={() => setShowMyProposals(!showMyProposals)}
          className={`px-2 py-1.5 text-xs font-mono rounded transition-colors ${
            showMyProposals 
              ? 'bg-[#00d992]/20 text-[#00d992] border border-[#00d992]/40' 
              : 'bg-zinc-900/70 text-zinc-400 border border-zinc-800'
          }`}
        >
          My Proposals
        </button>
      </div>

      {/* Proposals List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {filteredProposals.map(proposal => (
          <div 
            key={proposal.id} 
            className={`bg-zinc-900/40 border rounded-lg p-4 transition-all hover:border-zinc-700 ${
              proposal.isEmergency ? 'border-red-500/40 bg-red-500/5' : 'border-zinc-800'
            } ${selectedProposal?.id === proposal.id ? 'border-[#00d992]/40' : ''}`}
          >
            {proposal.isEmergency && (
              <div className="flex items-center gap-2 mb-2 text-red-400 text-xs font-mono">
                <AlertTriangle size={12} className="animate-pulse" />
                <span>EMERGENCY PROPOSAL</span>
              </div>
            )}
            
            <div 
              className="cursor-pointer"
              onClick={() => setSelectedProposal(selectedProposal?.id === proposal.id ? null : proposal)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-zinc-200 leading-tight">{proposal.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${STATUS_COLORS[proposal.status]}`}>
                      {proposal.status}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      {CATEGORY_LABELS[proposal.category]}
                    </span>
                  </div>
                </div>
                {selectedProposal?.id === proposal.id ? (
                  <ChevronUp size={14} className="text-zinc-500 shrink-0" />
                ) : (
                  <ChevronDown size={14} className="text-zinc-500 shrink-0" />
                )}
              </div>

              {/* Mini Progress */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-green-500 transition-all" 
                  style={{ width: `${forPercentage(proposal)}%` }}
                />
                <div 
                  className="h-full bg-red-500 transition-all" 
                  style={{ width: `${100 - forPercentage(proposal)}%` }}
                />
              </div>

              {/* Quorum Progress */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${proposal.quorumReached ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                    style={{ width: `${quorumPercentage(proposal)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {proposal.quorumReached ? (
                    <CheckCircle size={10} className="text-emerald-500" />
                  ) : (
                    <span>{totalVotes(proposal)}/{proposal.quorumRequired}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Expanded Detail View */}
            {selectedProposal?.id === proposal.id && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">{proposal.description}</p>
                
                {/* Voting Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-green-500/10 rounded border border-green-500/20">
                    <div className="text-lg font-mono font-bold text-green-400">{proposal.votesFor}</div>
                    <div className="text-[10px] font-mono text-green-400/70 uppercase">For</div>
                  </div>
                  <div className="text-center p-2 bg-red-500/10 rounded border border-red-500/20">
                    <div className="text-lg font-mono font-bold text-red-400">{proposal.votesAgainst}</div>
                    <div className="text-[10px] font-mono text-red-400/70 uppercase">Against</div>
                  </div>
                  <div className="text-center p-2 bg-zinc-500/10 rounded border border-zinc-500/20">
                    <div className="text-lg font-mono font-bold text-zinc-400">{proposal.votesAbstain}</div>
                    <div className="text-[10px] font-mono text-zinc-400/70 uppercase">Abstain</div>
                  </div>
                </div>

                {/* Time Remaining */}
                {proposal.status === 'VOTING' && (
                  <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-zinc-900/60 rounded">
                    <Clock size={12} className="text-purple-400" />
                    <span className="text-xs font-mono text-zinc-400">Time remaining:</span>
                    <span className="text-sm font-mono font-bold text-purple-400">
                      {timeRemaining[proposal.id] || 'Calculating...'}
                    </span>
                  </div>
                )}

                {/* Quadratic Voting Indicator */}
                <div className="flex items-center justify-between mb-4 p-2 bg-zinc-900/60 rounded">
                  <span className="text-xs font-mono text-zinc-500">Your voting weight:</span>
                  <span className="text-sm font-mono font-bold text-[#00d992]">
                    {quadraticWeight.toFixed(2)} sqrt(DIEM)
                  </span>
                </div>

                {/* Voting Buttons */}
                {proposal.status === 'VOTING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVote(proposal.id, 'for')}
                      disabled={userVote !== null}
                      className={`flex-1 py-3 rounded-lg font-mono text-sm flex items-center justify-center gap-2 transition-all ${
                        userVote === 'for' 
                          ? 'bg-green-500 text-black' 
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/40'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <CheckCircle size={16} />
                      Vote For
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 'against')}
                      disabled={userVote !== null}
                      className={`flex-1 py-3 rounded-lg font-mono text-sm flex items-center justify-center gap-2 transition-all ${
                        userVote === 'against' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <XCircle size={16} />
                      Vote Against
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 'abstain')}
                      disabled={userVote !== null}
                      className={`flex-1 py-3 rounded-lg font-mono text-sm flex items-center justify-center gap-2 transition-all ${
                        userVote === 'abstain' 
                          ? 'bg-zinc-500 text-white' 
                          : 'bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30 border border-zinc-500/40'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Minus size={16} />
                      Abstain
                    </button>
                  </div>
                )}

                {userVote && (
                  <div className="mt-3 text-center text-xs font-mono text-zinc-500">
                    You have already voted: <span className="text-white capitalize">{userVote}</span>
                  </div>
                )}

                {/* Meta Info */}
                <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-zinc-600">
                  <span>Proposed by: {proposal.proposer}</span>
                  <span>Deposit: {proposal.depositAmount} DIEM</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredProposals.length === 0 && (
        <div className="text-center py-8 text-zinc-500 text-sm font-mono">
          No proposals match your filters.
        </div>
      )}
    </div>
  );
};