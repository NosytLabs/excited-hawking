import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAgent } from '../context/useAgent';
import { Send, Zap, HelpCircle, Check, Copy, Share2 } from 'lucide-react';

const MAX_LENGTH = 2000;
const MAX_COST = 1.00;
const DEBOUNCE_MS = 500;
const MIN_STAKE_FOR_ACCESS = 10;

interface CostTier {
  name: string;
  price: number;
  features: string[];
  icon: React.ElementType;
  description: string;
}

const COST_TIERS: CostTier[] = [
  { name: 'Standard', price: 0.01, features: ['Simple questions', 'Fast response'], icon: Zap, description: 'Quick answer' },
  { name: 'Deep', price: 0.05, features: ['Complex queries', 'Deep analysis'], icon: Zap, description: 'Good for most conversations' },
  { name: 'Research', price: 0.25, features: ['Research', 'Detailed response'], icon: Zap, description: 'Thorough exploration' },
  { name: 'Max', price: 1.00, features: ['Full access', 'Priority'], icon: Zap, description: 'Maximum effort' },
];

export const PromptBox: React.FC = React.memo(() => {
  const { addPrompt, diemStaked } = useAgent();
  const [text, setText] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [showShare, setShowShare] = useState(false);
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const lastSubmitRef = useRef<number>(0);

  const cost = COST_TIERS[selectedTier].price;
  const baseCost = Math.min(MAX_COST, Math.max(0.01, text.length * 0.0005));
  const finalCost = Math.max(cost, baseCost).toFixed(2);

  const hasStakingAccess = diemStaked >= MIN_STAKE_FOR_ACCESS;
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
    const text = encodeURIComponent(`Just talked to @TheCommonsAgent! "${sharedPrompt.slice(0, 100)}..." #PublicAI`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer,width=550,height=420');
  }, [sharedPrompt]);

  return (
    <section 
      id="prompt" 
      className="prompt-box relative overflow-hidden rounded-xl bg-[var(--shell-surface)] border border-[var(--shell-border)] p-6 shadow-sm"
      aria-label="Prompt composer"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-[var(--shell-text)]">
          Start a prompt
        </h3>
        <div
          className="relative inline-block cursor-help"
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          onFocus={() => setTooltipVisible(true)}
          onBlur={() => setTooltipVisible(false)}
          tabIndex={0}
          role="tooltip"
        >
          <HelpCircle size={16} className="text-[var(--shell-text-muted)]" aria-label="Cost explanation tooltip" />
          {tooltipVisible && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[var(--shell-text)] text-[var(--shell-bg)] rounded-lg px-3 py-2 text-xs whitespace-nowrap z-50 shadow-md">
              Costs support the system: 80% burns, 20% to treasury
            </div>
          )}
        </div>
      </div>

          <p className="text-sm text-[var(--shell-text-muted)] mb-6 max-w-2xl leading-relaxed">
            Prompts are weighted by staked DIEM and processed through a cellular automaton. Higher stake increases attention weight. Queued prompts are selected by collective quadratic vote.
          </p>

      {hasStakingAccess ? (
        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Write your prompt here..."
              className="input w-full h-28 resize-none text-sm"
              disabled={isPaying}
              maxLength={MAX_LENGTH}
              aria-label="Prompt text"
            />
            <div className="absolute bottom-3 right-3 text-xs font-mono text-[var(--shell-text-muted)]">
              {text.length}/{MAX_LENGTH}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium text-[var(--shell-text-muted)] uppercase block mb-2">Depth</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COST_TIERS.map((tier, idx) => (
                <button
                  key={tier.name}
                  type="button"
                  onClick={() => setSelectedTier(idx)}
                  className={`p-3 rounded-xl text-center transition-colors border ${
                    selectedTier === idx 
                      ? 'border-[var(--vault-teal)] bg-[var(--shell-surface-2)]' 
                      : 'border-[var(--shell-border)] bg-transparent'
                  }`}
                >
                  <div className="mb-1 flex justify-center"><tier.icon size={20} className={selectedTier === idx ? 'text-[var(--vault-teal)]' : 'text-[var(--shell-text-muted)]'} /></div>
                  <div className={`font-bold text-xs mb-1 ${selectedTier === idx ? 'text-[var(--vault-teal)]' : 'text-[var(--shell-text)]'}`}>${tier.price.toFixed(2)}</div>
                  <div className="text-[10px] text-[var(--shell-text-muted)]">{tier.name}</div>
                </button>
              ))}
            </div>
          </div>

            <div className="mb-4 p-4 bg-[var(--shell-surface-2)] border border-[var(--shell-border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--shell-text)]">Attention Weight</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[var(--vault-teal)]">{quadraticWeight}x</span>
                <span className="text-xs text-[var(--shell-text-muted)]">({diemStaked.toFixed(2)} DIEM staked)</span>
              </div>
            </div>
            <div className="h-2 bg-[var(--shell-bg)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--vault-teal)] transition-all duration-500"
                style={{ width: `${Math.min(100, (diemStaked / 500) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--shell-text-muted)] mt-1">sqrt(staked DIEM) = voting weight</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--shell-text-muted)]">Cost:</span>
              <span className="bg-[var(--shell-bg)] px-3 py-1.5 rounded-lg text-sm font-bold text-[var(--shell-text)] border border-[var(--shell-border)]">
                ${finalCost}
              </span>
              <span className={`text-[10px] ${isPaying ? 'text-[var(--vault-teal)]' : 'text-[var(--shell-text-muted)]'}`}>
                {isPaying ? 'Processing...' : 'Ready'}
              </span>
            </div>

            <button
              type="submit"
              disabled={!text.trim() || isPaying}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPaying ? (
                <span>Processing...</span>
              ) : (
                <>
                  Submit
                  <Send size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-[var(--shell-surface-2)] border border-[var(--shell-border)] rounded-xl">
          <div className="flex items-center gap-3">
            <Zap size={24} className="text-[var(--vault-teal)]" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--shell-text)]">Stake DIEM to unlock submission</span>
              <span className="text-xs text-[var(--shell-text-muted)]">Staked: {diemStaked.toFixed(2)} DIEM (need {(MIN_STAKE_FOR_ACCESS - diemStaked).toFixed(2)} more)</span>
            </div>
          </div>
          <button onClick={() => window.location.href = '/#/stake'} className="btn-primary text-sm py-2">
            Stake Now
          </button>
        </div>
      )}

      {showShare && sharedPrompt && (
        <div className="mt-4 p-4 bg-[var(--shell-surface-2)] border border-[var(--shell-border)] rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--vault-teal)] flex items-center gap-1">
              <Check size={14} /> Success
            </span>
            <button type="button" onClick={() => setShowShare(false)} className="text-xs text-[var(--shell-text-muted)] hover:text-[var(--shell-text)]">Close</button>
          </div>
          <div className="text-sm text-[var(--shell-text)] mb-3 p-3 bg-[var(--shell-bg)] rounded-lg border border-[var(--shell-border)]">
            "{sharedPrompt.slice(0, 100)}{sharedPrompt.length > 100 ? '...' : ''}"
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleCopyPrompt} className="flex-1 btn-secondary text-sm py-2 flex justify-center items-center gap-2">
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
            <button type="button" onClick={handleTwitterShare} className="flex-1 btn-secondary text-sm py-2 flex justify-center items-center gap-2">
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
      )}
    </section>
  );
});