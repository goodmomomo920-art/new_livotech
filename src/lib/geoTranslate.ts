/**
 * Auto-translates Arabic text (product taglines, descriptions, features…) to English
 * for visitors browsing from outside Egypt — the same "visitor is abroad" detection
 * used by geoCurrency.ts for the price display.
 *
 * DISPLAY-ONLY: this never edits your data in Supabase. Content is still stored and
 * managed in Arabic in the admin panel — this just shows a translated copy to foreign
 * visitors in their browser. Uses the free MyMemory translation API (no key needed).
 * That free tier is rate-limited (roughly a few thousand words/day per visitor IP), so
 * on a very high-traffic site some translations may occasionally fall back to the
 * original Arabic — this fails silently and never breaks the page.
 */
import { useEffect, useState } from "react";
import { detectCountryCode } from "./geoCurrency";

const containsArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

// In-memory + sessionStorage cache so the same string is never translated twice per visit.
const memoryCache = new Map<string, string>();

async function translateToEnglish(text: string): Promise<string> {
  if (memoryCache.has(text)) return memoryCache.get(text)!;
  const storageKey = `livotech_tr_${text}`;
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) { memoryCache.set(text, stored); return stored; }
  } catch { /* ignore */ }
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`);
    const data = await res.json();
    const translated: string | undefined = data?.responseData?.translatedText;
    if (!translated) return text;
    memoryCache.set(text, translated);
    try { sessionStorage.setItem(storageKey, translated); } catch { /* ignore — storage full/unavailable */ }
    return translated;
  } catch {
    return text; // translation service unreachable — just show the original Arabic
  }
}

/**
 * Give it Arabic text; foreign visitors see it auto-translated to English once the
 * translation resolves (shows the original Arabic for an instant while it loads, and
 * forever if translation fails). Visitors in Egypt, or text that isn't Arabic to begin
 * with, are returned unchanged with no network call.
 */
export function useLocalizedText(text: string): string {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let cancelled = false;
    setDisplay(text);
    if (!text || !containsArabic(text)) return;
    detectCountryCode().then((code) => {
      if (cancelled || !code || code === "EG") return;
      translateToEnglish(text).then((translated) => { if (!cancelled) setDisplay(translated); });
    });
    return () => { cancelled = true; };
  }, [text]);

  return display;
}

/**
 * Same as useLocalizedText but for a list of strings (e.g. product.features) —
 * one hook call instead of one per array item, so it's safe inside components that
 * render a variable-length list.
 */
export function useLocalizedList(items: string[]): string[] {
  const [display, setDisplay] = useState(items);

  useEffect(() => {
    let cancelled = false;
    setDisplay(items);
    if (!items.some(containsArabic)) return;
    detectCountryCode().then((code) => {
      if (cancelled || !code || code === "EG") return;
      Promise.all(items.map((t) => (containsArabic(t) ? translateToEnglish(t) : Promise.resolve(t)))).then((translated) => {
        if (!cancelled) setDisplay(translated);
      });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.join("|")]);

  return display;
}
