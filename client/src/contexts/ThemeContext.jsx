import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
const STORAGE_KEY = 'skillintel_theme';
const VALID_THEMES = ['light', 'dark'];
const ThemeContext = createContext({
    theme: 'dark',
    setTheme: () => {},
    toggleTheme: () => {}
});
function readInitialTheme() {
    if (typeof window === 'undefined') return 'dark';
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved && VALID_THEMES.includes(saved)) return saved;
    } catch {  }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'dark';
}
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(readInitialTheme);
    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.dataset.theme = theme;
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        } catch {  }
    }, [theme]);
    const setTheme = useCallback((next) => {
        if (VALID_THEMES.includes(next)) setThemeState(next);
    }, []);
    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);
    const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
    return useContext(ThemeContext);
}
