'use client'

import React, { useState, useRef } from 'react'
// @ts-ignore
import OrganizationChart from '@dabeng/react-orgchart'
import '@/app/components/hr/orgchart.css'
import { Plus, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react'
import { createNode, updateNode, deleteNode, OrgNodeData } from '@/app/actions/org-chart'

interface OrgChartViewProps {
    initialTree: OrgNodeData | null
}

export default function OrgChartView({ initialTree }: OrgChartViewProps) {
    const [tree, setTree] = useState<OrgNodeData | null>(initialTree)
    const [selectedNode, setSelectedNode] = useState<OrgNodeData | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form states
    const [formData, setFormData] = useState({ name: '', role: '' })

    const handleNodeClick = (node: OrgNodeData) => {
        setSelectedNode(node)
        setFormData({ name: node.name, role: node.title })
        setIsEditOpen(true)
    }

    const handleAddClick = () => {
        setFormData({ name: '', role: '' })
        setIsAddOpen(true)
        setIsEditOpen(false)
    }

    const handleSaveAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const data = new FormData()
        data.append('name', formData.name)
        data.append('role', formData.role)
        // If adding to a selected node, parent is selectedNode.id
        // If tree is empty, parent is empty (Root)
        if (selectedNode) {
            data.append('parentId', selectedNode.id)
        } else if (tree) {
            // Adding root sibling? Or adding child to root if nothing selected?
            // Let's assume selecting a node is required to add a child, UNLESS tree is empty.
            // If tree exists and nothing selected, maybe warn? Or add as root?
            // For now, if nothing selected but tree exists, we warn or default to root.
            if (!confirm('No node selected. Create a new Root node?')) {
                setLoading(false); return
            }
        }

        const res = await createNode(data)
        if (res.success) {
            setIsAddOpen(false)
            // Trigger refresh or Optimistic update?
            // For now, reload page to get fresh tree or we need a way to refetch tree.
            // Server actions revalidatePath SHOULD refresh the server component wrapper if we used router.refresh() 
            // but we are in client. `router.refresh()` is needed.
            window.location.reload()
        } else {
            alert(res.message)
        }
        setLoading(false)
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedNode) return
        setLoading(true)
        const data = new FormData()
        data.append('name', formData.name)
        data.append('role', formData.role)

        const res = await updateNode(selectedNode.id, data)
        if (res.success) {
            setIsEditOpen(false)
            window.location.reload()
        } else {
            alert(res.message)
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!selectedNode) return
        if (!confirm('Are you sure you want to delete this node and potentially its children?')) return
        setLoading(true)
        const res = await deleteNode(selectedNode.id)
        if (res.success) {
            setIsEditOpen(false)
            setSelectedNode(null)
            window.location.reload()
        } else {
            alert(res.message)
        }
        setLoading(false)
    }

    // Custom Node Template
    const MyNode = ({ nodeData }: { nodeData: OrgNodeData }) => {
        return (
            <div
                className="node-card bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden w-48 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleNodeClick(nodeData)}
            >
                <div className="bg-orange-500 text-white p-2 text-sm font-bold truncate text-center">
                    {nodeData.title}
                </div>
                <div className="p-3 text-center">
                    <div className="text-slate-800 font-medium truncate">{nodeData.name}</div>
                    {/* Add ID for debug if needed */}
                </div>
            </div>
        )
    }

    return (
        <div className="h-[600px] border border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={() => { setSelectedNode(null); handleAddClick() }}
                    className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm text-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Root / Node
                </button>
            </div>

            {/* Chart Area */}
            {tree ? (
                <OrganizationChart
                    datasource={tree}
                    chartClass="myChart"
                    NodeTemplate={MyNode}
                    pan={true}
                    zoom={true}
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p>No organization chart found.</p>
                    <button onClick={handleAddClick} className="mt-4 text-orange-500 font-bold hover:underline">
                        Create Root Node
                    </button>
                </div>
            )}

            {/* Edit/Action Modal */}
            {isEditOpen && selectedNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Edit Position</h3>
                            <button onClick={() => setIsEditOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase">Role / Title</label>
                                <input
                                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase">Occupant Name</label>
                                <input
                                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="pt-2 flex gap-2">
                                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button type="button" onClick={handleDelete} disabled={loading} className="px-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleAddClick}
                                    className="w-full flex items-center justify-center gap-2 text-orange-600 font-medium py-2 hover:bg-orange-50 rounded-lg"
                                >
                                    <Plus className="w-4 h-4" /> Add Child Node
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">
                                {selectedNode ? `Add Child to ${selectedNode.title}` : 'Create Root Node'}
                            </h3>
                            <button onClick={() => setIsAddOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase">Role / Title</label>
                                <input
                                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    required
                                    placeholder="e.g. Sales Manager"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase">Occupant Name</label>
                                <input
                                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Maria Gonzalez"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 mt-4">
                                {loading ? 'Creating...' : 'Create Node'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
