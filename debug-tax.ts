
import { calculateTaxes } from './lib/tax-engine';

const input = {
    salesTotal: 176680.00,
    purchasesTotal: 32650.62,
    ufvStart: 2.0, // Default in ResultsPage
    ufvEnd: 2.0,   // Default in ResultsPage
    prevBalanceCF: 10000, // Hypothetical previous balance
    prevBalanceIUE: 0
};

console.log('--- TEST 1: Default UFV ---');
console.log(calculateTaxes(input));

const input2 = {
    ...input,
    ufvStart: 2.40000,
    ufvEnd: 2.40100, // Tiny increase
};

console.log('--- TEST 2: UFV Increase ---');
console.log(calculateTaxes(input2));
