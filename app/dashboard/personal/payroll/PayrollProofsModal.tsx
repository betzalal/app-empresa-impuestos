'use client'

import { useState } from 'react'
import { X, Upload, FileText, Check, AlertCircle, Loader2, Eye, Download } from 'lucide-react'
import { createPortal } from 'react-dom'
import { uploadPayrollProof } from '@/app/actions/hr'
import { useRouter } from 'next/navigation'

interface PayrollProofsModalProps {
    payroll: any
    isOpen: boolean
    onClose: () => void
}

export default function PayrollProofsModal({ payroll, isOpen, onClose }: PayrollProofsModalProps) {
    const router = useRouter()
    const [uploadingField, setUploadingField] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleFileUpload = async (fieldType: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingField(fieldType)
        setError(null)

        const formData = new FormData()
        formData.append('payrollId', payroll.id)
        formData.append('fieldType', fieldType)
        formData.append('file', file)

        const res = await uploadPayrollProof(formData)

        if (res.success) {
            router.refresh()
        } else {
            setError(res.message || 'Upload failed')
        }
        setUploadingField(null)
    }

    const ProofItem = ({ label, field, value }: { label: string, field: string, value: string | null }) => (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">{label}</h4>
                    {value ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                            <Check className="w-3 h-3" /> Uploaded
                        </span>
                    ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" /> Pending
                        </span>
                    )}
                </div>
                {uploadingField === field && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
            </div>

            {value ? (
                <div className="flex gap-2">
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                        <Eye className="w-4 h-4" /> View
                    </a>
                    {/* Re-upload hidden but possible if needed, or separate button */}
                </div>
            ) : (
                <label className="flex-1 flex flex-col items-center justify-center gap-2 px-3 py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer transition-all group">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                    <span className="text-xs text-slate-500 group-hover:text-blue-600">Click to Upload</span>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(field, e)}
                        disabled={!!uploadingField}
                    />
                </label>
            )}
        </div>
    )

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-orange-500" />
                            Payment Proofs
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Attach proof of payments for this payroll record.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProofItem
                            label="1. Sueldo - Comprobante Pago"
                            field="proofSalary"
                            value={payroll.proofSalary}
                        />
                        <ProofItem
                            label="2a. Social Security (AFP)"
                            field="proofSS"
                            value={payroll.proofSS}
                        />
                        <ProofItem
                            label="2b. Health Insurance (Caja)"
                            field="proofHealth"
                            value={payroll.proofHealth}
                        />
                        <ProofItem
                            label="2c. Labor Ministry"
                            field="proofLabor"
                            value={payroll.proofLabor}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
