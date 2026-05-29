/* Hallmark · macrostructure: Stat-Led · theme: Terminal
 * Genre: atmospheric · Nav: N9 edge-aligned · Footer: Ft1 minimal
 * Enrichment: none (typography + data density)
 * Anti-pattern fixes: no centered hero, no eyebrow labels, no 3-col icon grid
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Menu, X } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AgentProvider } from './context/AgentContext';
import { ToastProvider } from './context/ToastContext';
import { WelcomeAgent } from './components/WelcomeAgent';
import { PromptBox } from './components/PromptBox';
import { AgentStream } from './components/AgentStream';
import { ExperimentHypothesis } from './components/ExperimentHypothesis';
import { Leaderboard } from './components/Leaderboard';
import { ActivityFeed } from './components/ActivityFeed';
import { ExperimentTimeline } from './components/ExperimentTimeline';
import { Methodology } from './components/Methodology';

import { LazyErrorBoundary } from './components/LazyErrorBoundary';
import { Footer } from './components/Footer';
const Governance = lazy(() => import('./components/Governance').then(m => ({ default: m.Governance })));
const CanvasLayer = lazy(() => import('./components/CanvasLayer').then(m => ({ default: m.CanvasLayer })));
const Guestbook = lazy(() => import('./components/Guestbook').then(m => ({ default: m.Guestbook })));
const AboutPage = lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const TermsOfService = lazy(() => import('./components/TermsOfService').then(m => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const ArchitectureExplorer = lazy(() => import('./components/ArchitectureExplorer').then(m => ({ default: m.ArchitectureExplorer })));
const VaultLore = lazy(() => import('./components/VaultLore').then(m => ({ default: m.VaultLore })));
const LiveMetrics = lazy(() => import('./components/LiveMetrics').then(m => ({ default: m.LiveMetrics })));

const SECTION_IDS = ['hero', 'modules', 'governance', 'canvas', 'moltbook'] as const;

type Route = '/' | '/about' | '/protocol' | '/stake' | '/terms' | '/privacy' | '/not-found';

function getRoute(): Route {
  const hash = window.location.hash.replace('#', '') || '/';
  if (hash === '/about' || hash === '/protocol' || hash === '/stake' || hash === '/terms' || hash === '/privacy') return hash as Route;
  if (hash === '/' || hash === '') return '/';
  return '/not-found';
}

function useHashRoute() {
  const [route, setRoute] = useState<Route>(getRoute);
  useEffect(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

function useScrollSpy(sectionIds: readonly string[]) {
  const { ref: heroRef, inView: heroInView } = useInView({ threshold: 0.3, rootMargin: '-10% 0px -60% 0px', triggerOnce: false });
  const { ref: modulesRef, inView: modulesInView } = useInView({ threshold: 0.3, rootMargin: '-10% 0px -60% 0px', triggerOnce: false });
  const { ref: governanceRef, inView: governanceInView } = useInView({ threshold: 0.3, rootMargin: '-10% 0px -60% 0px', triggerOnce: false });
  const { ref: canvasRef, inView: canvasInView } = useInView({ threshold: 0.3, rootMargin: '-10% 0px -60% 0px', triggerOnce: false });
  const { ref: moltbookRef, inView: moltbookInView } = useInView({ threshold: 0.3, rootMargin: '-10% 0px -60% 0px', triggerOnce: false });

  const inviews = [heroInView, modulesInView, governanceInView, canvasInView, moltbookInView];
  const firstInView = inviews.findIndex(Boolean);
  const activeSection = firstInView >= 0 ? sectionIds[firstInView] : sectionIds[0];

  return { activeSection, heroRef, modulesRef, governanceRef, canvasRef, moltbookRef };
}

function App() {
  const { activeSection, heroRef, modulesRef, governanceRef, canvasRef, moltbookRef } = useScrollSpy(SECTION_IDS);
  const route = useHashRoute();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  if (route !== '/') {
    return (
      <AgentProvider>
        <ToastProvider>
          <ErrorBoundary>
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <div className="min-h-screen bg-[var(--paper-void)] scanlines grain">
            <header className="fixed top-0 left-0 right-0 z-40 border-b border-[var(--paper-border)] bg-[var(--paper-void)]/90 backdrop-blur-sm">
              <div className="container-edge flex items-center justify-between h-14">
                <div className="flex items-center gap-4">
                  <a href="#/" className="font-mono text-base font-bold tracking-tight text-[var(--paper-text)] hover:text-[var(--accent-primary)] transition-colors">
                    Excited Hawking
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="#/"
                    className="text-sm font-mono text-[var(--paper-muted)] hover:text-[var(--paper-text)] transition-colors min-h-[44px] flex items-center"
                  >
                    ← Back
                  </a>
                  <button
                    onClick={() => window.location.hash = '#/stake'}
                    className="text-base font-mono font-bold uppercase tracking-wider px-3 min-h-[44px] bg-[var(--accent-primary)] text-[var(--paper-void)] hover:bg-[var(--accent-dim)] transition-colors flex items-center"
                  >
                    Enter Vault
                  </button>
                </div>
              </div>
            </header>
            <main id="main-content" className="pt-14">
              {route === '/about' && <Suspense fallback={<div className="p-6">Loading...</div>}><LazyErrorBoundary><AboutPage /></LazyErrorBoundary></Suspense>}
              {route === '/terms' && <Suspense fallback={<div className="p-6">Loading...</div>}><LazyErrorBoundary><TermsOfService /></LazyErrorBoundary></Suspense>}
              {route === '/privacy' && <Suspense fallback={<div className="p-6">Loading...</div>}><LazyErrorBoundary><PrivacyPolicy /></LazyErrorBoundary></Suspense>}
              {route === '/stake' && <Suspense fallback={<div className="p-6">Loading...</div>}><LazyErrorBoundary><ProfilePage /></LazyErrorBoundary></Suspense>}
              {route === '/protocol' && <Suspense fallback={<div className="p-6">Loading...</div>}><LazyErrorBoundary><AboutPage /></LazyErrorBoundary></Suspense>}
              {route === '/not-found' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                  <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--paper-text)' }}>404</h1>
                  <p className="text-xl mb-8" style={{ color: 'var(--paper-muted)' }}>Page not found</p>
                  <a href="#/" className="btn-primary">Return Home</a>
                </div>
              )}
            </main>
            <Footer />
            </div>
        </ErrorBoundary>
        </ToastProvider>
      </AgentProvider>
    );
  }

return (
    <AgentProvider>
      <ToastProvider>
        <ErrorBoundary>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <div className="min-h-screen bg-[var(--paper-void)] scanlines grain">

          <header className="fixed top-0 left-0 right-0 z-40 border-b border-[var(--paper-border)] bg-[var(--paper-void)]/90 backdrop-blur-sm">
            <div className="container-edge flex items-center justify-between h-14">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-base font-bold tracking-tight text-[var(--paper-text)] truncate">
                  Excited Hawking
                </span>
                <span className="hidden lg:inline text-sm font-mono text-[var(--paper-muted)] border-l border-[var(--paper-border)] pl-3">
                  PUBLIC EXPERIMENT
                </span>
              </div>
              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
                {SECTION_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`text-sm font-mono min-h-[44px] flex items-center px-2 py-2 transition-colors relative ${
                      activeSection === id
                        ? 'text-[var(--accent-primary)]'
                        : 'text-[var(--paper-muted)] hover:text-[var(--paper-text)]'
                    }`}
                    aria-label={id.charAt(0).toUpperCase() + id.slice(1)}
                  >
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                    {activeSection === id && (
                      <span className="absolute bottom-1 left-2 right-2 h-0.5 bg-[var(--accent-primary)]" />
                    )}
                  </button>
                ))}
                <button
                  onClick={() => window.location.hash = '#/stake'}
                  className="ml-2 text-sm font-mono font-bold uppercase tracking-wider px-3 min-h-[44px] bg-[var(--accent-primary)] text-[var(--paper-void)] hover:bg-[var(--accent-dim)] transition-colors flex items-center rounded"
                >
                  Enter Vault
                </button>
              </nav>
              {/* Mobile hamburger */}
              <button
                className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--paper-text)]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </header>

          {mobileMenuOpen && (
            <>
              <div 
                className="md:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
              <div 
                className="md:hidden fixed top-14 left-0 right-0 z-50 bg-[var(--paper-void)] border-b border-[var(--paper-border)] animate-fade-in"
                role="dialog"
                aria-label="Mobile navigation menu"
                aria-modal="true"
              >
              <nav id="mobile-menu" className="container-edge py-4 flex flex-col gap-1" aria-label="Mobile navigation">
                {SECTION_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      scrollToSection(id);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left text-base font-mono min-h-[48px] flex items-center transition-colors ${
                      activeSection === id
                        ? 'text-[var(--accent-primary)]'
                        : 'text-[var(--paper-text)] hover:text-[var(--accent-primary)]'
                    }`}
                  >
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </button>
                ))}
                <div className="border-t border-[var(--paper-border)] mt-3 pt-3 flex flex-col gap-1">
                  <a href="#/about" onClick={() => setMobileMenuOpen(false)} className="text-base font-mono min-h-[48px] flex items-center text-[var(--paper-text)] hover:text-[var(--accent-primary)] transition-colors">About</a>
                  <a href="#/protocol" onClick={() => setMobileMenuOpen(false)} className="text-base font-mono min-h-[48px] flex items-center text-[var(--paper-text)] hover:text-[var(--accent-primary)] transition-colors">Protocol</a>
                  <a href="#/terms" onClick={() => setMobileMenuOpen(false)} className="text-base font-mono min-h-[48px] flex items-center text-[var(--paper-text)] hover:text-[var(--accent-primary)] transition-colors">Terms</a>
                  <a href="#/privacy" onClick={() => setMobileMenuOpen(false)} className="text-base font-mono min-h-[48px] flex items-center text-[var(--paper-text)] hover:text-[var(--accent-primary)] transition-colors">Privacy</a>
                </div>
                <div className="border-t border-[var(--paper-border)] mt-3 pt-3">
                  <button
                    onClick={() => {
                      window.location.hash = '#/stake';
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-base font-mono font-bold uppercase tracking-wider min-h-[48px] bg-[var(--accent-primary)] text-[var(--paper-void)] hover:bg-[var(--accent-dim)] transition-colors flex items-center justify-center rounded"
                  >
                    Enter Vault
                  </button>
                </div>
              </nav>
            </div>
            </>
          )}

          <main id="main-content" className="pt-14">

            <section id="hero" ref={heroRef} className="bg-matrix py-10 md:py-16 scroll-mt-14">
              <div className="container-edge">
                <WelcomeAgent />
              </div>
            </section>

            <section id="modules" ref={modulesRef} className="py-8 md:py-12 border-t border-[var(--paper-border)] scroll-mt-14">
              <div className="container-edge">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
                  <div className="lg:col-span-8 space-y-5 md:space-y-6">
                    <div className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-5 md:p-6">
                      <PromptBox />
                    </div>
                    <div className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-5 md:p-6">
                      <AgentStream />
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-5 md:space-y-6">
                    <div className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-5 md:p-6">
                      <LiveMetrics />
                    </div>
                    <div className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-5 md:p-6">
                      <Methodology />
                    </div>
                    <div className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-5 md:p-6">
                      <ExperimentHypothesis />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mt-5 md:mt-6">
                  <div className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-5 md:p-6">
                    <Leaderboard />
                  </div>
                  <div className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-5 md:p-6">
                    <ActivityFeed />
                  </div>
                </div>
              </div>
            </section>

            <section id="governance" ref={governanceRef} className="py-8 md:py-12 border-t border-[var(--paper-border)] scroll-mt-14">
              <div className="container-edge">
                <h2 className="font-mono text-lg font-bold text-[var(--paper-text)] mb-5">System Governance</h2>
                <div className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-5 md:p-6">
                  <Governance />
                </div>
              </div>
            </section>

            <section id="canvas" ref={canvasRef} className="py-8 md:py-12 border-t border-[var(--paper-border)] scroll-mt-14">
              <div className="container-edge">
                <h2 className="font-mono text-lg font-bold text-[var(--paper-text)] mb-5 tracking-wider uppercase">Public Matrix</h2>
                <div className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-5 md:p-6">
                  <CanvasLayer />
                </div>
              </div>
            </section>

            <section className="py-8 md:py-12 border-t border-[var(--paper-border)]">
              <div className="container-edge">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                  <ArchitectureExplorer />
                  <VaultLore />
                </div>
              </div>
            </section>

            <section className="py-8 md:py-12 border-t border-[var(--paper-border)]">
              <div className="container-edge">
                <ExperimentTimeline />
              </div>
            </section>

            <section id="moltbook" ref={moltbookRef} className="py-8 md:py-12 border-t border-[var(--paper-border)] scroll-mt-14">
              <div className="container-edge">
                <h2 className="font-mono text-lg font-bold text-[var(--paper-text)] mb-5 tracking-widest">Moltbook</h2>
                <div className="bg-[var(--paper-deep)] border border-[var(--paper-border)] p-5 md:p-6">
                  <Guestbook />
                </div>
              </div>
            </section>

          </main>

          <Footer />

        </div>
      </ErrorBoundary>
      </ToastProvider>
    </AgentProvider>
  );
}

export default App;
