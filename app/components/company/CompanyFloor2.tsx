'use client'

import { useState, useEffect, useTransition } from 'react'
import { CalendarEvent, createMemory, getCompanyEvents, deleteMemory, lockDay } from '@/app/actions/company'
import { ChevronLeft, ChevronRight, Save, Upload, FileText, AlertCircle, CheckCircle2, Lock, Trash2, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function CompanyFloor2() {
    const [memoryText, setMemoryText] = useState('')
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false) // Controls visibility
    const [isPending, startTransition] = useTransition()
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

    // Load events
    useEffect(() => {
        const loadEvents = async () => {
            // Fetch for current view (year/month) - fetching broader range ideally
            const data = await getCompanyEvents(currentDate.getMonth() + 1, currentDate.getFullYear())
            setEvents(data)
        }
        loadEvents()
    }, [currentDate, isPending]) // Reload when pending finishes (after save)

    const handleSaveMemory = () => {
        if (!memoryText.trim()) return

        startTransition(async () => {
            await createMemory(memoryText, selectedDate)
            setMemoryText('')
            // Optimistic update or wait for reload
        })
    }

    const handleDeleteMemory = (id: string) => {
        if (confirm('¿Estás seguro de borrar esta memoria?')) {
            startTransition(async () => {
                await deleteMemory(id)
            })
        }
    }

    const handleLockDay = () => {
        if (confirm('¿Estás seguro de guardar el día? No podrás hacer más cambios.')) {
            startTransition(async () => {
                await lockDay(selectedDate)
            })
        }
    }

    const handleDayClick = (date: Date) => {
        setSelectedDate(date)
        setIsModalOpen(true)
    }

    // Calendar Helper
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() // 0 = Sun

    const renderCalendarGrid = () => {
        const days = []
        // Empty slots for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/5 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50"></div>)
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const isToday = new Date().toDateString() === date.toDateString()
            const isSelected = selectedDate.toDateString() === date.toDateString()

            const dayEvents = events.filter(e =>
                new Date(e.date).getDate() === day &&
                new Date(e.date).getMonth() === currentDate.getMonth() &&
                new Date(e.date).getFullYear() === currentDate.getFullYear()
            )

            // Look for lock event in the full list for this day
            const dayIsLocked = dayEvents.some(e => e.type === 'lock')

            days.push(
                <div
                    key={day}
                    onClick={() => handleDayClick(date)}
                    className={`h-24 border p-1 relative cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50
                        ${isSelected ? 'border-blue-500 bg-blue-50/10' : 'border-slate-100 dark:border-slate-800/50 dark:bg-slate-900/20'}
                    `}
                >
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                            {day}
                        </span>
                        {/* Indicators Dot */}
                        <div className="flex gap-0.5">
                            {dayEvents.filter(e => e.type !== 'lock').map((ev, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full 
                                    ${ev.type === 'memory' ? 'bg-purple-400' :
                                        ev.type === 'tax' ? 'bg-red-400' :
                                            ev.type === 'payment' ? 'bg-green-400' : 'bg-gray-400'}
                                `} />
                            ))}
                        </div>
                        {dayIsLocked && <Lock size={12} className="text-slate-500" />}
                    </div>

                    {/* Tiny Event Previews */}
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                        {dayEvents.filter(e => e.type !== 'lock').slice(0, 3).map((ev, i) => (
                            <div key={i} className="text-[9px] truncate px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {ev.title}
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return days
    }

    const selectedDayEvents = events.filter(e => e.date.toDateString() === selectedDate.toDateString())
    const isDayLocked = selectedDayEvents.some(e => e.type === 'lock')

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* CARD A: MEMORIA (Left Column) */}
            <div className="glass-card p-6 flex flex-col h-[500px]">
                <div className="mb-4">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        Memoria Diaria
                    </h2>
                    <p className="text-xs text-slate-400">
                        Editando para: <span className="text-white font-medium">{selectedDate.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </p>
                </div>

                <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800 p-4 relative focus-within:ring-2 focus-within:ring-purple-500/50 transition-all">
                    {isDayLocked ? (
                        <div className="absolute inset-0 z-10 bg-slate-900/80 flex flex-col items-center justify-center text-slate-400">
                            <Lock size={32} className="mb-2 text-purple-500" />
                            <p className="text-sm font-medium">Día Cerrado</p>
                            <p className="text-xs">No se pueden agregar más memorias.</p>
                        </div>
                    ) : null}

                    <textarea
                        value={memoryText}
                        onChange={(e) => setMemoryText(e.target.value)}
                        placeholder="Escribe lo más importante de hoy..."
                        disabled={isDayLocked}
                        className="w-full h-full bg-transparent border-0 focus:ring-0 resize-none text-slate-300 placeholder-slate-600 text-sm leading-relaxed"
                    />
                    <div className="absolute bottom-4 right-4">
                        <button
                            onClick={handleSaveMemory}
                            disabled={isPending || !memoryText.trim() || isDayLocked}
                            className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-full shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* CARD B: CALENDAR (Right Column - Wider) */}
            <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[600px] lg:h-[500px]">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Calendario Fiscal & Eventos</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-slate-800 rounded">
                            <ChevronLeft className="text-slate-400" />
                        </button>
                        <span className="text-sm font-medium text-slate-300 w-32 text-center">
                            {currentDate.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-slate-800 rounded">
                            <ChevronRight className="text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-slate-500 uppercase">
                        <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                    </div>
                    {/* Days Grid */}
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {renderCalendarGrid()}
                    </div>
                </div>

                {/* Footer / Legend / Quick Actions */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400"></span>Memorias</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span>Impuestos</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span>Pagos</span>
                    </div>
                    {/* "Llenar datos / Subir imagen" generic trigger */}
                    <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                        <Upload size={14} /> Subir Documento / Imagen
                    </button>
                </div>
            </div>

            {/* Selected Day Modal/Dialog - "Opening" the day */}
            <AnimatePresence>
                {isModalOpen && selectedDate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing
                            className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {selectedDate.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    {isDayLocked && <Lock size={16} className="text-white/80" />}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1"
                                >
                                    <ChevronLeft className="rotate-180" size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                {selectedDayEvents.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        <p>No hay eventos registrados para este día.</p>
                                        {!isDayLocked && <p className="text-xs mt-2">Usa "Memoria Diaria" para agregar notas.</p>}
                                    </div>
                                ) : (
                                    selectedDayEvents.filter(e => e.type !== 'lock').map((ev) => (
                                        <div key={ev.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex gap-4 items-start group relative">
                                            <div className={`p-3 rounded-full flex-shrink-0 ${ev.type === 'memory' ? 'bg-purple-500/10 text-purple-400' :
                                                ev.type === 'tax' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-green-500/10 text-green-400'
                                                }`}>
                                                {ev.type === 'memory' ? <FileText size={20} /> : ev.type === 'tax' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-slate-200">{ev.title}</h4>
                                                <p className="text-sm text-slate-400 leading-relaxed mt-1 break-words">{ev.description}</p>
                                                {ev.metadata?.url && (
                                                    <div className="mt-2">
                                                        <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded border border-blue-800/50">
                                                            Ver Documento
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Delete Button for Memories */}
                                            {ev.type === 'memory' && !isDayLocked && (
                                                <button
                                                    onClick={() => handleDeleteMemory(ev.id)}
                                                    className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Borrar memoria"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
                                {isDayLocked ? (
                                    <button
                                        disabled
                                        className="flex items-center gap-2 text-green-400 text-sm font-medium px-4 py-2 bg-green-900/20 rounded-lg border border-green-800/50 cursor-not-allowed opacity-80"
                                    >
                                        <CheckCircle2 size={16} /> Día Guardado
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleLockDay}
                                        disabled={isPending}
                                        className="flex items-center gap-2 text-slate-300 hover:text-purple-300 text-sm font-medium px-4 py-2 hover:bg-purple-900/20 rounded-lg transition-colors border border-transparent hover:border-purple-800/30"
                                    >
                                        <Lock size={16} /> Guardar Día
                                    </button>
                                )}

                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-sm text-slate-400 hover:text-white px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div >
    )
}
