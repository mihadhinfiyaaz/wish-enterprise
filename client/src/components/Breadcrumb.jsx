import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// items: [{ label, to }]  — last item rendered as plain text (current page).
export default function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.to && !last ? (
              <Link to={item.to} className="transition-colors hover:text-accent">
                {item.label}
              </Link>
            ) : (
              <span className={last ? 'font-medium text-fg' : ''}>{item.label}</span>
            )}
            {!last && <ChevronRight size={13} className="text-faint" />}
          </span>
        );
      })}
    </nav>
  );
}
