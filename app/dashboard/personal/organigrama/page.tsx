import OrgChartView from './OrgChartView'
import { getOrgTree } from '@/app/actions/org-chart'

export const dynamic = 'force-dynamic'

export default async function OrganigramaPage() {
    const tree = await getOrgTree()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Estructura y Procesos: Organigrama</h1>
            <OrgChartView initialTree={tree} />
        </div>
    )
}
