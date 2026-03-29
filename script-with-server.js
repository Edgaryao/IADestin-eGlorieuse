// Version avec serveur backend (recommandé pour production)
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Base de données locale (simulée)
const database = {
  personnes: [
    {
      id: 1,
      nom: "Dupont",
      prenom: "Jean",
      age: 35,
      profession: "Développeur",
      ville: "Paris",
    },
    {
      id: 2,
      nom: "Martin",
      prenom: "Marie",
      age: 28,
      profession: "Designer",
      ville: "Lyon",
    },
    {
      id: 3,
      nom: "Bernard",
      prenom: "Pierre",
      age: 42,
      profession: "Manager",
      ville: "Marseille",
    },
    {
      id: 4,
      nom: "Dubois",
      prenom: "Sophie",
      age: 31,
      profession: "Architecte",
      ville: "Toulouse",
    },
  ],
};

function addMessage(text, isUser, isHtml = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;

  if (isHtml) {
    messageDiv.innerHTML = text;
  } else {
    messageDiv.textContent = text;
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function searchPerson(query) {
  const lowerQuery = query.toLowerCase();
  return database.personnes.filter(
    (p) =>
      p.nom.toLowerCase().includes(lowerQuery) ||
      p.prenom.toLowerCase().includes(lowerQuery) ||
      p.profession.toLowerCase().includes(lowerQuery) ||
      p.ville.toLowerCase().includes(lowerQuery),
  );
}

function formatPersonCard(person) {
  return `
        <div class="person-card">
            <h3>${person.prenom} ${person.nom}</h3>
            <p><strong>Âge:</strong> ${person.age} ans</p>
            <p><strong>Profession:</strong> ${person.profession}</p>
            <p><strong>Ville:</strong> ${person.ville}</p>
        </div>
    `;
}

async function generateImage(prompt) {
  const width = 400;
  const height = 300;
  const imageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
  return `<img src="${imageUrl}" alt="${prompt}" loading="lazy">
            <p style="margin-top: 8px; font-size: 12px; color: #666;">Image générée pour: "${prompt}"</p>`;
}

async function callGroqAPI(userMessage, context = '') {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        context: context
      })
    });

    if (!response.ok) {
      throw new Error('Erreur serveur');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Erreur:', error);
    return '⚠️ Erreur de connexion au serveur. Assurez-vous que le serveur est démarré (node server.js).';
  }
}

async function processMessage(message) {
  const lowerMessage = message.toLowerCase();

  // Commande pour générer une image
  if (
    lowerMessage.includes("génère") ||
    lowerMessage.includes("genere") ||
    lowerMessage.includes("image") ||
    lowerMessage.includes("photo")
  ) {
    addMessage("Génération de l'image en cours...", false);
    const imageHtml = await generateImage(message);
    setTimeout(() => {
      addMessage(imageHtml, false, true);
    }, 1000);
    return;
  }

  // Recherche de personnes dans la base de données
  if (
    lowerMessage.includes("personne") ||
    lowerMessage.includes("cherche") ||
    lowerMessage.includes("trouve") ||
    lowerMessage.includes("liste")
  ) {
    if (
      lowerMessage.includes("tous") ||
      lowerMessage.includes("toutes") ||
      lowerMessage.includes("liste")
    ) {
      let response = "<p>Voici toutes les personnes enregistrées:</p>";
      database.personnes.forEach((p) => {
        response += formatPersonCard(p);
      });
      addMessage(response, false, true);
      return;
    }

    const results = searchPerson(message);
    if (results.length > 0) {
      let response = `<p>J'ai trouvé ${results.length} personne(s):</p>`;
      results.forEach((p) => {
        response += formatPersonCard(p);
      });
      addMessage(response, false, true);
      return;
    }
  }

  // Utiliser l'API Groq via le serveur
  addMessage('💭 Réflexion...', false);
  const context = `Base de données disponible: ${database.personnes.length} personnes (${database.personnes.map(p => p.prenom + ' ' + p.nom).join(', ')})`;
  const response = await callGroqAPI(message, context);

  // Remplacer le message de chargement par la réponse
  const messages = chatMessages.children;
  if (messages.length > 0) {
    messages[messages.length - 1].textContent = response;
  }
}

function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, true);
  userInput.value = "";

  setTimeout(() => {
    processMessage(message);
  }, 300);
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});
