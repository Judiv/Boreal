# --- ÉTAPE 1 : INSTALLATION & BUILD ---
FROM node:20-alpine AS builder
WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copie du code et génération de Prisma
COPY . .
RUN npx prisma generate
# Build de l'application Next.js en ignorant les erreurs de connexion DB
RUN NEXT_PHASE=phase-production-build PRISMA_SKIP_POSTINSTALL=1 npm run build

# --- ÉTAPE 2 : RUNTIME (IMAGE FINALE) ---
FROM node:20-alpine AS runner
WORKDIR /app

# Sécurité : On définit l'environnement en production
ENV NODE_ENV production

# On ne copie que le nécessaire depuis le builder pour garder l'image légère
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY entrypoint.sh ./

# ✅ FIX IMAGES : Création du dossier uploads avec les droits d'écriture
# On s'assure que le dossier existe et qu'il est accessible à tous (777)
USER root
RUN mkdir -p public/uploads && chmod -R 777 public/uploads
RUN chmod +x entrypoint.sh

# Port d'écoute par défaut de Next.js
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]

# Lancement de l'application
CMD ["npm", "start"]