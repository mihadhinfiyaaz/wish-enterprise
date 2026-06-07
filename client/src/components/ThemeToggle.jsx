import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-2 text-muted transition-all duration-300 hover:border-accent hover:text-accent ${className}`}
    >
      <Sun
        size={17}
        className={`absolute transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        }`}
      />
      <Moon
        size={17}
        className={`absolute transition-all duration-300 ${
          isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
    </button>
  );
}
