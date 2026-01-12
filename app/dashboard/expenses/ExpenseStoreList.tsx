'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Store, ArrowRight, Loader2 } from 'lucide-react'
import { createExpenseStore } from '@/app/actions/expenses'

interface ExpenseStore {
    id: string
    name: string
    description: string | null
    createdAt: Date
    updatedAt: Date
}

export function ExpenseStoreList({ initialStores }: { initialStores: ExpenseStore[] }) {
    const router = useRouter()
    const [stores, setStores] = useState(initialStores)
    const [isCreating, setIsCreating] = useState(false)
    const [newStoreName, setNewStoreName] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newStoreName.trim()) return

        setIsLoading(true)
        const result = await createExpenseStore({ name: newStoreName })
        setIsLoading(false)

        if (result.success && result.data) {
            setStores([result.data, ...stores])
            setNewStoreName('')
            setIsCreating(false)
            router.refresh()
        }
    }

    return (
        <div className="space-y-6">
            {/* Create Button / Form */}
            {!isCreating ? (
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-900/20"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Tienda
                </button>
            ) : (
                <form onSubmit={handleCreateStore} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-xl max-w-md animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Nombre de la Tienda</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newStoreName}
                                onChange={(e) => setNewStoreName(e.target.value)}
                                placeholder="Ej. Sucursal Centro"
                                className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-[var(--text-secondary)]/50"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !newStoreName.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-[var(--text-secondary)] rounded-lg transition-colors border border-[var(--border-color)]"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Grid of Stores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stores.map((store) => (
                    <Link
                        key={store.id}
                        href={`/dashboard/expenses/${store.id}`}
                        className="group relative bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-blue-500/50 p-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/10 flex flex-col justify-between h-[160px]"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                            <ArrowRight className="w-5 h-5 text-blue-500" />
                        </div>

                        <div>
                            <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors border border-[var(--border-color)]">
                                <Store className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">{store.name}</h3>
                            {store.description && (
                                <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{store.description}</p>
                            )}
                        </div>

                        <div className="text-xs text-[var(--text-secondary)] font-medium">
                            Click para ver gastos
                        </div>
                    </Link>
                ))}

                {stores.length === 0 && !isCreating && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-xl">
                        <Store className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium">No hay tiendas registradas</p>
                        <p className="text-sm opacity-60">Crea tu primera tienda para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    )
}
