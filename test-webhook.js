const crypto = require('crypto');

// Configuration
const SYNC_SECRET = 'fallback-secret-for-dev-only-change-in-prod'; // Using default for test
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const CENTRAL_URL = 'http://127.0.0.1:3000/api/webhooks/onboarding';

async function testSync() {
    console.log('--- STARTING JS WEBHOOK TEST ---');

    const testData = {
        companyName: "JS Test Co " + Date.now(),
        nit: "777666555",
        adminUsername: "js_admin",
        description: "Prueba desde script JS",
        role: "Administrador",
        industry: "Servicios",
        priority: "Análisis de datos",
        teamSize: "11 a 50 personas",
        source: "Recomendación",
        fullName: "JS Tester",
        email: "js@test.com"
    };

    try {
        const key = crypto.createHash('sha256').update(SYNC_SECRET).digest();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        const jsonString = JSON.stringify(testData);
        let encrypted = cipher.update(jsonString, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag().toString('hex');

        const signature = crypto.createHmac('sha256', SYNC_SECRET).update(encrypted).digest('hex');

        console.log('Sending to:', CENTRAL_URL);

        const response = await fetch(CENTRAL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Onboarding-Signature': signature,
                'X-Onboarding-IV': iv.toString('hex'),
                'X-Onboarding-Tag': tag,
                'X-Source-Instance': 'JS-UNIT-TEST'
            },
            body: JSON.stringify({ data: encrypted }),
        });

        const result = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

testSync();
