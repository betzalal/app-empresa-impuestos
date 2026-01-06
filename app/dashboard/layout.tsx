import { ReactNode } from 'react'
import { Sidebar } from '@/app/components/Sidebar'
import { Header } from '@/app/components/Header'
import { getCompanyInfo } from '@/app/actions/company'
import { DashboardProvider } from '@/app/components/dashboard/DashboardContext'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const company = await getCompanyInfo()
    const companyName = company?.name || "SAWALIFE"
    const logoUrl = company?.logoUrl || "/images/logo.jpg"

    return (
        <DashboardProvider>
            <div className="min-h-screen font-sans antialiased selection:bg-blue-500/30 selection:text-blue-600 transition-colors duration-300">
                <Sidebar companyName={companyName} logoUrl={logoUrl} />
                <Header />

                <main className="pt-24 pb-8 px-4 sm:px-8 md:ml-64 transition-all duration-200">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </DashboardProvider>
    )
}
