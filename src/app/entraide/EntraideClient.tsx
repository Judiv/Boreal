"use client";

import { useState } from "react";
import { 
  Package, Car, Search, Plus, Trash2, ArrowRight, 
  User, Clock, MapPin, X, Pencil, CheckCircle, AlertCircle, Loader2
} from "lucide-react";
import styles from "./entraide.module.css";
import { 
  toggleLoan, addLoanObject, addRide, deleteObject, deleteRide, 
  updateLoanObject, updateRide, requestLoan, registerRide, unregisterRide 
} from "./actions";

export default function EntraideClient({ objects, rides, currentUserId }: any) {
  const [tab, setTab] = useState<"objets" | "rides">("objets");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false); // ✅ Empêche le spam de clics

  const filteredObjects = objects.filter((o: any) => o.nom.toLowerCase().includes(search.toLowerCase()));
  const filteredRides = rides.filter((r: any) => 
    r.destination.toLowerCase().includes(search.toLowerCase()) || r.depart.toLowerCase().includes(search.toLowerCase())
  );

  // Fonction pour gérer les actions asynchrones proprement
  const handleAction = async (actionFn: () => Promise<any>) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await actionFn();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glowBg} />

      <header className={styles.header}>
        <div className={styles.topNav}>
           <span className={styles.label}>Services Gadz</span>
           <div className={styles.dot} />
           <span className={styles.label}>Entraide</span>
        </div>
        <h1 className={styles.mainTitle}>COUP DE MAIN<span>.</span></h1>
        
        <div className={styles.tabWrapper}>
          <button onClick={() => setTab("objets")} className={tab === "objets" ? styles.activeTab : ""}>
            <Package size={18} /> Objets
          </button>
          <button onClick={() => setTab("rides")} className={tab === "rides" ? styles.activeTab : ""}>
            <Car size={18} /> Trajets
          </button>
        </div>
      </header>

      <div className={styles.actionRow}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input 
            placeholder={`Rechercher ${tab === "objets" ? "un outil..." : "une ville..."}`} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Proposer
        </button>
      </div>

      <div className={styles.contentSection}>
        {tab === "objets" ? (
          <div className={styles.objectGrid}>
            {filteredObjects.map((obj: any) => {
              const isOwner = String(currentUserId) === String(obj.ownerId);
              return (
                <div key={obj.id} className={styles.objectCard}>
                  <div className={styles.objHeader}>
                    <div className={styles.objIcon}><Package size={20} /></div>
                    {isOwner && (
                      <div className={styles.adminTools}>
                        <button onClick={() => setEditItem(obj)}><Pencil size={14} /></button>
                        <button onClick={() => confirm("Supprimer cet objet ?") && handleAction(() => deleteObject(obj.id))}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3>{obj.nom}</h3>
                  <p className={styles.description}>{obj.description}</p>
                  
                  <div className={styles.locationBadge}><MapPin size={12} /> {obj.lieu}</div>
                  
                  <div className={styles.stockStatus}>
                    <div className={styles.stockLabels}>
                      <span>{obj.disponible > 0 ? "Disponible" : "Non disponible"}</span>
                      <span>{obj.disponible}/{obj.quantite}</span>
                    </div>
                    <div className={styles.track}>
                      <div className={styles.fill} style={{ width: `${(obj.disponible/obj.quantite)*100}%` }} />
                    </div>
                  </div>

                  {isOwner ? (
                    <div className={styles.ownerActions}>
                      <button onClick={() => handleAction(() => toggleLoan(obj.id, false))} disabled={obj.disponible <= 0 || isProcessing}>Préter</button>
                      <button onClick={() => handleAction(() => toggleLoan(obj.id, true))} disabled={obj.disponible >= obj.quantite || isProcessing}>Rendu</button>
                    </div>
                  ) : (
                    <button 
                      className={styles.requestBtn} 
                      onClick={() => handleAction(async () => {
                        await requestLoan(obj.id);
                        alert("Demande envoyée au prêteur !");
                      })}
                      disabled={obj.disponible === 0 || isProcessing}
                    >
                      {isProcessing ? <Loader2 className={styles.spin} size={16} /> : <CheckCircle size={16} />}
                      Demander le prêt
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.rideList}>
            {filteredRides.map((ride: any) => {
              const isOwner = String(currentUserId) === String(ride.conducteurId);
              const isRegistered = ride.registrations?.some((reg: any) => String(reg.passengerId) === String(currentUserId));
              const placesRestantes = ride.places - (ride.registrations?.length || 0);

              return (
                <div key={ride.id} className={styles.rideCard}>
                  <div className={styles.rideInfo}>
                    <div className={styles.ridePath}>
                      <div className={styles.city}>{ride.depart}</div>
                      <ArrowRight size={18} className={styles.arrowAnim} />
                      <div className={styles.city}>{ride.destination}</div>
                    </div>
                    <div className={styles.rideTime}>
                      <Clock size={14} /> {
                        new Date(ride.dateHeure).toLocaleString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          timeZone: 'UTC'
                        })
                      }
                    </div>
                  </div>
                  
                  <div className={styles.rideRight}>
                    <div className={styles.placesStatus}>
                       {placesRestantes > 0 ? (
                         <span className={styles.placesLeft}>{placesRestantes} places libres</span>
                       ) : (
                         <span className={styles.fullBadge}>Complet</span>
                       )}
                    </div>
                    
                    <div className={styles.rideActionsRow}>
                      <div className={styles.driverTag}>
                        <span>{ride.conducteurName}</span>
                      </div>

                      {isOwner ? (
                        <div className={styles.adminToolsRow}>
                           <button onClick={() => setEditItem(ride)} className={styles.editBtn}><Pencil size={14} /></button>
                           <button onClick={() => confirm("Supprimer ce trajet ?") && handleAction(() => deleteRide(ride.id))} className={styles.deleteBtn}><Trash2 size={14} /></button>
                        </div>
                      ) : (
                        <button 
                          className={isRegistered ? styles.unregBtn : styles.regBtn}
                          onClick={() => handleAction(() => isRegistered ? unregisterRide(ride.id) : registerRide(ride.id))}
                          disabled={isProcessing || (!isRegistered && placesRestantes <= 0)}
                        >
                          {isProcessing ? <Loader2 className={styles.spin} size={16} /> : (isRegistered ? "Se désister" : "S'inscrire")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL AJOUT / ÉDITION (Pas de changement ici, mais isProcessing peut être ajouté au submit) */}
      {(showAddModal || editItem) && (
        <div className={styles.modalOverlay} onClick={() => { if(!isProcessing){setShowAddModal(false); setEditItem(null);}}}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editItem ? "Modifier" : "Proposer"} {tab === "objets" ? "un objet" : "un trajet"}</h2>
              <button onClick={() => { setShowAddModal(false); setEditItem(null); }} className={styles.closeBtn}><X /></button>
            </div>

            <form action={async (fd) => {
              handleAction(async () => {
                if (editItem) {
                  tab === "objets" ? await updateLoanObject(editItem.id, fd) : await updateRide(editItem.id, fd);
                } else {
                  tab === "objets" ? await addLoanObject(fd) : await addRide(fd);
                }
                setShowAddModal(false); setEditItem(null);
              });
            }}>
              {tab === "objets" ? (
                <>
                  <input name="nom" placeholder="Nom de l'objet" defaultValue={editItem?.nom} required />
                  <input name="lieu" placeholder="Lieu de retrait" defaultValue={editItem?.lieu} required />
                  <textarea name="description" placeholder="Infos complémentaires..." defaultValue={editItem?.description} />
                  <div className={styles.inputFlex}>
                    <label>Quantité totale :</label>
                    <input name="quantite" type="number" defaultValue={editItem?.quantite || 1} min="1" />
                  </div>
                </>
              ) : (
                <>
                  <input name="depart" placeholder="Ville de départ" defaultValue={editItem?.depart} required />
                  <input name="destination" placeholder="Destination" defaultValue={editItem?.destination} required />
                  <input name="dateHeure" type="datetime-local" defaultValue={editItem ? new Date(editItem.dateHeure).toISOString().slice(0, 16) : ""} required />
                  <input name="places" type="number" placeholder="Nombre de places total" defaultValue={editItem?.places} required />
                </>
              )}
              <button type="submit" className={styles.submitBtn} disabled={isProcessing}>
                {isProcessing ? "Envoi..." : (editItem ? "Enregistrer les modifications" : "Publier l'annonce")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}