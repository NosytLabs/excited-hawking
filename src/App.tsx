/* Hallmark · macrostructure: Workbench · genre: terminal-aesthetic */
import { Suspense, lazy } from 'react';
import { AgentProvider } from './context/AgentContext';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LazyErrorBoundary } from './components/LazyErrorBoundary';
import { WelcomeAgent } from './components/WelcomeAgent';
import { OnboardingBanner } from './components/OnboardingBanner';
import { PromptBox } from './components/PromptBox';
import { AgentStream } from './components/AgentStream';
import { LifeMeter } from './components/LifeMeter';
import { MemoryBrain } from './components/MemoryBrain';
import { SocialSharing } from './components/SocialSharing';
import { PromptQueue } from './components/PromptQueue';
import { AppHeader } from './components/AppHeader';

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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--term-green)] focus:text-[var(--term-void)] focus:font-mono focus:text-sm focus:rounded"
        >
          Skip to main content
        </a>
        <AppHeader onOpenStaking={() => { window.location.href = '/#/stake'; }} />

        {/* Main content */}
        <main id="main-content" className="crt-screen">
          <WelcomeAgent />
          <OnboardingBanner />
          
          <div className="max-w-7xl mx-auto px-6 py-16 grid xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)] gap-8">
            {/* Main agent interface */}
            <div className="flex flex-col gap-8">
              <PromptBox />
              <AgentStream />
            </div>
            
            {/* Sidebar / Support rail */}
            <aside data-testid="support-rail" className="flex flex-col gap-6 xl:sticky xl:top-24" aria-label="Support modules">
              <PromptQueue />
              <LifeMeter />
              <MemoryBrain />
              <SocialSharing />
            </aside>
          </div>

          {/* Secondary sections */}
          <section 
            id="governance" 
            className="py-12 border-t"
            style={{ 
              backgroundColor: 'var(--shell-surface)',
              borderColor: 'var(--shell-border)'
            }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <h2 
                className="text-2xl font-bold tracking-tight mb-6"
                style={{ 
                  fontFamily: 'var(--font-display)',
                  color: 'var(--shell-text)',
                }}
              >
                System Governance
              </h2>
              <Suspense fallback={<LoadingFallback />}>
                <LazyErrorBoundary name="Governance">
                  <Governance />
                </LazyErrorBoundary>
              </Suspense>
            </div>
          </section>

          <section id="canvas" className="py-20 border-t" style={{ borderColor: 'var(--shell-border)' }}>
            <div className="max-w-7xl mx-auto px-6">
              <h2 
                className="text-lg font-semibold mb-8 tracking-wider uppercase"
                style={{ 
                  fontFamily: 'var(--font-terminal)',
                  color: 'var(--shell-text)'
                }}
              >
                Public Matrix
              </h2>
              <Suspense fallback={<LoadingFallback />}>
                <LazyErrorBoundary name="CanvasLayer">
                  <CanvasLayer />
                </LazyErrorBoundary>
              </Suspense>
            </div>
          </section>

          <section 
            className="py-16 border-t"
            style={{ 
              backgroundColor: 'var(--shell-surface)',
              borderColor: 'var(--shell-border)'
            }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <h2 
                className="text-base font-medium mb-8"
                style={{ 
                  fontFamily: 'var(--font-display)',
                  color: 'var(--shell-text)',
                  letterSpacing: '0.15em'
                }}
              >
                Citizen Log
              </h2>
              <Suspense fallback={<LoadingFallback />}>
                <LazyErrorBoundary name="Guestbook">
                  <Guestbook />
                </LazyErrorBoundary>
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
            className="flex justify-center gap-6 text-sm mb-4"
            style={{ color: 'var(--shell-text-muted)' }}
          >
            <span>Commons Agent © {new Date().getFullYear()}</span>
          </div>

        </footer>
      </div>
      </ErrorBoundary>
    </AgentProvider>
  );
}

export default App;