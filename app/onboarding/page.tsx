'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, User, Target, BarChart, Users, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        // Step 1
        companyName: '',
        nit: '',
        adminUsername: '',
        adminPassword: '',
        extraUser1: '',
        extraUser2: '',
        description: '', // "A que se dedica la empresa"

        // Step 2 (Survey)
        role: '',
        industry: '',
        priority: '',
        teamSize: '',
        source: '',

        // Step 3
        fullName: '',
        email: '',
        logoUrl: '' // Base64
    })

    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelect = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value })
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                setLogoPreview(base64)
                setFormData({ ...formData, logoUrl: base64 })
            }
            reader.readAsDataURL(file)
        }
    }

    const nextStep = () => setStep(step + 1)
    const prevStep = () => setStep(step - 1)

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const { completeOnboarding } = await import('@/app/actions/onboarding')
            const result = await completeOnboarding(formData)

            if (result.success) {
                const { logout } = await import('@/app/actions/auth')
                await logout()
            } else {
                alert(result.error || 'Error al guardar datos. Intente nuevamente.')
            }
        } catch (error) {
            console.error(error)
            alert("Error saving data")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 font-sans">
            <div className="w-full max-w-4xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                {/* Sidebar / Progress */}
                <div className="w-full md:w-1/3 bg-[#0f172a] border-r border-slate-800 p-8 flex flex-col">
                    <div className="mb-10">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                            <Target className="text-white" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Configuración</h2>
                        <p className="text-slate-400 text-sm mt-2">Vamos a personalizar tu experiencia en unos pocos pasos.</p>
                    </div>

                    <div className="space-y-6 flex-1">
                        <StepIndicator current={step} step={1} icon={Building2} title="Empresa y Cuenta" desc="Datos básicos y seguridad" />
                        <StepIndicator current={step} step={2} icon={BarChart} title="Perfil y Industria" desc="Personaliza tu dashboard" />
                        <StepIndicator current={step} step={3} icon={CheckCircle} title="Finalizar" desc="Confirma y comienza" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-[#0f172a]/50">

                    {step === 1 && (
                        <div className="animate-in fade-in duration-500 space-y-6">
                            <h3 className="text-2xl font-bold text-white mb-6">Datos de la Empresa</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300">Nombre de la Empresa</label>
                                    <input name="companyName" value={formData.companyName} onChange={handleChange} className="input-field-dark" placeholder="Ej. Constructora Vision" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300">NIT</label>
                                    <input name="nit" value={formData.nit} onChange={handleChange} className="input-field-dark" placeholder="Ej. 1020304050" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">¿A qué se dedica la empresa?</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} className="input-field-dark h-20 resize-none" placeholder="Breve descripción..." />
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <h4 className="text-lg font-bold text-white mb-4">Configurar Cuenta Admin</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-300">Nuevo Usuario Admin</label>
                                        <input name="adminUsername" value={formData.adminUsername} onChange={handleChange} className="input-field-dark" placeholder="Nuevo usuario" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-300">Nueva Contraseña</label>
                                        <input type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} className="input-field-dark" placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <h4 className="text-lg font-bold text-white mb-4">Usuarios Adicionales (Opcional)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <input name="extraUser1" value={formData.extraUser1} onChange={handleChange} className="input-field-dark" placeholder="Usuario Extra 1" />
                                    <input name="extraUser2" value={formData.extraUser2} onChange={handleChange} className="input-field-dark" placeholder="Usuario Extra 2" />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={nextStep} disabled={!formData.companyName || !formData.nit || !formData.adminUsername || !formData.adminPassword} className="btn-primary">
                                    Continuar <ArrowRight size={18} className="ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in duration-500 space-y-8">
                            <h3 className="text-2xl font-bold text-white mb-2">Ayúdanos a entenderte mejor</h3>

                            <SurveyQuestion number={1} question="¿Cuál es tu rol principal en la empresa?" options={["Dueño / Director General", "Administrador / Gerente de Proyecto", "Contador / Gestor Financiero", "Recursos Humanos", "Operativo", "Otro"]} selected={formData.role} onSelect={(v: string) => handleSelect('role', v)} />
                            <SurveyQuestion number={2} question="¿En qué sector se desempeña tu organización?" options={["Construcción", "Agua / Recursos Hídricos", "Servicios Financieros", "Comercio", "Servicios Profesionales", "Otro"]} selected={formData.industry} onSelect={(v: string) => handleSelect('industry', v)} />
                            <SurveyQuestion number={3} question="¿Qué es lo primero que necesitas resolver hoy?" options={["Controlar gastos", "Gestionar nómina", "Automatizar impuestos", "Centralizar info", "Análisis de datos", "Otro"]} selected={formData.priority} onSelect={(v: string) => handleSelect('priority', v)} />
                            <SurveyQuestion number={4} question="¿Cuántas personas forman parte de tu equipo?" options={["Solo yo", "2 a 10 personas", "11 a 50 personas", "51 a 200 personas", "Más de 200"]} selected={formData.teamSize} onSelect={(v: string) => handleSelect('teamSize', v)} />
                            <SurveyQuestion number={5} question="¿Cómo descubriste nuestra plataforma?" options={["Recomendación", "Redes Sociales", "Google", "Publicidad", "Otro"]} selected={formData.source} onSelect={(v: string) => handleSelect('source', v)} />

                            <div className="flex justify-between pt-6 border-t border-slate-800">
                                <button onClick={prevStep} className="btn-secondary"><ArrowLeft size={18} className="mr-2" /> Atrás</button>
                                <button onClick={nextStep} className="btn-primary">Continuar <ArrowRight size={18} className="ml-2" /></button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in duration-500 space-y-6">
                            <h3 className="text-2xl font-bold text-white mb-6">Últimos detalles</h3>
                            <p className="text-slate-400">Para finalizar, completa tu perfil personal.</p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300">Nombre Completo</label>
                                    <input name="fullName" value={formData.fullName} onChange={handleChange} className="input-field-dark" placeholder="Ej. Juan Perez" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300">Correo Electrónico</label>
                                    <input name="email" value={formData.email} onChange={handleChange} className="input-field-dark" placeholder="juan@empresa.com" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">Logo de la Empresa</label>
                                <div onClick={() => document.getElementById('logo-input')?.click()} className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-800/10 hover:bg-slate-800/30 transition-all cursor-pointer group">
                                    <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                    {logoPreview ? (
                                        <div className="relative w-40 h-40">
                                            <img src={logoPreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity"><p className="text-white text-xs font-bold">Cambiar</p></div>
                                        </div>
                                    ) : (
                                        <>
                                            <Building2 className="text-slate-500 mb-2" size={32} />
                                            <p className="text-slate-300 font-medium text-sm text-center">Click para subir logo</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between pt-8 border-t border-slate-800 mt-8">
                                <button onClick={prevStep} className="btn-secondary"><ArrowLeft size={18} className="mr-2" /> Atrás</button>
                                <button onClick={handleSubmit} disabled={isLoading || !formData.fullName || !formData.email} className="btn-primary w-48">
                                    {isLoading ? 'Guardando...' : 'Finalizar y Comenzar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .input-field-dark {
                    background-color: #1e293b !important;
                    border: 1px solid #334155 !important;
                    border-radius: 0.5rem !important;
                    padding: 0.75rem 1rem !important;
                    color: #ffffff !important;
                    font-weight: 500 !important;
                    width: 100% !important;
                    font-size: 0.875rem !important;
                }
                .input-field-dark::placeholder {
                    color: #94a3b8 !important;
                }
                .input-field-dark:focus {
                    outline: none !important;
                    box-shadow: 0 0 0 2px #3b82f6 !important;
                }
                .btn-primary {
                    background-color: #2563eb !important;
                    color: white !important;
                    font-weight: 700 !important;
                    padding: 0.625rem 1.5rem !important;
                    border-radius: 0.5rem !important;
                    display: flex !important;
                    align-items: center !important;
                    transition: background 0.2s !important;
                }
                .btn-primary:hover:not(:disabled) {
                    background-color: #3b82f6 !important;
                }
                .btn-secondary {
                    background-color: transparent !important;
                    color: #cbd5e1 !important;
                    font-weight: 500 !important;
                    padding: 0.625rem 1.5rem !important;
                    border-radius: 0.5rem !important;
                    border: 1px solid #334155 !important;
                    display: flex !important;
                    align-items: center !important;
                }
            `}</style>
        </div>
    )
}

function StepIndicator({ current, step, icon: Icon, title, desc }: { current: number, step: number, icon: any, title: string, desc: string }) {
    const isActive = current === step
    const isCompleted = current > step
    return (
        <div className={`flex items-start gap-4 p-3 rounded-xl transition-all ${isActive ? 'bg-slate-800/50 border border-slate-700' : 'opacity-60'}`}>
            <div className={`mt-1 p-2 rounded-lg ${isActive || isCompleted ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
            </div>
            <div>
                <h4 className={`font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>{title}</h4>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
        </div>
    )
}

function SurveyQuestion({ number, question, options, selected, onSelect }: any) {
    return (
        <div className="space-y-3">
            <h4 className="font-bold text-slate-200"><span className="text-blue-500 mr-2">{number}.</span> {question}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                {options.map((opt: string) => (
                    <div key={opt} onClick={() => onSelect(opt)} className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 text-sm ${selected === opt ? 'bg-blue-600/20 border-blue-500 text-blue-100' : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'}`}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selected === opt ? 'border-blue-400 bg-blue-400' : 'border-slate-500'}`}>
                            {selected === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        {opt}
                    </div>
                ))}
            </div>
        </div>
    )
}
