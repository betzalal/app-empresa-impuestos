'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Lock, CheckCircle, FileText, Trash2, AlertCircle } from 'lucide-react'
import { uploadPaymentProof, deletePaymentProof, lockPaymentProof } from '@/app/actions/payments'
import Image from 'next/image'

interface PaymentUploadCardProps {
    taxType: 'IVA' | 'IT'
    month: number
    year: number
    calculatedAmount: number
    existingProof: any | null // existing proof object
}

export function PaymentUploadCard({ taxType, month, year, calculatedAmount, existingProof }: PaymentUploadCardProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(existingProof?.filePath || null)
    const [proof, setProof] = useState<any | null>(existingProof)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Sync state when props change (e.g. month switch)
    useEffect(() => {
        setProof(existingProof)
        setPreview(existingProof?.filePath || null)
    }, [existingProof])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('month', month.toString())
        formData.append('year', year.toString())
        formData.append('taxType', taxType)

        try {
            // Optimistic preview
            const objectUrl = URL.createObjectURL(file)
            setPreview(objectUrl)

            const res = await uploadPaymentProof(formData)
            if (res.success) {
                setProof(res.data)
                // Update preview if it's an image
                if (file.type.startsWith('image')) {
                    setPreview(objectUrl)
                } else {
                    setPreview(null)
                }
            } else {
                alert(res.message)
                setPreview(null)
            }
        } catch (error) {
            console.error(error)
            alert('Error al subir archivo')
            setPreview(null)
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async () => {
        if (!proof || proof.isLocked) return
        if (!confirm('¿Estás seguro de eliminar este comprobante?')) return

        const res = await deletePaymentProof(proof.id)
        if (res.success) {
            setProof(null)
            setPreview(null)
        } else {
            alert(res.message)
        }
    }

    const handleLock = async () => {
        if (!proof) return
        if (!confirm('¿Guardar PARA SIEMPRE? No podrás eliminar este archivo nunca más.')) return

        const res = await lockPaymentProof(proof.id)
        if (res.success) {
            setProof({ ...proof, isLocked: true })
        } else {
            alert(res.message)
        }
    }

    const isPaid = !!proof
    const isLocked = proof?.isLocked
    const isZeroBalance = calculatedAmount <= 0 && !isPaid

    return (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:shadow-xl border border-white/50 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-lg">

            {/* Background Decoration */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-colors duration-500 ${isPaid ? 'bg-green-400/20' : 'bg-blue-400/20'}`}></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                            {taxType}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Impuesto Mensual</p>
                    </div>

                    {/* Status Pill */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border ${isLocked
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : isPaid
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : isZeroBalance
                                ? 'bg-gray-100 text-gray-500 border-gray-200'
                                : 'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                        {isLocked ? <Lock size={12} /> : isPaid ? <CheckCircle size={12} /> : isZeroBalance ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {isLocked ? 'ARCHIVADO' : isPaid ? 'SUBIDO' : isZeroBalance ? 'SIN MOVIMIENTO' : 'PENDIENTE'}
                    </div>
                </div>

                {/* Amount Display */}
                <div className="mb-6 p-4 rounded-xl bg-white/50 border border-white/60 shadow-inner">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Monto Calculado</p>
                    <p className="text-xl font-mono font-bold text-gray-800">
                        {calculatedAmount.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                    </p>
                </div>

                {/* File Area */}
                <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300/50 rounded-xl bg-gray-50/30 hover:bg-white/40 transition-colors relative overflow-hidden">

                    {preview ? (
                        <div className="w-full h-full absolute inset-0 group-preview">
                            {proof?.fileType?.startsWith('image') ? (
                                <Image
                                    src={preview}
                                    alt="Comprobante"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                    <FileText size={48} className="mb-2 text-gray-400" />
                                    <span className="text-sm font-medium">{proof?.fileName}</span>
                                </div>
                            )}

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                <a
                                    href={preview}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all"
                                    title="Ver archivo"
                                >
                                    <FileText size={20} />
                                </a>

                                {!isLocked && (
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`text-center p-6 ${isZeroBalance ? 'opacity-50 grayscale' : 'cursor-pointer'}`}
                            onClick={() => !isZeroBalance && fileInputRef.current?.click()}
                        >
                            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 mx-auto mb-3 flex items-center justify-center shadow-sm">
                                <Upload size={24} />
                            </div>
                            <p className="text-sm font-bold text-gray-600">{isZeroBalance ? 'No requiere pago' : 'Subir Comprobante'}</p>
                            <p className="text-xs text-gray-400 mt-1">{isZeroBalance ? 'Saldo en cero' : 'Arrastra o haz click'}</p>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,application/pdf"
                        disabled={isZeroBalance}
                    />
                </div>

                {/* Footer Actions */}
                <div className="mt-4 flex justify-end">
                    {isPaid && !isLocked && (
                        <button
                            onClick={handleLock}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-black text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                            <Lock size={12} />
                            <span>GUARDAR PARA SIEMPRE</span>
                        </button>
                    )}
                    {isLocked && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed">
                            <Lock size={12} />
                            <span>BLOQUEADO</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
