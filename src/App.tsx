import { AgentProvider } from './context/AgentContext';
import { LifeMeter } from './components/LifeMeter';
import { AgentStream } from './components/AgentStream';
import { PromptBox } from './components/PromptBox';
import { PromptQueue } from './components/PromptQueue';
import { CanvasLayer } from './components/CanvasLayer';
import { Governance } from './components/Governance';
import { Guestbook } from './components/Guestbook';
import { SocialSharing } from './components/SocialSharing';
import { Terminal, Wifi, WifiOff } from 'lucide-react';
import { useAgent } from './context/useAgent';

function ConnectionStatus() {
  const { isConnected } = useAgent();

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <Wifi size={14} className="text-[#00d992]" />
          <span className="text-xs font-mono text-[#00d992]">LIVE</span>
        </>
      ) : (
        <>
          <WifiOff size={14} className="text-zinc-500" />
          <span className="text-xs font-mono text-zinc-500">OFFLINE</span>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AgentProvider>
      <div className="min-h-screen bg-[#050505] text-zinc-200 selection:bg-[#00d992] selection:text-black flex flex-col">
        <header className="glass-header px-4 md:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#00d992] flex items-center justify-center text-black">
              <Terminal size={20} />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg tracking-tight leading-none text-white">THE COMMONS AGENT</h1>
              <p className="font-mono text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">User-Owned Public AI</p>
            </div>
          </div>
          <nav className="flex items-center gap-3 sm:gap-6">
            <ConnectionStatus />
            <a href="#" className="hidden sm:block text-sm font-mono text-zinc-400 hover:text-white transition-colors">Docs</a>
            <a href="#" className="hidden sm:block text-sm font-mono text-zinc-400 hover:text-white transition-colors">Stake</a>
            <button className="flex items-center gap-2 bg-zinc-100 text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-white transition-colors">
              Connect
            </button>
          </nav>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 relative z-10">
          <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6">
            <LifeMeter />
            <AgentStream />
            <Guestbook />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
            <PromptBox />
            <PromptQueue />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <CanvasLayer />
              <SocialSharing />
            </div>
            <Governance />
          </div>
        </main>

        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00d992] rounded-full blur-[150px] opacity-10 mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0ea5e9] rounded-full blur-[150px] opacity-10 mix-blend-screen" />
        </div>
      </div>
    </AgentProvider>
  );
}

export default App;