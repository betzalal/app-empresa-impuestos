'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}>({
    theme: 'dark',
    toggleTheme: () => { },
    setTheme: () => { },
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark')

    useEffect(() => {
        // Check local storage or preference
        const savedTheme = localStorage.getItem('theme') as Theme
        if (savedTheme) {
            setThemeState(savedTheme)
        }
    }, [])

    useEffect(() => {
        // Update DOM
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(theme)

        // Also set data-theme attribute for easier CSS selection
        root.setAttribute('data-theme', theme)

        localStorage.setItem('theme', theme)
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
    }

    const toggleTheme = () => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
