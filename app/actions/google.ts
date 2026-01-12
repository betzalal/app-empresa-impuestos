'use server'

import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import prisma from '@/lib/prisma';
import { getCurrentUser } from './user';

/**
 * Helper to get Gmail credentials for the current user's company
 */
async function getGmailCredentials() {
    const user = await getCurrentUser();
    if (!user || !user.companyId) return null;

    const company = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { gmailUser: true, gmailAppPassword: true }
    });

    if (!company || !company.gmailUser || !company.gmailAppPassword) return null;

    return {
        user: company.gmailUser,
        pass: company.gmailAppPassword
    };
}

/**
 * Action to save Gmail credentials
 */
export async function saveGmailCredentialsAction(gmailUser: string, gmailAppPassword: string) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.companyId) throw new Error("No se encontró la empresa del usuario");

        await prisma.company.update({
            where: { id: user.companyId },
            data: {
                gmailUser,
                gmailAppPassword
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error saving Gmail credentials:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Action to send an email
 */
export async function sendGmailAction(to: string, subject: string, text: string) {
    try {
        const credentials = await getGmailCredentials();
        if (!credentials) return { success: false, error: "Credenciales de Gmail no configuradas" };

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: credentials
        });

        const mailOptions = {
            from: credentials.user,
            to: to,
            subject: subject,
            text: text
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error: any) {
        console.error('Error al enviar Gmail:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Action to fetch recent emails using IMAP
 */
export async function getGmailMessagesAction() {
    try {
        const credentials = await getGmailCredentials();
        if (!credentials) return { success: false, error: "Credenciales de Gmail no configuradas", notConfigured: true };

        const client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: credentials,
            logger: false
        });

        await client.connect();

        let lock = await client.getMailboxLock('INBOX');
        const messages = [];

        try {
            const status = await client.status('INBOX', { messages: true });
            const total = status.messages || 0;
            const start = Math.max(1, total - 9);
            const end = total;

            if (total > 0) {
                // Correct usage for fetch in imapflow
                for await (let message of client.fetch(`${start}:${end}`, { envelope: true })) {
                    if (message.envelope) {
                        messages.push({
                            id: message.uid,
                            subject: message.envelope.subject || '(Sin Asunto)',
                            from: message.envelope.from?.[0]?.address || 'Desconocido',
                            date: message.envelope.date,
                            snippet: ''
                        });
                    }
                }
            }
        } finally {
            lock.release();
        }

        await client.logout();

        // Return reversed to show newest first
        return { success: true, messages: messages.reverse() };
    } catch (error: any) {
        console.error('IMAP Error:', error);
        return { success: false, error: error.message };
    }
}

// Keeping a placeholder for fetching if needed, but the user requested nodemailer focus
// Nodemailer is primarily for sending. For receiving without complex OAuth,
// usually IMAP would be used, but since the user provided SMTP/Transporter info,
// we will focus on the sending functionality for the widget as "my own WhatsApp-web.js but for Gmail"
