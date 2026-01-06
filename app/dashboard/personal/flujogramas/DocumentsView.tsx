'use client'

import { useState } from 'react'
import { Plus, FileText, Download, Trash2, X, Loader2 } from 'lucide-react'
import { uploadDocument, deleteDocument } from '@/app/actions/documents'

// Simple interface matching Prisma model
interface CompanyDocument {
    id: string
    title: string
    type: string
    url: string
    createdAt: Date
    employee?: {
        firstName: string
        lastName: string
    } | null
}

interface DocumentsViewProps {
    initialDocuments: CompanyDocument[]
    employees: { id: string, firstName: string, lastName: string }[]
}

export default function DocumentsView({ initialDocuments, employees }: DocumentsViewProps) {
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [uploading, setUploading] = useState(false)

    async function handleUpload(formData: FormData) {
        setUploading(true)
        // Ensure type is set
        formData.set('type', 'Flujograma')

        const res = await uploadDocument(formData)
        setUploading(false)

        if (res.success) {
            setIsUploadOpen(false)
            // Ideally we'd optimize optimistic updates, but revalidatePath handles refresh usually
        } else {
            alert(res.message)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este documento?')) return
        await deleteDocument(id)
    }

    // Helper to get icon based on extension (simple check)
    const getIcon = (url: string) => {
        if (url.endsWith('.pdf')) return <FileText className="w-6 h-6 text-red-500" />
        return <FileText className="w-6 h-6 text-blue-500" />
    }

    return (
        <div>
            {/* Header Actions */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Subir Flujograma
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-6">Documento</div>
                    <div className="col-span-3">Fecha</div>
                    <div className="col-span-3 text-right">Acciones</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {initialDocuments.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 italic">
                            No hay documentos cargados.
                        </div>
                    ) : (
                        initialDocuments.map((doc) => (
                            <div key={doc.id} className="grid grid-cols-12 items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="col-span-6 flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        {getIcon(doc.url)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-white">{doc.title}</div>
                                        {doc.employee && (
                                            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-0.5">
                                                ➜ {doc.employee.firstName} {doc.employee.lastName}
                                            </div>
                                        )}
                                        <a href={doc.url} target="_blank" className="text-xs text-blue-500 hover:underline truncate max-w-[200px] block">
                                            Ver archivo
                                        </a>
                                    </div>
                                </div>
                                <div className="col-span-3 text-sm text-slate-500">
                                    {new Date(doc.createdAt).toLocaleDateString()}
                                </div>
                                <div className="col-span-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={doc.url}
                                        download
                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-colors"
                                        title="Descargar"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Subir Flujograma</h3>
                            <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form action={handleUpload} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Título del Documento
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    placeholder="Ej. Proceso de Contratación"
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Asignar a Empleado (Opcional)
                                </label>
                                <select
                                    name="employeeId"
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                >
                                    <option value="">-- General / Sin asignar --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Archivo (PDF o Imagen)
                                </label>
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        name="file"
                                        required
                                        accept=".pdf,image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="space-y-2 pointer-events-none">
                                        <div className="mx-auto w-10 h-10 bg-orange-100 dark:bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center">
                                            <Download className="w-5 h-5 rotate-180" />
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            Arrastra tu archivo aquí o <span className="text-orange-500 font-medium">haz clic para buscar</span>
                                        </p>
                                        <p className="text-xs text-slate-400">PDF, PNG, JPG hasta 10MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50 flex justify-center items-center"
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {uploading ? 'Subiendo...' : 'Subir Documento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
