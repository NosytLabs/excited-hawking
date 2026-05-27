import { Link } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-6">
        <span className="text-8xl font-display font-black text-muted/30" aria-hidden="true">
          404
        </span>
      </div>
      <h1 className="text-3xl font-display font-bold text-text mb-4">
        Signal Lost
      </h1>
      <p className="text-muted max-w-md mb-8">
        The neural pathway you're searching for doesn't exist or has been redistributed across the emergence grid.
      </p>
      <Link
        href="#"
        className="btn-primary flex items-center gap-2"
      >
        Return to Origin
      </Link>
    </div>
  );
}

export default NotFound;
