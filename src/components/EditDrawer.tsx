"use client";
import { useEffect, useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "./ToastProvider";

// Exported so Main.tsx can use it as the HistoryItem type
export interface EditableItem {
    _id: string;
    createdAt: string;
    documentType?: string;
    confidenceScore?: number;
    metadata?: {
        detectedLanguage?: string;
        imageQuality?: string;
    };
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
    rawText?: string;
}

interface LineItem {
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
}

interface FormState {
    documentType: string;
    confidenceScore: string;
    detectedLanguage: string;
    imageQuality: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    birthdate: string;
    address: string;
    personNames: string;
    companyNames: string;
    emails: string;
    phoneNumbers: string;
    addresses: string;
    invoiceNumber: string;
    receiptNumber: string;
    date: string;
    dueDate: string;
    subtotal: string;
    tax: string;
    financialTotal: string;
    currency: string;
    lineItems: LineItem[];
    rawText: string;
}

function toForm(item: EditableItem): FormState {
    return {
        documentType: item.documentType ?? "",
        confidenceScore: item.confidenceScore != null ? String(item.confidenceScore) : "",
        detectedLanguage: item.metadata?.detectedLanguage ?? "",
        imageQuality: item.metadata?.imageQuality ?? "",
        firstName: item.entities?.firstName ?? "",
        middleName: item.entities?.middleName ?? "",
        lastName: item.entities?.lastName ?? "",
        gender: item.entities?.gender ?? "",
        birthdate: item.entities?.birthdate ?? "",
        address: item.entities?.address ?? "",
        personNames: (item.entities?.personNames ?? []).join(", "),
        companyNames: (item.entities?.companyNames ?? []).join(", "),
        emails: (item.entities?.emails ?? []).join(", "),
        phoneNumbers: (item.entities?.phoneNumbers ?? []).join(", "),
        addresses: (item.entities?.addresses ?? []).join(", "),
        invoiceNumber: item.financialData?.invoiceNumber ?? "",
        receiptNumber: item.financialData?.receiptNumber ?? "",
        date: item.financialData?.date ?? "",
        dueDate: item.financialData?.dueDate ?? "",
        subtotal: item.financialData?.subtotal != null ? String(item.financialData.subtotal) : "",
        tax: item.financialData?.tax != null ? String(item.financialData.tax) : "",
        financialTotal: item.financialData?.total != null ? String(item.financialData.total) : "",
        currency: item.financialData?.currency ?? "",
        lineItems: (item.items ?? []).map(i => ({
            description: i.description ?? "",
            quantity: i.quantity != null ? String(i.quantity) : "",
            unitPrice: i.unitPrice != null ? String(i.unitPrice) : "",
            total: i.total != null ? String(i.total) : "",
        })),
        rawText: item.rawText ?? "",
    };
}

function splitCsv(s: string): string[] {
    return s.split(",").map(x => x.trim()).filter(Boolean);
}

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

interface EditDrawerProps {
    item: EditableItem | null;
    onClose: () => void;
    onSaved: (updated: EditableItem) => void;
}

export default function EditDrawer({ item, onClose, onSaved }: EditDrawerProps) {
    const { toast } = useToast();
    const [form, setForm] = useState<FormState | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setForm(item ? toForm(item) : null);
    }, [item]);

    if (!item || !form) return null;

    const set = (field: keyof Omit<FormState, "lineItems">, value: string) =>
        setForm(f => f ? { ...f, [field]: value } : f);

    const setLineItem = (index: number, field: keyof LineItem, value: string) =>
        setForm(f => {
            if (!f) return f;
            const lineItems = f.lineItems.map((li, i) => i === index ? { ...li, [field]: value } : li);
            return { ...f, lineItems };
        });

    const addLineItem = () =>
        setForm(f => f ? { ...f, lineItems: [...f.lineItems, { description: "", quantity: "", unitPrice: "", total: "" }] } : f);

    const removeLineItem = (index: number) =>
        setForm(f => f ? { ...f, lineItems: f.lineItems.filter((_, i) => i !== index) } : f);

    const handleSave = async () => {
        if (!form) return;
        setIsSaving(true);
        try {
            const payload = {
                id: item._id,
                documentType: form.documentType,
                confidenceScore: form.confidenceScore !== "" ? Number(form.confidenceScore) : 0,
                metadata: {
                    detectedLanguage: form.detectedLanguage,
                    imageQuality: form.imageQuality,
                },
                entities: {
                    personNames: splitCsv(form.personNames),
                    companyNames: splitCsv(form.companyNames),
                    emails: splitCsv(form.emails),
                    phoneNumbers: splitCsv(form.phoneNumbers),
                    addresses: splitCsv(form.addresses),
                    lastName: form.lastName,
                    firstName: form.firstName,
                    middleName: form.middleName,
                    gender: form.gender,
                    birthdate: form.birthdate,
                    address: form.address,
                },
                financialData: {
                    invoiceNumber: form.invoiceNumber,
                    receiptNumber: form.receiptNumber,
                    date: form.date,
                    dueDate: form.dueDate,
                    subtotal: form.subtotal !== "" ? Number(form.subtotal) : null,
                    tax: form.tax !== "" ? Number(form.tax) : null,
                    total: form.financialTotal !== "" ? Number(form.financialTotal) : null,
                    currency: form.currency,
                },
                items: form.lineItems.map(li => ({
                    description: li.description,
                    quantity: li.quantity !== "" ? Number(li.quantity) : null,
                    unitPrice: li.unitPrice !== "" ? Number(li.unitPrice) : null,
                    total: li.total !== "" ? Number(li.total) : null,
                })),
                rawText: form.rawText,
            };

            const resp = await fetch("/api/save-scanned-data", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || `Error ${resp.status}`);
            }

            const data = await resp.json();
            toast({ title: "Saved", description: "Record updated successfully." });
            onSaved(data.data);
            onClose();
        } catch (e) {
            toast({
                title: "Save failed",
                description: e instanceof Error ? e.message : String(e),
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const displayName =
        [item.entities?.firstName, item.entities?.lastName].filter(Boolean).join(" ") ||
        item.documentType ||
        item._id;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                onClick={onClose}
            />

            {/* Drawer */}
            <aside className="fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl z-40 flex flex-col border-l border-zinc-200 dark:border-zinc-800">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Edit Record</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">{displayName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

                    {/* Document */}
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

                    {/* Identity */}
                    <div>
                        <SectionLabel title="Identity" />
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <Field label="First Name">
                                <input className={inputCls} value={form.firstName} onChange={e => set("firstName", e.target.value)} />
                            </Field>
                            <Field label="Middle Name">
                                <input className={inputCls} value={form.middleName} onChange={e => set("middleName", e.target.value)} />
                            </Field>
                            <Field label="Last Name">
                                <input className={inputCls} value={form.lastName} onChange={e => set("lastName", e.target.value)} />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <Field label="Gender">
                                <input className={inputCls} value={form.gender} onChange={e => set("gender", e.target.value)} />
                            </Field>
                            <Field label="Birthdate">
                                <input className={inputCls} value={form.birthdate} onChange={e => set("birthdate", e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Address">
                            <input className={inputCls} value={form.address} onChange={e => set("address", e.target.value)} />
                        </Field>
                    </div>

                    {/* Extracted Lists */}
                    <div>
                        <SectionLabel title="Extracted Lists" subtitle="Comma-separated" />
                        <div className="space-y-3">
                            <Field label="Emails">
                                <input className={inputCls} value={form.emails} onChange={e => set("emails", e.target.value)} placeholder="a@b.com, c@d.com" />
                            </Field>
                            <Field label="Phone Numbers">
                                <input className={inputCls} value={form.phoneNumbers} onChange={e => set("phoneNumbers", e.target.value)} placeholder="+1 555 0000, +1 555 0001" />
                            </Field>
                            <Field label="Person Names">
                                <input className={inputCls} value={form.personNames} onChange={e => set("personNames", e.target.value)} />
                            </Field>
                            <Field label="Company Names">
                                <input className={inputCls} value={form.companyNames} onChange={e => set("companyNames", e.target.value)} />
                            </Field>
                            <Field label="Addresses">
                                <input className={inputCls} value={form.addresses} onChange={e => set("addresses", e.target.value)} />
                            </Field>
                        </div>
                    </div>

                    {/* Financial Data */}
                    <div>
                        <SectionLabel title="Financial Data" />
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <Field label="Invoice Number">
                                <input className={inputCls} value={form.invoiceNumber} onChange={e => set("invoiceNumber", e.target.value)} />
                            </Field>
                            <Field label="Receipt Number">
                                <input className={inputCls} value={form.receiptNumber} onChange={e => set("receiptNumber", e.target.value)} />
                            </Field>
                            <Field label="Date">
                                <input className={inputCls} value={form.date} onChange={e => set("date", e.target.value)} />
                            </Field>
                            <Field label="Due Date">
                                <input className={inputCls} value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
                            </Field>
                            <Field label="Currency">
                                <input className={inputCls} value={form.currency} onChange={e => set("currency", e.target.value)} placeholder="USD" />
                            </Field>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <Field label="Subtotal">
                                <input className={inputCls} type="number" value={form.subtotal} onChange={e => set("subtotal", e.target.value)} />
                            </Field>
                            <Field label="Tax">
                                <input className={inputCls} type="number" value={form.tax} onChange={e => set("tax", e.target.value)} />
                            </Field>
                            <Field label="Total">
                                <input className={inputCls} type="number" value={form.financialTotal} onChange={e => set("financialTotal", e.target.value)} />
                            </Field>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <SectionLabel title="Line Items" />
                        <div className="space-y-2">
                            {form.lineItems.length > 0 && (
                                <div className="grid grid-cols-[1fr_56px_80px_80px_28px] gap-2 px-0.5">
                                    {["Description", "Qty", "Unit Price", "Total", ""].map((h, i) => (
                                        <span key={i} className="text-[10px] text-zinc-400">{h}</span>
                                    ))}
                                </div>
                            )}
                            {form.lineItems.map((li, i) => (
                                <div key={i} className="grid grid-cols-[1fr_56px_80px_80px_28px] gap-2 items-center">
                                    <input
                                        className={inputCls}
                                        value={li.description}
                                        onChange={e => setLineItem(i, "description", e.target.value)}
                                        placeholder="Description"
                                    />
                                    <input
                                        className={inputCls}
                                        type="number"
                                        value={li.quantity}
                                        onChange={e => setLineItem(i, "quantity", e.target.value)}
                                        placeholder="0"
                                    />
                                    <input
                                        className={inputCls}
                                        type="number"
                                        value={li.unitPrice}
                                        onChange={e => setLineItem(i, "unitPrice", e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <input
                                        className={inputCls}
                                        type="number"
                                        value={li.total}
                                        onChange={e => setLineItem(i, "total", e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeLineItem(i)}
                                        className="flex items-center justify-center text-zinc-400 hover:text-red-500 transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addLineItem}
                            className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-600 transition"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add item
                        </button>
                    </div>

                    {/* Raw Text */}
                    <div>
                        <SectionLabel title="Raw Text" />
                        <textarea
                            className={inputCls + " resize-y font-mono leading-relaxed"}
                            value={form.rawText}
                            onChange={e => set("rawText", e.target.value)}
                            rows={5}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                            : "Save Changes"
                        }
                    </button>
                </div>
            </aside>
        </>
    );
}
