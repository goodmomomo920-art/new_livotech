/**
 * Shows visitors abroad the price in their own currency instead of EGP.
 *
 * IMPORTANT: this is DISPLAY-ONLY. The amount actually charged always stays in EGP
 * (product.price / product.currency, untouched, all the way through Checkout.tsx and
 * the Kashier payment call) — this hook never feeds into checkout. Detecting the
 * visitor's country is best-effort (IP geolocation, no login/consent needed) and
 * silently falls back to EGP if it fails, is blocked, or the visitor is in Egypt.
 *
 * The EGP-per-unit rates are editable in Admin › Settings › "Foreign currency display"
 * (stored in the settings table's fxRates column) — DEFAULT_RATES below is only the
 * fallback used before that setting has loaded, or for currencies not configured there.
 */
import { useEffect, useState } from "react";

const DEFAULT_RATES: Record<string, number> = { USD: 51, SAR: 13.6 };

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", CA: "USD",
  SA: "SAR",
};

type GeoState = { currency: string; countryCode: string } | null;

let cached: GeoState | undefined; // module-level cache — fetch once per page session
let inflight: Promise<GeoState> | null = null;

async function detectGeoCurrency(): Promise<GeoState> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const stored = sessionStorage.getItem("livotech_geo_currency");
      if (stored) return (cached = JSON.parse(stored));
    } catch { /* sessionStorage unavailable — fall through to network */ }
    try {
      const res = await fetch("https://ipwho.is/?fields=country_code");
      const data = await res.json();
      const countryCode: string | undefined = data?.country_code;
      const currency = countryCode ? COUNTRY_TO_CURRENCY[countryCode] : undefined;
      const result: GeoState = currency ? { currency, countryCode } : null;
      try { sessionStorage.setItem("livotech_geo_currency", JSON.stringify(result)); } catch { /* ignore */ }
      return (cached = result);
    } catch {
      return (cached = null); // network blocked, rate-limited, etc. — just stay in EGP
    }
  })();
  return inflight;
}

const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);

/**
 * Given an amount already in EGP, returns the price formatted for display:
 * - Visitor in Egypt / undetected / unsupported currency → the real EGP amount.
 * - Visitor abroad with a configured currency (USD, SAR, …) → converted to that
 *   currency using `rates` (pass state.settings.fxRates from the admin-editable setting).
 *
 * This never changes what is actually charged — Checkout.tsx keeps using
 * product.price / product.currency (EGP) untouched, exactly like before.
 */
export function useDisplayPrice(amountEgp: number, realCurrency: string, rates: Record<string, number> = DEFAULT_RATES): string {
  const [display, setDisplay] = useState(() => formatAmount(amountEgp, realCurrency));

  useEffect(() => {
    let cancelled = false;
    if (realCurrency !== "EGP") { setDisplay(formatAmount(amountEgp, realCurrency)); return; }
    detectGeoCurrency().then((geo) => {
      if (cancelled) return;
      if (!geo || geo.countryCode === "EG") { setDisplay(formatAmount(amountEgp, realCurrency)); return; }
      const rate = rates[geo.currency] ?? DEFAULT_RATES[geo.currency];
      if (!rate) { setDisplay(formatAmount(amountEgp, realCurrency)); return; }
      setDisplay(formatAmount(amountEgp / rate, geo.currency));
    });
    return () => { cancelled = true; };
  }, [amountEgp, realCurrency, rates]);

  return display;
}
