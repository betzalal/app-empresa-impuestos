'use server'

import { google } from 'googleapis'
import { getCurrentUser } from './user'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

// Configuration
// In a real app, use process.env. For this specific request, use the provided values.
const CLIENT_ID = '1041432400486-0o2go4o8t8uenvm6rbv8b3fn06bpbjpv.apps.googleusercontent.com'
const CLIENT_SECRET = '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'
const REDIRECT_URI = 'http://localhost:3000/api/google/callback'

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
)

export async function getAuthUrl() {
    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email' // To identify the connected account
    ]

    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Critical for refresh token
        scope: scopes,
        prompt: 'consent' // Force prompts to ensure we get refresh token
    })
}

export async function getGmailMessages() {
    const user = await getCurrentUser()
    if (!user || (!user.companyId && !user.nit)) return { error: "No user/company found" }

    const companyId = user.companyId || (await prisma.company.findUnique({ where: { nit: user.nit || '' } }))?.id
    if (!companyId) return { error: "Company not linked" }

    // Fetch tokens
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { gmailAccessToken: true, gmailRefreshToken: true }
    })

    if (!company || !company.gmailAccessToken) {
        return { error: "Gmail not connected", notConnected: true }
    }

    // Set credentials
    oauth2Client.setCredentials({
        access_token: company.gmailAccessToken,
        refresh_token: company.gmailRefreshToken || undefined
    })

    try {
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

        // List messages
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10
        })

        const messages = response.data.messages || []

        // Fetch details for each message
        const detailedMessages = await Promise.all(messages.map(async (msg) => {
            const details = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id!
            })

            const headers = details.data.payload?.headers
            const subject = headers?.find(h => h.name === 'Subject')?.value || '(No Subject)'
            const from = headers?.find(h => h.name === 'From')?.value || '(Unknown)'
            const date = headers?.find(h => h.name === 'Date')?.value || ''

            return {
                id: msg.id,
                snippet: details.data.snippet,
                subject,
                from,
                date
            }
        }))

        return { success: true, messages: detailedMessages }

    } catch (error: any) {
        console.error("Gmail API Error:", error)
        // Check if token expired and refresh failed (googleapis handles refresh automatically if refresh_token is set, 
        // but if it fails we might need to re-auth)
        if (error.code === 401) {
            return { error: "Token expired", notConnected: true }
        }
        return { error: "Failed to fetch emails" }
    }
}
