'use client'

import { useState, useEffect } from 'react'
import { getReceivedSurveys, deleteReceivedSurvey } from '@/app/actions/surveys'
import { Users, Trash2, ExternalLink, Calendar, Building, Mail, Target, Info, Search } from 'lucide-react'

export default function SurveysPage() {
    const [surveys, setSurveys] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedSurvey, setSelectedSurvey] = useState<any | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchSurveys()
    }, [])

    const fetchSurveys = async () => {
        setIsLoading(true)
        const data = await getReceivedSurveys()
        setSurveys(data)
        setIsLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este registro?')) {
            await deleteReceivedSurvey(id)
            fetchSurveys()
            if (selectedSurvey?.id === id) setSelectedSurvey(null)
        }
    }

    const filteredSurveys = surveys.filter(s =>
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nit.includes(searchTerm) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestión de Usuarios</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Monitoreo de onboarding institucional y captación de datos.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por empresa, NIT o email..."
                        className="input-field pl-10 w-full md:w-80"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="glass-card p-12 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-400 font-medium font-sans">Cargando datos...</p>
                        </div>
                    ) : filteredSurveys.length === 0 ? (
                        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
                            <Users className="text-slate-300 mb-4" size={48} />
                            <p className="text-slate-400 font-medium">No se encontraron registros de usuarios.</p>
                        </div>
                    ) : (
                        <div className="glass-card overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-[var(--border-color)]">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Empresa</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Administrador</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {filteredSurveys.map((survey) => (
                                        <tr
                                            key={survey.id}
                                            className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${selectedSurvey?.id === survey.id ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => setSelectedSurvey(survey)}
                                        >
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-bold text-[var(--text-primary)]">{survey.companyName}</div>
                                                <div className="text-xs text-slate-400">NIT: {survey.nit}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="text-[var(--text-primary)]">{survey.fullName}</div>
                                                <div className="text-xs text-slate-400">{survey.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(survey.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(survey.id); }}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Details Sidebar */}
                <div className="lg:col-span-1">
                    {selectedSurvey ? (
                        <div className="glass-card p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-start justify-between">
                                <h2 className="text-lg font-bold text-[var(--text-primary)]">Detalles de Empresa</h2>
                                <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                                    {selectedSurvey.industry || 'General'}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <DetailItem icon={Building} label="NIT" value={selectedSurvey.nit} />
                                <DetailItem icon={Mail} label="Email Contacto" value={selectedSurvey.email} />
                                <DetailItem icon={Calendar} label="Fecha Registro" value={new Date(selectedSurvey.createdAt).toLocaleString()} />
                                <DetailItem icon={ExternalLink} label="Instancia Origen" value={selectedSurvey.sourceInstance} />
                            </div>

                            <div className="pt-6 border-t border-[var(--border-color)]">
                                <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase flex items-center gap-2">
                                    <Target size={14} /> Análisis de Onboarding
                                </h3>
                                <div className="space-y-3">
                                    <SurveyBadge label="Rol" value={selectedSurvey.role} />
                                    <SurveyBadge label="Prioridad" value={selectedSurvey.priority} />
                                    <SurveyBadge label="Equipo" value={selectedSurvey.teamSize} />
                                    <SurveyBadge label="Referencia" value={selectedSurvey.source} />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[var(--border-color)]">
                                <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
                                    <Info size={14} /> Descripción
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                    "{selectedSurvey.description || 'Sin descripción proporcionada.'}"
                                </p>
                            </div>

                            <button className="w-full btn-primary justify-center text-sm py-3 mt-4">
                                Ver JSON Completo
                            </button>
                        </div>
                    ) : (
                        <div className="glass-card p-12 flex flex-col items-center justify-center text-center opacity-50 grayscale border-dashed">
                            <Info className="text-slate-300 mb-4" size={32} />
                            <p className="text-slate-400 text-sm italic">Selecciona un usuario de la lista para ver el desglose completo del survey.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function DetailItem({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <Icon size={16} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{value || 'N/A'}</p>
            </div>
        </div>
    )
}

function SurveyBadge({ label, value }: { label: string, value: string }) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">{label}</span>
            <span className="text-[11px] font-bold text-slate-700">{value}</span>
        </div>
    )
}
