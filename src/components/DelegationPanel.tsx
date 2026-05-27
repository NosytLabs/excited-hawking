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
  <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--term-void)', border: '1px solid var(--term-green-dim)' }}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-mono" style={{ color: 'var(--term-green)' }}>CULTIVATION CIRCLE</span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-[var(--term-green-dim)]">Root Strength:</span>
        <span className="text-[var(--term-green)]">{quadraticWeight.toFixed(2)} roots</span>
      </div>
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-[var(--term-green-dim)]">Delegated:</span>
        <span className="text-[var(--term-green)]">{delegations.reduce((sum, d) => sum + d.amount, 0)} seeds</span>
      </div>
      <label htmlFor="delegation-address" className="sr-only">Delegation address</label>
      <input
        id="delegation-address"
        type="text"
        value={delegationAddress}
        onChange={(e) => onDelegationAddressChange(e.target.value)}
        placeholder="Enter address..."
        className="w-full mt-2 bg-black/50 border border-[var(--term-green-dim)] rounded px-3 py-2 text-xs font-mono text-[var(--term-green)] placeholder-[var(--term-concrete)] focus:outline-none focus:border-[var(--term-green)]"
      />
      <button
        type="button"
        onClick={() => {
          if (delegationAddress.trim()) {
            onDelegate();
          }
        }}
        className="w-full mt-2 bg-[var(--term-green-dim)]/30 hover:bg-[var(--term-green-dim)]/50 text-[var(--term-green)] border border-[var(--term-green)] text-xs font-mono py-2 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--term-green)]"
        aria-label="Execute delegation"
      >
        [EXECUTE DELEGATION]
      </button>
    </div>
  </div>
);
