import { createEmployee } from '@/app/actions/hr'

export default function NewEmployeePage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Employee</h1>

            <form action={createEmployee} className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name *</label>
                        <input name="firstName" required type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name *</label>
                        <input name="lastName" required type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Document ID (CI/NIT)</label>
                    <input name="documentId" type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo</label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative">
                        <input type="file" name="image" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="text-sm text-slate-500">
                            <span className="text-orange-500 font-medium">Click to upload</span> or drag and drop
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Job Title *</label>
                        <input name="jobTitle" required type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                        <input name="department" type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                        <input name="email" type="email" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                        <input name="phone" type="tel" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Base Salary (Bs)</label>
                    <input name="baseSalary" type="number" step="0.01" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent" />
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
                        Create Employee
                    </button>
                </div>
            </form>
        </div>
    )
}
