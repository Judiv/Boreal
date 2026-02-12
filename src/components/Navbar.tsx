"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Pusher from "pusher-js";
import { 
  Menu, X, LogOut, User, Newspaper, Home, LogIn, 
  ShieldCheck, Wallet, Store, Bell, Images,
  GraduationCap, PartyPopper, Compass, Dumbbell, HelpingHand,
  RefreshCw 
} from "lucide-react"; 
import styles from "./Navbar.module.css";
import { logout, getMyNotifications } from "@/app/profile/actions";
import { NOTIFICATION_CONFIG } from "@/app/profile/config";
import { useLoginModal } from "@/context/LoginModalContext";
import { useBorgia } from "@/context/BorgiaContext";
import { refreshBorgiaBalance } from "@/actions/borgia";

export default function Navbar({ user }: { user: any }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false); // ✅ État pour l'animation de refresh
  const pathname = usePathname();
  const { openLoginModal } = useLoginModal();
  const { balance, isConnected, openBorgia } = useBorgia();
  const sounds = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    Object.keys(NOTIFICATION_CONFIG).forEach((key) => {
      const config = NOTIFICATION_CONFIG[key as keyof typeof NOTIFICATION_CONFIG];
      const audio = new Audio(config.sound);
      audio.preload = "auto";
      sounds.current[key] = audio;
    });
  }, []);

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
      const type = data.type as keyof typeof NOTIFICATION_CONFIG;
      const audio = sounds.current[type] || sounds.current["INFO"];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      pusher.unsubscribe(`user-${user.id}`);
      pusher.disconnect();
    };
  }, [user]);

  const canAccessAdmin = 
    user?.role?.nom === "SUPER_ADMIN" || 
    user?.permissionsPerso?.some((p: any) => p.code === "view_admin") ||
    user?.role?.permissions?.some((p: any) => p.code === "view_admin");

  const links = [
    { name: "Accueil", href: "/", icon: <Home size={18} /> },
    { name: "Boquettes", href: "/boquettes", icon: <Store size={18} /> },
    { name: "News", href: "/news", icon: <Newspaper size={18} /> },
    { name: "Galerie", href: "/galerie", icon: <Images size={18} /> },
    { name: "Ecole", href: "/ecole", icon: <GraduationCap size={18} /> },
    { name: "Fete", href: "/fete", icon: <PartyPopper size={18} /> },
    { name: "Evasion", href: "/evasion", icon: <Compass size={18} /> },
    { name: "Sports", href: "/sports", icon: <Dumbbell size={18} /> },
    { name: "Entraide", href: "/entraide", icon: <HelpingHand size={18} /> },
  ];

  if (canAccessAdmin) {
    links.push({ name: "Admin", href: "/admin", icon: <ShieldCheck size={18} />, isAdmin: true });
  }

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.leftSection}>
            <Link href="/" className={styles.logo}>BOREAL</Link>
            <div className={styles.navLinks}>
              {links.map((link: any) => (
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
            {user ? (
              <>
                {/* ✅ Widget Borgia Amélioré */}
                <div 
                  className={`${styles.balanceBadge} ${!isConnected ? styles.notConnectedBadge : ""}`} 
                  onClick={() => openBorgia()}
                  title={isConnected ? "Solde Borgia synchronisé" : "Cliquez pour vous connecter à Borgia"}
                >
                    <Wallet size={16} className={isConnected ? styles.iconActive : styles.iconWarn} />
                    <span className={styles.balanceText}>
                      {isConnected ? `${Number(balance || 0).toFixed(2)} €` : "Borgia ⚠️"}
                    </span>
                </div>

                <Link href="/profile?tab=notifications" className={styles.notifButton}>
                  <div className="relative">
                    <Bell size={20} className={unreadCount > 0 ? styles.bellActive : ""} />
                    {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
                  </div>
                </Link>

                <Link href="/profile" className={styles.profileButton}>
                  <User size={16} /> 
                  <span className="hidden xl:inline">Mon Profil</span>
                </Link>
                <button onClick={() => logout()} className={styles.logoutButton}><LogOut size={20} /></button>
              </>
            ) : (
              <button onClick={() => openLoginModal()} className={styles.loginButton}>
                <LogIn size={16} /> <span>Se connecter</span>
              </button>
            )}
            
            <button className={styles.mobileToggle} onClick={() => setIsMobileOpen(!isMobileOpen)}>
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MENU MOBILE */}
      <div className={`${styles.mobileMenu} ${isMobileOpen ? styles.mobileMenuOpen : ""}`}>
        {links.map((link: any) => (
           <Link key={link.href} href={link.href} className={styles.link} onClick={() => setIsMobileOpen(false)} style={link.isAdmin ? { color: "#f87171" } : {}}>
             {link.icon} {link.name}
           </Link>
        ))}
        {user && (
          <div className={styles.mobileUserStats}>
             <button className={styles.mobileBorgiaBtn} onClick={() => { setIsMobileOpen(false); openBorgia(); }}>
                <Wallet size={18} /> {isConnected ? `Solde : ${Number(balance || 0).toFixed(2)} €` : "Se connecter à Borgia"}
             </button>
          </div>
        )}
      </div>
    </>
  );
}