import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth"; // Importation de ta fonction de session Boreal

export async function GET() {
  // 1. Récupérer l'utilisateur Boreal actuel
  const borealUser = await getUser();
  
  if (!borealUser) {
    return NextResponse.json({ error: "Session Boreal expirée" }, { status: 401 });
  }

  const cookieStore = await cookies();
  
  // 2. Chercher le cookie spécifique à cet utilisateur (ex: borgia_session_123)
  const session = cookieStore.get(`borgia_session_${borealUser.id}`);

  if (!session) {
    // Si pas de cookie, on renvoie un état non connecté au lieu d'une erreur 401
    // Cela permet au Provider de savoir qu'il faut proposer la connexion
    return NextResponse.json({ isConnected: false, balance: 0 });
  }

  try {
    // 3. Appel à Sibers avec les cookies de session de l'utilisateur
    const res = await fetch("https://sibers.borgia-app.com/", {
      headers: { 
        "Cookie": session.value,
        "User-Agent": "Boreal-App-Gadz",
        "Cache-Control": "no-cache" 
      },
      next: { revalidate: 0 } 
    });

    if (!res.ok) {
      // Si Sibers répond mal (cookie expiré sur Sibers), on considère l'utilisateur déconnecté
      return NextResponse.json({ isConnected: false, balance: 0 });
    }

    const html = await res.text();

    // 4. Extraction du solde
    const balanceMatch = html.match(/(-?\d+[\.,]\d{2})\s*(?:€|&euro;)/i);
    
    if (!balanceMatch) {
      return NextResponse.json({ 
        isConnected: true, 
        balance: 0, 
        warning: "Solde introuvable dans le HTML" 
      });
    }

    const balance = parseFloat(balanceMatch[1].replace(',', '.'));

    return NextResponse.json({ 
      isConnected: true, 
      balance 
    });

  } catch (error) {
    console.error("Erreur Scraper Sibers:", error);
    return NextResponse.json({ error: "Serveur Sibers injoignable" }, { status: 500 });
  }
}