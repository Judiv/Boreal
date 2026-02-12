"use client";

import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";
import styles from "./ImageSelector.module.css";

interface ImageSelectorProps {
  // ✅ On ajoute le "?" pour rendre la fonction optionnelle 
  // Cela évite l'erreur "Event handlers cannot be passed to Client Component props"
  onFilesSelected?: (files: File[]) => void;
  multiple?: boolean;
  defaultValue?: string; // ✅ Pour afficher l'image existante en mode Edit
}

export default function ImageSelector({ onFilesSelected, multiple = false, defaultValue }: ImageSelectorProps) {
  // On initialise avec la valeur par défaut si elle existe
  const [previews, setPreviews] = useState<string[]>(defaultValue ? [defaultValue] : []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const selectedFiles = multiple ? files : [files[0]];
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    
    if (multiple) {
        setPreviews(prev => [...prev, ...newPreviews]);
        // ✅ Utilisation de l'optional chaining ?.
        onFilesSelected?.(selectedFiles);
    } else {
        setPreviews(newPreviews);
        onFilesSelected?.(selectedFiles);
    }
  };

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    // Reset de l'input pour pouvoir reprendre la même image si besoin
    if (fileInputRef.current) fileInputRef.current.value = "";
    onFilesSelected?.([]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {previews.map((src, index) => (
          <div key={index} className={styles.previewCard}>
            <img src={src} alt="Preview" />
            <button type="button" onClick={() => removeImage(index)} className={styles.removeBtn}>
              <X size={14} />
            </button>
          </div>
        ))}
        
        {(multiple || previews.length === 0) && (
            <button 
              type="button" 
              className={styles.addPlaceholder} 
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus size={24} />
              <span>{multiple ? "Ajouter" : "Choisir"}</span>
            </button>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple={multiple}
        name="imageFile" // ✅ Crucial : permet à l'Action Server de récupérer "imageFile"
        className="hidden"
      />
    </div>
  );
}