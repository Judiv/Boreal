import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json([]);

  const trash = await prisma.message.findMany({
    where: {
      OR: [
        { expediteurId: session.user.id, supprimePourExpediteur: true },
        { destinataires: { some: { userId: session.user.id, supprime: true } } }
      ]
    },
    include: {
      expediteur: { select: { bucque: true } },
      destinataires: { where: { userId: session.user.id } }
    },
    orderBy: { dateEnvoi: 'desc' }
  });

  return NextResponse.json(trash);
}