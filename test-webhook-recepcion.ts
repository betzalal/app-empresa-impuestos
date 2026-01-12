import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

const SYNC_SECRET = process.env.SYNC_SECRET || 'fallback-secret-for-dev-only-change-in-prod';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const CENTRAL_URL = 'http://localhost:3000/api/webhooks/onboarding';

async function testSync() {
    console.log('--- STARTING WEBHOOK TEST ---');
    console.log('Target URL:', CENTRAL_URL);

    const testData = {
        companyName: "Empresa de Prueba " + Date.now(),
        nit: "999888777",
        adminUsername: "admin_tester",
        description: "Prueba de integración centralizada",
        role: "Dueño",
        industry: "Construcción",
        priority: "Controlar gastos",
        teamSize: "2 a 10 personas",
        source: "Google",
        fullName: "Tester Verificador",
        email: "test@verificador.com"
    };

    try {
        // 1. Encrypt
        const key = crypto.createHash('sha256').update(SYNC_SECRET).digest();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        const jsonString = JSON.stringify(testData);
        let encrypted = cipher.update(jsonString, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag().toString('hex');

        // 2. Sign
        const signature = crypto.createHmac('sha256', SYNC_SECRET).update(encrypted).digest('hex');

        console.log('Sending encrypted payload...');

        // 3. Post
        const response = await fetch(CENTRAL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Onboarding-Signature': signature,
                'X-Onboarding-IV': iv.toString('hex'),
                'X-Onboarding-Tag': tag,
                'X-Source-Instance': 'TEST-UNIT'
            },
            body: JSON.stringify({ data: encrypted }),
        });

        const status = response.status;
        const result = await response.json();

        if (response.ok) {
            console.log('SUCCESS: Data received and processed by central server!');
            console.log('Response:', JSON.stringify(result, null, 2));
        } else {
            console.error('FAILED:', status, result);
        }

    } catch (error) {
        console.error('ERROR during test:', error);
    }
}

testSync();
