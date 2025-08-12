ticker: string            // único si existe (ETFs), para fondos usar alias corto
isin: string              // único (preferido)
nombre: string
proveedor: string         // gestora o marca (iShares, Vanguard, Bestinver…)
clase: "equity" | "bond" | "mixed" | "cash" | "commodity" | "alt" | "fund"
subclase: string          // p.ej. "DM World", "EM", "Corp IG EUR", "RV España Value", etc.
region: "Global" | "USA" | "Europe" | "Emerging" | "APAC" | "Spain" | "Multi"
moneda: "EUR" | "USD" | "GBP" | ...
hedged: boolean
ucits: boolean
traspasable: boolean
esg: boolean
ter: number | null        // Total Expense Ratio (%)
benchmark: string | null

// Métricas (pueden ser null si no se conocen)
ret_12m: number | null    // % simple aprox
ret_36m: number | null
ret_60m: number | null
vol_36m: number | null

// Meta opcional
data_as_of: string | null // "YYYY-MM"
notas: string | null