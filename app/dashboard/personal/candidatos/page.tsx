import { getCandidates } from '@/app/actions/candidates'
import { CandidatesBoard } from './CandidatesBoard'

export default async function CandidatosPage() {
    const candidates = await getCandidates()

    return (
        <div className="h-full">
            <CandidatesBoard initialCandidates={candidates} />
        </div>
    )
}
