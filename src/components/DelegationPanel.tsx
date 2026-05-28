/* Hallmark · component: delegation-panel · genre: terminal-aesthetic · theme: Terminal */
import React from 'react';

interface DelegationPanelProps {
  quadraticWeight: number;
  delegations: { address: string; amount: number; lastUpdated: number }[];
  delegationAddress: string;
  onDelegationAddressChange: (address: string) => void;
  onDelegate: () => void;
  onClose?: () => void;
}

export const DelegationPanel: React.FC<DelegationPanelProps> = ({
  quadraticWeight,
  delegations,
  delegationAddress,
  onDelegationAddressChange,
  onDelegate,
}) => (
  <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--paper-void)', border: '1px solid var(--accent-dim)' }}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base font-mono" style={{ color: 'var(--accent-primary)' }}>CULTIVATION CIRCLE</span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center text-base font-mono">
        <span className="text-[var(--accent-dim)]">Root Strength:</span>
        <span className="text-[var(--accent-primary)]">{quadraticWeight.toFixed(2)} roots</span>
      </div>
      <div className="flex justify-between items-center text-base font-mono">
        <span className="text-[var(--accent-dim)]">Delegated:</span>
        <span className="text-[var(--accent-primary)]">{delegations.reduce((sum, d) => sum + d.amount, 0)} seeds</span>
      </div>
      <label htmlFor="delegation-address" className="sr-only">Delegation address</label>
      <input
        id="delegation-address"
        type="text"
        value={delegationAddress}
        onChange={(e) => onDelegationAddressChange(e.target.value)}
        placeholder="Enter address..."
        className="w-full mt-2 bg-black/50 border border-[var(--accent-dim)] rounded px-3 py-2 text-base font-mono text-[var(--accent-primary)] placeholder-[var(--paper-border)] focus:outline-none focus:border-[var(--accent-primary)]"
      />
      <button
        type="button"
        onClick={() => {
          if (delegationAddress.trim()) {
            onDelegate();
          }
        }}
        className="w-full mt-2 bg-[var(--accent-dim)]/30 hover:bg-[var(--accent-dim)]/50 text-[var(--accent-primary)] border border-[var(--accent-primary)] text-base font-mono py-2 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
        aria-label="Execute delegation"
      >
        [EXECUTE DELEGATION]
      </button>
    </div>
  </div>
);
