import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAgent } from '../context/useAgent';
import { Send, Sprout, Leaf, HelpCircle, Check, Copy, Share2 } from 'lucide-react';

const MAX_LENGTH = 2000;
const MAX_COST = 1.00;
const DEBOUNCE_MS = 500;

interface CostTier {
  name: string;
  price: number;
  features: string[];
  emoji: string;
  description: string;
}

const COST_TIERS: CostTier[] = [
  { name: 'Seed', price: 0.01, features: ['Simple questions', 'Fast response'], emoji: '🌱', description: 'Just want a quick answer?' },
  { name: 'Sprout', price: 0.05, features: ['Complex queries', 'Deep analysis'], emoji: '🌿', description: 'Good for most conversations' },
  { name: 'Bloom', price: 0.25, features: ['Research', 'Detailed response'], emoji: '🌸', description: 'Thorough exploration of topics' },
  { name: 'Grove', price: 1.00, features: ['Full access', 'Priority'], emoji: '🌳', description: 'For serious growth' },
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
    <div style={{
      backgroundColor: 'var(--color-cream-deep)',
      border: '1px solid var(--color-sand-line)',
      borderRadius: '16px',
      padding: '1.5rem',
      transition: 'all 300ms var(--ease-out)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-bark)' }}>
          <Sprout size={20} style={{ color: 'var(--color-sage)' }} aria-hidden="true" />
          Plant an Idea
        </h3>
        <div
          style={{ position: 'relative', display: 'inline-block', cursor: 'help' }}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          onFocus={() => setTooltipVisible(true)}
          onBlur={() => setTooltipVisible(false)}
          tabIndex={0}
          role="tooltip"
        >
          <HelpCircle size={16} style={{ color: 'var(--color-stone)' }} />
          {tooltipVisible && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--color-bark)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              color: 'var(--color-cream)',
              whiteSpace: 'nowrap',
              zIndex: 50,
              boxShadow: '0 4px 12px oklch(0% 0% 0% / 0.15)',
            }}>
              Costs feed the garden: 80% nurtures scarcity, 20% grows the treasury
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="Plant an idea in the garden... What shall we grow today?"
            className="input"
            style={{
              width: '100%',
              height: '7rem',
              resize: 'none',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
            }}
            disabled={isPaying}
            maxLength={MAX_LENGTH}
            aria-label="Plant an idea in the garden"
          />
          <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-stone)' }}>
            {text.length}/{MAX_LENGTH}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-stone)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Growth depth</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '0.5rem' }}>
            {COST_TIERS.map((tier, idx) => (
              <button
                key={tier.name}
                type="button"
                onClick={() => setSelectedTier(idx)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  transition: 'all 150ms var(--ease-out)',
                  cursor: 'pointer',
                  border: selectedTier === idx
                    ? '2px solid var(--color-sage)'
                    : '1px solid var(--color-sand-line)',
                  backgroundColor: selectedTier === idx
                    ? 'oklch(65% 15% 145deg / 0.08)'
                    : 'transparent',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{tier.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem', color: selectedTier === idx ? 'var(--color-sage-deep)' : 'var(--color-clay)' }}>${tier.price.toFixed(2)}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--color-stone)' }}>{tier.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, oklch(65% 15% 145deg / 0.08), oklch(72% 16% 38deg / 0.06))',
          border: '1px solid oklch(65% 15% 145deg / 0.15)',
          borderRadius: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Leaf size={16} style={{ color: 'var(--color-sage)' }} aria-hidden="true" />
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-bark)' }}>Your Garden Influence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-sage-deep)' }}>
                {quadraticWeight}x
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}>
                ({diemStaked.toFixed(2)} staked)
              </span>
            </div>
          </div>
          <div style={{ height: '8px', backgroundColor: 'var(--color-cream)', borderRadius: '100px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: '100px',
                transition: 'width 0.5s ease',
                background: 'linear-gradient(90deg, var(--color-sage), var(--color-terra))',
                width: `${Math.min(100, (diemStaked / 500) * 100)}%`,
              }}
            />
          </div>
          <p style={{ fontSize: '0.625rem', color: 'var(--color-stone)', marginTop: '0.25rem' }}>More seeds planted = more influence, but costs grow quadratically</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}>Cost:</span>
            <span style={{
              backgroundColor: 'var(--color-parchment)',
              padding: '0.375rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--color-bark)',
              border: '1px solid var(--color-sand-line)',
            }}>
              ${finalCost}
            </span>
            <span style={{ fontSize: '0.625rem', color: isPaying ? 'var(--color-terra)' : 'var(--color-stone)' }}>
              {isPaying ? 'growing...' : 'ready'}
            </span>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isPaying}
            className="btn-primary"
            style={{
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: !text.trim() || isPaying ? 0.6 : 1,
              cursor: !text.trim() || isPaying ? 'not-allowed' : 'pointer',
            }}
          >
            {isPaying ? (
              <span style={{ opacity: 0.8 }}>Growing...</span>
            ) : (
              <>
                Plant
                <Send size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {showShare && sharedPrompt && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'oklch(65% 15% 145deg / 0.08)',
          border: '1px solid oklch(65% 15% 145deg / 0.2)',
          borderRadius: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-sage-deep)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Seed planted! Processing your idea...
            </span>
            <button
              type="button"
              onClick={() => setShowShare(false)}
              style={{ color: 'var(--color-stone)', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none' }}
            >
              Close
            </button>
          </div>

          <div style={{
            fontSize: '0.875rem',
            color: 'var(--color-bark)',
            marginBottom: '0.75rem',
            padding: '0.75rem',
            backgroundColor: 'var(--color-cream)',
            borderRadius: '8px',
            border: '1px solid var(--color-sand-line)',
          }}>
            &ldquo;{sharedPrompt.slice(0, 100)}{sharedPrompt.length > 100 ? '...' : ''}&rdquo;
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleCopyPrompt}
              style={{
                flex: 1,
                padding: '0.625rem 1rem',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: copied ? 'var(--color-success)' : 'var(--color-parchment)',
                color: copied ? 'white' : 'var(--color-bark)',
                transition: 'all 150ms var(--ease-out)',
              }}
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
            </button>
            <button
              type="button"
              onClick={handleTwitterShare}
              style={{
                flex: 1,
                padding: '0.625rem 1rem',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: 'oklch(72% 16% 38deg / 0.15)',
                color: 'var(--color-terra)',
                transition: 'all 150ms var(--ease-out)',
              }}
            >
              <Share2 size={14} /> Share on X
            </button>
          </div>
        </div>
      )}
    </div>
  );
});