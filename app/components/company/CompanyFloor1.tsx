'use client'

import { useEffect, useState } from 'react'

export function CompanyFloor1({
    userName,
    companyName,
    dataVolume = 0.5
}: {
    userName: string,
    companyName: string,
    dataVolume?: number
}) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div style={{ minHeight: '70vh' }} className="w-full flex items-center justify-center bg-slate-950/20" />
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] w-full relative">
            {/* Texts */}
            <div className="mt-12 space-y-4 text-center z-10 flex flex-col items-center relative animate-in fade-in duration-1000">
                <h2 className="text-xl md:text-2xl font-medium text-[var(--text-secondary)]">
                    Hola, <span className="text-[var(--text-primary)] font-bold">{userName}</span>
                </h2>

                <h1 className="text-3xl md:text-5xl font-black tracking-tight flex flex-col gap-2 items-center">
                    <span className="text-[var(--text-secondary)] opacity-80">¿Qué harás hoy</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 py-1">
                        {companyName}?
                    </span>
                </h1>
            </div>
        </div>
    )
}

