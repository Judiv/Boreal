import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://admin_boreal:password_secret@db:5432/boreal_db?schema=public",
    },
  },
});

async function main() {
  console.log('🌱 Début du seeding de Boreal...');

  // 1. Création des Rôles
  const superAdminRole = await prisma.role.upsert({
    where: { nom: 'SUPER_ADMIN' },
    update: {},
    create: { nom: 'SUPER_ADMIN' },
  });

  console.log('✅ Rôles créés.');

// 3. Création des Catégories (Basé sur CATEGORY_LABELS)
  const CATEGORY_LABELS: Record<string, string> = {
    "GENERAL": "📌 Général",
    "SPORT": "🏆 Sport / Compétition",
    "SOIREE": "🎉 Déjantes / Gala",
    "COMITS": "🎭 Comits",
    "INFO": "ℹ️ Information",
    "ADMINISTRATIVE": "📂 Administrative",
    "AUTRE": "📌 Autre"
  };

  console.log('📂 Seeding des catégories...');

  for (const [code, label] of Object.entries(CATEGORY_LABELS)) {
    await prisma.category.upsert({
      where: { code: code },
      update: { label: label }, // Met à jour le label si tu changes l'émoji un jour
      create: {
        code: code,
        label: label,
        color: "#3b82f6", // Couleur par défaut (Bleu Boreal)
      },
    });
  }
  
  console.log(`✅ ${Object.keys(CATEGORY_LABELS).length} catégories synchronisées.`);

  // 4. Création de Tags (Modèle Tag)
  const tagsData = ['ZiFoys', 'ZiSport', 'ZiDent', 'ZiMatos', 'Comits'];
  for (const tagName of tagsData) {
    await prisma.tag.upsert({
      where: { nom: tagName },
      update: {},
      create: { nom: tagName },
    });
  }
  console.log('🏷️ Tags créés.');

  console.log('🚀 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
