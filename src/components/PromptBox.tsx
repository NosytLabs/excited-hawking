import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAgent } from '../context/useAgent';
import { Send, Zap, DollarSign, Shield, Check } from 'lucide-react';

const MAX_LENGTH = 2000;
const MAX_COST = 1.00;
const DEBOUNCE_MS = 500;

interface CostTier {
  name: string;
  price: number;
  features: string[];
}

const COST_TIERS: CostTier[] = [
  { name: 'Basic', price: 0.01, features: ['Simple queries', '5s timeout'] },
  { name: 'Standard', price: 0.05, features: ['Complex queries', '30s timeout', 'Priority'] },
  { name: 'Premium', price: 0.25, features: ['Deep research', '60s timeout', 'Priority', 'Memory'] },
  { name: 'API Access', price: 1.00, features: ['Full API', 'Webhooks', 'Dedicated'] },
];

export const PromptBox: React.FC = () => {
  const { addPrompt, diemStaked } = useAgent();
  const [text, setText] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [showShare, setShowShare] = useState(false);
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const lastSubmitRef = useRef<number>(0);

  const cost = COST_TIERS[selectedTier].price;
  const baseCost = Math.min(MAX_COST, Math.max(0.01, text.length * 0.0005));
  const finalCost = Math.max(cost, baseCost).toFixed(2);

  // Voting power calculation
  const votingPower = Math.sqrt(diemStaked);
  const quadraticWeight = votingPower.toFixed(2);

  useEffect(() => {
    if (sharedPrompt) {
      const timer = setTimeout(() => setShowShare(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [sharedPrompt]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length > MAX_LENGTH) return;

    const now = Date.now();
    if (now - lastSubmitRef.current < DEBOUNCE_MS) return;
    lastSubmitRef.current = now;

    setIsPaying(true);

    setTimeout(() => {
      setIsPaying(false);
      setSharedPrompt(text);
      addPrompt(text, parseFloat(finalCost));
      setShowShare(true);
      setText('');
    }, 1500);
  }, [text, finalCost, addPrompt]);

  const handleCopyPrompt = useCallback(async () => {
    if (!sharedPrompt) return;
    try {
      await navigator.clipboard.writeText(sharedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [sharedPrompt]);

  const handleTwitterShare = useCallback(() => {
    if (!sharedPrompt) return;
    const text = encodeURIComponent(`Just prompted The Peoples Agent: "${sharedPrompt.slice(0, 100)}..."`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=550,height=420');
  }, [sharedPrompt]);

  return (
    <div className="glass-panel">
      <h3 className="font-mono text-sm uppercase tracking-wider mb-4 flex items-center gap-2 text-zinc-300">
        <Zap size={16} className="text-yellow-400" />
        Prompt the Agent
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="relative mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="e.g. Verify the total value locked on Aave across all chains..."
            className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-lg p-4 text-sm font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#00d992] transition-colors resize-none h-24"
            disabled={isPaying}
            maxLength={MAX_LENGTH}
            aria-label="Prompt input for the agent"
          />
          <div className="absolute bottom-3 right-3 text-xs font-mono text-zinc-500">
            {text.length}/{MAX_LENGTH}
          </div>
        </div>

        {/* Cost Tiers */}
        <div className="mb-4">
          <label className="text-xs font-mono text-zinc-500 uppercase mb-2 block">Service Tier</label>
          <div className="grid grid-cols-4 gap-2">
            {COST_TIERS.map((tier, idx) => (
              <button
                key={tier.name}
                type="button"
                onClick={() => setSelectedTier(idx)}
                className={`p-2 rounded text-xs font-mono transition-all ${
                  selectedTier === idx
                    ? 'bg-[#00d992]/20 text-[#00d992] border border-[#00d992]/40'
                    : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold mb-1">${tier.price.toFixed(2)}</div>
                <div className="text-[10px] opacity-70">{tier.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Voting Power Indicator */}
        <div className="mb-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-purple-400" />
              <span className="text-xs font-mono text-zinc-400">Your Voting Power</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold text-purple-400">
                {quadraticWeight} sqrt(DIEM)
              </span>
              <span className="text-[10px] font-mono text-zinc-600">
                ({diemStaked.toFixed(2)} DIEM staked)
              </span>
            </div>
          </div>
          <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
              style={{ width: `${Math.min(100, (diemStaked / 500) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
            <span>Cost:</span>
            <span className="text-white bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
              ${finalCost} USDC
            </span>
            <span className="text-zinc-600 ml-1">({isPaying ? 'processing' : 'ready'})</span>
          </div>
          
          <button
            type="submit"
            disabled={!text.trim() || isPaying}
            className="bg-[#00d992] hover:bg-[#00bf80] text-[#050505] font-semibold py-2 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPaying ? (
              <>
                <span className="animate-pulse">Broadcasting...</span>
              </>
            ) : (
              <>
                Send to Agent
                <Send size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Post-Submission Share */}
      {showShare && sharedPrompt && (
        <div className="mt-4 p-4 bg-[#00d992]/10 border border-[#00d992]/30 rounded-lg animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-mono text-[#00d992]">Got it. Running...</span>
            <button 
              onClick={() => setShowShare(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs font-mono"
            >
              Close
            </button>
          </div>
          
          <div className="text-xs font-mono text-zinc-400 mb-3 p-2 bg-black/30 rounded border border-zinc-800">
            "{sharedPrompt.slice(0, 100)}{sharedPrompt.length > 100 ? '...' : ''}"
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCopyPrompt}
              className={`flex-1 py-2 px-3 rounded text-xs font-mono flex items-center justify-center gap-1 transition-all ${
                copied 
                  ? 'bg-green-500 text-black' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              {copied ? <Check size={12} /> : <DollarSign size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleTwitterShare}
              className="flex-1 py-2 px-3 rounded text-xs font-mono bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] flex items-center justify-center gap-1 transition-all"
            >
              Share on X
            </button>
          </div>
        </div>
      )}
    </div>
  );
};