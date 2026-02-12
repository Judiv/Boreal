"use client";

import { useState, useRef } from "react";
import { FileText, X, UploadCloud } from "lucide-react";
import styles from "./pdfSelector.module.css";

interface PdfSelectorProps {
  currentPdfUrl?: string | null;
  onFileChange?: (file: File | null) => void;
}

export default function PdfSelector({ currentPdfUrl, onFileChange }: PdfSelectorProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(
    currentPdfUrl ? "Document actuel" : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFileName(file.name);
      onFileChange?.(file);
    } else if (file) {
      alert("Veuillez sélectionner un fichier PDF uniquement.");
      e.target.value = "";
    }
  };

  const clearSelection = () => {
    setSelectedFileName(null);
    onFileChange?.(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>Document PDF (Optionnel)</label>
      
      {!selectedFileName ? (
        <div className={styles.dropzone} onClick={() => fileInputRef.current?.click()}>
          <UploadCloud size={24} />
          <span>Ajouter un PDF</span>
        </div>
      ) : (
        <div className={styles.fileCard}>
          <div className={styles.fileIcon}>
            <FileText size={20} />
          </div>
          <span className={styles.fileName}>{selectedFileName}</span>
          <button type="button" onClick={clearSelection} className={styles.removeBtn}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ✅ L'input est sorti de la condition pour rester dans le DOM quoi qu'il arrive */}
      <input 
        type="file" 
        name="pdf" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        style={{ 
          opacity: 0, 
          position: 'absolute', 
          zIndex: -1, 
          width: '1px', 
          height: '1px',
          pointerEvents: 'none' 
        }} 
      />
    </div>
  );
}