import { useCallback, useState, useRef } from "react";
import { Upload, Image, X } from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  preview: string | null;
  onClear: () => void;
  isAnalyzing: boolean;
}

const DropZone = ({ onFileSelect, preview, onClear, isAnalyzing }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  if (preview) {
    return (
      <div className="relative group">
        <div className="rounded-lg overflow-hidden border border-border bg-card">
          <img
            src={preview}
            alt="Document preview"
            className="w-full max-h-[400px] object-contain"
          />
        </div>
        {!isAnalyzing && (
          <button
            onClick={onClear}
            className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-lg border-2 border-dashed p-12
        flex flex-col items-center justify-center gap-4 transition-all duration-300
        ${isDragging
          ? "border-primary bg-primary/5 animate-pulse-border"
          : "border-border hover:border-primary/50 hover:bg-card/50"
        }
      `}
    >
      <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
        {isDragging ? (
          <Image className="w-6 h-6 text-primary" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {isDragging ? "Drop your document here" : "Drop an image or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, WEBP — invoices, receipts, IDs, forms, contracts
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default DropZone;
