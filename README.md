# Assistant Destinée Glorieuse

Chatbot intelligent avec API Groq pour des réponses IA avancées.

## 🚀 Installation

### Option 1: Avec serveur Node.js (RECOMMANDÉ)

1. Installez Node.js si ce n'est pas déjà fait
2. Installez les dépendances:
```bash
npm install
```

3. Modifiez `server.js` et ajoutez votre clé API Groq:
```javascript
const GROQ_API_KEY = 'votre_clé_ici';
```

4. Démarrez le serveur:
```bash
npm start
```

5. Ouvrez http://localhost:3000 dans votre navigateur

6. Dans `index.html`, changez le script:
```html
<script src="script-with-server.js"></script>
```

### Option 2: Sans serveur (peut avoir des problèmes CORS)

1. Modifiez `script.js` et ajoutez votre clé API:
```javascript
const GROQ_API_KEY = 'votre_clé_ici';
```

2. Ouvrez `index.html` directement dans votre navigateur

⚠️ Note: L'API Groq peut bloquer les requêtes directes depuis le navigateur (CORS). Utilisez l'Option 1 si vous rencontrez des erreurs.

## 🎯 Fonctionnalités

- 🤖 Réponses intelligentes via API Groq (Llama 3.3)
- 👥 Recherche de personnes dans la base de données
- 🖼️ Génération d'images
- 📱 Interface responsive optimisée mobile

## 📝 Commandes

- "bonjour" - Saluer l'assistant
- "liste toutes les personnes" - Afficher tous les membres
- "cherche Dupont" - Rechercher une personne
- "génère une image de..." - Créer une image
- Toute autre question sera traitée par l'IA Groq

## 🔑 Obtenir une clé API Groq

1. Allez sur https://console.groq.com
2. Créez un compte gratuit
3. Générez une clé API
4. Copiez-la dans `server.js` ou `script.js`
