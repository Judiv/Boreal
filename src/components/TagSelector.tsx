"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Tag, Check } from "lucide-react";
import styles from "./TagSelector.module.css";

interface TagSelectorProps {
  tags: string[];
  defaultValue?: string;
  name: string;
  label?: string;
}

export default function TagSelector({ tags, defaultValue, name, label }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue || "");
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer la liste si on clique ailleurs sur la page
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (tag: string) => {
    setSelected(tag);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          <Tag size={14} /> {label}
        </label>
      )}

      <div className={styles.customSelect}>
        {/* L'élément visible qui déclenche l'ouverture */}
        <div 
          className={`${styles.trigger} ${isOpen ? styles.triggerActive : ""}`} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selected ? styles.value : styles.placeholder}>
            {selected || "-- Choisir un tag de gestion --"}
          </span>
          <ChevronDown size={18} className={`${styles.icon} ${isOpen ? styles.iconRotate : ""}`} />
        </div>

        {/* La liste déroulante personnalisée */}
        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownInner}>
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <div 
                    key={tag} 
                    className={`${styles.option} ${selected === tag ? styles.optionSelected : ""}`}
                    onClick={() => handleSelect(tag)}
                  >
                    <span>{tag}</span>
                    {selected === tag && <Check size={14} className={styles.checkIcon} />}
                  </div>
                ))
              ) : (
                <div className={styles.noOption}>Aucun tag disponible</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input caché pour le FormData des Server Actions */}
      <input type="hidden" name={name} value={selected} required />
    </div>
  );
}