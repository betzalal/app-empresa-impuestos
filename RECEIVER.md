# Central Receiver Implementation Guide

To safely receive onboarding data from your instances, you need to implement a webhook receiver on your central server (`144.91.118.73`).

## 1. Environment Variable
Ensure you have the same `SYNC_SECRET` on both servers.

```bash
SYNC_SECRET="your-secure-shared-secret"
```

## 2. Receiver Webhook (Next.js Example)

Create a file at `app/api/webhooks/onboarding/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('X-Onboarding-Signature');
        const ivHex = req.headers.get('X-Onboarding-IV');
        const tagHex = req.headers.get('X-Onboarding-Tag');
        const { data: encryptedPayload } = await req.json();

        if (!signature || !ivHex || !tagHex || !encryptedPayload) {
            return NextResponse.json({ error: 'Missing headers or payload' }, { status: 400 });
        }

        const secret = process.env.SYNC_SECRET;
        if (!secret) throw new Error('SYNC_SECRET not configured');

        // 1. Verify Signature (HMAC-SHA256)
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(encryptedPayload)
            .digest('hex');

        if (signature !== expectedSignature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 2. Decrypt Payload (AES-256-GCM)
        const key = crypto.createHash('sha256').update(secret).digest();
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedPayload, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        const onboardingData = JSON.parse(decrypted);

        // 3. Process the data (Save to DB, Send Email, etc.)
        console.log('Received Onboarding Data:', onboardingData);
        
        // TODO: Your database logic here
        // await prisma.clientSurvey.create({ data: onboardingData });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
```

## Security Strategy
- **AES-GCM**: Provides both confidentiality (encryption) and authenticity (tag).
- **HMAC**: Provides a secondary layer of authentication via a shared secret.
- **IV Handling**: Random IVs are generated per request to prevent replay attacks and pattern analysis.
