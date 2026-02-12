"use client";

import { useState, useEffect } from "react";
import { searchUsers } from "../actions";
import { X, User, Check, Plus, Search } from "lucide-react";
import styles from "../mail.module.css";

export default function RecipientSearch({ onSelectionChange, initialRecipient = null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);

  // Synchronisation avec l'utilisateur initial (cas de la réponse)
  useEffect(() => {
    if (initialRecipient && selected.length === 0) {
      setSelected([initialRecipient]);
      onSelectionChange([initialRecipient.id]);
    }
  }, [initialRecipient]);

  useEffect(() => {
    if (query.length > 1) {
      searchUsers(query).then(setResults);
    } else {
      setResults([]);
    }
  }, [query]);

  const add = (user) => {
    if (!selected.find(u => u.id === user.id)) {
      const newList = [...selected, user];
      setSelected(newList);
      onSelectionChange(newList.map(u => u.id));
    }
    setQuery("");
    setResults([]);
  };

  const remove = (id) => {
    const newList = selected.filter(u => u.id !== id);
    setSelected(newList);
    onSelectionChange(newList.map(u => u.id));
  };

  return (
    <div className={styles.recipientContainer}>
      <div className={styles.recipientWrapper}>
        <div className={styles.selectedList}>
          {selected.map(u => (
            <span key={u.id} className={styles.recipientBadge}>
              <span className={styles.badgeText}>{u.bucque || u.prenom}</span>
              <button 
                type="button" 
                onClick={() => remove(u.id)} 
                className={styles.badgeRemove}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            placeholder={selected.length === 0 ? "Destinataire (Bucque, Nom...)" : ""}
            className={styles.recipientInput}
            autoComplete="off"
          />
        </div>
      </div>

      {results.length > 0 && (
        <div className={styles.searchDropdown}>
          {results.map(u => (
            <div key={u.id} onClick={() => add(u)} className={styles.searchResultItem}>
              <div className={styles.resultAvatar}>
                {(u.bucque?.[0] || u.prenom?.[0]).toUpperCase()}
              </div>
              <div className={styles.resultMeta}>
                <span className={styles.resultBucque}>{u.bucque}</span>
                <span className={styles.resultName}>{u.prenom} {u.nom}</span>
              </div>
              <Plus size={16} className={styles.resultPlus} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}