import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'All Hangers', to: '/hangers' },
  { label: 'Wholesale', to: '/wholesale' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function submitSearch(e) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/hangers?q=${encodeURIComponent(q)}` : '/hangers');
    setSearchOpen(false);
    setMenuOpen(false);
    setQuery('');
  }

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
              {({ isActive }) => (
                <span className="relative">
                  {item.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px bg-accent transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0'
                    }`}
                  />
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-2 text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Search size={17} />
          </button>
          <ThemeToggle />
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-2 text-muted transition-colors hover:border-accent hover:text-accent md:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="animate-fade-in border-t border-line bg-base-alt">
          <form onSubmit={submitSearch} className="container-page flex items-center gap-3 py-3">
            <Search size={18} className="text-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hangers…"
              className="flex-1 bg-transparent text-sm text-fg placeholder:text-faint focus:outline-none"
            />
            <button type="submit" className="btn-solid !py-2 !px-5 text-xs">
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="animate-fade-in border-t border-line bg-base md:hidden">
          <div className="container-page flex flex-col py-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-3 text-sm transition-colors ${
                    isActive ? 'bg-surface-2 font-semibold text-fg' : 'text-muted hover:text-fg'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
