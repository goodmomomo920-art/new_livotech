import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { Btn, EmptyState, Spinner, money, usePageTitle } from "../components/ui";
import type { Order } from "../lib/types";

type Phase = "waiting" | "paid" | "failed" | "error";

/** Kashier redirects the browser back here after the customer pays (or cancels). This page
 *  never trusts the browser return by itself — it polls the order row, which only the
 *  server-side kashier-webhook function is allowed to mark "paid". Once that's happened,
 *  it grants ownership/subscriptions/etc. the same way the old instant-checkout did. */
export default function CheckoutCallback() {
  usePageTitle("Confirming payment…");
  const { me, pollOrderPayment, provisionOrder, toast } = useStore();
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>("waiting");
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode/re-render guard — this must run exactly once
    ran.current = true;
    if (!orderId || !me) { setPhase("error"); setErr("Missing order — go back to your cart and try again."); return; }

    (async () => {
      try {
        const confirmed = await pollOrderPayment(orderId);
        if (confirmed.paymentStatus === "paid") {
          const provisioned = await provisionOrder(orderId);
          setOrder(provisioned);
          setPhase("paid");
          toast("success", "Payment confirmed", `Order ${provisioned.number} is on your account now.`);
        } else if (confirmed.paymentStatus === "failed") {
          setOrder(confirmed);
          setPhase("failed");
        } else {
          // Still pending after the poll window — Kashier's webhook can lag a few seconds
          // behind the redirect. Don't declare failure; let the customer check their orders.
          setOrder(confirmed);
          setPhase("failed");
          setErr("Still waiting on confirmation from the payment gateway.");
        }
      } catch (e) {
        setPhase("error");
        setErr(e instanceof Error ? e.message : "Something went wrong confirming this payment.");
      }
    })();
  }, [orderId, me, pollOrderPayment, provisionOrder, toast]);

  if (phase === "waiting") {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
        <Spinner className="h-7 w-7" />
        <p className="text-[15px] font-semibold text-mist-200">Confirming your payment…</p>
        <p className="max-w-sm text-[13px] text-mist-500">Don't close this tab — this only takes a few seconds.</p>
      </div>
    );
  }

  if (phase === "paid" && order) {
    return (
      <div className="container-x py-20">
        <EmptyState icon="check" title="Payment confirmed" body={`Order ${order.number} — ${money(order.total, order.currency)} — is now on your account.`}
          action={<div className="flex gap-3"><Link to="/dashboard/orders"><Btn icon="receipt">View order</Btn></Link><Link to="/dashboard"><Btn variant="outline">Go to dashboard</Btn></Link></div>} />
      </div>
    );
  }

  return (
    <div className="container-x py-20">
      <EmptyState icon="alert" title={order?.paymentStatus === "failed" ? "Payment didn't go through" : "Couldn't confirm this payment yet"}
        body={err || "Your card wasn't charged, or the confirmation is still on its way. Check your orders in a moment, or try again."}
        action={<div className="flex gap-3"><Btn icon="refresh" onClick={() => nav(0)}>Check again</Btn><Link to="/dashboard/orders"><Btn variant="outline">My orders</Btn></Link></div>} />
    </div>
  );
}
