/**
 * Shows visitors a rough price in their own currency next to the real EGP price.
 *
 * IMPORTANT: this is a DISPLAY-ONLY convenience. The amount actually charged always
 * stays in EGP (product.price / product.currency, untouched, all the way through
 * Checkout.tsx and the Kashier payment call) — this hook never feeds into checkout.
 * Detecting the visitor's country is best-effort (IP geolocation, no login/consent
 * needed) and silently does nothing if it fails, is blocked, or the visitor is in Egypt.
 */
import { useEffect, useState } from "react";

// Static, occasionally-updated approximate EGP value of 1 unit of each currency.
// Update these numbers every so often to keep the hint roughly accurate — they only
// drive the small "≈" hint text, never the real charge.
const EGP_PER_UNIT: Record<string, number> = {
  USD: 51,
  EUR: 55,
  GBP: 64,
  SAR: 13.6,
  AED: 13.9,
  KWD: 166,
  QAR: 14,
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", CA: "USD", GB: "GBP",
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", IE: "EUR", PT: "EUR", BE: "EUR", AT: "EUR", GR: "EUR",
  SA: "SAR", AE: "AED", KW: "KWD", QA: "QAR",
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
      return (cached = null); // network blocked, rate-limited, etc. — just skip the hint
    }
  })();
  return inflight;
}

/**
 * Given an amount already in EGP, returns a short "≈ $270" style hint for the
 * visitor's likely local currency, or null while loading / if unavailable / if
 * the visitor appears to already be in Egypt (no hint needed).
 */
export function useApproxForeignPrice(amountEgp: number): string | null {
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    detectGeoCurrency().then((geo) => {
      if (cancelled || !geo || geo.countryCode === "EG") return;
      const rate = EGP_PER_UNIT[geo.currency];
      if (!rate) return;
      const converted = amountEgp / rate;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: geo.currency,
        maximumFractionDigits: converted % 1 ? 2 : 0,
      }).format(converted);
      setHint(`≈ ${formatted}`);
    });
    return () => { cancelled = true; };
  }, [amountEgp]);

  return hint;
}
