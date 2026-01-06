import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/app/actions/user'

const CLIENT_ID = '1041432400486-0o2go4o8t8uenvm6rbv8b3fn06bpbjpv.apps.googleusercontent.com'
const CLIENT_SECRET = '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'
const REDIRECT_URI = 'http://localhost:3000/api/google/callback'

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
)

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.redirect(new URL('/dashboard/company?error=google_auth_failed', request.url))
    }

    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code)

        // Get current user to link tokens
        // Note: actions/user.ts functions might use headers()/cookies() which work in App Router API Routes
        const user = await getCurrentUser()

        if (!user) {
            console.error("No user found in session during callback")
            return NextResponse.redirect(new URL('/dashboard/company?error=unauthorized', request.url))
        }

        const companyId = user.companyId || (user.nit ? (await prisma.company.findUnique({ where: { nit: user.nit } }))?.id : null)

        if (companyId) {
            await prisma.company.update({
                where: { id: companyId },
                data: {
                    gmailAccessToken: tokens.access_token,
                    gmailRefreshToken: tokens.refresh_token // Store this! Important for long-lived access
                }
            })
        } else {
            console.error("No company linked to user")
        }

        return NextResponse.redirect(new URL('/dashboard/company?success=gmail_connected', request.url))

    } catch (error) {
        console.error("Error exchanging token:", error)
        return NextResponse.redirect(new URL('/dashboard/company?error=token_exchange_failed', request.url))
    }
}
