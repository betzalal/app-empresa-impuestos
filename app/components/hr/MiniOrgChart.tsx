import { User, Users } from 'lucide-react'

export function MiniOrgChart({ jobTitle }: { jobTitle: string }) {
    // Simple heuristic to determine level for visualization
    const isManager = jobTitle.toLowerCase().includes('gerente') || jobTitle.toLowerCase().includes('manager') || jobTitle.toLowerCase().includes('jefe')

    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
            {/* Level 1: CEO/Top */}
            <div className={`w-12 h-8 rounded border-2 flex items-center justify-center ${isManager ? 'border-slate-300 bg-slate-100' : 'border-slate-200'} `}>
                <div className="w-16 h-[2px] bg-slate-300 absolute mt-8" />
            </div>

            {/* Level 2: Middle (Highlighted if Manager) */}
            <div className="flex gap-4 relative">
                <div className={`w-12 h-8 rounded border-2 flex items-center justify-center z-10 ${isManager ? 'border-yellow-500 bg-yellow-100' : 'border-slate-300 bg-slate-50'}`}>
                    {isManager && <User className="w-4 h-4 text-yellow-600" />}
                </div>
                <div className={`w-12 h-8 rounded border-2 flex items-center justify-center z-10 border-slate-200`}></div>
            </div>

            {/* Connector */}
            <div className="w-[1px] h-4 bg-slate-300 -mt-2"></div>
            <div className="w-32 h-[1px] bg-slate-300"></div>

            {/* Level 3: Individual Contributors (Highlighted if NOT Manager) */}
            <div className="flex gap-2 pt-2">
                <div className={`w-8 h-6 rounded border-2 flex items-center justify-center ${!isManager ? 'border-yellow-500 bg-yellow-100' : 'border-slate-200'}`}>
                    {!isManager && <User className="w-3 h-3 text-yellow-600" />}
                </div>
                <div className="w-8 h-6 rounded border-2 border-slate-200"></div>
                <div className="w-8 h-6 rounded border-2 border-slate-200"></div>
                <div className="w-8 h-6 rounded border-2 border-slate-200"></div>
            </div>

            <p className="text-xs text-slate-400 mt-2 font-medium">
                {isManager ? 'Management Level' : 'Operational Level'}
            </p>
        </div>
    )
}
