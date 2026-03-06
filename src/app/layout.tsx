import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUserSession } from "@/lib/auth";
import { LoginModalProvider } from "@/context/LoginModalContext";
import { BorgiaProvider } from "@/context/BorgiaContext";
import NotificationObserver from "@/components/NotificationObserver";
import ChatBot from "@/components/ChatBot/ChatBot"; 
import AuthContext from "@/context/AuthContext"; 

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
  // Récupération de la session complète côté serveur
  const session = await getUserSession().catch(() => null);

  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthContext session={session}> 
          <NotificationObserver />
          <LoginModalProvider>
            <BorgiaProvider user={session?.user || null}> 
              <Navbar user={session?.user || null} />
              
              <main style={{ minHeight: "calc(100vh - 70px)", paddingTop: "70px" }}>
                  {children}
              </main>
              
              <footer style={{ position: 'relative', zIndex: 1000, background: '#050507' }}>
                <Footer />
              </footer>

              <ChatBot />
            </BorgiaProvider>
          </LoginModalProvider>
        </AuthContext>
      </body>
    </html>
  );
}