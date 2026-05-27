export function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-6">
        <span 
          className="text-8xl font-display font-black" 
          aria-hidden="true"
          style={{ color: 'var(--shell-text-muted)', opacity: 0.3 }}
        >
          404
        </span>
      </div>
      <h1 
        className="text-3xl font-display font-bold mb-4"
        style={{ color: 'var(--shell-text)' }}
      >
        Signal Lost
      </h1>
      <p 
        className="max-w-md mb-8"
        style={{ color: 'var(--shell-text-muted)' }}
      >
        The neural pathway you're searching for doesn't exist or has been redistributed across the emergence grid.
      </p>
      <a
        href="#"
        className="btn-primary flex items-center gap-2"
      >
        Return to Origin
      </a>
    </div>
  );
}

export default NotFound;
