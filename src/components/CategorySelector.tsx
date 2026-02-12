// src/components/CategorySelector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LayoutGrid, Check } from "lucide-react";
import styles from "./CategorySelector.module.css";

interface Category {
  id: string;
  label: string;
}

interface CategorySelectorProps {
  categories: Category[];
  defaultValue?: string;
  name: string;
  label?: string;
  placeholder?: string;
  onChange?: (value: string) => void; // ✅ Ajout du callback
}

export default function CategorySelector({ 
  categories, 
  defaultValue, 
  name, 
  label,
  placeholder = "-- Sélectionner une catégorie --",
  onChange
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue || "");
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

  const handleSelect = (id: string) => {
    setSelected(id);
    setIsOpen(false);
    if (onChange) onChange(id); // ✅ On prévient le parent
  };

  const selectedLabel = categories.find(c => c.id === selected)?.label || placeholder;

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          <LayoutGrid size={14} /> {label}
        </label>
      )}

      <div className={styles.customSelect}>
        <div 
          className={`${styles.trigger} ${isOpen ? styles.triggerActive : ""}`} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selected ? styles.value : styles.placeholder}>
            {selectedLabel}
          </span>
          <ChevronDown size={18} className={`${styles.icon} ${isOpen ? styles.iconRotate : ""}`} />
        </div>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownInner}>
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className={`${styles.option} ${selected === cat.id ? styles.optionSelected : ""}`}
                  onClick={() => handleSelect(cat.id)}
                >
                  <span>{cat.label}</span>
                  {selected === cat.id && <Check size={14} className={styles.checkIcon} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <input type="hidden" name={name} value={selected} required />
    </div>
  );
}