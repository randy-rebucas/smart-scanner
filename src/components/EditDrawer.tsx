"use client";
import { useEffect, useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "./ToastProvider";

// ── EditableItem (exported for use in Main.tsx) ───────────────────────────────

export interface EditableItem {
    _id: string;
    createdAt: string;
    documentType?: string;
    confidenceScore?: number;
    metadata?: {
        detectedLanguage?: string;
        imageQuality?: string;
    };

    // ── Legacy flat fields (kept for backward compatibility) ──────────────────
    entities?: {
        personNames?: string[];
        companyNames?: string[];
        emails?: string[];
        phoneNumbers?: string[];
        addresses?: string[];
        lastName?: string;
        firstName?: string;
        middleName?: string;
        gender?: string;
        birthdate?: string;
        address?: string;
    };
    financialData?: {
        invoiceNumber?: string;
        receiptNumber?: string;
        date?: string;
        dueDate?: string;
        subtotal?: number | null;
        tax?: number | null;
        total?: number | null;
        currency?: string;
    };
    items?: Array<{
        description?: string;
        quantity?: number | null;
        unitPrice?: number | null;
        total?: number | null;
    }>;

    // ── ID / Passport / Driver's License ──────────────────────────────────────
    idInfo?: {
        idType?: string;
        idNumber?: string;
        firstName?: string;
        lastName?: string;
        middleName?: string;
        gender?: string;
        birthdate?: string;
        nationality?: string;
        address?: string;
        issuingAuthority?: string;
        issuingCountry?: string;
        issueDate?: string;
        expirationDate?: string;
    };

    // ── Invoice ───────────────────────────────────────────────────────────────
    vendor?: { name?: string; address?: string; phone?: string; email?: string; taxId?: string; website?: string };
    client?: { name?: string; address?: string; phone?: string; email?: string };
    invoiceDetails?: {
        invoiceNumber?: string; date?: string; dueDate?: string;
        purchaseOrderNumber?: string; paymentTerms?: string; notes?: string;
        subtotal?: number | null; discount?: number | null; tax?: number | null;
        shipping?: number | null; total?: number | null; currency?: string;
    };

    // ── Receipt ───────────────────────────────────────────────────────────────
    merchant?: { name?: string; address?: string; phone?: string; taxId?: string };
    receiptDetails?: {
        receiptNumber?: string; date?: string; time?: string; cashier?: string;
        paymentMethod?: string; subtotal?: number | null; discount?: number | null;
        tax?: number | null; tip?: number | null; total?: number | null; currency?: string;
    };

    // ── Business Card ─────────────────────────────────────────────────────────
    contact?: {
        firstName?: string; lastName?: string; title?: string; company?: string;
        department?: string; phone?: string; mobilePhone?: string; email?: string;
        website?: string; address?: string; linkedin?: string; twitter?: string;
    };

    // ── Contract ──────────────────────────────────────────────────────────────
    contractInfo?: {
        title?: string; contractNumber?: string; effectiveDate?: string;
        expirationDate?: string; governingLaw?: string;
    };
    parties?: Array<{ name?: string; role?: string; address?: string }>;
    keyTerms?: string[];
    signatories?: Array<{ name?: string; role?: string; signedDate?: string }>;

    // ── Medical ───────────────────────────────────────────────────────────────
    patient?: { firstName?: string; lastName?: string; birthdate?: string; gender?: string; patientId?: string };
    provider?: { name?: string; specialty?: string; licenseNumber?: string; facility?: string; address?: string; phone?: string };
    documentDate?: string;
    diagnosis?: string[];
    medications?: Array<{ name?: string; dosage?: string; frequency?: string; quantity?: string }>;
    notes?: string;

    // ── Form ──────────────────────────────────────────────────────────────────
    formTitle?: string;
    formNumber?: string;
    date?: string;
    fields?: Record<string, unknown>;
    signatures?: string[];

    // ── Other ─────────────────────────────────────────────────────────────────
    keyValuePairs?: Record<string, unknown>;
    tables?: unknown[];

    rawText?: string;
}

// ── Internal form types ───────────────────────────────────────────────────────

interface LineItem      { description: string; quantity: string; unitPrice: string; total: string }
interface ContractParty { name: string; role: string; address: string }
interface Signatory     { name: string; role: string; signedDate: string }
interface Medication    { name: string; dosage: string; frequency: string; quantity: string }

interface FormState {
    // Always visible
    documentType: string; confidenceScore: string; detectedLanguage: string; imageQuality: string; rawText: string;

    // ID
    idType: string; idNumber: string; idFirstName: string; idLastName: string; idMiddleName: string;
    idGender: string; idBirthdate: string; idNationality: string; idAddress: string;
    idIssuingAuthority: string; idIssuingCountry: string; idIssueDate: string; idExpirationDate: string;

    // Invoice
    vendorName: string; vendorAddress: string; vendorPhone: string; vendorEmail: string; vendorTaxId: string; vendorWebsite: string;
    clientName: string; clientAddress: string; clientPhone: string; clientEmail: string;
    invNumber: string; invDate: string; invDueDate: string; invPONumber: string; invPaymentTerms: string; invNotes: string;
    invSubtotal: string; invDiscount: string; invTax: string; invShipping: string; invTotal: string; invCurrency: string;

    // Receipt
    merchantName: string; merchantAddress: string; merchantPhone: string; merchantTaxId: string;
    recNumber: string; recDate: string; recTime: string; recCashier: string; recPaymentMethod: string;
    recSubtotal: string; recDiscount: string; recTax: string; recTip: string; recTotal: string; recCurrency: string;

    // Business Card
    contactFirstName: string; contactLastName: string; contactTitle: string; contactCompany: string;
    contactDepartment: string; contactPhone: string; contactMobilePhone: string; contactEmail: string;
    contactWebsite: string; contactAddress: string; contactLinkedin: string; contactTwitter: string;

    // Contract
    contractTitle: string; contractNumber: string; contractEffectiveDate: string;
    contractExpirationDate: string; contractGoverningLaw: string; contractKeyTerms: string;
    contractParties: ContractParty[]; contractSignatories: Signatory[];

    // Medical
    patientFirstName: string; patientLastName: string; patientBirthdate: string; patientGender: string; patientIdNum: string;
    providerName: string; providerSpecialty: string; providerLicenseNumber: string;
    providerFacility: string; providerAddress: string; providerPhone: string;
    docDate: string; diagnosis: string; medNotes: string;
    medications: Medication[];

    // Form
    formTitle: string; formNumber: string; formDate: string;

    // Legacy fallback
    firstName: string; middleName: string; lastName: string; gender: string; birthdate: string; address: string;
    personNames: string; companyNames: string; emails: string; phoneNumbers: string; addresses: string;
    invoiceNumber: string; receiptNumber: string; date: string; dueDate: string;
    subtotal: string; tax: string; financialTotal: string; currency: string;
    lineItems: LineItem[];
}

type StringFields = Omit<FormState, "lineItems" | "contractParties" | "contractSignatories" | "medications">;

// ── toForm ────────────────────────────────────────────────────────────────────

function n(v: number | null | undefined): string { return v != null ? String(v) : ""; }

function toForm(item: EditableItem): FormState {
    return {
        documentType: item.documentType ?? "", confidenceScore: n(item.confidenceScore),
        detectedLanguage: item.metadata?.detectedLanguage ?? "", imageQuality: item.metadata?.imageQuality ?? "",
        rawText: item.rawText ?? "",

        idType: item.idInfo?.idType ?? "", idNumber: item.idInfo?.idNumber ?? "",
        idFirstName: item.idInfo?.firstName ?? "", idLastName: item.idInfo?.lastName ?? "",
        idMiddleName: item.idInfo?.middleName ?? "", idGender: item.idInfo?.gender ?? "",
        idBirthdate: item.idInfo?.birthdate ?? "", idNationality: item.idInfo?.nationality ?? "",
        idAddress: item.idInfo?.address ?? "", idIssuingAuthority: item.idInfo?.issuingAuthority ?? "",
        idIssuingCountry: item.idInfo?.issuingCountry ?? "", idIssueDate: item.idInfo?.issueDate ?? "",
        idExpirationDate: item.idInfo?.expirationDate ?? "",

        vendorName: item.vendor?.name ?? "", vendorAddress: item.vendor?.address ?? "",
        vendorPhone: item.vendor?.phone ?? "", vendorEmail: item.vendor?.email ?? "",
        vendorTaxId: item.vendor?.taxId ?? "", vendorWebsite: item.vendor?.website ?? "",
        clientName: item.client?.name ?? "", clientAddress: item.client?.address ?? "",
        clientPhone: item.client?.phone ?? "", clientEmail: item.client?.email ?? "",
        invNumber: item.invoiceDetails?.invoiceNumber ?? "", invDate: item.invoiceDetails?.date ?? "",
        invDueDate: item.invoiceDetails?.dueDate ?? "", invPONumber: item.invoiceDetails?.purchaseOrderNumber ?? "",
        invPaymentTerms: item.invoiceDetails?.paymentTerms ?? "", invNotes: item.invoiceDetails?.notes ?? "",
        invSubtotal: n(item.invoiceDetails?.subtotal), invDiscount: n(item.invoiceDetails?.discount),
        invTax: n(item.invoiceDetails?.tax), invShipping: n(item.invoiceDetails?.shipping),
        invTotal: n(item.invoiceDetails?.total), invCurrency: item.invoiceDetails?.currency ?? "",

        merchantName: item.merchant?.name ?? "", merchantAddress: item.merchant?.address ?? "",
        merchantPhone: item.merchant?.phone ?? "", merchantTaxId: item.merchant?.taxId ?? "",
        recNumber: item.receiptDetails?.receiptNumber ?? "", recDate: item.receiptDetails?.date ?? "",
        recTime: item.receiptDetails?.time ?? "", recCashier: item.receiptDetails?.cashier ?? "",
        recPaymentMethod: item.receiptDetails?.paymentMethod ?? "",
        recSubtotal: n(item.receiptDetails?.subtotal), recDiscount: n(item.receiptDetails?.discount),
        recTax: n(item.receiptDetails?.tax), recTip: n(item.receiptDetails?.tip),
        recTotal: n(item.receiptDetails?.total), recCurrency: item.receiptDetails?.currency ?? "",

        contactFirstName: item.contact?.firstName ?? "", contactLastName: item.contact?.lastName ?? "",
        contactTitle: item.contact?.title ?? "", contactCompany: item.contact?.company ?? "",
        contactDepartment: item.contact?.department ?? "", contactPhone: item.contact?.phone ?? "",
        contactMobilePhone: item.contact?.mobilePhone ?? "", contactEmail: item.contact?.email ?? "",
        contactWebsite: item.contact?.website ?? "", contactAddress: item.contact?.address ?? "",
        contactLinkedin: item.contact?.linkedin ?? "", contactTwitter: item.contact?.twitter ?? "",

        contractTitle: item.contractInfo?.title ?? "", contractNumber: item.contractInfo?.contractNumber ?? "",
        contractEffectiveDate: item.contractInfo?.effectiveDate ?? "",
        contractExpirationDate: item.contractInfo?.expirationDate ?? "",
        contractGoverningLaw: item.contractInfo?.governingLaw ?? "",
        contractKeyTerms: (item.keyTerms ?? []).join(", "),
        contractParties: (item.parties ?? []).map(p => ({ name: p.name ?? "", role: p.role ?? "", address: p.address ?? "" })),
        contractSignatories: (item.signatories ?? []).map(s => ({ name: s.name ?? "", role: s.role ?? "", signedDate: s.signedDate ?? "" })),

        patientFirstName: item.patient?.firstName ?? "", patientLastName: item.patient?.lastName ?? "",
        patientBirthdate: item.patient?.birthdate ?? "", patientGender: item.patient?.gender ?? "",
        patientIdNum: item.patient?.patientId ?? "",
        providerName: item.provider?.name ?? "", providerSpecialty: item.provider?.specialty ?? "",
        providerLicenseNumber: item.provider?.licenseNumber ?? "", providerFacility: item.provider?.facility ?? "",
        providerAddress: item.provider?.address ?? "", providerPhone: item.provider?.phone ?? "",
        docDate: item.documentDate ?? "", diagnosis: (item.diagnosis ?? []).join(", "),
        medNotes: item.notes ?? "",
        medications: (item.medications ?? []).map(m => ({ name: m.name ?? "", dosage: m.dosage ?? "", frequency: m.frequency ?? "", quantity: m.quantity ?? "" })),

        formTitle: item.formTitle ?? "", formNumber: item.formNumber ?? "", formDate: item.date ?? "",

        firstName: item.entities?.firstName ?? "", middleName: item.entities?.middleName ?? "",
        lastName: item.entities?.lastName ?? "", gender: item.entities?.gender ?? "",
        birthdate: item.entities?.birthdate ?? "", address: item.entities?.address ?? "",
        personNames: (item.entities?.personNames ?? []).join(", "),
        companyNames: (item.entities?.companyNames ?? []).join(", "),
        emails: (item.entities?.emails ?? []).join(", "),
        phoneNumbers: (item.entities?.phoneNumbers ?? []).join(", "),
        addresses: (item.entities?.addresses ?? []).join(", "),
        invoiceNumber: item.financialData?.invoiceNumber ?? "", receiptNumber: item.financialData?.receiptNumber ?? "",
        date: item.financialData?.date ?? "", dueDate: item.financialData?.dueDate ?? "",
        subtotal: n(item.financialData?.subtotal), tax: n(item.financialData?.tax),
        financialTotal: n(item.financialData?.total), currency: item.financialData?.currency ?? "",
        lineItems: (item.items ?? []).map(i => ({
            description: i.description ?? "", quantity: n(i.quantity), unitPrice: n(i.unitPrice), total: n(i.total),
        })),
    };
}

// ── buildPayload ──────────────────────────────────────────────────────────────

function splitCsv(s: string): string[] { return s.split(",").map(x => x.trim()).filter(Boolean); }
function num(s: string): number | null  { return s !== "" ? Number(s) : null; }

function buildPayload(id: string, form: FormState) {
    const base = {
        id,
        documentType: form.documentType,
        confidenceScore: form.confidenceScore !== "" ? Number(form.confidenceScore) : 0,
        metadata: { detectedLanguage: form.detectedLanguage, imageQuality: form.imageQuality },
        rawText: form.rawText,
    };

    const t = form.documentType?.toLowerCase() || "";

    if (["id", "passport", "drivers_license"].includes(t)) {
        return { ...base, idInfo: {
            idType: form.idType, idNumber: form.idNumber,
            firstName: form.idFirstName, lastName: form.idLastName, middleName: form.idMiddleName,
            gender: form.idGender, birthdate: form.idBirthdate, nationality: form.idNationality,
            address: form.idAddress, issuingAuthority: form.idIssuingAuthority,
            issuingCountry: form.idIssuingCountry, issueDate: form.idIssueDate, expirationDate: form.idExpirationDate,
        }};
    }
    if (t === "invoice") {
        return { ...base,
            vendor: { name: form.vendorName, address: form.vendorAddress, phone: form.vendorPhone, email: form.vendorEmail, taxId: form.vendorTaxId, website: form.vendorWebsite },
            client: { name: form.clientName, address: form.clientAddress, phone: form.clientPhone, email: form.clientEmail },
            invoiceDetails: {
                invoiceNumber: form.invNumber, date: form.invDate, dueDate: form.invDueDate,
                purchaseOrderNumber: form.invPONumber, paymentTerms: form.invPaymentTerms, notes: form.invNotes,
                subtotal: num(form.invSubtotal), discount: num(form.invDiscount), tax: num(form.invTax),
                shipping: num(form.invShipping), total: num(form.invTotal), currency: form.invCurrency,
            },
            items: form.lineItems.map(li => ({ description: li.description, quantity: num(li.quantity), unitPrice: num(li.unitPrice), total: num(li.total) })),
        };
    }
    if (t === "receipt") {
        return { ...base,
            merchant: { name: form.merchantName, address: form.merchantAddress, phone: form.merchantPhone, taxId: form.merchantTaxId },
            receiptDetails: {
                receiptNumber: form.recNumber, date: form.recDate, time: form.recTime,
                cashier: form.recCashier, paymentMethod: form.recPaymentMethod,
                subtotal: num(form.recSubtotal), discount: num(form.recDiscount), tax: num(form.recTax),
                tip: num(form.recTip), total: num(form.recTotal), currency: form.recCurrency,
            },
            items: form.lineItems.map(li => ({ description: li.description, quantity: num(li.quantity), unitPrice: num(li.unitPrice), total: num(li.total) })),
        };
    }
    if (t === "business_card") {
        return { ...base, contact: {
            firstName: form.contactFirstName, lastName: form.contactLastName, title: form.contactTitle,
            company: form.contactCompany, department: form.contactDepartment, phone: form.contactPhone,
            mobilePhone: form.contactMobilePhone, email: form.contactEmail, website: form.contactWebsite,
            address: form.contactAddress, linkedin: form.contactLinkedin, twitter: form.contactTwitter,
        }};
    }
    if (t === "contract") {
        return { ...base,
            contractInfo: {
                title: form.contractTitle, contractNumber: form.contractNumber,
                effectiveDate: form.contractEffectiveDate, expirationDate: form.contractExpirationDate,
                governingLaw: form.contractGoverningLaw,
            },
            parties: form.contractParties,
            keyTerms: splitCsv(form.contractKeyTerms),
            signatories: form.contractSignatories,
        };
    }
    if (t === "medical") {
        return { ...base,
            patient: { firstName: form.patientFirstName, lastName: form.patientLastName, birthdate: form.patientBirthdate, gender: form.patientGender, patientId: form.patientIdNum },
            provider: { name: form.providerName, specialty: form.providerSpecialty, licenseNumber: form.providerLicenseNumber, facility: form.providerFacility, address: form.providerAddress, phone: form.providerPhone },
            documentDate: form.docDate,
            diagnosis: splitCsv(form.diagnosis),
            medications: form.medications,
            notes: form.medNotes,
        };
    }
    if (t === "form") {
        return { ...base, formTitle: form.formTitle, formNumber: form.formNumber, date: form.formDate };
    }
    // Legacy / other
    return { ...base,
        entities: {
            personNames: splitCsv(form.personNames), companyNames: splitCsv(form.companyNames),
            emails: splitCsv(form.emails), phoneNumbers: splitCsv(form.phoneNumbers), addresses: splitCsv(form.addresses),
            lastName: form.lastName, firstName: form.firstName, middleName: form.middleName,
            gender: form.gender, birthdate: form.birthdate, address: form.address,
        },
        financialData: {
            invoiceNumber: form.invoiceNumber, receiptNumber: form.receiptNumber,
            date: form.date, dueDate: form.dueDate,
            subtotal: num(form.subtotal), tax: num(form.tax), total: num(form.financialTotal), currency: form.currency,
        },
        items: form.lineItems.map(li => ({ description: li.description, quantity: num(li.quantity), unitPrice: num(li.unitPrice), total: num(li.total) })),
    };
}

// ── UI helpers ────────────────────────────────────────────────────────────────

const inputCls =
    "w-full px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 " +
    "bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition placeholder:text-zinc-400";

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{title}</p>
            {subtitle && <p className="text-[10px] text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[10px] text-zinc-500 mb-1">{label}</label>
            {children}
        </div>
    );
}

// ── LineItems sub-component ───────────────────────────────────────────────────

function LineItemsSection({
    items, onSet, onAdd, onRemove,
}: {
    items: LineItem[];
    onSet: (i: number, f: keyof LineItem, v: string) => void;
    onAdd: () => void;
    onRemove: (i: number) => void;
}) {
    return (
        <div>
            <SectionLabel title="Line Items" />
            <div className="space-y-2">
                {items.length > 0 && (
                    <div className="grid grid-cols-[1fr_56px_80px_80px_28px] gap-2 px-0.5">
                        {["Description", "Qty", "Unit Price", "Total", ""].map((h, i) => (
                            <span key={i} className="text-[10px] text-zinc-400">{h}</span>
                        ))}
                    </div>
                )}
                {items.map((li, i) => (
                    <div key={i} className="grid grid-cols-[1fr_56px_80px_80px_28px] gap-2 items-center">
                        <input className={inputCls} value={li.description} onChange={e => onSet(i, "description", e.target.value)} placeholder="Description" />
                        <input className={inputCls} type="number" value={li.quantity} onChange={e => onSet(i, "quantity", e.target.value)} placeholder="0" />
                        <input className={inputCls} type="number" value={li.unitPrice} onChange={e => onSet(i, "unitPrice", e.target.value)} placeholder="0.00" />
                        <input className={inputCls} type="number" value={li.total} onChange={e => onSet(i, "total", e.target.value)} placeholder="0.00" />
                        <button type="button" onClick={() => onRemove(i)} className="flex items-center justify-center text-zinc-400 hover:text-red-500 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={onAdd} className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-600 transition">
                <Plus className="w-3.5 h-3.5" /> Add item
            </button>
        </div>
    );
}

// ── EditDrawer component ──────────────────────────────────────────────────────

interface EditDrawerProps {
    item: EditableItem | null;
    onClose: () => void;
    onSaved: () => void;
}

export default function EditDrawer({ item, onClose, onSaved }: EditDrawerProps) {
    const { toast } = useToast();
    const [form, setForm] = useState<FormState | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { setForm(item ? toForm(item) : null); }, [item]);

    if (!item || !form) return null;

    const set = (field: keyof StringFields, value: string) =>
        setForm(f => f ? { ...f, [field]: value } : f);

    // ── lineItems ─────────────────────────────────────────────────────────────
    const setLineItem = (i: number, field: keyof LineItem, v: string) =>
        setForm(f => f ? { ...f, lineItems: f.lineItems.map((li, idx) => idx === i ? { ...li, [field]: v } : li) } : f);
    const addLineItem = () =>
        setForm(f => f ? { ...f, lineItems: [...f.lineItems, { description: "", quantity: "", unitPrice: "", total: "" }] } : f);
    const removeLineItem = (i: number) =>
        setForm(f => f ? { ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) } : f);

    // ── contractParties ───────────────────────────────────────────────────────
    const setParty = (i: number, field: keyof ContractParty, v: string) =>
        setForm(f => f ? { ...f, contractParties: f.contractParties.map((p, idx) => idx === i ? { ...p, [field]: v } : p) } : f);
    const addParty = () =>
        setForm(f => f ? { ...f, contractParties: [...f.contractParties, { name: "", role: "", address: "" }] } : f);
    const removeParty = (i: number) =>
        setForm(f => f ? { ...f, contractParties: f.contractParties.filter((_, idx) => idx !== i) } : f);

    // ── signatories ───────────────────────────────────────────────────────────
    const setSignatory = (i: number, field: keyof Signatory, v: string) =>
        setForm(f => f ? { ...f, contractSignatories: f.contractSignatories.map((s, idx) => idx === i ? { ...s, [field]: v } : s) } : f);
    const addSignatory = () =>
        setForm(f => f ? { ...f, contractSignatories: [...f.contractSignatories, { name: "", role: "", signedDate: "" }] } : f);
    const removeSignatory = (i: number) =>
        setForm(f => f ? { ...f, contractSignatories: f.contractSignatories.filter((_, idx) => idx !== i) } : f);

    // ── medications ───────────────────────────────────────────────────────────
    const setMedication = (i: number, field: keyof Medication, v: string) =>
        setForm(f => f ? { ...f, medications: f.medications.map((m, idx) => idx === i ? { ...m, [field]: v } : m) } : f);
    const addMedication = () =>
        setForm(f => f ? { ...f, medications: [...f.medications, { name: "", dosage: "", frequency: "", quantity: "" }] } : f);
    const removeMedication = (i: number) =>
        setForm(f => f ? { ...f, medications: f.medications.filter((_, idx) => idx !== i) } : f);

    // ── save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!form) return;
        setIsSaving(true);
        try {
            const payload = buildPayload(item._id, form);
            const resp = await fetch("/api/save-scanned-data", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error((err as { error?: string }).error || `Error ${resp.status}`);
            }
            toast({ title: "Saved", description: "Record updated successfully." });
            onSaved();
            onClose();
        } catch (e) {
            toast({ title: "Save failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Derived type flags ────────────────────────────────────────────────────
    const docType = form.documentType?.toLowerCase() || "";
    const isIdentity    = ["id", "passport", "drivers_license"].includes(docType);
    const isInvoice     = docType === "invoice";
    const isReceipt     = docType === "receipt";
    const isBusinessCard = docType === "business_card";
    const isContract    = docType === "contract";
    const isMedical     = docType === "medical";
    const isForm        = docType === "form";
    const isLegacy      = !isIdentity && !isInvoice && !isReceipt && !isBusinessCard && !isContract && !isMedical && !isForm;

    const displayName =
        [form.idFirstName || form.contactFirstName || form.patientFirstName || form.firstName,
         form.idLastName  || form.contactLastName  || form.patientLastName  || form.lastName]
            .filter(Boolean).join(" ") ||
        form.vendorName || form.merchantName || form.contractTitle || form.formTitle ||
        item.documentType || item._id;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30" onClick={onClose} />

            {/* Drawer */}
            <aside className="fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl z-40 flex flex-col border-l border-zinc-200 dark:border-zinc-800">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Edit Record</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">{displayName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

                    {/* ── Document (always) ──────────────────────────────────── */}
                    <div>
                        <SectionLabel title="Document" />
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Document Type">
                                <input className={inputCls} value={form.documentType} onChange={e => set("documentType", e.target.value)} />
                            </Field>
                            <Field label="Confidence Score">
                                <input className={inputCls} type="number" value={form.confidenceScore} onChange={e => set("confidenceScore", e.target.value)} />
                            </Field>
                            <Field label="Language">
                                <input className={inputCls} value={form.detectedLanguage} onChange={e => set("detectedLanguage", e.target.value)} />
                            </Field>
                            <Field label="Image Quality">
                                <input className={inputCls} value={form.imageQuality} onChange={e => set("imageQuality", e.target.value)} />
                            </Field>
                        </div>
                    </div>

                    {/* ── IDENTITY ───────────────────────────────────────────── */}
                    {isIdentity && (<>
                        <div>
                            <SectionLabel title="ID Details" />
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Field label="ID Type">
                                    <input className={inputCls} value={form.idType} onChange={e => set("idType", e.target.value)} placeholder="National ID, Passport…" />
                                </Field>
                                <Field label="ID Number">
                                    <input className={inputCls} value={form.idNumber} onChange={e => set("idNumber", e.target.value)} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <Field label="First Name">
                                    <input className={inputCls} value={form.idFirstName} onChange={e => set("idFirstName", e.target.value)} />
                                </Field>
                                <Field label="Middle Name">
                                    <input className={inputCls} value={form.idMiddleName} onChange={e => set("idMiddleName", e.target.value)} />
                                </Field>
                                <Field label="Last Name">
                                    <input className={inputCls} value={form.idLastName} onChange={e => set("idLastName", e.target.value)} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Field label="Gender">
                                    <input className={inputCls} value={form.idGender} onChange={e => set("idGender", e.target.value)} />
                                </Field>
                                <Field label="Birthdate">
                                    <input className={inputCls} value={form.idBirthdate} onChange={e => set("idBirthdate", e.target.value)} />
                                </Field>
                                <Field label="Nationality">
                                    <input className={inputCls} value={form.idNationality} onChange={e => set("idNationality", e.target.value)} />
                                </Field>
                                <Field label="Expiration Date">
                                    <input className={inputCls} value={form.idExpirationDate} onChange={e => set("idExpirationDate", e.target.value)} />
                                </Field>
                                <Field label="Issue Date">
                                    <input className={inputCls} value={form.idIssueDate} onChange={e => set("idIssueDate", e.target.value)} />
                                </Field>
                                <Field label="Issuing Country">
                                    <input className={inputCls} value={form.idIssuingCountry} onChange={e => set("idIssuingCountry", e.target.value)} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <Field label="Address">
                                    <input className={inputCls} value={form.idAddress} onChange={e => set("idAddress", e.target.value)} />
                                </Field>
                                <Field label="Issuing Authority">
                                    <input className={inputCls} value={form.idIssuingAuthority} onChange={e => set("idIssuingAuthority", e.target.value)} />
                                </Field>
                            </div>
                        </div>
                    </>)}

                    {/* ── INVOICE ────────────────────────────────────────────── */}
                    {isInvoice && (<>
                        <div>
                            <SectionLabel title="Vendor" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Name"><input className={inputCls} value={form.vendorName} onChange={e => set("vendorName", e.target.value)} /></Field>
                                <Field label="Tax ID"><input className={inputCls} value={form.vendorTaxId} onChange={e => set("vendorTaxId", e.target.value)} /></Field>
                                <Field label="Phone"><input className={inputCls} value={form.vendorPhone} onChange={e => set("vendorPhone", e.target.value)} /></Field>
                                <Field label="Email"><input className={inputCls} value={form.vendorEmail} onChange={e => set("vendorEmail", e.target.value)} /></Field>
                                <Field label="Website"><input className={inputCls} value={form.vendorWebsite} onChange={e => set("vendorWebsite", e.target.value)} /></Field>
                                <Field label="Address"><input className={inputCls} value={form.vendorAddress} onChange={e => set("vendorAddress", e.target.value)} /></Field>
                            </div>
                        </div>
                        <div>
                            <SectionLabel title="Client" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Name"><input className={inputCls} value={form.clientName} onChange={e => set("clientName", e.target.value)} /></Field>
                                <Field label="Email"><input className={inputCls} value={form.clientEmail} onChange={e => set("clientEmail", e.target.value)} /></Field>
                                <Field label="Phone"><input className={inputCls} value={form.clientPhone} onChange={e => set("clientPhone", e.target.value)} /></Field>
                                <Field label="Address"><input className={inputCls} value={form.clientAddress} onChange={e => set("clientAddress", e.target.value)} /></Field>
                            </div>
                        </div>
                        <div>
                            <SectionLabel title="Invoice Details" />
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Field label="Invoice #"><input className={inputCls} value={form.invNumber} onChange={e => set("invNumber", e.target.value)} /></Field>
                                <Field label="PO Number"><input className={inputCls} value={form.invPONumber} onChange={e => set("invPONumber", e.target.value)} /></Field>
                                <Field label="Date"><input className={inputCls} value={form.invDate} onChange={e => set("invDate", e.target.value)} /></Field>
                                <Field label="Due Date"><input className={inputCls} value={form.invDueDate} onChange={e => set("invDueDate", e.target.value)} /></Field>
                                <Field label="Currency"><input className={inputCls} value={form.invCurrency} onChange={e => set("invCurrency", e.target.value)} placeholder="USD" /></Field>
                                <Field label="Payment Terms"><input className={inputCls} value={form.invPaymentTerms} onChange={e => set("invPaymentTerms", e.target.value)} /></Field>
                            </div>
                            <div className="grid grid-cols-4 gap-3 mb-3">
                                <Field label="Subtotal"><input className={inputCls} type="number" value={form.invSubtotal} onChange={e => set("invSubtotal", e.target.value)} /></Field>
                                <Field label="Discount"><input className={inputCls} type="number" value={form.invDiscount} onChange={e => set("invDiscount", e.target.value)} /></Field>
                                <Field label="Tax"><input className={inputCls} type="number" value={form.invTax} onChange={e => set("invTax", e.target.value)} /></Field>
                                <Field label="Shipping"><input className={inputCls} type="number" value={form.invShipping} onChange={e => set("invShipping", e.target.value)} /></Field>
                            </div>
                            <Field label="Total">
                                <input className={inputCls} type="number" value={form.invTotal} onChange={e => set("invTotal", e.target.value)} />
                            </Field>
                            <div className="mt-3">
                                <Field label="Notes">
                                    <textarea className={inputCls + " resize-y"} rows={2} value={form.invNotes} onChange={e => set("invNotes", e.target.value)} />
                                </Field>
                            </div>
                        </div>
                        <LineItemsSection items={form.lineItems} onSet={setLineItem} onAdd={addLineItem} onRemove={removeLineItem} />
                    </>)}

                    {/* ── RECEIPT ────────────────────────────────────────────── */}
                    {isReceipt && (<>
                        <div>
                            <SectionLabel title="Merchant" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Name"><input className={inputCls} value={form.merchantName} onChange={e => set("merchantName", e.target.value)} /></Field>
                                <Field label="Tax ID"><input className={inputCls} value={form.merchantTaxId} onChange={e => set("merchantTaxId", e.target.value)} /></Field>
                                <Field label="Phone"><input className={inputCls} value={form.merchantPhone} onChange={e => set("merchantPhone", e.target.value)} /></Field>
                                <Field label="Address"><input className={inputCls} value={form.merchantAddress} onChange={e => set("merchantAddress", e.target.value)} /></Field>
                            </div>
                        </div>
                        <div>
                            <SectionLabel title="Receipt Details" />
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Field label="Receipt #"><input className={inputCls} value={form.recNumber} onChange={e => set("recNumber", e.target.value)} /></Field>
                                <Field label="Date"><input className={inputCls} value={form.recDate} onChange={e => set("recDate", e.target.value)} /></Field>
                                <Field label="Time"><input className={inputCls} value={form.recTime} onChange={e => set("recTime", e.target.value)} /></Field>
                                <Field label="Cashier"><input className={inputCls} value={form.recCashier} onChange={e => set("recCashier", e.target.value)} /></Field>
                                <Field label="Payment Method"><input className={inputCls} value={form.recPaymentMethod} onChange={e => set("recPaymentMethod", e.target.value)} /></Field>
                                <Field label="Currency"><input className={inputCls} value={form.recCurrency} onChange={e => set("recCurrency", e.target.value)} placeholder="USD" /></Field>
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                                <Field label="Subtotal"><input className={inputCls} type="number" value={form.recSubtotal} onChange={e => set("recSubtotal", e.target.value)} /></Field>
                                <Field label="Discount"><input className={inputCls} type="number" value={form.recDiscount} onChange={e => set("recDiscount", e.target.value)} /></Field>
                                <Field label="Tax"><input className={inputCls} type="number" value={form.recTax} onChange={e => set("recTax", e.target.value)} /></Field>
                                <Field label="Tip"><input className={inputCls} type="number" value={form.recTip} onChange={e => set("recTip", e.target.value)} /></Field>
                                <Field label="Total"><input className={inputCls} type="number" value={form.recTotal} onChange={e => set("recTotal", e.target.value)} /></Field>
                            </div>
                        </div>
                        <LineItemsSection items={form.lineItems} onSet={setLineItem} onAdd={addLineItem} onRemove={removeLineItem} />
                    </>)}

                    {/* ── BUSINESS CARD ──────────────────────────────────────── */}
                    {isBusinessCard && (
                        <div>
                            <SectionLabel title="Contact" />
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Field label="First Name"><input className={inputCls} value={form.contactFirstName} onChange={e => set("contactFirstName", e.target.value)} /></Field>
                                <Field label="Last Name"><input className={inputCls} value={form.contactLastName} onChange={e => set("contactLastName", e.target.value)} /></Field>
                                <Field label="Title / Position"><input className={inputCls} value={form.contactTitle} onChange={e => set("contactTitle", e.target.value)} /></Field>
                                <Field label="Department"><input className={inputCls} value={form.contactDepartment} onChange={e => set("contactDepartment", e.target.value)} /></Field>
                                <Field label="Company"><input className={inputCls} value={form.contactCompany} onChange={e => set("contactCompany", e.target.value)} /></Field>
                                <Field label="Website"><input className={inputCls} value={form.contactWebsite} onChange={e => set("contactWebsite", e.target.value)} /></Field>
                                <Field label="Phone"><input className={inputCls} value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} /></Field>
                                <Field label="Mobile"><input className={inputCls} value={form.contactMobilePhone} onChange={e => set("contactMobilePhone", e.target.value)} /></Field>
                                <Field label="Email"><input className={inputCls} value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} /></Field>
                                <Field label="LinkedIn"><input className={inputCls} value={form.contactLinkedin} onChange={e => set("contactLinkedin", e.target.value)} /></Field>
                                <Field label="Twitter"><input className={inputCls} value={form.contactTwitter} onChange={e => set("contactTwitter", e.target.value)} /></Field>
                            </div>
                            <Field label="Address"><input className={inputCls} value={form.contactAddress} onChange={e => set("contactAddress", e.target.value)} /></Field>
                        </div>
                    )}

                    {/* ── CONTRACT ───────────────────────────────────────────── */}
                    {isContract && (<>
                        <div>
                            <SectionLabel title="Contract Info" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Title"><input className={inputCls} value={form.contractTitle} onChange={e => set("contractTitle", e.target.value)} /></Field>
                                <Field label="Contract #"><input className={inputCls} value={form.contractNumber} onChange={e => set("contractNumber", e.target.value)} /></Field>
                                <Field label="Effective Date"><input className={inputCls} value={form.contractEffectiveDate} onChange={e => set("contractEffectiveDate", e.target.value)} /></Field>
                                <Field label="Expiration Date"><input className={inputCls} value={form.contractExpirationDate} onChange={e => set("contractExpirationDate", e.target.value)} /></Field>
                                <Field label="Governing Law"><input className={inputCls} value={form.contractGoverningLaw} onChange={e => set("contractGoverningLaw", e.target.value)} /></Field>
                            </div>
                        </div>
                        <div>
                            <SectionLabel title="Parties" />
                            <div className="space-y-2">
                                {form.contractParties.length > 0 && (
                                    <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 px-0.5">
                                        {["Name", "Role", "Address", ""].map((h, i) => <span key={i} className="text-[10px] text-zinc-400">{h}</span>)}
                                    </div>
                                )}
                                {form.contractParties.map((p, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 items-center">
                                        <input className={inputCls} value={p.name} onChange={e => setParty(i, "name", e.target.value)} placeholder="Name" />
                                        <input className={inputCls} value={p.role} onChange={e => setParty(i, "role", e.target.value)} placeholder="Role" />
                                        <input className={inputCls} value={p.address} onChange={e => setParty(i, "address", e.target.value)} placeholder="Address" />
                                        <button type="button" onClick={() => removeParty(i)} className="flex items-center justify-center text-zinc-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addParty} className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-600 transition">
                                <Plus className="w-3.5 h-3.5" /> Add party
                            </button>
                        </div>
                        <div>
                            <SectionLabel title="Key Terms" subtitle="Comma-separated" />
                            <input className={inputCls} value={form.contractKeyTerms} onChange={e => set("contractKeyTerms", e.target.value)} placeholder="Term 1, Term 2" />
                        </div>
                        <div>
                            <SectionLabel title="Signatories" />
                            <div className="space-y-2">
                                {form.contractSignatories.length > 0 && (
                                    <div className="grid grid-cols-[1fr_1fr_120px_28px] gap-2 px-0.5">
                                        {["Name", "Role", "Signed Date", ""].map((h, i) => <span key={i} className="text-[10px] text-zinc-400">{h}</span>)}
                                    </div>
                                )}
                                {form.contractSignatories.map((s, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_1fr_120px_28px] gap-2 items-center">
                                        <input className={inputCls} value={s.name} onChange={e => setSignatory(i, "name", e.target.value)} placeholder="Name" />
                                        <input className={inputCls} value={s.role} onChange={e => setSignatory(i, "role", e.target.value)} placeholder="Role" />
                                        <input className={inputCls} value={s.signedDate} onChange={e => setSignatory(i, "signedDate", e.target.value)} placeholder="Date" />
                                        <button type="button" onClick={() => removeSignatory(i)} className="flex items-center justify-center text-zinc-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addSignatory} className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-600 transition">
                                <Plus className="w-3.5 h-3.5" /> Add signatory
                            </button>
                        </div>
                    </>)}

                    {/* ── MEDICAL ────────────────────────────────────────────── */}
                    {isMedical && (<>
                        <div>
                            <SectionLabel title="Patient" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="First Name"><input className={inputCls} value={form.patientFirstName} onChange={e => set("patientFirstName", e.target.value)} /></Field>
                                <Field label="Last Name"><input className={inputCls} value={form.patientLastName} onChange={e => set("patientLastName", e.target.value)} /></Field>
                                <Field label="Birthdate"><input className={inputCls} value={form.patientBirthdate} onChange={e => set("patientBirthdate", e.target.value)} /></Field>
                                <Field label="Gender"><input className={inputCls} value={form.patientGender} onChange={e => set("patientGender", e.target.value)} /></Field>
                                <Field label="Patient ID"><input className={inputCls} value={form.patientIdNum} onChange={e => set("patientIdNum", e.target.value)} /></Field>
                            </div>
                        </div>
                        <div>
                            <SectionLabel title="Provider" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Name"><input className={inputCls} value={form.providerName} onChange={e => set("providerName", e.target.value)} /></Field>
                                <Field label="Specialty"><input className={inputCls} value={form.providerSpecialty} onChange={e => set("providerSpecialty", e.target.value)} /></Field>
                                <Field label="License #"><input className={inputCls} value={form.providerLicenseNumber} onChange={e => set("providerLicenseNumber", e.target.value)} /></Field>
                                <Field label="Facility"><input className={inputCls} value={form.providerFacility} onChange={e => set("providerFacility", e.target.value)} /></Field>
                                <Field label="Phone"><input className={inputCls} value={form.providerPhone} onChange={e => set("providerPhone", e.target.value)} /></Field>
                                <Field label="Address"><input className={inputCls} value={form.providerAddress} onChange={e => set("providerAddress", e.target.value)} /></Field>
                            </div>
                        </div>
                        <div>
                            <SectionLabel title="Clinical Info" />
                            <div className="grid grid-cols-1 gap-3">
                                <Field label="Document Date"><input className={inputCls} value={form.docDate} onChange={e => set("docDate", e.target.value)} /></Field>
                                <Field label="Diagnosis" ><input className={inputCls} value={form.diagnosis} onChange={e => set("diagnosis", e.target.value)} placeholder="Diagnosis 1, Diagnosis 2" /></Field>
                            </div>
                        </div>
                        <div>
                            <SectionLabel title="Medications" />
                            <div className="space-y-2">
                                {form.medications.length > 0 && (
                                    <div className="grid grid-cols-[1fr_80px_80px_64px_28px] gap-2 px-0.5">
                                        {["Drug Name", "Dosage", "Frequency", "Qty", ""].map((h, i) => <span key={i} className="text-[10px] text-zinc-400">{h}</span>)}
                                    </div>
                                )}
                                {form.medications.map((m, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_80px_80px_64px_28px] gap-2 items-center">
                                        <input className={inputCls} value={m.name} onChange={e => setMedication(i, "name", e.target.value)} placeholder="Drug name" />
                                        <input className={inputCls} value={m.dosage} onChange={e => setMedication(i, "dosage", e.target.value)} placeholder="500mg" />
                                        <input className={inputCls} value={m.frequency} onChange={e => setMedication(i, "frequency", e.target.value)} placeholder="Twice daily" />
                                        <input className={inputCls} value={m.quantity} onChange={e => setMedication(i, "quantity", e.target.value)} placeholder="30" />
                                        <button type="button" onClick={() => removeMedication(i)} className="flex items-center justify-center text-zinc-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addMedication} className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-600 transition">
                                <Plus className="w-3.5 h-3.5" /> Add medication
                            </button>
                        </div>
                        <div>
                            <SectionLabel title="Notes" />
                            <textarea className={inputCls + " resize-y"} rows={3} value={form.medNotes} onChange={e => set("medNotes", e.target.value)} />
                        </div>
                    </>)}

                    {/* ── FORM ───────────────────────────────────────────────── */}
                    {isForm && (
                        <div>
                            <SectionLabel title="Form Info" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Form Title"><input className={inputCls} value={form.formTitle} onChange={e => set("formTitle", e.target.value)} /></Field>
                                <Field label="Form #"><input className={inputCls} value={form.formNumber} onChange={e => set("formNumber", e.target.value)} /></Field>
                                <Field label="Date"><input className={inputCls} value={form.formDate} onChange={e => set("formDate", e.target.value)} /></Field>
                            </div>
                        </div>
                    )}

                    {/* ── LEGACY / OTHER ─────────────────────────────────────── */}
                    {isLegacy && (<>
                        <div>
                            <SectionLabel title="Identity" />
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <Field label="First Name"><input className={inputCls} value={form.firstName} onChange={e => set("firstName", e.target.value)} /></Field>
                                <Field label="Middle Name"><input className={inputCls} value={form.middleName} onChange={e => set("middleName", e.target.value)} /></Field>
                                <Field label="Last Name"><input className={inputCls} value={form.lastName} onChange={e => set("lastName", e.target.value)} /></Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Field label="Gender"><input className={inputCls} value={form.gender} onChange={e => set("gender", e.target.value)} /></Field>
                                <Field label="Birthdate"><input className={inputCls} value={form.birthdate} onChange={e => set("birthdate", e.target.value)} /></Field>
                            </div>
                            <Field label="Address"><input className={inputCls} value={form.address} onChange={e => set("address", e.target.value)} /></Field>
                        </div>
                        <div>
                            <SectionLabel title="Extracted Lists" subtitle="Comma-separated" />
                            <div className="space-y-3">
                                <Field label="Emails"><input className={inputCls} value={form.emails} onChange={e => set("emails", e.target.value)} /></Field>
                                <Field label="Phone Numbers"><input className={inputCls} value={form.phoneNumbers} onChange={e => set("phoneNumbers", e.target.value)} /></Field>
                                <Field label="Person Names"><input className={inputCls} value={form.personNames} onChange={e => set("personNames", e.target.value)} /></Field>
                                <Field label="Company Names"><input className={inputCls} value={form.companyNames} onChange={e => set("companyNames", e.target.value)} /></Field>
                                <Field label="Addresses"><input className={inputCls} value={form.addresses} onChange={e => set("addresses", e.target.value)} /></Field>
                            </div>
                        </div>
                        <div>
                            <SectionLabel title="Financial Data" />
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Field label="Invoice Number"><input className={inputCls} value={form.invoiceNumber} onChange={e => set("invoiceNumber", e.target.value)} /></Field>
                                <Field label="Receipt Number"><input className={inputCls} value={form.receiptNumber} onChange={e => set("receiptNumber", e.target.value)} /></Field>
                                <Field label="Date"><input className={inputCls} value={form.date} onChange={e => set("date", e.target.value)} /></Field>
                                <Field label="Due Date"><input className={inputCls} value={form.dueDate} onChange={e => set("dueDate", e.target.value)} /></Field>
                                <Field label="Currency"><input className={inputCls} value={form.currency} onChange={e => set("currency", e.target.value)} placeholder="USD" /></Field>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Subtotal"><input className={inputCls} type="number" value={form.subtotal} onChange={e => set("subtotal", e.target.value)} /></Field>
                                <Field label="Tax"><input className={inputCls} type="number" value={form.tax} onChange={e => set("tax", e.target.value)} /></Field>
                                <Field label="Total"><input className={inputCls} type="number" value={form.financialTotal} onChange={e => set("financialTotal", e.target.value)} /></Field>
                            </div>
                        </div>
                        <LineItemsSection items={form.lineItems} onSet={setLineItem} onAdd={addLineItem} onRemove={removeLineItem} />
                    </>)}

                    {/* ── Raw Text (always) ──────────────────────────────────── */}
                    <div>
                        <SectionLabel title="Raw Text" />
                        <textarea className={inputCls + " resize-y font-mono leading-relaxed"} value={form.rawText} onChange={e => set("rawText", e.target.value)} rows={5} />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Save Changes"}
                    </button>
                </div>
            </aside>
        </>
    );
}
