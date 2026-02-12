#!/bin/sh
echo "🚀 Vérification de la base de données..."
npx prisma migrate deploy

# ✅ AJOUT : Garantir que le dossier uploads est lié au dossier de build
mkdir -p .next/standalone/public/uploads
cp -rs /app/public/uploads/* .next/standalone/public/uploads/ 2>/dev/null || true

# LANCER LE SEED (C'est ici que ça se passe)
echo "🌱 Exécution du seed..."
npx prisma db seed

# Démarrer l'application
echo "Démarrage de Boreal..."
npm run start