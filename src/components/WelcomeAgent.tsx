import React from 'react';
import { ChevronDown } from 'lucide-react';

export const WelcomeAgent: React.FC = () => {
  return (
    <section 
      className="relative min-h-[65vh] flex items-center justify-center overflow-hidden px-6 py-24"
      style={{ backgroundColor: 'var(--term-void)' }}
    >
      {/* Subtle grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(var(--term-green-dim) 1px, transparent 1px),
            linear-gradient(90deg, var(--term-green-dim) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Header badge */}
        <div 
          className="inline-block mb-8 px-4 py-2 border"
          style={{ 
            borderColor: 'var(--ui-bezel)',
            backgroundColor: 'var(--term-charcoal)'
          }}
        >
          <span 
            className="text-xs tracking-widest"
            style={{ 
              fontFamily: 'var(--font-terminal)',
              color: 'var(--term-green-dim)'
            }}
          >
            SESSION INITIALIZED
          </span>
        </div>

        <h1 
          className="font-medium mb-6 tracking-wide" 
          style={{ 
            fontFamily: 'var(--font-terminal)',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            color: 'var(--term-green)',
            textShadow: '0 0 30px oklch(70% 22% 140deg / 30%)',
          }}
        >
          Welcome to Agent Terminal
        </h1>
        
        <p 
          className="text-base md:text-lg mb-12 max-w-xl mx-auto opacity-80" 
          style={{ 
            fontFamily: 'var(--font-body)',
            color: 'var(--term-green-dim)',
            lineHeight: 1.7
          }}
        >
          A focused terminal for human-agent collaboration. 
          Ask questions, generate content, and interact with your AI companion.
        </p>

        <div className="flex gap-4 mb-12">
          <button 
            onClick={() => document.querySelector<HTMLDivElement>('.prompt-box')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 bg-term-green text-term-void font-bold uppercase tracking-wider hover:bg-white transition-colors"
          >
            Start Session
          </button>
          <button 
            onClick={() => window.open('https://github.com/obra/excited-hawking', '_blank')}
            className="px-6 py-3 border border-term-green text-term-green font-bold uppercase tracking-wider hover:bg-term-green/10 transition-colors"
          >
            View Docs
          </button>
        </div>
      </div>

      {/* Minimal corner accents */}
      <div 
        className="absolute top-6 left-6 w-6 h-6 border-l border-t"
        style={{ borderColor: 'var(--ui-bezel)' }}
      />
      <div 
        className="absolute top-6 right-6 w-6 h-6 border-r border-t"
        style={{ borderColor: 'var(--ui-bezel)' }}
      />
      <div 
        className="absolute bottom-6 left-6 w-6 h-6 border-l border-b"
        style={{ borderColor: 'var(--ui-bezel)' }}
      />
      <div 
        className="absolute bottom-6 right-6 w-6 h-6 border-r border-b"
        style={{ borderColor: 'var(--ui-bezel)' }}
      />

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <ChevronDown size={20} style={{ color: 'var(--term-amber)', opacity: 0.6 }} />
      </div>
    </section>
  );
};