import { getCurrentUser } from '@/app/actions/user'
import { getCompanyDataVolume } from '@/app/actions/company'
import { CompanyFloor1 } from '@/app/components/company/CompanyFloor1'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamic imports for heavy sections
const CompanyFloor2 = dynamic(() => import('@/app/components/company/CompanyFloor2').then(mod => mod.CompanyFloor2), {
    loading: () => <div className="h-[400px] w-full animate-pulse bg-slate-900/20 rounded-xl" />
})

const CompanyFloor3 = dynamic(() => import('@/app/components/company/CompanyFloor3').then(mod => mod.CompanyFloor3), {
    loading: () => <div className="h-[400px] w-full animate-pulse bg-slate-900/20 rounded-xl" />
})

export default async function CompanyPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/')
        return null
    }

    const dataVolume = await getCompanyDataVolume()
    const companyName = user?.company?.name || user?.username || "Mi Empresa"

    return (
        <div className="min-h-full space-y-24 pb-20">
            {/* PISO 1: Bienvenida */}
            <CompanyFloor1
                userName={user?.username || 'Usuario'}
                companyName={companyName}
                dataVolume={dataVolume}
            />

            {/* PISO 2: Memoria y Calendario */}
            <section className="container mx-auto px-4">
                <CompanyFloor2 />
            </section>

            {/* PISO 3: Integraciones y Gemini */}
            <section className="container mx-auto px-4 pb-12">
                <CompanyFloor3 />
            </section>
        </div>
    )
}

