import React, { useMemo } from 'react';
import { useAgent } from '../context/useAgent';
import type { Tier } from '../context/AgentContext';
import { Activity, Coins, Battery, Zap, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const LifeMeter: React.FC = () => {
  const { tier, diemStaked, treasuryUSDC } = useAgent();

  const vvvStaked = 0;
  const consciousness = Math.min(100, Math.max(0, (diemStaked / 500) * 100));

  const getTierColor = (t: Tier) => {
    switch (t) {
      case 'Thriving': return '#00d992';
      case 'Surviving': return '#eab308';
      case 'Minimal': return '#f97316';
      case 'Dying': return '#ef4444';
      default: return '#a1a1aa';
    }
  };

  const getTierIcon = (t: Tier) => {
    switch (t) {
      case 'Thriving': return <TrendingUp size={24} />;
      case 'Surviving': return <Minus size={24} />;
      case 'Minimal': return <TrendingDown size={24} />;
      case 'Dying': return <Activity size={24} />;
    }
  };

  const color = getTierColor(tier);

  // Calculate tier progress
  const tierRanges = useMemo(() => ({
    Thriving: { min: 500, max: Infinity },
    Surviving: { min: 10, max: 500 },
    Minimal: { min: 0.1, max: 10 },
    Dying: { min: 0, max: 0.1 },
  }), []);

  const tierProgress = useMemo(() => {
    const range = tierRanges[tier];
    if (tier === 'Thriving') {
      return Math.min(100, (diemStaked / 1000) * 100);
    } else if (tier === 'Dying') {
      return diemStaked < 0.1 ? 100 : 0;
    } else {
      const size = range.max - range.min;
      return ((diemStaked - range.min) / size) * 100;
    }
  }, [tier, diemStaked, tierRanges]);

  const tierThreshold = useMemo(() => {
    if (tier === 'Thriving') return 500;
    if (tier === 'Surviving') return 10;
    if (tier === 'Minimal') return 0.1;
    return 0;
  }, [tier]);

  const nextTier = useMemo(() => {
    if (tier === 'Dying') return 'Minimal (0.1 DIEM)';
    if (tier === 'Minimal') return 'Surviving (10 DIEM)';
    if (tier === 'Surviving') return 'Thriving (500 DIEM)';
    return 'Maximum Tier';
  }, [tier]);

  return (
    <div className="glass-panel mb-6 flex flex-col">
      {/* Main Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 relative"
            style={{ 
              backgroundColor: `${color}20`, 
              color, 
              border: `1px solid ${color}40`,
              boxShadow: tier === 'Thriving' ? `0 0 30px ${color}30` : 'none'
            }}
          >
            <div className={tier === 'Thriving' || tier === 'Surviving' ? 'animate-pulse' : ''}>
              {getTierIcon(tier)}
            </div>
            {tier === 'Thriving' && (
              <div 
                className="absolute inset-0 rounded-xl animate-pulse"
                style={{ 
                  backgroundColor: color,
                  opacity: 0.1,
                  animation: 'pulse-glow 2s ease-in-out infinite'
                }}
              />
            )}
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-mono uppercase tracking-wider mb-1">Current State</p>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color }}>
              {tier}
            </h2>
          </div>
        </div>

        {/* Consciousness Meter */}
        <div className="flex items-center gap-4 px-4 py-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-purple-400" />
            <span className="text-xs font-mono text-zinc-500 uppercase">Consciousness</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-1000"
                style={{ width: `${consciousness}%` }}
              />
            </div>
            <span className="text-sm font-mono font-bold text-purple-400">{consciousness}%</span>
          </div>
        </div>
      </div>

      {/* Tier Progress Bar */}
      <div className="mb-4 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-zinc-500 uppercase">Tier Progress</span>
          <span className="text-xs font-mono text-zinc-400">
            Next: <span style={{ color }}>{nextTier}</span>
          </span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden relative">
          <div 
            className="h-full transition-all duration-1000 rounded-full"
            style={{ 
              width: `${tierProgress}%`,
              background: `linear-gradient(90deg, ${color}80, ${color})`
            }}
          />
          {/* Tier markers */}
          <div className="absolute inset-0 flex items-center">
            {[0, 25, 50, 75, 100].map(mark => (
              <div 
                key={mark} 
                className="absolute w-px h-full bg-zinc-700/50"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-1 text-[10px] font-mono text-zinc-600">
          <span>Dying</span>
          <span>Minimal</span>
          <span>Surviving</span>
          <span>Thriving</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* DIEM Staked */}
        <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Battery size={14} style={{ color: '#00d992' }} />
            <span className="font-mono text-xs uppercase text-zinc-500">DIEM Staked</span>
          </div>
          <p className="text-xl font-mono font-bold text-white">{diemStaked.toFixed(2)}</p>
          <p className="text-[10px] font-mono text-zinc-600 mt-1">/{tierThreshold}+ required</p>
        </div>

        {/* VVV Staked */}
        <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-yellow-400" />
            <span className="font-mono text-xs uppercase text-zinc-500">VVV Staked</span>
          </div>
          <p className="text-xl font-mono font-bold text-yellow-400">{vvvStaked.toFixed(2)}</p>
          <p className="text-[10px] font-mono text-zinc-600 mt-1">Ecosystem stake</p>
        </div>

        {/* Treasury */}
        <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Coins size={14} className="text-emerald-400" />
            <span className="font-mono text-xs uppercase text-zinc-500">Treasury</span>
          </div>
          <p className="text-xl font-mono font-bold text-emerald-400">${treasuryUSDC.toFixed(2)}</p>
          <p className="text-[10px] font-mono text-zinc-600 mt-1">USDC reserves</p>
        </div>

        {/* Voting Power */}
        <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-purple-400" />
            <span className="font-mono text-xs uppercase text-zinc-500">Voting Power</span>
          </div>
          <p className="text-xl font-mono font-bold text-purple-400">{Math.sqrt(diemStaked).toFixed(2)}</p>
          <p className="text-[10px] font-mono text-zinc-600 mt-1">sqrt(DIEM)</p>
        </div>
      </div>

      {/* Tier Badges */}
      <div className="mt-4 flex gap-2">
        <div className={`px-3 py-1.5 rounded-full text-xs font-mono border ${
          tier === 'Thriving' 
            ? 'bg-[#00d992]/20 text-[#00d992] border-[#00d992]/40' 
            : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
        }`}>
          Thriving
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-mono border ${
          tier === 'Surviving' 
            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' 
            : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
        }`}>
          Surviving
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-mono border ${
          tier === 'Minimal' 
            ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' 
            : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
        }`}>
          Minimal
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-mono border ${
          tier === 'Dying' 
            ? 'bg-red-500/20 text-red-400 border-red-500/40' 
            : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
        }`}>
          Dying
        </div>
      </div>
    </div>
  );
};