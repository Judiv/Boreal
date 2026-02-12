# 🌍 Guide de Déploiement Complet - Boreal

Ce document détaille l'installation de A à Z du portail Boreal sur un serveur de production.

---

## ☁️ ÉTAPE 1 : Configuration des services tiers

Avant de toucher au serveur, vous devez configurer les deux services externes indispensables.

### 1.1 Pusher (Notifications en temps réel)
1. Créez un compte sur [Pusher.com](https://pusher.com/).
2. Cliquez sur **"Create App"** dans la section "Channels".
3. Nommez votre application (ex: `Boreal-Prod`).
4. Choisissez le cluster **eu (Europe)**.
5. Une fois l'app créée, allez dans l'onglet **"App Keys"**.
6. Copiez les valeurs suivantes pour votre fichier `.env` :
   - `app_id`
   - `key`
   - `secret`
   - `cluster`

### 1.2 Cloudinary (Hébergement des images et vidéos)
1. Créez un compte sur [Cloudinary.com](https://cloudinary.com/).
2. Sur votre tableau de bord (Dashboard), récupérez :
   - `Cloud Name`
   - `API Key`
   - `API Secret`
3. Allez dans **Settings** (roue crantée en bas à gauche) > **Upload**.
4. Descendez jusqu'à **"Upload presets"** et cliquez sur **"Add upload preset"**.
5. Configurez-le ainsi :
   - **Upload preset name** : `boreal_upload`
   - **Signing Mode** : `Unsigned` (TRÈS IMPORTANT pour permettre l'upload via l'app).
6. Cliquez sur **Save**.

---

## 🖥️ ÉTAPE 2 : Préparation du serveur Linux

Connectez-vous à votre serveur (Ubuntu 22.04+ recommandé) via SSH.

### 2.1 Mise à jour et installation des outils
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose nginx certbot python3-certbot-nginx git -y
sudo systemctl enable --now docker
```

---

## 📦 ÉTAPE 3 : Installation de l'application

### 3.1 Récupération du code
```bash
cd /var/www
sudo git clone [https://github.com/Judiv/Boreal.git](https://github.com/Judiv/Boreal.git)
cd Boreal
```

### 3.2 Configuration de l'environnement
```bash
sudo cp .env.example .env
sudo nano .env
```
Remplissez vos clés Pusher, Cloudinary, et vos identifiants SMTP.

---

## ÉTAPE 4 : Lancement avec Docker

### 4.1 Build et démarrage 
```bash
sudo docker-compose up --build -d
```

### 4.2 Initialisation de la base de données
```bash
sudo docker exec -it app-boreal-app-1 npx prisma migrate deploy
sudo docker exec -it app-boreal-app-1 npx prisma db seed
```

---

## ÉTAPE 5 : Configuration Nginx et SSL (HTTPS)

### 5.1 Créer la configuration Nginx
```bash
sudo nano /etc/nginx/sites-available/boreal
```
Collez ce bloc (remplacez votre-domaine.com par le vôtre) :

```bash
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 Activation du site et du SSL
```bash
sudo ln -s /etc/nginx/sites-available/boreal /etc/nginx/sites-enabled/
sudo systemctl restart nginx
sudo certbot --nginx -d votre-domaine.com
```

## ÉTAPE 6 : Maintenance courante

Logs de l'app : 
```bash
sudo docker logs -f app-boreal-app-1
```

Mettre à jour le code :
```bash
git pull origin main
docker-compose up --build -d
docker exec -it app-boreal-app-1 npx prisma migrate deploy
```

Backup DB :
```bash
docker exec app-boreal-db-1 pg_dump -U admin_boreal boreal_db > backup_$(date +%F).sql
```
Une fois enregistré et poussé (`git push`), la preview sur GitHub sera parfaitement propre. Est-ce que c'est bon pour toi ?
