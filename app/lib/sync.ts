import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a JSON payload using AES-256-GCM.
 * Uses SYNC_SECRET as the key.
 */
export function encryptPayload(data: any): { payload: string; iv: string; tag: string } {
    const secret = process.env.SYNC_SECRET || 'fallback-secret-for-dev-only-change-in-prod';
    const key = crypto.createHash('sha256').update(secret).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const jsonString = JSON.stringify(data);
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
        payload: encrypted,
        iv: iv.toString('hex'),
        tag: authTag
    };
}

/**
 * Signs a payload using HMAC-SHA256.
 */
export function signPayload(payload: string): string {
    const secret = process.env.SYNC_SECRET || 'fallback-secret-for-dev-only-change-in-prod';
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Sends the encrypted and signed data to the central server.
 */
export async function sendToCentralServer(data: any) {
    // The IP provided by the user
    const CENTRAL_IP = '144.91.118.73';
    const WEBHOOK_URL = `http://${CENTRAL_IP}/api/webhooks/onboarding`;

    try {
        const { payload, iv, tag } = encryptPayload(data);
        const signature = signPayload(payload);

        console.log(`[Sync] Attempting to send data to ${WEBHOOK_URL}`);

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Onboarding-Signature': signature,
                'X-Onboarding-IV': iv,
                'X-Onboarding-Tag': tag,
                'X-Source-Instance': process.env.NEXT_PUBLIC_APP_URL || 'unknown-instance'
            },
            body: JSON.stringify({ data: payload }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Sync] Failed to sync data: ${response.status} ${errorText}`);
        } else {
            console.log('[Sync] Data successfully synchronized with central server.');
        }
    } catch (error) {
        console.error('[Sync] Error during data synchronization:', error);
    }
}
