import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { isAddonCompatible, TYPE_META } from "../lib/seed";
import type { Addon, Product } from "../lib/types";
import { I } from "./icons";
import { Badge, Btn, EmptyState, Modal, money } from "./ui";
import { TypeBadge } from "./product";

/** The customer's owned products that this add-on can attach to. */
export function useOwnedForAddon(addon: Addon | null): Product[] {
  const { me, state } = useStore();
  return useMemo(() => {
    if (!me || !addon) return [];
    return state.ownerships
      .filter((o) => o.customerId === me.id && o.status === "active")
      .map((o) => state.products.find((p) => p.id === o.productId))
      .filter((p): p is Product => !!p && isAddonCompatible(addon, p));
  }, [me, addon, state.ownerships, state.products]);
}

/**
 * Attach flow: pick one of the customer's compatible owned products,
 * then the add-on alone goes to the cart (the base product isn't charged again).
 */
export function AttachAddonModal({ addon, onClose }: { addon: Addon | null; onClose: () => void }) {
  const { me, setCart, toast } = useStore();
  const nav = useNavigate();
  const owned = useOwnedForAddon(addon);
  const [sel, setSel] = useState<string | null>(null);
  if (!addon) return null;

  return (
    <Modal
      open onClose={onClose}
      title={<span className="flex items-center gap-2.5"><I name={addon.icon} size={18} className="text-solar-300" /> Attach “{addon.name}”</span>}
      footer={
        owned.length > 0 && (
          <>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn
              icon="cart"
              disabled={!sel}
              onClick={() => {
                if (!sel) return;
                setCart({ productId: sel, interval: "once", addonIds: [addon.id] });
                toast("success", "Add-on added to cart", `${addon.name} — the base product won't be charged again.`);
                onClose();
                nav("/checkout");
              }}
            >
              Add to cart · {money(addon.price)}{addon.interval === "monthly" ? "/mo" : ""}
            </Btn>
          </>
        )
      }
    >
      {!me ? (
        <EmptyState icon="lock" title="Log in to attach add-ons" body="Add-ons stack on products you already own."
          action={<Link to="/login"><Btn icon="key">Log in</Btn></Link>} />
      ) : owned.length === 0 ? (
        <EmptyState
          icon="box" title="No compatible product owned yet"
          body={`“${addon.name}” attaches to: ${addon.compat.map((c) => TYPE_META[c].plural).join(", ")}. Buy one first, then come back — it takes a minute.`}
          action={<Link to={`/products?type=${addon.compat[0]}`}><Btn icon="arrowR">Browse {TYPE_META[addon.compat[0]].plural.toLowerCase()}</Btn></Link>}
        />
      ) : (
        <div>
          <p className="mb-3 text-[13px] leading-relaxed text-mist-400">
            Choose which of your products this add-on should power. Only compatible products are listed — compatibility is set by our team per product.
          </p>
          <div className="space-y-2.5">
            {owned.map((p) => (
              <button
                key={p.id} onClick={() => setSel(p.id)} aria-pressed={sel === p.id}
                className={`flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all ${sel === p.id ? "border-pulse-400/60 bg-pulse-400/[0.07]" : "border-mist-100/12 hover:border-mist-100/25"}`}
              >
                <img src={p.image} alt="" className="h-11 w-14 rounded-md border border-mist-100/10 object-cover object-top" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-mist-100">{p.name}</span>
                  <span className="mt-0.5 block text-[11.5px] text-mist-500">Owned · {TYPE_META[p.type].label}</span>
                </span>
                <TypeBadge type={p.type} className="hidden sm:inline-flex" />
                <span className={`grid size-5 shrink-0 place-items-center rounded-full border transition-all ${sel === p.id ? "border-pulse-400 bg-pulse-400 text-ink-950" : "border-mist-100/25 text-transparent"}`}>
                  <I name="check" size={11} strokeWidth={2.6} />
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-mist-500">
            <I name="shield" size={13} className="mt-0.5 shrink-0 text-pulse-400" />
            Billed separately at {money(addon.price)}{addon.interval === "monthly" ? "/month" : " one-time"} — remove it any time without touching the base product.
          </p>
        </div>
      )}
    </Modal>
  );
}

/** Smart CTA under an add-on card on public pages. */
export function AttachAddonCta({ addon, onAttach }: { addon: Addon; onAttach: (a: Addon) => void }) {
  const { me } = useStore();
  const owned = useOwnedForAddon(addon);
  if (!me) {
    return (
      <Link to="/login?next=/addons" className="flex items-center justify-center gap-2 rounded-lg border border-mist-100/15 px-3 py-2 text-[12.5px] font-semibold text-mist-300 transition-colors hover:border-pulse-400/50 hover:text-pulse-300">
        <I name="key" size={13} /> Log in to attach
      </Link>
    );
  }
  if (owned.length === 0) {
    return (
      <p className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-mist-100/20 px-3 py-2 text-center text-[11.5px] text-mist-500">
        <Badge tone="mist">Requires a linked product you own</Badge>
      </p>
    );
  }
  return (
    <button onClick={() => onAttach(addon)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-pulse-400 px-3 py-2 text-[12.5px] font-bold text-ink-950 transition-all hover:bg-pulse-300 active:scale-[0.98]">
      <I name="plus" size={13} strokeWidth={2.2} /> Attach to my {owned.length === 1 ? owned[0].name : "product"}
    </button>
  );
}
