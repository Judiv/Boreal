import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth"; // Vérifie que le chemin vers ta fonction getUser est correct

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const loginUrl = "https://sibers.borgia-app.com/auth/login/";

    // 0. Vérifier l'utilisateur Boréal actuel
    const borealUser = await getUser();
    if (!borealUser) {
      return NextResponse.json({ error: "Session Boréal expirée" }, { status: 401 });
    }

    // 1. Récupérer le jeton CSRF initial et le cookie associé
    const getInitial = await fetch(loginUrl, { cache: 'no-store' });
    const initialHtml = await getInitial.text();
    const initialCookies = getInitial.headers.get("set-cookie");

    const match = initialHtml.match(/name="csrfmiddlewaretoken" value="(.+?)"/);
    const csrfToken = match ? match[1] : null;

    if (!csrfToken || !initialCookies) {
      return NextResponse.json({ error: "Jeton CSRF introuvable" }, { status: 500 });
    }

    // 2. Préparer la connexion
    const params = new URLSearchParams();
    params.append('csrfmiddlewaretoken', csrfToken);
    params.append('username', username);
    params.append('password', password);
    params.append('next', '');

    const loginRes = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": initialCookies, 
        "Referer": loginUrl,
      },
      body: params,
      redirect: "manual", 
    });

    const setCookieHeader = loginRes.headers.getSetCookie();

    // 3. Stockage avec ID utilisateur
    if (loginRes.status === 302 && setCookieHeader.length > 0) {
      const cookieStore = await cookies();
      const finalCookies = setCookieHeader.map(c => c.split(';')[0]).join('; ');

      // ✅ On nomme le cookie avec l'ID de l'user Boréal
      cookieStore.set(`borgia_session_${borealUser.id}`, finalCookies, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // On le garde 30 jours pour le confort
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Identifiants Borgia incorrects" }, { status: 401 });

  } catch (error) {
    console.error("Erreur Connexion Borgia:", error);
    return NextResponse.json({ error: "Erreur de liaison avec Sibers" }, { status: 500 });
  }
}