import { Suspense, lazy } from 'react';
import { AgentProvider } from './context/AgentContext';
import { Terminal, Cpu, Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WelcomeAgent } from './components/WelcomeAgent';
import { OnboardingBanner } from './components/OnboardingBanner';
import { PromptBox } from './components/PromptBox';
import { AgentStream } from './components/AgentStream';
import { LifeMeter } from './components/LifeMeter';
import { SocialSharing } from './components/SocialSharing';
import { PromptQueue } from './components/PromptQueue';

// Lazy load below-the-fold components
const Governance = lazy(() => import('./components/Governance').then(m => ({ default: m.Governance })));
const CanvasLayer = lazy(() => import('./components/CanvasLayer').then(m => ({ default: m.CanvasLayer })));
const Guestbook = lazy(() => import('./components/Guestbook').then(m => ({ default: m.Guestbook })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-12" style={{ color: 'var(--term-green-dim)' }}>
    <Loader2 className="animate-spin mr-2" size={24} />
    <span className="font-mono text-sm tracking-wider">LOADING MODULE...</span>
  </div>
);

function App() {
  return (
    <AgentProvider>
      <ErrorBoundary>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--term-void)' }}>
        {/* Header - Clean Terminal */}
        <header 
          className="sticky top-0 z-50 border-b"
          style={{ 
            backgroundColor: 'var(--term-charcoal)', 
            borderColor: 'var(--ui-bezel)',
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--term-green)',
                  boxShadow: '0 0 10px oklch(70% 22% 140deg / 40%)'
                }}
              >
                <Terminal size={18} style={{ color: 'var(--term-void)' }} />
              </div>
              <div>
                <span 
                  className="font-medium text-sm tracking-wide"
                  style={{ 
                    fontFamily: 'var(--font-terminal)',
                    color: 'var(--term-green)',
                  }}
                >
                  AGENT TERMINAL
                </span>

              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--term-green-dim)' }}>
                <Cpu size={12} />
                <span className="font-mono tracking-wider">ONLINE</span>
              </div>

              <button type="button" className="btn-primary text-xs tracking-wider px-4 py-2" aria-label="Connect wallet">
                CONNECT
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="crt-screen">
          <WelcomeAgent />
          <OnboardingBanner />
          
          <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-3 gap-8">
            {/* Main agent interface */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              <PromptBox />
              <AgentStream />
            </div>
            
            {/* Sidebar */}
            <div className="flex flex-col gap-8">
              <PromptQueue />
              <LifeMeter />
              <SocialSharing />
            </div>
          </div>

          {/* Secondary sections */}
          <section 
            id="governance" 
            className="py-16 border-t"
            style={{ 
              backgroundColor: 'var(--term-charcoal)',
              borderColor: 'var(--ui-bezel)'
            }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <h2 
                className="text-xl font-medium mb-8 tracking-wide"
                style={{ 
                  fontFamily: 'var(--font-terminal)',
                  color: 'var(--term-amber)',
                }}
              >
                {'>'} SYSTEM GOVERNANCE
              </h2>
              <Suspense fallback={<LoadingFallback />}>
                <Governance />
              </Suspense>
            </div>
          </section>

          <section id="canvas" className="py-16 border-t" style={{ borderColor: 'var(--ui-bezel)' }}>
            <div className="max-w-7xl mx-auto px-6">
              <h2 
                className="text-xl font-medium mb-8 tracking-wide"
                style={{ 
                  fontFamily: 'var(--font-terminal)',
                  color: 'var(--term-green)'
                }}
              >
                {'>'} PUBLIC MATRIX
              </h2>
              <Suspense fallback={<LoadingFallback />}>
                <CanvasLayer />
              </Suspense>
            </div>
          </section>

          <section 
            className="py-16 border-t"
            style={{ 
              backgroundColor: 'var(--term-charcoal)',
              borderColor: 'var(--ui-bezel)'
            }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <h2 
                className="text-xl font-medium mb-8 tracking-wide"
                style={{ 
                  fontFamily: 'var(--font-terminal)',
                  color: 'var(--term-amber)'
                }}
              >
                {'>'} CITIZEN LOG
              </h2>
              <Suspense fallback={<LoadingFallback />}>
                <Guestbook />
              </Suspense>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer 
          className="py-8 text-center border-t"
          style={{ 
            borderColor: 'var(--ui-bezel)',
            backgroundColor: 'var(--term-charcoal)'
          }}
        >
          <div 
            className="flex justify-center gap-6 text-sm tracking-wider mb-4"
            style={{ color: 'var(--term-green-dim)' }}
          >
            <span className="font-mono">AGENT TERMINAL © {new Date().getFullYear()}</span>
          </div>

        </footer>
      </div>
      </ErrorBoundary>
    </AgentProvider>
  );
}

export default App;