# Configuration Supabase pour Assistant Destinée Glorieuse

## Étape 1: Créer un compte Supabase

1. Allez sur https://supabase.com
2. Cliquez sur "Start your project"
3. Créez un compte gratuit (avec Google, GitHub ou email)

## Étape 2: Créer un nouveau projet

1. Cliquez sur "New Project"
2. Donnez un nom à votre projet (ex: "eglise-destinnee-glorieuse")
3. Créez un mot de passe pour la base de données (notez-le bien!)
4. Choisissez une région proche de vous
5. Cliquez sur "Create new project" (attendre 1-2 minutes)

## Étape 3: Créer les tables

Dans le menu de gauche, cliquez sur "SQL Editor", puis copiez-collez ce code:

```sql
-- Table des personnes (membres)
CREATE TABLE personnes (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  datearrivee DATE,
  datenaissance DATE,
  age INTEGER,
  invitepar TEXT,
  role TEXT,
  baptise TEXT,
  dejachretien TEXT,
  egliseorigine TEXT,
  parrecommandation TEXT,
  recommandepar TEXT,
  lieuhabitation TEXT,
  localisation TEXT,
  numero TEXT,
  sujetpriere TEXT,
  infosperso TEXT,
  photo TEXT,
  dateinscription DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des présences
CREATE TABLE presences (
  id BIGSERIAL PRIMARY KEY,
  membreid BIGINT REFERENCES personnes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  present BOOLEAN DEFAULT true,
  evenement TEXT DEFAULT 'Culte du Dimanche',
  remarque TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer Row Level Security (RLS)
ALTER TABLE personnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE presences ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture publique
CREATE POLICY "Lecture publique personnes" ON personnes FOR SELECT USING (true);
CREATE POLICY "Lecture publique presences" ON presences FOR SELECT USING (true);

-- Politique pour permettre l'insertion publique
CREATE POLICY "Insertion publique personnes" ON personnes FOR INSERT WITH CHECK (true);
CREATE POLICY "Insertion publique presences" ON presences FOR INSERT WITH CHECK (true);

-- Politique pour permettre la mise à jour publique
CREATE POLICY "Mise à jour publique personnes" ON personnes FOR UPDATE USING (true);
CREATE POLICY "Mise à jour publique presences" ON presences FOR UPDATE USING (true);

-- Politique pour permettre la suppression publique
CREATE POLICY "Suppression publique personnes" ON personnes FOR DELETE USING (true);
CREATE POLICY "Suppression publique presences" ON presences FOR DELETE USING (true);
```

Cliquez sur "Run" pour exécuter le script.

## Étape 4: Récupérer vos clés API

1. Dans le menu de gauche, cliquez sur "Project Settings" (icône engrenage)
2. Cliquez sur "API" dans le sous-menu
3. Vous verrez:
   - **Project URL** (ex: https://xxxxx.supabase.co)
   - **anon public** key (une longue clé qui commence par "eyJ...")

## Étape 5: Configurer votre application

1. Ouvrez le fichier `supabase-config.js`
2. Remplacez:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   Par vos vraies valeurs:
   ```javascript
   const SUPABASE_URL = 'https://xxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGc...votre_clé_complète';
   ```

## Étape 6: Ajouter le SDK Supabase

Dans votre fichier `index.html`, ajoutez cette ligne dans le `<head>` avant les autres scripts:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

## Étape 7: Tester

1. Ouvrez votre application dans le navigateur
2. Essayez d'ajouter un membre
3. Vérifiez dans Supabase (Table Editor) que les données apparaissent

## Notes importantes

- **Gratuit jusqu'à**: 500 MB stockage + 2 GB bande passante/mois
- **Sécurité**: Les politiques RLS permettent l'accès public (à modifier si besoin)
- **Photos**: Stockées en base64 dans la colonne `photo` (pour grandes quantités, utilisez Supabase Storage)

## Dépannage

Si ça ne fonctionne pas:
1. Vérifiez la console du navigateur (F12) pour les erreurs
2. Vérifiez que les clés API sont correctes
3. Vérifiez que les tables sont bien créées dans Supabase
4. Vérifiez que RLS est activé avec les bonnes politiques
