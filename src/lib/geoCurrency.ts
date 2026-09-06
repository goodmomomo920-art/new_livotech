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
 *
 * The same country detection is reused by geoTranslate.ts for the auto-translate feature.
 */
import { useEffect, useState } from "react";

const DEFAULT_RATES: Record<string, number> = { USD: 51, SAR: 13.6 };

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", CA: "USD",
  SA: "SAR",
};

let cached: string | null | undefined; // module-level cache — fetch once per page session; undefined = not fetched yet
let inflight: Promise<string | null> | null = null;

/** Returns the visitor's ISO-2 country code (e.g. "EG", "US"), or null if undetected/blocked. */
export async function detectCountryCode(): Promise<string | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const stored = sessionStorage.getItem("livotech_geo_country");
      if (stored !== null) return (cached = JSON.parse(stored));
    } catch { /* sessionStorage unavailable — fall through to network */ }
    try {
      const res = await fetch("https://ipwho.is/?fields=country_code");
      const data = await res.json();
      const code: string | null = data?.country_code ?? null;
      try { sessionStorage.setItem("livotech_geo_country", JSON.stringify(code)); } catch { /* ignore */ }
      return (cached = code);
    } catch {
      return (cached = null); // network blocked, rate-limited, etc. — just stay with defaults
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
  const convert = useCurrencyConverter(realCurrency, rates);
  return convert(amountEgp);
}

/**
 * Same conversion as useDisplayPrice, but returns a reusable converter FUNCTION
 * instead of a single formatted string. Use this one instead of useDisplayPrice
 * whenever you need to format more than one amount (e.g. inside a .map() over a
 * list of add-ons or plan options) — calling a hook per list item would break the
 * rules of hooks, but calling this once and then invoking the returned function
 * per item is safe.
 */
export function useCurrencyConverter(realCurrency: string, rates: Record<string, number> = DEFAULT_RATES): (amountEgp: number) => string {
  const [countryCode, setCountryCode] = useState<string | null | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    detectCountryCode().then((c) => { if (!cancelled) setCountryCode(c); });
    return () => { cancelled = true; };
  }, []);

  return (amountEgp: number) => {
    if (realCurrency !== "EGP" || countryCode === "loading" || !countryCode || countryCode === "EG") {
      return formatAmount(amountEgp, realCurrency);
    }
    const currency = COUNTRY_TO_CURRENCY[countryCode];
    const rate = currency ? rates[currency] ?? DEFAULT_RATES[currency] : undefined;
    if (!currency || !rate) return formatAmount(amountEgp, realCurrency);
    return formatAmount(amountEgp / rate, currency);
  };
}
