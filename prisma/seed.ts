import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de Boreal...');

  // 1. Création des Rôles
  const superAdminRole = await prisma.role.upsert({
    where: { nom: 'SUPER_ADMIN' },
    update: {},
    create: { nom: 'SUPER_ADMIN' },
  });

  const userRole = await prisma.role.upsert({
    where: { nom: 'USER' },
    update: {},
    create: { nom: 'USER' },
  });

  console.log('✅ Rôles créés.');

  // 2. Création de l'utilisateur SUPER_ADMIN
  const hashedPassword = await bcrypt.hash('Ancistrus54*', 10);
  
  const admin = await prisma.user.upsert({
    where: { emailEnsam: 'antoineschirrerpro@gmail.com' },
    update: { roleId: superAdminRole.id }, // On s'assure qu'il est bien admin s'il existe déjà
    create: {
      emailEnsam: 'antoineschirrerpro@gmail.com',
      password: hashedPassword,
      liseId: '2025-0703', // Requis par ton schéma (@unique)
      prenom: 'Antoine',
      nom: 'Schirrer',
      bucque: 'Admin',
      numFams: '51',
      roleId: superAdminRole.id,
      soldeBorgia: 0.0,
    },
  });

  console.log(`👑 Admin créé : ${admin.emailEnsam}`);

// 3. Création des Catégories (Basé sur CATEGORY_LABELS)
  const CATEGORY_LABELS: Record<string, string> = {
    "GENERAL": "📌 Général",
    "SPORT": "🏆 Sport / Compétition",
    "SOIREE": "🎉 Soirée / Fête",
    "COMITS": "🎭 Comits / Spectacle",
    "CULTURE": "🎨 Culture / Art",
    "INFO": "ℹ️ Information",
    "COVOITURAGE": "🚗 Covoiturage",
    "ADMINISTRATIVE": "📂 Administrative",
    "GALA": "🥂 Gala",
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