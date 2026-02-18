"use client";

import { Copy, Check, Database, Loader2 } from "lucide-react";
import { useState } from "react";

import { useToast } from "./ToastProvider";
import FormatedData from "@/models/FormatedData";

interface Metadata {
  detectedLanguage?: string;
  imageQuality?: string;
}

interface Entities {
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
}

interface FinancialData {
  invoiceNumber?: string;
  receiptNumber?: string;
  date?: string;
  dueDate?: string;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  currency?: string;
}

interface Item {
  description?: string;
  quantity?: number | null;
  unitPrice?: number | null;
  total?: number | null;
}

interface DataShape {
  documentType?: string;
  confidenceScore?: number;
  metadata?: Metadata;
  entities?: Entities;
  financialData?: FinancialData;
  items?: Item[];
  rawText?: string;
}

interface JsonDisplayProps {
  data: DataShape;
}

const syntaxHighlight = (json: string): string => {
  return json.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
};

const JsonDisplay = ({ data }: JsonDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const jsonStr = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToMongo = async () => {
    setIsSaving(true);
    try {
      // Format the data using the FormatedData model shape
      // (Client-side: just ensure the shape matches, server will validate)
      const formatted = {
        documentType: data.documentType || "",
        confidenceScore: data.confidenceScore || 0,
        metadata: {
          detectedLanguage: data.metadata?.detectedLanguage || "",
          imageQuality: data.metadata?.imageQuality || "",
        },
        entities: {
          personNames: data.entities?.personNames || [],
          companyNames: data.entities?.companyNames || [],
          emails: data.entities?.emails || [],
          phoneNumbers: data.entities?.phoneNumbers || [],
          addresses: data.entities?.addresses || [],
          lastName: data.entities?.lastName || "",
          firstName: data.entities?.firstName || "",
          middleName: data.entities?.middleName || "",
          gender: data.entities?.gender || "",
          birthdate: data.entities?.birthdate || "",
          address: data.entities?.address || "",
        },
        financialData: {
          invoiceNumber: data.financialData?.invoiceNumber || "",
          receiptNumber: data.financialData?.receiptNumber || "",
          date: data.financialData?.date || "",
          dueDate: data.financialData?.dueDate || "",
          subtotal: data.financialData?.subtotal ?? null,
          tax: data.financialData?.tax ?? null,
          total: data.financialData?.total ?? null,
          currency: data.financialData?.currency || "",
        },
        items: Array.isArray(data.items)
          ? data.items.map((item: any) => ({
              description: item.description || "",
              quantity: item.quantity ?? null,
              unitPrice: item.unitPrice ?? null,
              total: item.total ?? null,
            }))
          : [],
        rawText: data.rawText || "",
      };
      const resp = await fetch(`api/save-scanned-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formatted),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      setSaved(true);
      toast({ title: "Saved to MongoDB", description: "Document data stored successfully." });
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/50">
        <span className="text-xs font-mono text-muted-foreground">output.json</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveToMongo}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                Saved
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                Save to MongoDB
              </>
            )}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-auto max-h-[500px] text-xs leading-relaxed font-mono">
        <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonStr) }} />
      </pre>
    </div>
  );
};

export default JsonDisplay;
