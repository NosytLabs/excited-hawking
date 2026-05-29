import { useEffect, useState } from 'react';

const MESSAGES = ['INITIALIZING', 'LOADING', 'PROCESSING', 'CALIBRATING'];

export function TerminalLoader() {
  const [dots, setDots] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex(i => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(msgInterval);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(c => !c);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="flex items-center gap-3 p-4">
      <span className="font-mono text-sm text-[var(--accent-primary)]">▸</span>
      <span className="font-mono text-sm text-[var(--paper-muted)]">
        {MESSAGES[messageIndex]}
        <span className="text-[var(--accent-primary)]">{dots}</span>
        <span className="text-[var(--paper-text)]">{showCursor ? '█' : ' '}</span>
      </span>
    </div>
  );
}
