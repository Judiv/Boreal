"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Pusher from "pusher-js";
import { 
  Menu, X, LogOut, User, Newspaper, Home, LogIn, 
  ShieldCheck, Wallet, Store, Bell, Images,
  GraduationCap, PartyPopper, Compass, Dumbbell, HelpingHand
} from "lucide-react"; 
import styles from "./Navbar.module.css";
import { logout, getMyNotifications } from "@/app/profile/actions";
import { useLoginModal } from "@/context/LoginModalContext";
import { useBorgia } from "@/context/BorgiaContext";

export default function Navbar({ user }: { user: any }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { openLoginModal } = useLoginModal();
  const { balance, isConnected, openBorgia } = useBorgia();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobileOpen]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Notifications logic
  useEffect(() => {
    if (!user) return;
    getMyNotifications().then(notifs => {
      setUnreadCount(notifs.filter((n: any) => !n.isRead).length);
    });

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`user-${user.id}`);
    channel.bind("new-notification", (data: any) => {
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      pusher.unsubscribe(`user-${user.id}`);
      pusher.disconnect();
    };
  }, [user]);

  const canAccessAdmin = user?.role?.nom === "SUPER_ADMIN" || 
                        user?.permissionsPerso?.some((p: any) => p.code === "view_admin");

  // ✅ Configuration des liens avec propriété 'protected'
  const allLinks = [
    { name: "Accueil", href: "/", icon: <Home size={18} />, protected: false },
    { name: "Boquettes", href: "/boquettes", icon: <Store size={18} />, protected: true },
    { name: "News", href: "/news", icon: <Newspaper size={18} />, protected: true },
    { name: "Galerie", href: "/galerie", icon: <Images size={18} />, protected: true },
    { name: "Ecole", href: "/ecole", icon: <GraduationCap size={18} />, protected: true },
    { name: "Fete", href: "/fete", icon: <PartyPopper size={18} />, protected: true },
    { name: "Evasion", href: "/evasion", icon: <Compass size={18} />, protected: true },
    { name: "Sports", href: "/sports", icon: <Dumbbell size={18} />, protected: true },
    { name: "Entraide", href: "/entraide", icon: <HelpingHand size={18} />, protected: true },
  ];

  // ✅ Filtrage des liens selon l'état de connexion
  const links = allLinks.filter(link => !link.protected || (link.protected && user));

  if (canAccessAdmin) {
    links.push({ name: "Admin", href: "/admin", icon: <ShieldCheck size={18} />, isAdmin: true, protected: true });
  }

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.leftSection}>
            <Link href="/" className={styles.logo}>BOREAL</Link>
            <div className={styles.navLinks}>
              {links.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`${styles.link} ${isActive(link.href) ? styles.activeLink : ""}`}
                  style={link.isAdmin ? { color: "#f87171" } : {}}
                >
                  <span className={styles.iconWrapper}>{link.icon}</span>
                  <span className={styles.linkText}>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.userActions}>
            <div className={styles.desktopOnly}>
              {user ? (
                <>
                  <div className={`${styles.balanceBadge} ${!isConnected ? styles.notConnectedBadge : ""}`} onClick={openBorgia}>
                    <Wallet size={16} className={isConnected ? styles.iconActive : styles.iconWarn} />
                    <span className={styles.balanceText}>{isConnected ? `${Number(balance || 0).toFixed(2)} €` : "Borgia ⚠️"}</span>
                  </div>
                  
                  <Link href="/profile?tab=notifications" className={styles.notifButton}>
                    <div className={styles.notifContainer}>
                      <Bell size={20} className={unreadCount > 0 ? styles.bellIconActive : ""} />
                      {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
                    </div>
                  </Link>
                  
                  <Link href="/profile" className={styles.profileButton}><User size={16} /> Profil</Link>
                  <button onClick={() => logout()} className={styles.logoutButton}><LogOut size={20} /></button>
                </>
              ) : (
                <button onClick={openLoginModal} className={styles.loginButton}><LogIn size={16} /> Connexion</button>
              )}
            </div>

            <button className={styles.mobileToggle} onClick={() => setIsMobileOpen(!isMobileOpen)}>
              {isMobileOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      <div className={`${styles.mobileOverlay} ${isMobileOpen ? styles.overlayVisible : ""}`} onClick={() => setIsMobileOpen(false)} />
      <aside className={`${styles.mobileMenu} ${isMobileOpen ? styles.mobileMenuOpen : ""}`}>
        <p className={styles.sidebarCategory}>Navigation</p>
        <div className={styles.mobileNavLinks}>
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`${styles.link} ${isActive(link.href) ? styles.activeLink : ""}`}
              onClick={() => setIsMobileOpen(false)}
            >
              {link.icon} {link.name}
            </Link>
          ))}
        </div>

        <p className={styles.sidebarCategory}>Mon Compte</p>
        <div className={styles.mobileUserActions}>
          {user ? (
            <>
              <button className={styles.mobileActionBtn} onClick={() => { openBorgia(); setIsMobileOpen(false); }}>
                <Wallet size={18} /> {isConnected ? `Solde : ${Number(balance || 0).toFixed(2)} €` : "Borgia"}
              </button>
              <Link href="/profile" className={styles.mobileActionBtn} onClick={() => setIsMobileOpen(false)}>
                <User size={18} /> Profil
              </Link>
              <button onClick={() => { logout(); setIsMobileOpen(false); }} className={styles.mobileLogoutBtn}>
                <LogOut size={18} /> Déconnexion
              </button>
            </>
          ) : (
            <button onClick={() => { openLoginModal(); setIsMobileOpen(false); }} className={styles.loginButton}>
              <LogIn size={18} /> Se connecter
            </button>
          )}
        </div>
      </aside>
    </>
  );
}