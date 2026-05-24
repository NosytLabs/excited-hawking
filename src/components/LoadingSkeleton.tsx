import React from 'react';

const shimmer = `
@keyframes shimmer {
  0% { opacity: 0.3; }
  50% { opacity: 0.7; }
  100% { opacity: 0.3; }
}
`;

export const CardSkeleton: React.FC = () => (
  <div
    className="rounded-lg"
    style={{
      padding: '1.5rem',
      backgroundColor: 'oklch(15% 2% 250deg / 0.5)',
      border: '1px solid oklch(30% 5% 250deg / 0.3)',
      animation: 'shimmer 2s ease-in-out infinite',
    }}
  >
    <style>{shimmer}</style>
    <div
      style={{
        height: '1rem',
        width: '40%',
        backgroundColor: 'oklch(25% 3% 250deg / 0.6)',
        borderRadius: '4px',
        marginBottom: '1rem',
      }}
    />
    <div
      style={{
        height: '2.5rem',
        width: '100%',
        backgroundColor: 'oklch(25% 3% 250deg / 0.6)',
        borderRadius: '4px',
        marginBottom: '0.75rem',
      }}
    />
    <div
      style={{
        height: '0.75rem',
        width: '60%',
        backgroundColor: 'oklch(25% 3% 250deg / 0.6)',
        borderRadius: '4px',
      }}
    />
  </div>
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div>
    <style>{shimmer}</style>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          gap: '0.75rem',
          padding: '0.75rem 0',
          borderBottom: i < rows - 1 ? '1px solid oklch(30% 5% 250deg / 0.15)' : 'none',
          animation: 'shimmer 2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }}
      >
        <div
          style={{
            width: '1rem',
            height: '1rem',
            backgroundColor: 'oklch(25% 3% 250deg / 0.6)',
            borderRadius: '2px',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: '0.75rem',
              width: '100%',
              backgroundColor: 'oklch(25% 3% 250deg / 0.6)',
              borderRadius: '4px',
              marginBottom: '0.5rem',
            }}
          />
          <div
            style={{
              height: '0.75rem',
              width: '60%',
              backgroundColor: 'oklch(25% 3% 250deg / 0.6)',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
    ))}
  </div>
);

export const CanvasSkeleton: React.FC = () => (
  <div
    className="flex items-center justify-center"
    style={{
      width: '200px',
      height: '200px',
      backgroundColor: 'oklch(10% 2% 250deg)',
      border: '1px solid oklch(30% 5% 250deg / 0.3)',
      borderRadius: '4px',
      animation: 'shimmer 2s ease-in-out infinite',
    }}
  >
    <style>{shimmer}</style>
    <span
      style={{
        fontSize: '0.625rem',
        fontFamily: 'var(--font-terminal)',
        color: 'oklch(50% 10% 140deg / 0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}
    >
      Loading grid...
    </span>
  </div>
);
