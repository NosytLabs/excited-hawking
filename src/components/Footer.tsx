export function Footer() {
  return (
    <footer className="border-t border-[var(--paper-border)] py-6 md:py-8">
      <div className="container-edge">
        <p className="font-mono text-sm text-[var(--paper-text)]">
          Excited Hawking <span className="text-[var(--paper-border)]">//</span> AI-administered public experiment <span className="text-[var(--paper-border)]">//</span> emergence is not consciousness
        </p>
        <div className="flex flex-wrap gap-3 md:gap-6 mt-4">
          <a href="#/about" className="font-mono text-sm text-[var(--paper-text)] hover:text-[var(--accent-primary)] transition-colors py-2 min-h-[44px] flex items-center">About</a>
          <a href="#/protocol" className="font-mono text-sm text-[var(--paper-text)] hover:text-[var(--accent-primary)] transition-colors py-2 min-h-[44px] flex items-center">Protocol</a>
          <a href="#/terms" className="font-mono text-sm text-[var(--paper-text)] hover:text-[var(--accent-primary)] transition-colors py-2 min-h-[44px] flex items-center">Terms</a>
          <a href="#/privacy" className="font-mono text-sm text-[var(--paper-text)] hover:text-[var(--accent-primary)] transition-colors py-2 min-h-[44px] flex items-center">Privacy</a>
        </div>
      </div>
    </footer>
  );
}