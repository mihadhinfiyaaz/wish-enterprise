import { Star } from 'lucide-react';

// Read-only star rating. `rating` 0–5, optionally with a review count.
export default function Stars({ rating = 0, reviewCount, size = 16, className = '' }) {
  const full = Math.round(rating * 2) / 2; // nearest half
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(full);
          const half = !filled && i - 0.5 === full;
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star size={size} className="text-line-2" strokeWidth={1.5} />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? size / 2 : size }}
                >
                  <Star size={size} className="fill-accent text-accent" strokeWidth={1.5} />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {(rating > 0 || reviewCount != null) && (
        <span className="text-sm text-muted">
          <span className="font-semibold text-fg">{Number(rating).toFixed(1)}</span>
          {reviewCount != null && ` (${reviewCount} reviews)`}
        </span>
      )}
    </div>
  );
}
