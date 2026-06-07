export default function Spinner({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-20 text-muted ${className}`}>
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
