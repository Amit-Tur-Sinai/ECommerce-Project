import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get initial theme from localStorage or system preference
const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if HTML script already set the class (runs before React)
  const hasDarkClass = document.documentElement.classList.contains('dark');
  const stored = localStorage.getItem('theme');
  
  // If localStorage exists, use it
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  
  // If HTML script set dark class but no localStorage, use that
  if (hasDarkClass) return true;
  
  // Fall back to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(() => getInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
