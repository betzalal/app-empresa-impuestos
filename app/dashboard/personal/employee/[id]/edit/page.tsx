import { updateEmployee } from '@/app/actions/hr'
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'


export default async function EditEmployeePage({ params }: { params: { id: string } }) {
    const employee = await prisma.employee.findUnique({
        where: { id: params.id }
    })

    if (!employee) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Employee: {employee.firstName}</h1>

            <form action={updateEmployee.bind(null, employee.id)} className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 space-y-8">

                {/* Personal Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name *</label>
                            <input name="firstName" defaultValue={employee.firstName} required type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name *</label>
                            <input name="lastName" defaultValue={employee.lastName} required type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Document ID (CI/NIT) *</label>
                            <input name="documentId" defaultValue={employee.documentId} required type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Birth Date</label>
                            <input name="birthDate" defaultValue={employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : ''} type="date" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                            <input name="address" defaultValue={employee.address || ''} type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo</label>
                            <div className="flex items-center gap-4">
                                {employee.image && (
                                    <div className="w-16 h-16 relative rounded-full overflow-hidden border border-slate-200">
                                        <img src={employee.image} alt="Current" className="object-cover w-full h-full" />
                                    </div>
                                )}
                                <div className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-3 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative">
                                    <input type="file" name="image" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="text-xs text-slate-500">
                                        <span className="text-orange-500 font-medium">Change Photo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                            <input name="email" defaultValue={employee.email || ''} type="email" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                            <input name="phone" defaultValue={employee.phone || ''} type="tel" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                    </div>
                </div>

                {/* Job Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Job Details & Transfer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Job Title *</label>
                            <input
                                name="jobTitle"
                                defaultValue={employee.jobTitle}
                                required
                                type="text"
                                placeholder="Change to promote/transfer..."
                                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                            />
                            <p className="text-xs text-slate-400">Updating this creates a new Job Position if it doesn&apos;t exist.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                            <input name="department" defaultValue={employee.department} type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date Hired</label>
                            <input name="hiredDate" defaultValue={new Date(employee.hiredDate).toISOString().split('T')[0]} type="date" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Store Assignment</label>
                            <input name="store" defaultValue={employee.store || ''} type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Base Salary (Bs) *</label>
                            <input name="baseSalary" defaultValue={employee.baseSalary} required type="number" step="0.01" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Horas cargadas total (Mes)</label>
                            <input name="monthlyHours" defaultValue={(employee as any).monthlyHours || 176} type="number" step="0.1" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium">
                        Cancel
                    </button>
                    <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium shadow-md shadow-orange-500/20">
                        Update Employee
                    </button>
                </div>
            </form>
        </div>
    )
}
