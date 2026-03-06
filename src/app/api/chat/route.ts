import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const session = await getUserSession();

    if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const response = await fetch(`${process.env.OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        prompt: `Instructions : Tu es l'IA de Boreal, l'assistant des Gadzarts de l'Usine. 
        Tu aides les élèves sur le site (boquettes, soirées, archives) et la Resam.
        Sois très bref, amical et réponds en français.
        
        Question de ${session.user.prenom} : ${message}
        Réponse :`,
        stream: false,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.response });

  } catch (error) {
    return NextResponse.json({ error: "IA indisponible" }, { status: 500 });
  }
}