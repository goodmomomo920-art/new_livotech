import jsPDF from "jspdf";
import { fmtDate, money } from "../components/ui";
import type { Order } from "./types";

export interface InvoiceBrand {
  brand: string;
  contactEmail: string;
}

export interface InvoiceCustomer {
  name: string;
  email: string;
  company?: string;
}

/** Builds a clean, single-page PDF invoice for a paid order and triggers a download. */
export function downloadInvoicePdf(order: Order, brand: InvoiceBrand, customer: InvoiceCustomer) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = 60;

  const ink = (r: number, g: number, b: number) => doc.setTextColor(r, g, b);
  const line = (x1: number, yy: number, x2: number) => { doc.setDrawColor(226, 228, 233); doc.line(x1, yy, x2, yy); };

  // brand + invoice heading
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); ink(19, 22, 32);
  doc.text(brand.brand, margin, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); ink(120, 124, 136);
  doc.text(brand.contactEmail, margin, y + 15);

  doc.setFont("helvetica", "bold"); doc.setFontSize(22); ink(19, 22, 32);
  doc.text("INVOICE", pageW - margin, y, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); ink(120, 124, 136);
  doc.text(`# ${order.number}`, pageW - margin, y + 15, { align: "right" });
  doc.text(fmtDate(order.createdAt), pageW - margin, y + 28, { align: "right" });

  y += 50;
  line(margin, y, pageW - margin);
  y += 28;

  // billed to
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); ink(150, 153, 163);
  doc.text("BILLED TO", margin, y);
  y += 16;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); ink(19, 22, 32);
  doc.text(customer.name || customer.email, margin, y);
  y += 15;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); ink(100, 104, 116);
  doc.text(customer.email, margin, y);
  if (customer.company) { y += 14; doc.text(customer.company, margin, y); }

  // payment method, top-right
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); ink(150, 153, 163);
  doc.text("PAYMENT METHOD", pageW - margin, y - (customer.company ? 29 : 15), { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); ink(19, 22, 32);
  doc.text(order.paymentMethod, pageW - margin, y - (customer.company ? 14 : 0), { align: "right" });

  y += 36;

  // table header
  const rightEdge = pageW - margin;
  doc.setFillColor(246, 247, 249);
  doc.rect(margin, y, pageW - margin * 2, 24, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); ink(130, 134, 146);
  doc.text("ITEM", margin + 10, y + 16);
  doc.text("QTY", rightEdge - 170, y + 16, { align: "right" });
  doc.text("PRICE", rightEdge - 90, y + 16, { align: "right" });
  doc.text("TOTAL", rightEdge - 10, y + 16, { align: "right" });
  y += 24;

  doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); ink(40, 43, 54);
  for (const item of order.items) {
    y += 24;
    doc.text(item.name, margin + 10, y, { maxWidth: pageW - margin * 2 - 190 });
    doc.text(String(item.qty), rightEdge - 170, y, { align: "right" });
    doc.text(money(item.unitPrice, order.currency), rightEdge - 90, y, { align: "right" });
    doc.text(money(item.total, order.currency), rightEdge - 10, y, { align: "right" });
    line(margin, y + 8, rightEdge);
  }

  y += 32;
  const totalsLabelX = rightEdge - 170;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); ink(100, 104, 116);
  doc.text("Subtotal", totalsLabelX, y);
  doc.text(money(order.subtotal, order.currency), rightEdge - 10, y, { align: "right" });

  if (order.discount) {
    y += 18;
    doc.text(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, totalsLabelX, y);
    doc.text(`-${money(order.discount, order.currency)}`, rightEdge - 10, y, { align: "right" });
  }

  y += 16;
  line(totalsLabelX, y, rightEdge);
  y += 22;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); ink(19, 22, 32);
  doc.text("Total", totalsLabelX, y);
  doc.text(money(order.total, order.currency), rightEdge - 10, y, { align: "right" });

  y += 20;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); ink(120, 124, 136);
  doc.text("Status: Paid", totalsLabelX, y);

  // footer
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); ink(150, 153, 163);
  doc.text(`Questions about this invoice? ${brand.contactEmail}`, margin, pageH - 40);

  doc.save(`invoice-${order.number}.pdf`);
}
