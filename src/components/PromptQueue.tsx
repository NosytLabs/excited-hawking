import React, { useMemo } from 'react';
import { useAgent } from '../context/useAgent';
import { ListOrdered, ThumbsUp } from 'lucide-react';

export const PromptQueue = React.memo(function PromptQueueComponent() {
  const { prompts, votePrompt, canVote, voteDisabledReason } = useAgent();

  const activePrompts = useMemo(() =>
    prompts.filter(p => p.status === 'queued').sort((a, b) => b.votes - a.votes),
    [prompts]
  );

  return (
    <div className="card h-[300px] flex flex-col">
      <h3 className="font-mono text-base uppercase tracking-wider mb-4 flex items-center gap-2 text-[var(--shell-text)] border-b border-[var(--shell-border)] pb-2">
        <ListOrdered size={16} />
        Prompt queue
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {activePrompts.length === 0 ? (
          <p className="text-[var(--shell-text-muted)] text-base font-mono text-center mt-8">No prompts in queue yet.</p>
        ) : (
          activePrompts.map(prompt => (
            <div key={prompt.id} className="bg-[var(--shell-surface-2)] border border-[var(--shell-border)] rounded p-3 flex gap-3 animate-fade-in">
              <button 
                aria-label="Vote for prompt"
                onClick={() => votePrompt(prompt.id)}
                disabled={!canVote}
                title={!canVote ? voteDisabledReason : "Vote for this prompt"}
                className="flex flex-col items-center justify-center shrink-0 w-10 text-[var(--shell-text-muted)] hover:text-[var(--vault-teal)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ThumbsUp size={14} className="mb-1" />
                <span className="font-mono text-base">{prompt.votes}</span>
              </button>
              
              <div className="flex-1 min-w-0">
                <p className="text-base text-[var(--shell-text)] line-clamp-2 leading-relaxed">{prompt.text}</p>
                <div className="flex items-center gap-2 mt-2 font-mono text-base text-[var(--shell-text-muted)] uppercase">
                  <span>By: {prompt.user}</span>
                  <span>•</span>
                  <span className="text-[var(--shell-text-muted)]">${prompt.cost.toFixed(2)} USDC</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {!canVote && (
        <p id="prompt-vote-note" className="mt-4 text-base text-[var(--shell-text-muted)] font-mono text-center">
          {voteDisabledReason}
        </p>
      )}
    </div>
  );
});
