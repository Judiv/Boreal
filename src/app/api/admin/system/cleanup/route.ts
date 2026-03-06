import { runFullMaintenance } from "@/lib/cleanup-bot";
import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";

export async function POST(req: Request) {
  // Sécurité : Seul un admin (ou une clé API secrète) peut lancer ça
  const session = await getUserSession();
  if (!session?.user?.isAdmin) { // Adapte selon ton schéma auth
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await runFullMaintenance();
  return NextResponse.json(report);
}