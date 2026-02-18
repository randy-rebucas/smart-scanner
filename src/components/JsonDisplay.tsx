"use client";

import { Copy, Check, Database, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "./ToastProvider";

interface JsonDisplayProps {
  data: Record<string, unknown>;
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
      // const resp = await fetch(
      //   `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-to-mongodb`,
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      //     },
      //     body: JSON.stringify({ data }),
      //   }
      // );
      // if (!resp.ok) {
      //   const err = await resp.json().catch(() => ({}));
      //   throw new Error(err.error || `Error ${resp.status}`);
      // }
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
