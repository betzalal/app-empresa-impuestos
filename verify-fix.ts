
import { getMonthlyTotals } from './app/actions/tax-data';

async function verify() {
    const month = 12; // December
    const year = 2025; // 2025

    console.log(`Verifying totals for ${month}/${year}...`);
    const result = await getMonthlyTotals(month, year);

    console.log('Result:', result);

    if (result.success && (result.salesTotal > 0 || result.purchasesTotal > 0)) {
        console.log('SUCCESS: Non-zero totals returned.');
    } else {
        console.log('WARNING: Totals are still zero or request failed.');
    }
}

verify();
