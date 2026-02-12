import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getUser } from "@/lib/auth";
import { LoginModalProvider } from "@/context/LoginModalContext";
import { BorgiaProvider } from "@/context/BorgiaContext";
import NotificationObserver from "@/components/NotificationObserver";
import ChatBot from "@/components/ChatBot/ChatBot"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Boreal",
  description: "Application de vie étudiante",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    android: '/android-chrome-192x192.png',
    androidMaskable: '/android-chrome-512x512.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // On récupère l'utilisateur. Si ça échoue ou si pas de cookie, user = null.
  const user = await getUser().catch(() => null);

  return (
    <html lang="fr">
      <body className={inter.className}>
        <NotificationObserver />
        <LoginModalProvider>
          <BorgiaProvider user={user}> 
            <Navbar user={user} />
            <div style={{ paddingTop: "70px" }}>
                {children}
            </div>
            <ChatBot />
          </BorgiaProvider>
        </LoginModalProvider>

        {/* 🛡️ PROTECTION CLIENT SIMPLE
            On injecte ce script uniquement si l'utilisateur n'est pas authentifié côté serveur.
            Le JS vérifie l'URL du navigateur pour éviter de boucler sur /login.
        */}
        {!user && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const p = window.location.pathname;
                  const publicRoutes = ['/login', '/registration', '/reset-password'];
                  const isPublic = publicRoutes.some(route => p.startsWith(route));
                  
                  // Si on n'est pas sur une route publique et qu'on n'est pas connecté
                  if (!isPublic) {
                    window.location.replace('/login');
                  }
                })();
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}