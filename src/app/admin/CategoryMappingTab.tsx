"use client";

import { useState } from "react";
import { CATEGORY_LABELS } from "@/lib/categories";
import { addCategoryMapping, deleteCategoryMapping } from "./actions";
import { Tag, Trash2, Plus, LayoutGrid } from "lucide-react";
import styles from "./admin.module.css";

export default function CategoryMappingTab({ mappings, allTags }: any) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.header}>
        <h2 className="text-xl font-bold">Gestion des Accès Catégories</h2>
        <p className="text-slate-400 text-sm">Associez un tag à une catégorie pour autoriser la publication.</p>
      </div>

      {/* FORMULAIRE D'AJOUT */}
      <form action={async (fd) => {
        await addCategoryMapping(fd.get("cat") as string, fd.get("tag") as string);
      }} className="flex gap-4 p-6 bg-white/5 rounded-2xl mb-8 border border-white/10">
        <div className="flex-1">
          <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Catégorie</label>
          <select name="cat" className={styles.select}>
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Tag Requis</label>
          <select name="tag" className={styles.select}>
            {allTags.map((t: any) => <option key={t.id} value={t.nom}>{t.nom}</option>)}
          </select>
        </div>
        <button type="submit" className={styles.addBtn}>
          <Plus size={18} /> Associer
        </button>
      </form>

      {/* LISTE DES MAPPINGS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mappings.map((m: any) => (
          <div key={m.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
            <div>
              <div className="text-blue-400 font-bold text-sm">{CATEGORY_LABELS[m.category] || m.category}</div>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                <Tag size={10} /> {m.tag}
              </div>
            </div>
            <button onClick={() => deleteCategoryMapping(m.id)} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}