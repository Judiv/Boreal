// src/app/boquettes/AddBoquetteButton.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import EditBoquetteModal from "./EditBoquetteModal";
import styles from "./boquettes.module.css";

// ✅ Mise à jour des types de props
interface TagOption {
  id: string;
  label: string;
}

export default function AddBoquetteButton({ 
  availableTags, 
  isSuperAdmin 
}: { 
  availableTags: TagOption[], 
  isSuperAdmin: boolean 
}) {
  const [showModal, setShowModal] = useState(false);

  // Initialisation d'une boquette vide pour la création
  const emptyBoquette = {
    nom: "",
    lieu: "",
    description: "",
    imageUrl: "",
    requiredTag: ""
  };

  return (
    <>
      <button className={styles.addBtn} onClick={() => setShowModal(true)}>
        <Plus size={20} />
        <span>Ajouter une Boquette</span>
      </button>

      {showModal && (
        <EditBoquetteModal 
          boquette={emptyBoquette}
          availableTags={availableTags} // ✅ On passe les tags formatés {id, label}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setShowModal(false)}
          isCreation={true} 
        />
      )}
    </>
  );
}