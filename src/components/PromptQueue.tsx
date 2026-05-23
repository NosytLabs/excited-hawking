import React, { useMemo } from 'react';
import { useAgent } from '../context/useAgent';
import { ListOrdered, ThumbsUp } from 'lucide-react';

export const PromptQueue: React.FC = () => {
  const { prompts, votePrompt } = useAgent();

  const activePrompts = useMemo(() =>
    prompts.filter(p => p.status === 'queued').sort((a, b) => b.votes - a.votes),
    [prompts]
  );

  return (
    <div className="glass-panel mb-6 h-[300px] flex flex-col">
      <h3 className="font-mono text-sm uppercase tracking-wider mb-4 flex items-center gap-2 text-zinc-300 border-b border-zinc-800 pb-2">
        <ListOrdered size={16} />
        Public Queue
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {activePrompts.length === 0 ? (
          <p className="text-zinc-500 text-sm font-mono text-center mt-8">No prompts in queue. Be the first!</p>
        ) : (
          activePrompts.map(prompt => (
            <div key={prompt.id} className="bg-[rgba(255,255,255,0.03)] border border-zinc-800 rounded p-3 flex gap-3 animate-fade-in">
              <button 
                onClick={() => votePrompt(prompt.id)}
                className="flex flex-col items-center justify-center shrink-0 w-10 text-zinc-400 hover:text-[#00d992] transition-colors"
              >
                <ThumbsUp size={14} className="mb-1" />
                <span className="font-mono text-xs">{prompt.votes}</span>
              </button>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 line-clamp-2 leading-relaxed">{prompt.text}</p>
                <div className="flex items-center gap-2 mt-2 font-mono text-[10px] text-zinc-500 uppercase">
                  <span>By: {prompt.user}</span>
                  <span>•</span>
                  <span className="text-zinc-400">${prompt.cost.toFixed(2)} USDC</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
