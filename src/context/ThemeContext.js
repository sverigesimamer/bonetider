import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { dark, light } from '../theme/colors';

const ThemeContext = createContext({ theme: dark, isDark: true, setMode: () => {} });

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    return localStorage.getItem('bonetiderTheme') || 'system';
  });

  // Listen to system color scheme changes
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = mode === 'system' ? systemDark : mode === 'dark';
  const theme  = isDark ? dark : light;

  const setMode = (m) => {
    setModeState(m);
    localStorage.setItem('bonetiderTheme', m);
  };

  useEffect(() => {
    document.body.style.background = theme.bg;
  }, [theme.bg]);

  // Stabilize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({ theme, isDark, mode, setMode }),
    [isDark, mode, theme] // eslint-disable-line
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
