import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

const ALGORITHM = 'aes-256-gcm';

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('X-Onboarding-Signature');
        const ivHex = req.headers.get('X-Onboarding-IV');
        const tagHex = req.headers.get('X-Onboarding-Tag');
        const source = req.headers.get('X-Source-Instance') || 'unknown';

        const body = await req.json();
        const encryptedPayload = body.data;

        if (!signature || !ivHex || !tagHex || !encryptedPayload) {
            return NextResponse.json({ error: 'Missing headers or payload' }, { status: 400 });
        }

        const secret = process.env.SYNC_SECRET;
        if (!secret) {
            console.error('[Webhook] SYNC_SECRET not configured on central server');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 1. Verify Signature (HMAC-SHA256)
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(encryptedPayload)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.warn('[Webhook] Invalid signature received');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 2. Decrypt Payload (AES-256-GCM)
        try {
            const key = crypto.createHash('sha256').update(secret).digest();
            const iv = Buffer.from(ivHex, 'hex');
            const tag = Buffer.from(tagHex, 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(tag);

            let decrypted = decipher.update(encryptedPayload, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            const data = JSON.parse(decrypted);

            // 3. Store in Database
            await (prisma as any).receivedSurvey.create({
                data: {
                    sourceInstance: source,
                    companyName: data.companyName,
                    nit: data.nit,
                    adminUsername: data.adminUsername,
                    description: data.description,
                    role: data.role,
                    industry: data.industry,
                    priority: data.priority,
                    teamSize: data.teamSize,
                    source: data.source,
                    fullName: data.fullName,
                    email: data.email,
                    rawData: decrypted // Store the full plain JSON string
                }
            });

            console.log(`[Webhook] Successfully processed survey for ${data.companyName} from ${source}`);
            return NextResponse.json({ success: true });

        } catch (decryptError) {
            console.error('[Webhook] Decryption failed:', decryptError);
            return NextResponse.json({ error: 'Decryption failed' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[Webhook] Internal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
