'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from './company'

export type OrgNodeData = {
    id: string
    name: string
    title: string // mapped from 'role' in DB for library compatibility
    children?: OrgNodeData[]
}

export type ActionResponse = {
    success: boolean
    message: string
    data?: any
}

/**
 * Fetches the entire Org Tree in a nested structure compatible with @dabeng/react-orgchart
 */
export async function getOrgTree() {
    const session = await verifySession()
    // 1. Fetch only this company's nodes
    const nodes = await prisma.orgNode.findMany({
        where: { companyId: session.companyId }
    })

    if (nodes.length === 0) return null

    // 2. Build Tree
    const nodeMap = new Map<string, OrgNodeData>()
    const rootNodes: OrgNodeData[] = []

    // Initialize map
    nodes.forEach(node => {
        nodeMap.set(node.id, {
            id: node.id,
            name: node.name,
            title: node.role,
            children: []
        })
    })

    // Link children
    nodes.forEach(node => {
        const mappedNode = nodeMap.get(node.id)!
        if (node.parentId) {
            const parent = nodeMap.get(node.parentId)
            if (parent) {
                parent.children?.push(mappedNode)
            } else {
                // Orphaned node? Treat as root for now or warn
                rootNodes.push(mappedNode)
            }
        } else {
            rootNodes.push(mappedNode)
        }
    })

    // Return the first root (library expects single root usually, or we wrap)
    // If multiple roots, we might need a dummy super-root if the lib requires single tree
    if (rootNodes.length === 1) return rootNodes[0]
    if (rootNodes.length > 1) {
        return {
            id: 'root',
            name: 'Organization',
            title: 'Root',
            children: rootNodes
        }
    }
    return null
}

/**
 * Creates a new node.
 */
export async function createNode(formData: FormData): Promise<ActionResponse> {
    try {
        const session = await verifySession()
        const name = formData.get('name') as string
        const role = formData.get('role') as string
        const parentId = formData.get('parentId') as string

        if (!name || !role) {
            return { success: false, message: 'Name and Role are required.' }
        }

        await prisma.orgNode.create({
            data: {
                name,
                role,
                parentId: parentId || null, // If empty string, null (Root)
                companyId: session.companyId
            }
        })

        revalidatePath('/dashboard/personal/organigrama')
        return { success: true, message: 'Node created.' }
    } catch (error) {
        console.error('Create node error:', error)
        return { success: false, message: 'Failed to create node.' }
    }
}

/**
 * Updates a node (rename or move).
 */
export async function updateNode(id: string, formData: FormData): Promise<ActionResponse> {
    try {
        const session = await verifySession()

        // Verify Ownership
        const node = await prisma.orgNode.findUnique({ where: { id } })
        if (node?.companyId !== session.companyId) return { success: false, message: 'Unauthorized' }

        const name = formData.get('name') as string
        const role = formData.get('role') as string
        const parentId = formData.get('parentId') as string

        const data: any = {}
        if (name) data.name = name
        if (role) data.role = role
        if (parentId !== undefined) data.parentId = parentId === 'root' || parentId === '' ? null : parentId

        await prisma.orgNode.update({
            where: { id },
            data
        })

        revalidatePath('/dashboard/personal/organigrama')
        return { success: true, message: 'Node updated.' }
    } catch (error) {
        return { success: false, message: 'Failed to update node.' }
    }
}

/**
 * Deletes a node.
 */
export async function deleteNode(id: string): Promise<ActionResponse> {
    try {
        const session = await verifySession()

        // Verify Ownership
        const node = await prisma.orgNode.findUnique({ where: { id } })
        if (node?.companyId !== session.companyId) return { success: false, message: 'Unauthorized' }

        await prisma.orgNode.delete({
            where: { id }
        })

        revalidatePath('/dashboard/personal/organigrama')
        return { success: true, message: 'Node deleted.' }
    } catch (error) {
        return { success: false, message: 'Failed to delete node.' }
    }
}
