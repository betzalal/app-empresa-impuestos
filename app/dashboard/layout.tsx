import { ReactNode } from 'react'
import { Sidebar } from '@/app/components/Sidebar'
import { Header } from '@/app/components/Header'
import { getCompanyInfo } from '@/app/actions/company'
import { MainContent } from '@/app/components/dashboard/MainContent'
import { DashboardProvider } from '@/app/components/dashboard/DashboardContext'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const company = await getCompanyInfo()

    if (!company) {
        redirect('/')
        return null
    }

    const companyName = company?.name || "Mi Empresa"
    const logoUrl = company?.logoUrl || null

    return (
        <DashboardProvider>
            <div className="min-h-screen font-sans antialiased selection:bg-blue-500/30 selection:text-blue-600 transition-colors duration-300">
                <Sidebar companyName={companyName} logoUrl={logoUrl} />
                <Header />

                <MainContent>
                    {children}
                </MainContent>
            </div>
        </DashboardProvider>
    )
}
