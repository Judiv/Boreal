"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, CheckCircle2, Loader2 } from "lucide-react";
import styles from "./MediaSelector.module.css";

export default function MediaSelector({ defaultValue, onChange }: { defaultValue?: string, onChange?: (url: string) => void }) {
  const [previewUrl, setPreviewUrl] = useState(defaultValue || "");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setProgress(0);

    // Déterminer le type pour l'URL Cloudinary
    const resourceType = file.type.startsWith("video/") ? "video" : "image";
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "boreal_upload"); // Ton preset bien configuré

    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        setPreviewUrl(data.secure_url);
        if (onChange) onChange(data.secure_url);
        console.log("Succès Cloudinary:", data.secure_url);
      } else {
        const error = JSON.parse(xhr.responseText);
        console.error("Erreur détaillée:", error);
        alert(`Cloudinary Error ${xhr.status}: ${error.error?.message}`);
        setIsUploading(false);
      }
    };

    xhr.onerror = () => {
      console.error("Erreur Réseau / CORS détectée");
      alert("Erreur Réseau. Vérifiez que votre vidéo ne dépasse pas les limites de votre plan Cloudinary Gratuit (souvent 100Mo max par fichier).");
      setIsUploading(false);
    };

    // ✅ On précise le resourceType (image ou video) dans l'URL pour éviter les erreurs CORS de détection
    xhr.open("POST", `https://api.cloudinary.com/v1_1/dvdjcmdni/${resourceType}/upload`, true);
    
    // Crucial : Ne pas mettre de Headers manuels (Content-Type), le navigateur le fait avec le FormData
    xhr.send(formData);
  };

  return (
    <div className={styles.mediaSelectorWrapper}>
       <label className={styles.label}>MÉDIA DE FOND (FICHIER OU URL)</label>
      <div 
        className={`${styles.inputContainer} ${isUploading ? styles.disabled : ""}`} 
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <UploadCloud size={20} className={isUploading ? "animate-bounce text-purple-500" : "text-purple-500"} />
        <div className="flex flex-col flex-1">
          <span className="text-sm font-bold text-white">
            {isUploading ? `Upload direct : ${progress}%` : "Cliquer pour changer le média"}
          </span>
          {isUploading && (
            <div className={styles.progressBarBg}>
              <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/*"
          onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} 
        />
      </div>

      {previewUrl && !isUploading && (
        <div className={styles.successWrapper}>
          <div className={styles.successBadge}>
            <CheckCircle2 size={14} /> Média prêt
          </div>
          <button type="button" className={styles.clearBtn} onClick={() => setPreviewUrl("")}>
            Supprimer
          </button>
        </div>
      )}
      
      <input type="hidden" name="trailerUrl" value={previewUrl} />
    </div>
  );
}