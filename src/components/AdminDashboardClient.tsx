"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, Users, FileText, Hash, Activity, LayoutGrid,
  Terminal, GitMerge, Settings, Trash2, PlusCircle, Tag as TagIcon, X, Search,
  Loader2, CheckCircle, Database
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react"; 
import styles from "@/app/admin/admin.module.css";
import AdminSearch from "./AdminSearch";
import { 
  createTag, 
  deleteTag, 
  addCategoryMapping, 
  deleteCategoryMapping, 
  createCategory, 
  deleteCategory,
  runStorageCleanup // ✅ Import de l'action de nettoyage
} from "@/app/admin/actions";
import CategorySelector from "./CategorySelector";

export default function AdminDashboardClient({ data }: { data: any }) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  // États pour la validation du mapping
  const [mapCat, setMapCat] = useState("");
  const [mapTag, setMapTag] = useState("");

  // ✅ États pour le bot de nettoyage
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  const { 
    logs = [], 
    users = [], 
    stats = {}, 
    allTags = [], 
    categoryMappings = [], 
    categories = [] 
  } = data || {};

  const isActive = (tab: string) => currentTab === tab ? styles.activeLink : "";

  const getLogColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("ERROR") || act.includes("DELETE")) return "text-red-400";
    if (act.includes("LOGIN") || act.includes("CREATE")) return "text-emerald-400";
    return "text-blue-400";
  };

  const handleRunCleanup = async () => {
    if (!confirm("Analyse du serveur : Voulez-vous vraiment supprimer les fichiers orphelins ?")) return;
    
    setIsCleaning(true);
    try {
      const result = await runStorageCleanup();
      setCleanupResult(result);
    } catch (e) {
      alert("Erreur système lors du nettoyage");
    } finally {
      setIsCleaning(false);
    }
  };

  const groupedMappings = categoryMappings.reduce((acc: any, current: any) => {
    if (!acc[current.category]) acc[current.category] = [];
    acc[current.category].push({ id: current.id, tag: current.tag });
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <div className={styles.aurora} />
      
      <aside className={styles.sidebar}>
        <div className="px-6 space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black italic">A</div>
            <span className="text-sm font-black italic uppercase tracking-wider text-white">Admin Panel</span>
          </div>
          <nav>
            <p className={styles.navSectionTitle}>Général</p>
            <Link href="/admin?tab=dashboard" className={`${styles.navLink} ${isActive("dashboard")}`}><LayoutDashboard size={16} /> <span>Dashboard</span></Link>
            <Link href="/admin?tab=users" className={`${styles.navLink} ${isActive("users")}`}><Users size={16} /> <span>Utilisateurs</span></Link>
            <Link href="/admin?tab=logs" className={`${styles.navLink} ${isActive("logs")}`}><FileText size={16} /> <span>Logs</span></Link>
            
            <p className={styles.navSectionTitle}>Gestion</p>
            <Link href="/admin?tab=tags" className={`${styles.navLink} ${isActive("tags")}`}><Hash size={16} /> <span>Tags</span></Link>
            <Link href="/admin?tab=categories" className={`${styles.navLink} ${isActive("categories")}`}><LayoutGrid size={16} /> <span>Catégories</span></Link>
            <Link href="/admin?tab=mappings" className={`${styles.navLink} ${isActive("mappings")}`}><GitMerge size={16} /> <span>Accès</span></Link>
            
            <p className={styles.navSectionTitle}>Système</p>
            <Link href="/admin?tab=maintenance" className={`${styles.navLink} ${isActive("maintenance")}`}><Database size={16} /> <span>Stockage</span></Link>
          </nav>
        </div>
      </aside>

      <main className={styles.main}>
        {/* --- VUE 1 : DASHBOARD --- */}
        {currentTab === "dashboard" && (
          <div className="space-y-8">
            <h1 className="text-3xl font-black text-white uppercase italic">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={styles.serverCard}>
                    <Users size={18} className="text-blue-500"/>
                    <div><h3 className="text-sm font-bold opacity-50 uppercase">Membres</h3><p className="text-2xl font-black">{stats.totalUsers || 0}</p></div>
                </div>
                <div className={styles.serverCard}>
                    <Activity size={18} className="text-emerald-500"/>
                    <div><h3 className="text-sm font-bold opacity-50 uppercase">Events</h3><p className="text-2xl font-black">{stats.totalEvents || 0}</p></div>
                </div>
                <div className={styles.serverCard}>
                    <Terminal size={18} className="text-amber-500"/>
                    <div><h3 className="text-sm font-bold opacity-50 uppercase">Logs</h3><p className="text-2xl font-black">{stats.totalLogs || 0}</p></div>
                </div>
            </div>

            <div className={styles.consoleWindow} style={{ height: '400px' }}>
                <div className={styles.consoleHeader}>
                    <span className="text-xs font-mono font-bold uppercase text-slate-400">Activités Récentes</span>
                    <Link href="/admin?tab=logs" className={styles.seeAllLink}>Voir tout</Link>
                </div>
                <div className={styles.consoleBody}>
                    {logs.slice(0, 15).map((log:any) => (
                        <div key={log.id} className={styles.logRow}>
                            <span className="text-slate-600">[{format(new Date(log.createdAt), "HH:mm")}]</span>
                            <span className={`font-bold ${getLogColor(log.action)}`}>{log.action}</span>
                            <span className="text-slate-400 truncate">{log.details}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* --- VUE MAINTENANCE : CLEANUP BOT --- */}
        {currentTab === "maintenance" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-white uppercase italic">Maintenance Stockage</h1>
            
            <div className={styles.addTagPanel}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">Optimisation du Serveur</h2>
                  <p className="text-slate-400 text-sm">Scan le dossier <code className="text-blue-400">/public/uploads</code> et supprime les fichiers qui ne sont plus référencés dans la base de données.</p>
                </div>
                
                <button 
                  onClick={handleRunCleanup}
                  disabled={isCleaning}
                  className={styles.addButton}
                  style={{ minWidth: '200px', backgroundColor: cleanupResult ? '#059669' : '#dc2626' }}
                >
                  {isCleaning ? (
                    <><Loader2 className="animate-spin" size={18} /> Analyse...</>
                  ) : (
                    <><Trash2 size={18} /> Lancer le Nettoyage</>
                  )}
                </button>
              </div>
            </div>

            {cleanupResult && (
              <div className={styles.consoleWindow} style={{ height: '200px' }}>
                <div className={styles.consoleHeader}>
                   <span className="text-xs font-mono font-bold uppercase text-emerald-400">Cleanup_Report.log</span>
                </div>
                <div className={styles.consoleBody}>
                  <div className="flex items-center gap-3 text-emerald-400 font-mono text-sm">
                    <CheckCircle size={16} />
                    <span>Scan terminé avec succès à {format(new Date(), "HH:mm:ss")}</span>
                  </div>
                  <div className="mt-4 space-y-1 font-mono text-sm text-slate-300">
                    <p className="flex justify-between border-b border-white/5 pb-1">
                      <span>Fichiers orphelins supprimés:</span>
                      <span className="text-white font-bold">{cleanupResult.deletedCount ?? 0}</span>
                    </p>
                    <p className="flex justify-between border-b border-white/5 pb-1">
                      <span>Espace disque récupéré:</span>
                      <span className="text-white font-bold">{cleanupResult.spaceSavedMB ?? "0.00"} Mo</span>
                    </p>
                    
                    {cleanupResult.deletedCount === 0 && (
                      <p className="text-blue-400 text-[11px] mt-2 italic">
                        ℹ️ Aucun fichier orphelin détecté. Votre stockage est déjà optimisé.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VUE 2 : UTILISATEURS --- */}
        {currentTab === "users" && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black text-white uppercase italic">Utilisateurs</h1>
                    <div className={styles.searchWrapper}>
                        <AdminSearch />
                        <Search className={styles.searchIcon} size={18} />
                    </div>
                </div>
                <div className={styles.tableCard}>
                    <table className="w-full text-left">
                        <thead className={styles.tableHeader}>
                            <tr><th>Identité</th><th>Rôle</th><th>Tags</th><th className="text-right">Action</th></tr>
                        </thead>
                        <tbody className="text-sm">
                            {users.map((user:any) => (
                                <tr key={user.id} className={styles.tableRow}>
                                    <td><div className="flex items-center gap-3"><div className={styles.avatarBox}>{user.prenom?.[0]}{user.nom?.[0]}</div><p className="font-bold">{user.prenom} {user.nom}</p></div></td>
                                    <td><span className={styles.roleBadge}>{user.role?.nom || "USER"}</span></td>
                                    <td><div className="flex gap-1">{user.tags?.slice(0,2).map((t:any) => <span key={t.id} className={styles.tagBadge}>#{t.nom}</span>)}</div></td>
                                    <td className="text-right"><Link href={`/admin/users/${user.id}`} className={styles.manageButton}><Settings size={14}/> Gérer</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- VUE 3 : LOGS --- */}
        {currentTab === "logs" && (
            <div className="space-y-6">
                <h1 className="text-3xl font-black text-white uppercase italic">Logs Système</h1>
                <div className={styles.consoleWindow} style={{ height: 'calc(100vh - 250px)' }}>
                    <div className={styles.consoleHeader}>
                        <span className="text-xs font-mono font-bold uppercase text-slate-400">System.log</span>
                    </div>
                    <div className={styles.consoleBody}>
                        {logs.map((log:any) => (
                            <div key={log.id} className={styles.logRow}>
                                <span className="text-slate-600 shrink-0">[{format(new Date(log.createdAt), "dd/MM HH:mm:ss")}]</span>
                                <span className={`font-bold ${getLogColor(log.action)}`}>{log.action}</span>
                                <span className="text-slate-500">@{log.user?.prenom || "SYS"}:</span>
                                <span className="text-slate-300">{log.details}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- VUE 4 : TAGS --- */}
        {currentTab === "tags" && (
            <div className="space-y-8">
                <h1 className="text-3xl font-black text-white uppercase italic">Gestion Tags</h1>
                <div className={styles.addTagPanel}>
                    <form action={createTag} className={styles.addInputWrapper}>
                        <div className={styles.selectField}>
                            <label className={styles.selectLabel}>Libellé</label>
                            <input name="nom" placeholder="Nouveau tag..." className={styles.addInput} required />
                        </div>
                        <button type="submit" className={styles.addButton}><PlusCircle size={18}/> Créer</button>
                    </form>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {allTags.map((tag:any) => (
                        <div key={tag.id} className={styles.rubriqueCard}>
                            <span className={styles.tagName}><span className={styles.hashSymbol}>#</span>{tag.nom}</span>
                            <form action={deleteTag.bind(null, tag.id)}><button type="submit" className={styles.deleteBtn}><Trash2 size={14}/></button></form>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- VUE 5 : CATÉGORIES --- */}
        {currentTab === "categories" && (
            <div className="space-y-8 animate-in fade-in duration-500">
                <h1 className="text-3xl font-black text-white uppercase italic">Rayons / Catégories</h1>
                <div className={styles.addTagPanel}>
                    <form action={createCategory} className={styles.addInputWrapper}>
                        <div className={styles.selectField}>
                            <label className={styles.selectLabel}>Code unique</label>
                            <input name="code" placeholder="EX: SPORT" className={styles.addInput} required />
                        </div>
                        <div className={styles.selectField}>
                            <label className={styles.selectLabel}>Libellé complet</label>
                            <input name="label" placeholder="🏆 Sport / Compétition" className={styles.addInput} required />
                        </div>
                        <button type="submit" className={styles.addButton}><PlusCircle size={18}/> Créer</button>
                    </form>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {categories.map((cat: any) => (
                        <div key={cat.id} className={styles.rubriqueCard}>
                            <div>
                                <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{cat.code}</div>
                                <div className="text-white font-bold">{cat.label}</div>
                            </div>
                            <form action={async () => {
                                if(confirm(`Supprimer "${cat.label}" ?`)) await deleteCategory(cat.id);
                            }}>
                                <button type="submit" className={styles.deleteBtn}><Trash2 size={16}/></button>
                            </form>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- VUE 6 : MAPPINGS --- */}
        {currentTab === "mappings" && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-white uppercase italic">Accès Catégories</h1>
            <div className={styles.addTagPanel}>
              <form 
                action={async (fd) => {
                  const c = fd.get("category");
                  const t = fd.get("tag");
                  if (c && t) await addCategoryMapping(c as string, t as string);
                }} 
                className={styles.addInputWrapper}
              >
                <div className={styles.selectField}>
                  <label className={styles.selectLabel}>Rayon</label>
                  <CategorySelector 
                    name="category" 
                    categories={categories.map((c: any) => ({ id: c.code, label: c.label }))} 
                    placeholder="Choisir rayon..."
                    onChange={(val) => setMapCat(val)}
                  />
                </div>
                <div className={styles.selectField}>
                  <label className={styles.selectLabel}>Tag Responsable</label>
                  <CategorySelector 
                    name="tag" 
                    categories={allTags.map((t: any) => ({ id: t.nom, label: t.nom }))} 
                    placeholder="Choisir tag..."
                    onChange={(val) => setMapTag(val)}
                  />
                </div>
                <button 
                  type="submit" 
                  className={styles.addButton} 
                  disabled={!mapCat || !mapTag}
                  style={{ opacity: (!mapCat || !mapTag) ? 0.4 : 1, cursor: (!mapCat || !mapTag) ? 'not-allowed' : 'pointer' }}
                >
                  <PlusCircle size={18} /> Associer
                </button>
              </form>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(groupedMappings).map(([category, tags]: any) => {
                const catLabel = categories.find((c:any) => c.code === category)?.label || category;
                return (
                  <div key={category} className={styles.groupedMappingCard}>
                    <div className={styles.mappingHeader}>
                      <div className={styles.mappingCatLabel}>{catLabel}</div>
                      <span className={styles.tagCount}>{tags.length} tag(s)</span>
                    </div>
                    <div className={styles.tagCloud}>
                      {tags.map((t: any) => (
                        <div key={t.id} className={styles.mappingTagPill}>
                          <span>#{t.tag}</span>
                          <button onClick={() => deleteCategoryMapping(t.id)} className={styles.pillDeleteBtn}><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}