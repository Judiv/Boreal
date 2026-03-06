"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Tag, Check, X } from "lucide-react";
import styles from "./TagSelector.module.css";

interface TagSelectorProps {
  tags: string[];
  defaultValue?: string | string[];
  name: string;
  label?: string;
  multiple?: boolean; // Nouvelle option
  placeholder?: string;
}

export default function TagSelector({ 
  tags, 
  defaultValue, 
  name, 
  label, 
  multiple = false,
  placeholder 
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialisation de l'état selon le mode
  const [selected, setSelected] = useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const containerRef = useRef<HTMLDivElement>(null);

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
    if (multiple) {
      if (selected.includes(tag)) {
        setSelected(selected.filter((t) => t !== tag));
      } else {
        setSelected([...selected, tag]);
      }
      // On ne ferme pas le dropdown en mode multiple pour faciliter la saisie
    } else {
      setSelected([tag]);
      setIsOpen(false);
    }
  };

  const removeTag = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    setSelected(selected.filter((t) => t !== tag));
  };

  // Valeur à envoyer au formulaire
  const hiddenValue = multiple ? JSON.stringify(selected) : (selected[0] || "");

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          <Tag size={14} /> {label}
        </label>
      )}

      <div className={styles.customSelect}>
        <div 
          className={`${styles.trigger} ${isOpen ? styles.triggerActive : ""}`} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className={styles.valueWrapper}>
            {selected.length > 0 ? (
              multiple ? (
                <div className={styles.tagBadgeContainer}>
                  {selected.map(tag => (
                    <span key={tag} className={styles.tagBadge}>
                      {tag}
                      <X size={12} onClick={(e) => removeTag(e, tag)} className={styles.removeIcon} />
                    </span>
                  ))}
                </div>
              ) : (
                <span className={styles.value}>{selected[0]}</span>
              )
            ) : (
              <span className={styles.placeholder}>
                {placeholder || (multiple ? "Sélectionner des tags..." : "-- Choisir un tag --")}
              </span>
            )}
          </div>
          <ChevronDown size={18} className={`${styles.icon} ${isOpen ? styles.iconRotate : ""}`} />
        </div>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownInner}>
              {tags.length > 0 ? (
                tags.map((tag) => {
                  const isSelected = selected.includes(tag);
                  return (
                    <div 
                      key={tag} 
                      className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`}
                      onClick={() => handleSelect(tag)}
                    >
                      <span>{tag}</span>
                      {isSelected && <Check size={14} className={styles.checkIcon} />}
                    </div>
                  );
                })
              ) : (
                <div className={styles.noOption}>Aucun tag disponible</div>
              )}
            </div>
          </div>
        )}
      </div>

      <input type="hidden" name={name} value={hiddenValue} />
    </div>
  );
}