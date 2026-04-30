"use client";

import * as React from "react";
import { Upload, X, FileIcon, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilePickerProps {
  name: string;
  maxFiles?: number;
  accept?: string;
}

export function FilePicker({ name, maxFiles = 5, accept = "image/*" }: FilePickerProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    setError(null);
    const incoming = Array.from(newFiles);
    
    // Simple client-side validation
    const validFiles = incoming.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} es demasiado grande (máx 5MB)`);
        return false;
      }
      return true;
    });

    setFiles((prev) => {
      const combined = [...prev, ...validFiles];
      if (combined.length > maxFiles) {
        setError(`Solo puedes subir hasta ${maxFiles} archivos`);
      }
      return combined.slice(0, maxFiles);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Synchronize files with a hidden input for form submission
  // Note: Programmatically setting input.files requires DataTransfer
  React.useEffect(() => {
    if (inputRef.current) {
      const dataTransfer = new DataTransfer();
      files.forEach((file) => dataTransfer.items.add(file));
      inputRef.current.files = dataTransfer.files;
    }
  }, [files]);

  return (
    <div className="grid gap-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 py-8 transition-colors hover:bg-muted",
          isDragging && "border-primary bg-primary/5",
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
          </div>
          <p className="text-xs text-muted-foreground">
            Imágenes (PNG, JPG, WEBP, GIF) hasta 5MB (máx {maxFiles})
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          name={name}
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}

      {files.length > 0 && (
        <ul className="grid gap-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-md border bg-card p-2 text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Eliminar</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
