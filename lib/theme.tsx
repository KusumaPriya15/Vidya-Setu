import React, { createContext, useContext } from 'react';

type Theme = 'light';

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: 'light',
  setTheme: () => null,
});

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Always enforce light mode in the DOM just to be safe
  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  return (
    <ThemeProviderContext.Provider value={{ theme: 'light', setTheme: () => {} }}>
      {children}
    </ThemeProviderContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
