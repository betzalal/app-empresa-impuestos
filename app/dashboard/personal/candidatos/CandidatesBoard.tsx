'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, X, FileText, Trash2, Calendar, DollarSign, Briefcase } from 'lucide-react'
import { createCandidate, updateCandidateStatus, deleteCandidate, hireCandidate, Candidate } from '@/app/actions/candidates' // Added hireCandidate
import { useRouter } from 'next/navigation'

interface Props {
    initialCandidates: Candidate[]
}

const COLUMNS = [
    { id: 'Recibido', title: 'Applied', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'Entrevista', title: 'Interview', color: 'bg-blue-50 dark:bg-blue-950' },
    { id: 'Oferta', title: 'Offer', color: 'bg-orange-50 dark:bg-orange-950' },
    { id: 'Contratado', title: 'Hired', color: 'bg-green-50 dark:bg-green-950' }
]

export function CandidatesBoard({ initialCandidates }: Props) {
    const router = useRouter()
    const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)

    // Sync with server data (in case of revalidation)
    useEffect(() => {
        setCandidates(initialCandidates)
    }, [initialCandidates])

    // UI State
    const [mounted, setMounted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Modals Control
    const [activeModal, setActiveModal] = useState<'create' | 'interview' | 'offer' | 'hire' | null>(null)

    // Drag & Modal Data State
    const [pendingDrag, setPendingDrag] = useState<{ id: string, newStatus: string } | null>(null)
    const [interviewDate, setInterviewDate] = useState('')
    const [offerNotes, setOfferNotes] = useState('')

    // Detailed Hire Form State
    const [hireFormData, setHireFormData] = useState({
        firstName: '',
        lastName: '',
        documentId: '',
        birthDate: '',
        address: '',
        phone: '',
        email: '',
        position: '',
        department: 'General',
        salary: 0,
        startDate: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        setMounted(true)
    }, [])

    // --- Drag Handling ---
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return
        if (destination.droppableId === source.droppableId && destination.index === source.index) return

        const newStatus = destination.droppableId
        const candidate = candidates.find(c => c.id === draggableId)

        if (!candidate) return

        // Intercept specific transitions
        if (newStatus === 'Entrevista') {
            setPendingDrag({ id: draggableId, newStatus })
            setActiveModal('interview')
            return
        }

        if (newStatus === 'Oferta') {
            setPendingDrag({ id: draggableId, newStatus })
            setActiveModal('offer')
            return
        }

        if (newStatus === 'Contratado') {
            setPendingDrag({ id: draggableId, newStatus })

            // Pre-fill hire form
            const names = candidate.name.split(' ')
            const firstName = names[0] || ''
            const lastName = names.slice(1).join(' ') || '-'

            setHireFormData(prev => ({
                ...prev,
                firstName,
                lastName,
                email: `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${lastName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}@sawalife.com`,
                position: candidate.proposedRole || candidate.appliedPosition,
                salary: candidate.expectedSalary || 0,
                // Reset others
                phone: '',
                documentId: '',
                birthDate: '',
                address: ''
            }))
            setActiveModal('hire')
            return
        }

        // Standard Transfer
        executeStatusUpdate(draggableId, newStatus)
    }

    const executeStatusUpdate = async (id: string, status: string, extraData: Partial<Candidate> = {}) => {
        // Optimistic Update
        const updatedCandidates = candidates.map(c =>
            c.id === id ? { ...c, status, ...extraData } : c
        )
        setCandidates(updatedCandidates)

        await updateCandidateStatus(id, status, extraData)
        router.refresh()

        // Reset States
        setPendingDrag(null)
        setInterviewDate('')
        setOfferNotes('')
        setActiveModal(null)
    }

    // --- Modal Actions ---

    // 1. Create Candidate
    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const res = await createCandidate(formData)
        if (res.success) {
            setActiveModal(null)
            router.refresh()
        }
        setIsSubmitting(false)
    }

    // 2. Schedule Interview
    const confirmInterview = async () => {
        if (!pendingDrag || !interviewDate) return
        await executeStatusUpdate(pendingDrag.id, pendingDrag.newStatus, { interviewDate: new Date(interviewDate) })
    }

    // 3. Confirm Offer
    const confirmOffer = async () => {
        if (!pendingDrag) return
        await executeStatusUpdate(pendingDrag.id, pendingDrag.newStatus, { offerDetails: offerNotes })
    }

    // 4. Hire (Convert to Employee)
    const confirmHire = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pendingDrag) return
        setIsSubmitting(true)

        // Use hireCandidate action which redirects
        // We construct FormData matching what createEmployee expects
        const formData = new FormData()
        formData.append('candidateId', pendingDrag.id) // For updating candidate status
        formData.append('firstName', hireFormData.firstName)
        formData.append('lastName', hireFormData.lastName)
        formData.append('documentId', hireFormData.documentId)
        formData.append('jobTitle', hireFormData.position) // Mapped to jobTitle
        formData.append('department', hireFormData.department)
        formData.append('baseSalary', hireFormData.salary.toString())
        formData.append('startDate', hireFormData.startDate)
        formData.append('hiredDate', hireFormData.startDate) // Same as start date
        formData.append('email', hireFormData.email)
        formData.append('phone', hireFormData.phone)
        formData.append('address', hireFormData.address)
        formData.append('birthDate', hireFormData.birthDate)
        formData.append('status', 'Active')

        try {
            await hireCandidate(formData)
            // If successful, it redirects. We don't need to do anything.
        } catch (error) {
            // Check if it's a redirect error? Nextjs redirects look like errors sometimes but 'hireCandidate' returns voidPromise that might reject.
            // Usually we just let it bubble or catch real errors.
            console.error(error)
            // Only reset failing state if it wasn't a redirect (redirects break flow anyway)
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this candidate?')) return
        const updated = candidates.filter(c => c.id !== id)
        setCandidates(updated)
        await deleteCandidate(id)
        router.refresh()
    }

    return (
        <>
            {/* --- MODALS (Portals) --- */}
            {mounted && createPortal(
                <>
                    {/* 1. NEW CANDIDATE MODAL */}
                    {activeModal === 'create' && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Candidate</h2>
                                    <button onClick={() => setActiveModal(null)}><X className="w-6 h-6 text-slate-400" /></button>
                                </div>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Full Name *</label>
                                            <input name="name" required className="input-field" placeholder="Michael Scott" />
                                        </div>
                                        <div>
                                            <label className="label">Applied Position *</label>
                                            <input name="appliedPosition" required className="input-field" placeholder="Regional Manager" />
                                        </div>
                                        <div>
                                            <label className="label">Proposed Role</label>
                                            <input name="proposedRole" className="input-field" placeholder="Sales Manager" />
                                        </div>
                                        <div>
                                            <label className="label">Expected Salary</label>
                                            <input name="expectedSalary" type="number" className="input-field" placeholder="5000" />
                                        </div>
                                        <div>
                                            <label className="label">Years of Experience</label>
                                            <input name="yearsExperience" type="number" className="input-field" placeholder="5" />
                                        </div>
                                        <div>
                                            <label className="label">CV (PDF)</label>
                                            <input name="cv" type="file" accept=".pdf" className="file-input" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Previous Jobs</label>
                                        <textarea name="previousJobs" className="input-field h-20" placeholder="List recent companies..." />
                                    </div>
                                    <div>
                                        <label className="label">Description / Notes</label>
                                        <textarea name="description" className="input-field h-24" placeholder="Candidate strengths, source, etc." />
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3">
                                        <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary">Cancel</button>
                                        <button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? 'Saving...' : 'Create'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* 2. INTERVIEW MODAL */}
                    {activeModal === 'interview' && (
                        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-2xl shadow-xl">
                                <h3 className="text-lg font-bold mb-4 dark:text-white">Schedule Interview</h3>
                                <label className="label">Interview Date & Time</label>
                                <input
                                    type="datetime-local"
                                    className="input-field mb-6"
                                    value={interviewDate}
                                    onChange={(e) => setInterviewDate(e.target.value)}
                                />
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => { setActiveModal(null); setPendingDrag(null); router.refresh(); }} className="btn-secondary">Cancel</button>
                                    <button onClick={confirmInterview} disabled={!interviewDate} className="btn-primary">Schedule</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. OFFER MODAL */}
                    {activeModal === 'offer' && (
                        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-2xl shadow-xl">
                                <h3 className="text-lg font-bold mb-4 dark:text-white">Make an Offer</h3>
                                <label className="label">Offer Details / Notes</label>
                                <textarea
                                    className="input-field h-32 mb-6"
                                    placeholder="Salary offered, benefits, start date..."
                                    value={offerNotes}
                                    onChange={(e) => setOfferNotes(e.target.value)}
                                />
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => { setActiveModal(null); setPendingDrag(null); router.refresh(); }} className="btn-secondary">Cancel</button>
                                    <button onClick={confirmOffer} className="btn-primary">Confirm Offer</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. HIRE MODAL (Enhanced) */}
                    {activeModal === 'hire' && pendingDrag && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Finalize Hiring</h2>
                                    <button onClick={() => { setActiveModal(null); setPendingDrag(null); router.refresh(); }}><X className="w-6 h-6 text-slate-400" /></button>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
                                    Please verify and complete the details below to create the employee.
                                </p>
                                <form onSubmit={confirmHire} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">First Name *</label>
                                            <input required className="input-field" value={hireFormData.firstName} onChange={e => setHireFormData({ ...hireFormData, firstName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Last Name *</label>
                                            <input required className="input-field" value={hireFormData.lastName} onChange={e => setHireFormData({ ...hireFormData, lastName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Position (Job Title) *</label>
                                            <input required className="input-field" value={hireFormData.position} onChange={e => setHireFormData({ ...hireFormData, position: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Department</label>
                                            <input className="input-field" value={hireFormData.department} onChange={e => setHireFormData({ ...hireFormData, department: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Basic Salary (Bs) *</label>
                                            <input type="number" required className="input-field" value={hireFormData.salary} onChange={e => setHireFormData({ ...hireFormData, salary: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                        <div>
                                            <label className="label">Start Date *</label>
                                            <input type="date" required className="input-field" value={hireFormData.startDate} onChange={e => setHireFormData({ ...hireFormData, startDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Document ID (CI) *</label>
                                            <input required className="input-field" value={hireFormData.documentId} onChange={e => setHireFormData({ ...hireFormData, documentId: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Birth Date *</label>
                                            <input type="date" required className="input-field" value={hireFormData.birthDate} onChange={e => setHireFormData({ ...hireFormData, birthDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Phone</label>
                                            <input className="input-field" value={hireFormData.phone} onChange={e => setHireFormData({ ...hireFormData, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Official Email *</label>
                                        <input type="email" required className="input-field" value={hireFormData.email} onChange={e => setHireFormData({ ...hireFormData, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">Address</label>
                                        <input className="input-field" value={hireFormData.address} onChange={e => setHireFormData({ ...hireFormData, address: e.target.value })} />
                                    </div>

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button type="button" onClick={() => { setActiveModal(null); setPendingDrag(null); router.refresh(); }} className="btn-secondary">Cancel</button>
                                        <button type="submit" disabled={isSubmitting} className="btn-primary bg-green-600 hover:bg-green-700 shadow-green-600/20">
                                            {isSubmitting ? 'Creating Employee...' : 'Confirm Hire'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>,
                document.body
            )}

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recruitment Pipeline</h1>
                <button
                    onClick={() => setActiveModal('create')}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-orange-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Candidate
                </button>
            </div>

            {/* BOARD */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)] overflow-x-auto pb-4">
                    {COLUMNS.map(col => {
                        const colCandidates = candidates.filter(c => c.status === col.id)
                        return (
                            <div key={col.id} className={`flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800/50 overflow-hidden ${col.color}`}>
                                <div className="p-4 flex justify-between items-center border-b border-black/5 dark:border-white/5">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-100">{col.title}</h3>
                                    <span className="bg-white/50 dark:bg-black/20 text-xs font-mono px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">{colCandidates.length}</span>
                                </div>
                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 p-3 space-y-3 overflow-y-auto transition-colors scrollbar-thin ${snapshot.isDraggingOver ? 'bg-black/5 dark:bg-white/5' : ''}`}
                                        >
                                            {colCandidates.map((candidate, index) => (
                                                <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group relative ${snapshot.isDragging ? 'rotate-2 shadow-xl ring-2 ring-orange-500/50 z-50' : ''}`}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{candidate.name}</h4>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{candidate.appliedPosition}</p>
                                                                </div>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(candidate.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            {/* Detailed Info Preview */}
                                                            <div className="mt-3 space-y-1">
                                                                {candidate.yearsExperience ? (
                                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                                        <Briefcase className="w-3 h-3" /> {candidate.yearsExperience} yrs exp
                                                                    </div>
                                                                ) : null}
                                                                {candidate.expectedSalary ? (
                                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                                        <DollarSign className="w-3 h-3" /> ${candidate.expectedSalary}
                                                                    </div>
                                                                ) : null}
                                                                {candidate.interviewDate && (
                                                                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {new Date(candidate.interviewDate).toLocaleDateString()}
                                                                        {' '}
                                                                        {new Date(candidate.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {candidate.cvUrl && (
                                                                <a href={candidate.cvUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="mt-3 inline-flex items-center gap-2 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1.5 rounded w-full justify-center transition-colors">
                                                                    <FileText className="w-3 h-3" /> View CV
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        )
                    })}
                </div>
            </DragDropContext>

            <style jsx global>{`
                .label { @apply block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1; }
                .input-field { @apply w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none; }
                .file-input { @apply w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-900/30 dark:file:text-orange-400 dark:text-slate-300; }
                .btn-primary { @apply px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-colors; }
                .btn-secondary { @apply px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors; }
            `}</style>
        </>
    )
}
