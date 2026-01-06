export interface TaxInput {
    salesTotal: number
    purchasesTotal: number
    ufvStart: number
    ufvEnd: number
    prevBalanceCF: number
    prevBalanceIUE: number
}

export interface TaxResult {
    iva: {
        debitFiscal: number
        creditFiscal: number
        updateBalance: number
        totalCF: number
        pay: number
        newBalance: number
    }
    it: {
        determined: number
        pay: number
        newBalanceIUE: number
    }
    iue: {
        netProfit: number // Simplified
        provision: number
    }
}

export function calculateTaxes(input: TaxInput): TaxResult {
    // IVA
    const debitFiscal = input.salesTotal * 0.13
    const creditFiscal = input.purchasesTotal * 0.13

    // Update = Prev * ((End/Start) - 1)
    const updateBalance = input.prevBalanceCF * ((input.ufvEnd / input.ufvStart) - 1)

    const totalCF = creditFiscal + input.prevBalanceCF + updateBalance

    const ivaPay = Math.max(0, debitFiscal - totalCF)
    const newBalanceCF = Math.max(0, totalCF - debitFiscal)

    // IT
    const itDetermined = input.salesTotal * 0.03
    const itPay = Math.max(0, itDetermined - input.prevBalanceIUE)
    const newBalanceIUE = Math.max(0, input.prevBalanceIUE - itDetermined)

    // IUE (Provision)
    // Utilidad = Ingresos - Gastos (Assuming purchases = valid expenses for simplified view)
    // NOTE: IUE is an ANNUAL tax. Monthly provision is not legally required to be shown/calculated here.
    // We calculate Net Profit for visibility, but Provision is 0 until Annual Closing.
    const netProfit = Math.max(0, input.salesTotal - input.purchasesTotal)
    const provision = 0 // netProfit * 0.25 (Disabled: Annual Calculation Only in Dashboard)

    return {
        iva: {
            debitFiscal: Number(debitFiscal.toFixed(2)),
            creditFiscal: Number(creditFiscal.toFixed(2)),
            updateBalance: Number(updateBalance.toFixed(2)),
            totalCF: Number(totalCF.toFixed(2)),
            pay: Number(ivaPay.toFixed(2)),
            newBalance: Number(newBalanceCF.toFixed(2)),
        },
        it: {
            determined: Number(itDetermined.toFixed(2)),
            pay: Number(itPay.toFixed(2)),
            newBalanceIUE: Number(newBalanceIUE.toFixed(2)),
        },
        iue: {
            netProfit: Number(netProfit.toFixed(2)),
            provision: Number(provision.toFixed(2)),
        },
    }
}
