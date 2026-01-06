import DocumentsView from './DocumentsView'
import prisma from '@/lib/prisma'

export default async function FlujogramasPage() {
    const { getCompanyDocuments } = await import('@/app/actions/documents')
    const { getEmployees } = await import('@/app/lib/data/hr')

    const documents = await getCompanyDocuments()
    const employees = await getEmployees()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Estructura y Procesos: Flujogramas</h1>
            <DocumentsView initialDocuments={documents} employees={employees} />
        </div>
    )
}
