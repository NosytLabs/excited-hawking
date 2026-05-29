/* Hallmark · component: prompt-box · genre: terminal-aesthetic · theme: Terminal */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAgent } from '../context/useAgent';
import { Send, Zap, HelpCircle, Check, Copy, Share2, AlertCircle } from 'lucide-react';

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
  const { addPrompt, diemStaked, backendAvailable } = useAgent();
  const [text, setText] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [showShare, setShowShare] = useState(false);
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setSubmitError(null);
    setIsPaying(true);
    setTimeout(() => {
      if (!backendAvailable) {
        setIsPaying(false);
        setSubmitError('Backend unavailable. Please try again later.');
        return;
      }
      setIsPaying(false);
      setSharedPrompt(text);
      addPrompt(text, parseFloat(finalCost));
      setShowShare(true);
      setText('');
    }, 1500);
  }, [text, finalCost, addPrompt, backendAvailable]);

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
    const tweetText = `Just talked to @TheCommonsAgent! "${sharedPrompt.slice(0, 100)}..." #PublicAI`;
    const text = encodeURIComponent(tweetText);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
  }, [sharedPrompt]);

  return (
    <section 
      id="prompt" 
      className="prompt-box relative overflow-hidden rounded-xl bg-[var(--paper-surface)] border border-[var(--paper-border)] p-4 md:p-6 shadow-sm"
      aria-label="Prompt composer"
    >
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h3 className="text-lg md:text-xl font-medium text-[var(--paper-text)]">
          Start a prompt
        </h3>
        <div className="group relative inline-block">
          <HelpCircle
            size={16}
            className="text-[var(--paper-muted)] cursor-help"
            aria-label="Cost explanation"
            aria-describedby="cost-tooltip"
          />
          <div
            id="cost-tooltip"
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[var(--paper-text)] text-[var(--paper-void)] rounded-lg px-3 py-2 text-sm whitespace-nowrap z-50 shadow-md hidden group-hover:block group-focus-within:block"
            role="tooltip"
            aria-live="polite"
          >
            Costs support the system: 80% burns, 20% to treasury
          </div>
        </div>
      </div>

          <p className="text-sm md:text-base text-[var(--paper-muted)] mb-5 md:mb-6 max-w-2xl leading-relaxed">
            Prompts are weighted by staked DIEM and processed through a cellular automaton. Higher stake increases attention weight. Queued prompts are selected by collective quadratic vote.
          </p>

      {hasStakingAccess ? (
        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Write your prompt here..."
              className="input w-full h-28 resize-none text-base"
              disabled={isPaying}
              maxLength={MAX_LENGTH}
              aria-label="Prompt text"
            />
            <div className="absolute bottom-3 right-3 text-base font-mono text-[var(--paper-muted)]">
              {text.length}/{MAX_LENGTH}
            </div>
          </div>

          <div className="mb-4">
            <span className="text-base font-medium text-[var(--paper-muted)] uppercase block mb-2">Depth</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2" role="group" aria-label="Select prompt depth">
              {COST_TIERS.map((tier, idx) => (
                <button
                  key={tier.name}
                  type="button"
                  onClick={() => setSelectedTier(idx)}
                  className={`p-3 rounded-xl text-center transition-colors border ${
                    selectedTier === idx 
                      ? 'border-[var(--accent-primary)] bg-[var(--paper-elevated)]' 
                      : 'border-[var(--paper-border)] bg-transparent'
                  }`}
                  aria-pressed={selectedTier === idx}
                >
                  <div className="mb-1 flex justify-center"><tier.icon size={20} className={selectedTier === idx ? 'text-[var(--accent-primary)]' : 'text-[var(--paper-muted)]'} /></div>
                  <div className={`font-bold text-base mb-1 ${selectedTier === idx ? 'text-[var(--accent-primary)]' : 'text-[var(--paper-text)]'}`}>${tier.price.toFixed(2)}</div>
                  <div className="text-base text-[var(--paper-muted)]">{tier.name}</div>
                </button>
              ))}
            </div>
          </div>

            <div className="mb-4 p-4 bg-[var(--paper-elevated)] border border-[var(--paper-border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-medium text-[var(--paper-text)]">Attention Weight</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[var(--accent-primary)]">{quadraticWeight}x</span>
                <span className="text-base text-[var(--paper-muted)]">({diemStaked.toFixed(2)} DIEM staked)</span>
              </div>
            </div>
            <div className="h-2 bg-[var(--paper-void)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-primary)] transition-all duration-500"
                style={{ width: `${Math.min(100, (diemStaked / 500) * 100)}%` }}
              />
            </div>
            <p className="text-base text-[var(--paper-muted)] mt-1">sqrt(staked DIEM) = voting weight</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base text-[var(--paper-muted)]">Cost:</span>
              <span className="bg-[var(--paper-void)] px-3 py-1.5 rounded-lg text-base font-bold text-[var(--paper-text)] border border-[var(--paper-border)]">
                ${finalCost}
              </span>
              <span className={`text-base ${isPaying ? 'text-[var(--accent-primary)]' : 'text-[var(--paper-muted)]'}`}>
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-[var(--paper-elevated)] border border-[var(--paper-border)] rounded-xl">
          <div className="flex items-center gap-3">
            <Zap size={24} className="text-[var(--accent-primary)]" />
            <div className="flex flex-col gap-1">
              <span className="text-base font-medium text-[var(--paper-text)]">Stake DIEM to unlock submission</span>
              <span className="text-base text-[var(--paper-muted)]">Staked: {diemStaked.toFixed(2)} DIEM (need {(MIN_STAKE_FOR_ACCESS - diemStaked).toFixed(2)} more)</span>
            </div>
          </div>
          <button onClick={() => window.location.hash = '#/stake'} className="btn-primary text-base py-2">
            Stake Now
          </button>
        </div>
      )}

      {submitError && (
        <div className="mt-4 p-4 bg-[var(--paper-void)] border border-[var(--danger)] rounded-xl flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} className="text-[var(--danger)] flex-shrink-0" />
          <span className="text-base text-[var(--danger)]">{submitError}</span>
        </div>
      )}

      {showShare && sharedPrompt && (
        <div className="mt-4 p-4 bg-[var(--paper-elevated)] border border-[var(--paper-border)] rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-medium text-[var(--accent-primary)] flex items-center gap-1">
              <Check size={14} /> Success
            </span>
            <button type="button" onClick={() => setShowShare(false)} className="text-base text-[var(--paper-muted)] hover:text-[var(--paper-text)]">Close</button>
          </div>
          <div className="text-base text-[var(--paper-text)] mb-3 p-3 bg-[var(--paper-void)] rounded-lg border border-[var(--paper-border)]">
            "{sharedPrompt.slice(0, 100)}{sharedPrompt.length > 100 ? '...' : ''}"
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleCopyPrompt} className="flex-1 btn-secondary text-base py-2 flex justify-center items-center gap-2">
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
            <button type="button" onClick={handleTwitterShare} className="flex-1 btn-secondary text-base py-2 flex justify-center items-center gap-2">
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
      )}
    </section>
  );
});