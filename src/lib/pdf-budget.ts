import path from "path";
import PDFDocument from "pdfkit";
import { groupedItems, kindSubtotals } from "@/lib/budget";
import { PAYMENT_CONDITION_LABEL, PAYMENT_METHOD_LABEL, type PaymentCondition, type PaymentMethod } from "@/lib/commercial";
import { formatDate } from "@/lib/date";
import { formatBRL, moneyString } from "@/lib/money";
import { KIND_LABEL, extraDetailLines, itemDetailLines, parseExtras, travelFeeAmount, type ItemKind, type TemplateConfig } from "@/lib/templates";

type PdfBudget = {
  number: string;
  createdAt: Date;
  validityDate: Date | null;
  estimatedDays: number | null;
  notes: string | null;
  serviceAddress: string | null;
  extras?: unknown;
  subtotal: { toString(): string } | number | string;
  discount: { toString(): string } | number | string;
  total: { toString(): string } | number | string;
  paymentMethod?: string | null;
  acceptedPaymentMethods?: unknown;
  paymentCondition?: string | null;
  downPaymentAmount?: { toString(): string } | number | string;
  customer: {
    name: string;
    phone: string;
    address?: string | null;
  };
  company: {
    name: string;
    phone: string;
    whatsapp: string;
    document?: string | null;
    email: string;
  };
  serviceCity?: { name: string } | null;
  serviceState?: { uf: string } | null;
  items: {
    description: string;
    quantity: { toString(): string } | number | string;
    unit: string;
    unitPrice: { toString(): string } | number | string;
    subtotal: { toString(): string } | number | string;
    kind?: string | null;
    groupName?: string | null;
    notes?: string | null;
    material?: string | null;
    deadline?: string | null;
    length?: string | null;
    width?: string | null;
    height?: string | null;
    areaNote?: string | null;
    powerNote?: string | null;
    volumeNote?: string | null;
  }[];
  photos?: { path: string; caption: string | null }[];
};

const NAVY = "#172138";
const GOLD = "#D99212";
const SOFT = "#3a4458";
const LINE = "#e6dcc8";

function n(value: { toString(): string } | number | string) {
  return Number(value);
}

function paymentMethodLabel(value: string | null | undefined) {
  return value && value in PAYMENT_METHOD_LABEL ? PAYMENT_METHOD_LABEL[value as PaymentMethod] : "";
}

function paymentConditionLabel(value: string | null | undefined) {
  return value && value in PAYMENT_CONDITION_LABEL ? PAYMENT_CONDITION_LABEL[value as PaymentCondition] : "";
}

function publicFile(rel: string) {
  return path.join(process.cwd(), "public", rel.replace(/^\//, ""));
}

export function pdfFileName(number: string) {
  return `orcah-${number.replace(/[^\w-]+/g, "")}.pdf`;
}

export async function buildBudgetPdf(budget: PdfBudget, template?: TemplateConfig) {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  const extras = parseExtras(budget.extras);
  const title = template?.publicTitle ?? "ORÇAMENTO";

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  try {
    doc.image(publicFile("brand/orcah-pdf.png"), 48, 40, { height: 36 });
  } catch {
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(18).text("Orcah", 48, 48);
  }

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(16).text(budget.company.name, 48, 90);
  doc.fillColor(SOFT).font("Helvetica").fontSize(10);
  doc.text(`WhatsApp: ${budget.company.whatsapp || budget.company.phone}`);
  if (budget.company.document) doc.text(`CNPJ/CPF: ${budget.company.document}`);
  doc.text(budget.company.email);

  doc.moveDown(1.2);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(11).text(title.toUpperCase());
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(14).text(budget.number);
  doc.fillColor(SOFT).font("Helvetica").fontSize(10);
  doc.text(`Data: ${formatDate(budget.createdAt)}`);
  if (budget.validityDate) doc.text(`Validade: ${formatDate(budget.validityDate)}`);
  if (budget.estimatedDays) doc.text(`Prazo estimado: ${budget.estimatedDays} dia(s)`);
  for (const line of extraDetailLines(extras, template?.form)) {
    doc.text(line);
  }

  doc.moveDown(0.8);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text("Cliente");
  doc.fillColor(SOFT).font("Helvetica").fontSize(10);
  doc.text(budget.customer.name);
  doc.text(budget.customer.phone);
  if (budget.customer.address) doc.text(budget.customer.address);
  if (budget.serviceCity && budget.serviceState) {
    doc.text(`Serviço em ${budget.serviceCity.name}-${budget.serviceState.uf}`);
  }
  if (budget.serviceAddress) doc.text(budget.serviceAddress);

  if (template?.photos.placement === "before-items") {
    drawPhotos(doc, budget.photos, template.photos.sectionTitle);
  }

  doc.moveDown(1);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text("Serviços");
  doc.moveDown(0.4);

  const groups = groupedItems(budget.items);
  for (const group of groups) {
    if (group.name) {
      if (doc.y > 700) doc.addPage();
      doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(10).text(group.name);
      doc.moveDown(0.2);
    }
    drawTable(doc, group.items, template);
    if (group.name && groups.length > 1) {
      doc.fillColor(SOFT).font("Helvetica").fontSize(9);
      doc.text(`Subtotal ${group.name}: ${formatBRL(group.subtotal)}`, { align: "right" });
      doc.moveDown(0.4);
    }
  }

  if (template?.photos.placement === "after-items") {
    drawPhotos(doc, budget.photos, template.photos.sectionTitle);
  }

  doc.moveTo(320, doc.y).lineTo(547, doc.y).strokeColor(LINE).stroke();
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(10).fillColor(SOFT);
  for (const [kind, amount] of kindSubtotals(budget.items)) {
    if (kind in KIND_LABEL) {
      doc.text(`${KIND_LABEL[kind as ItemKind]}  ${formatBRL(amount)}`, { align: "right" });
    }
  }
  doc.text(`Subtotal  ${formatBRL(n(budget.subtotal))}`, { align: "right" });
  const travel = travelFeeAmount(extras);
  if (travel > 0) {
    doc.text(`Deslocamento  ${formatBRL(travel)}`, { align: "right" });
  }
  if (n(budget.discount) > 0) {
    doc.text(`Desconto  - ${formatBRL(n(budget.discount))}`, { align: "right" });
  }
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13);
  doc.text(`Total  ${formatBRL(n(budget.total))}`, { align: "right" });

  const payment = paymentMethodLabel(budget.paymentMethod);
  const condition = paymentConditionLabel(budget.paymentCondition);
  if (payment || condition) {
    doc.moveDown(0.5);
    doc.fillColor(SOFT).font("Helvetica").fontSize(10);
    if (payment) doc.text(`Pagamento: ${payment}`, { align: "right" });
    if (condition) doc.text(`Condição: ${condition}`, { align: "right" });
    if (budget.paymentCondition === "deposit_balance" && budget.downPaymentAmount) {
      const downPayment = n(budget.downPaymentAmount);
      doc.text(`Entrada: ${formatBRL(downPayment)}`, { align: "right" });
      doc.text(`Saldo restante: ${formatBRL(n(budget.total) - downPayment)}`, { align: "right" });
    }
  }

  if (budget.notes) {
    doc.moveDown(1.2);
    doc.font("Helvetica-Bold").fontSize(11).text("Observações");
    doc.font("Helvetica").fontSize(10).fillColor(SOFT).text(budget.notes);
  }
  if (template?.footerNote) {
    doc.moveDown(0.6);
    doc.font("Helvetica").fontSize(8).fillColor(SOFT).text(template.footerNote);
  }

  doc.moveDown(2);
  doc.fillColor(GOLD).font("Helvetica").fontSize(8).text("Feito com Orcah  ·  orcah.com.br", { align: "center" });

  doc.end();
  return done;
}

function drawTable(
  doc: PDFKit.PDFDocument,
  items: PdfBudget["items"],
  template?: TemplateConfig,
) {
  const tableTop = doc.y;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(SOFT);
  doc.text("Item", 48, tableTop, { width: 250 });
  doc.text("Qtd", 300, tableTop, { width: 50, align: "right" });
  doc.text("Valor", 360, tableTop, { width: 80, align: "right" });
  doc.text("Subtotal", 450, tableTop, { width: 90, align: "right" });
  doc.moveTo(48, tableTop + 14).lineTo(547, tableTop + 14).strokeColor(GOLD).lineWidth(1).stroke();

  let y = tableTop + 22;
  doc.font("Helvetica").fontSize(10).fillColor(NAVY);
  for (const item of items) {
    if (y > 720) {
      doc.addPage();
      y = 48;
    }
    const kind = item.kind && item.kind in KIND_LABEL ? `${KIND_LABEL[item.kind as ItemKind]} · ` : "";
    const details = itemDetailLines(item, {
      depthAsLength: template?.form?.itemSizeWHD,
      materialLabel: template?.form?.itemMaterialLabel,
    });
    const label = `${kind}${item.description}${details.length ? `\n${details.join(" · ")}` : ""}`;
    const rowH = Math.max(16, doc.heightOfString(label, { width: 250 }));
    doc.text(label, 48, y, { width: 250 });
    doc.text(`${moneyString(n(item.quantity))} ${item.unit}`, 300, y, { width: 50, align: "right" });
    doc.text(formatBRL(n(item.unitPrice)), 360, y, { width: 80, align: "right" });
    doc.text(formatBRL(n(item.subtotal)), 450, y, { width: 90, align: "right" });
    y += rowH + 8;
  }
  doc.y = y + 6;
}

function drawPhotos(
  doc: PDFKit.PDFDocument,
  photos: PdfBudget["photos"] | undefined,
  title: string,
) {
  if (!photos?.length) return;
  doc.moveDown(0.8);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text(title);
  doc.moveDown(0.3);
  for (const photo of photos.slice(0, 6)) {
    if (doc.y > 620) doc.addPage();
    try {
      doc.image(publicFile(photo.path), { fit: [500, 160], align: "center" });
      if (photo.caption) {
        doc.fillColor(SOFT).font("Helvetica").fontSize(8).text(photo.caption);
      }
      doc.moveDown(0.4);
    } catch {
      if (photo.caption) {
        doc.fillColor(SOFT).font("Helvetica").fontSize(9).text(photo.caption);
      }
    }
  }
}
