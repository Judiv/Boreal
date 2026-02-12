# Boreal
Boreal est une plateforme full-stack dédiée à la gestion des résidences étudiantes. Développée avec Next.js 15, Prisma et PostgreSQL, elle centralise la communication, les événements et le suivi financier Borgia au sein d'une infrastructure Docker isolée.

# 🏔️ Boreal - Portail Résidence

Boreal est une plateforme moderne de gestion pour résidence étudiante (Gadzarts), permettant la gestion des actualités, des événements, de l'entraide et du solde Borgia.

## 🚀 Technologies
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Base de données**: [PostgreSQL](https://www.postgresql.org/) avec [Prisma ORM](https://www.prisma.io/)
- **Conteneurisation**: [Docker](https://www.docker.com/) & Docker Compose
- **Emails**: Nodemailer (SMTP OVH)
- **Style**: Tailwind CSS & Lucide Icons

## 🛠️ Installation (Local avec Docker)

### 1. Prérequis
- Docker Desktop installé
- Git

### 2. Clonage et Configuration
```bash
git clone [https://github.com/TON_PSEUDO/app-boreal.git](https://github.com/TON_PSEUDO/app-boreal.git)
cd app-boreal
cp .env.example .env
