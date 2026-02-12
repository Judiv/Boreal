-- Création de la table des Rôles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) UNIQUE NOT NULL -- 'SUPER_ADMIN', 'DELEGUE_RU', 'DELEGUE_SPORT', 'GADZ'
);

-- Table Utilisateurs (Profil Personnel)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email_ensam VARCHAR(100) UNIQUE NOT NULL, -- La clé pour la Sync
    nom VARCHAR(100),
    prenom VARCHAR(100),
    num_fams VARCHAR(20),
    age INTEGER,
    solde_borgia DECIMAL(10, 2) DEFAULT 0.00,
    role_id INTEGER REFERENCES roles(id),
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des News (Vie Collective)
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    image_url VARCHAR(255),
    categorie VARCHAR(50), -- 'ADMIN', 'FESTIF', 'SPORT'
    auteur_id INTEGER REFERENCES users(id),
    date_publication TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des Permissions fines (La Matrice des Droits)
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    peut_modifier_ru BOOLEAN DEFAULT FALSE,
    peut_modifier_sport BOOLEAN DEFAULT FALSE,
    peut_publier_news BOOLEAN DEFAULT FALSE,
    peut_gerer_planning BOOLEAN DEFAULT FALSE
);