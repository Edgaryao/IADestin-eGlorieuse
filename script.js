// ===== LOADING SCREEN =====
window.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loadingScreen");
  const loadingProgress = document.getElementById("loadingProgress");
  const loadingStatus = document.getElementById("loadingStatus");

  const steps = [
    { progress: 20, status: "Connexion à la base de données...", delay: 400 },
    { progress: 40, status: "Chargement des membres...", delay: 600 },
    { progress: 60, status: "Chargement des présences...", delay: 500 },
    { progress: 80, status: "Initialisation de l'interface...", delay: 400 },
    { progress: 100, status: "Prêt!", delay: 300 },
  ];

  let currentStep = 0;

  function nextStep() {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      loadingProgress.style.width = step.progress + "%";
      loadingStatus.textContent = step.status;
      currentStep++;
      setTimeout(nextStep, step.delay);
    } else {
      // Masquer l'écran de chargement
      setTimeout(() => {
        loadingScreen.classList.add("hidden");
        setTimeout(() => {
          loadingScreen.style.display = "none";
        }, 500);
      }, 300);
    }
  }

  // Démarrer l'animation de chargement
  setTimeout(nextStep, 500);
});

// ===== SYSTÈME DE NOTIFICATIONS =====
function showNotification(type, title, message) {
  const container = document.getElementById("notificationsContainer");

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="10"></circle>
             <line x1="12" y1="16" x2="12" y2="12"></line>
             <line x1="12" y1="8" x2="12.01" y2="8"></line>
           </svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>`,
  };

  notification.innerHTML = `
    <div class="notification-icon">${icons[type] || icons.info}</div>
    <div class="notification-content">
      <h4 class="notification-title">${title}</h4>
      <p class="notification-message">${message}</p>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(notification);

  // Auto-fermeture après 5 secondes
  setTimeout(() => {
    notification.classList.add("hiding");
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  }, 5000);
}

// ===== CONFIGURATION ET BASE DE DONNÉES =====
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Configuration API Groq
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Historique de conversation pour la mémoire de l'IA
let conversationHistory = [];

// Base de données locale avec localStorage (sera remplacée par Supabase)
const database = {
  personnes: [],
  presences: [],
};

// Fonction pour copier le contenu d'une carte
function copyCardContent(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;

  // Extraire le texte sans le bouton
  const clone = card.cloneNode(true);
  const button = clone.querySelector("button");
  if (button) button.remove();

  const text = clone.innerText;

  // Copier dans le presse-papiers
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // Notification de succès
      showNotification(
        "success",
        "Copié!",
        "Les informations ont été copiées dans le presse-papiers",
      );
    })
    .catch((err) => {
      console.error("Erreur copie:", err);
      showNotification("error", "Erreur", "Impossible de copier le contenu");
    });
}

// Fonction pour copier le texte d'un élément parent
function copyText(button) {
  const parent = button.parentElement;
  const clone = parent.cloneNode(true);
  const btn = clone.querySelector("button");
  if (btn) btn.remove();

  const text = clone.innerText;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = button.innerHTML;
      button.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Copié!';
      button.style.background = "#10b981";
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = "#6366f1";
      }, 2000);
    })
    .catch((err) => {
      console.error("Erreur copie:", err);
      alert("Impossible de copier");
    });
}

function addMessage(text, isUser, isHtml = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;

  // Créer un conteneur pour le message
  const messageContent = document.createElement("div");
  messageContent.style.width = "100%";

  if (isHtml) {
    messageContent.innerHTML = text;
  } else {
    // Convertir le markdown basique en HTML pour les messages bot
    if (!isUser) {
      let formattedText = text;

      // Gras: **texte** -> <strong>texte</strong>
      formattedText = formattedText.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>",
      );

      // Sauts de ligne doubles -> paragraphes
      formattedText = formattedText
        .split("\n\n")
        .map((para) => {
          if (para.trim()) {
            return `<p style="margin: 8px 0;">${para.trim()}</p>`;
          }
          return "";
        })
        .join("");

      // Listes avec tirets ou puces
      formattedText = formattedText.replace(
        /<p style="margin: 8px 0;">([•\-]\s.+?)<\/p>/g,
        (match, content) => {
          return `<p style="margin: 4px 0 4px 15px;">${content}</p>`;
        },
      );

      // Numérotation
      formattedText = formattedText.replace(
        /<p style="margin: 8px 0;">(\d+\.\s.+?)<\/p>/g,
        (match, content) => {
          return `<p style="margin: 4px 0 4px 15px; font-weight: 500;">${content}</p>`;
        },
      );

      messageContent.innerHTML = formattedText;
    } else {
      messageContent.textContent = text;
    }
  }

  messageDiv.appendChild(messageContent);

  // Ajouter un bouton de copie pour les messages du bot
  if (!isUser) {
    const copyBtn = document.createElement("button");
    copyBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copier</span>';
    copyBtn.className = "copy-message-btn";
    copyBtn.title = "Copier le message";
    copyBtn.onclick = () => {
      const textToCopy = messageContent.innerText || messageContent.textContent;
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          copyBtn.innerHTML =
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copié!</span>';
          setTimeout(() => {
            copyBtn.innerHTML =
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copier</span>';
          }, 2000);
        })
        .catch((err) => {
          console.error("Erreur copie:", err);
        });
    };
    messageDiv.appendChild(copyBtn);
  }

  chatMessages.appendChild(messageDiv);

  // Défiler automatiquement vers le bas avec animation fluide
  setTimeout(() => {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: "smooth",
    });
  }, 100);
}

function formatPersonCard(person) {
  const presences = database.presences.filter((p) => p.membreId === person.id);
  const tauxPresence =
    presences.length > 0
      ? Math.round(
          (presences.filter((p) => p.present).length / presences.length) * 100,
        )
      : 0;

  const photoHtml = person.photo
    ? `<img src="${person.photo}" alt="${person.prenom}" style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`
    : "";

  const baptiseText =
    person.baptise === "oui"
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>Baptisé(e)'
      : person.baptise === "non"
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>Non baptisé(e)'
        : person.baptise === "en_cours"
          ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Baptême en cours'
          : "Non renseigné";

  // Créer un ID unique pour cette carte
  const cardId = `card-${person.id}-${Date.now()}`;

  return `
        <div class="person-card" id="${cardId}" style="position: relative;">
            <button onclick="copyCardContent('${cardId}')" style="position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3); transition: all 0.2s; font-weight: 500;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copier
            </button>
            ${photoHtml}
            <h3 style="color: #6366f1; margin-bottom: 15px; font-size: 18px; font-weight: 600;">${person.prenom} ${person.nom}</h3>
            <div style="text-align: left; line-height: 1.8;">
                ${person.age ? `<p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Âge:</strong> <span style="color: #666;">${person.age} ans</span></p>` : ""}
                ${person.dateNaissance ? `<p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path></svg>Anniversaire:</strong> <span style="color: #666;">${new Date(person.dateNaissance).toLocaleDateString("fr-FR")}</span></p>` : ""}
                ${person.dateArrivee ? `<p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path></svg>Date d'arrivée:</strong> <span style="color: #666;">${new Date(person.dateArrivee).toLocaleDateString("fr-FR")}</span></p>` : ""}
                ${person.invitePar && person.invitePar !== "Non renseigné" ? `<p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>Invité par:</strong> <span style="color: #666;">${person.invitePar}</span></p>` : ""}
                ${person.role && person.role !== "Non spécifié" ? `<p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>Rôle:</strong> <span style="color: #666;">${person.role}</span></p>` : ""}
                <p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>Baptême:</strong> <span style="color: #666;">${baptiseText}</span></p>
                ${person.dejaChretien === "oui" && person.egliseOrigine ? `<p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>Église d'origine:</strong> <span style="color: #666;">${person.egliseOrigine}</span></p>` : ""}
                ${person.parRecommandation === "oui" && person.recommandePar ? `<p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>Recommandé par:</strong> <span style="color: #666;">${person.recommandePar}</span></p>` : ""}
                <p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>Lieu d'habitation:</strong> <span style="color: #666;">${person.lieuHabitation || person.quartier || "Non spécifié"}</span></p>
                ${person.localisation ? `<p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>Localisation GPS:</strong> <span style="color: #666;">${person.localisation}</span></p>` : ""}
                <p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>Téléphone:</strong> <span style="color: #666;">${person.numero}</span></p>
                ${person.sujetPriere ? `<p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>Sujet de prière:</strong> <span style="color: #666;">${person.sujetPriere}</span></p>` : ""}
                ${person.infosPerso ? `<p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>Infos:</strong> <span style="color: #666;">${person.infosPerso}</span></p>` : ""}
                <p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>Inscrit le:</strong> <span style="color: #666;">${new Date(person.dateInscription).toLocaleDateString("fr-FR")}</span></p>
                <p style="margin: 8px 0; display: flex; align-items: center; gap: 8px;"><strong style="color: #333; display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>Présences:</strong> <span style="color: #666;">${presences.filter((p) => p.present).length}/${presences.length} (${tauxPresence}%)</span></p>
            </div>
        </div>
    `;
}

function ajouterMembre(data) {
  // Utiliser Supabase uniquement
  if (
    typeof supabaseClient !== "undefined" &&
    typeof ajouterMembreSupabase === "function"
  ) {
    return ajouterMembreSupabase(data);
  }

  // Si Supabase n'est pas disponible, afficher une erreur
  console.error("Supabase n'est pas configuré");
  throw new Error("Impossible d'ajouter le membre: Supabase non configuré");
}

function modifierMembre(membreId, updates) {
  // Utiliser Supabase uniquement
  if (
    typeof supabaseClient !== "undefined" &&
    typeof modifierMembreSupabase === "function"
  ) {
    return modifierMembreSupabase(membreId, updates);
  }

  // Si Supabase n'est pas disponible, afficher une erreur
  console.error("Supabase n'est pas configuré");
  throw new Error("Impossible de modifier le membre: Supabase non configuré");
}

function enregistrerPresence(data) {
  // Utiliser Supabase uniquement
  if (
    typeof supabaseClient !== "undefined" &&
    typeof enregistrerPresenceSupabase === "function"
  ) {
    return enregistrerPresenceSupabase(data);
  }

  // Si Supabase n'est pas disponible, afficher une erreur
  console.error("Supabase n'est pas configuré");
  throw new Error(
    "Impossible d'enregistrer la présence: Supabase non configuré",
  );
}

function getStatistiques(membreId = null) {
  if (membreId) {
    const membre = database.personnes.find((p) => p.id === membreId);
    if (!membre) return null;

    const presences = database.presences.filter((p) => p.membreId === membreId);
    const presents = presences.filter((p) => p.present).length;
    const absents = presences.length - presents;
    const taux =
      presences.length > 0
        ? Math.round((presents / presences.length) * 100)
        : 0;

    return {
      membre: `${membre.prenom} ${membre.nom}`,
      totalPresences: presents,
      totalAbsences: absents,
      tauxPresence: taux,
      dernierePresence:
        presences.length > 0 ? presences[presences.length - 1].date : "Aucune",
    };
  } else {
    const stats = database.personnes.map((membre) => {
      const presences = database.presences.filter(
        (p) => p.membreId === membre.id,
      );
      const presents = presences.filter((p) => p.present).length;
      const taux =
        presences.length > 0
          ? Math.round((presents / presences.length) * 100)
          : 0;

      return {
        id: membre.id,
        nom: `${membre.prenom} ${membre.nom}`,
        presences: presents,
        absences: presences.length - presents,
        taux: taux,
      };
    });

    return stats.sort((a, b) => b.taux - a.taux);
  }
}

async function generateImage(prompt) {
  try {
    // Extraire le nom du membre si mentionné dans le prompt
    const membre = database.personnes.find(
      (p) =>
        prompt.toLowerCase().includes(p.nom.toLowerCase()) ||
        prompt.toLowerCase().includes(p.prenom.toLowerCase()),
    );

    if (membre) {
      const memberName = `${membre.prenom} ${membre.nom}`;

      // Si le membre a une photo enregistrée, l'afficher
      if (membre.photo) {
        return `<div style="text-align: center;">
                  <img src="${membre.photo}" alt="${memberName}" loading="lazy" style="max-width: 100%; max-height: 500px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                  <p style="margin-top: 12px; font-size: 14px; color: #333; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    Photo de <strong>${memberName}</strong>
                  </p>
                  <p style="margin-top: 8px; font-size: 12px; color: #666; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Inscrit(e) le: ${membre.dateinscription ? new Date(membre.dateinscription).toLocaleDateString("fr-FR") : "Non renseigné"}
                  </p>
                </div>`;
      } else {
        // Si pas de photo, générer un avatar avec les initiales
        const initials = `${membre.prenom[0]}${membre.nom[0]}`.toUpperCase();
        const colors = [
          "4a90e2",
          "2ecc71",
          "e74c3c",
          "f39c12",
          "9b59b6",
          "1abc9c",
          "e67e22",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=512&background=${randomColor}&color=fff&bold=true&format=png&rounded=true&font-size=0.4`;

        return `<div style="text-align: center;">
                  <img src="${avatarUrl}" alt="${memberName}" loading="lazy" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                  <p style="margin-top: 12px; font-size: 14px; color: #333; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Avatar de <strong>${memberName}</strong>
                  </p>
                  <p style="margin-top: 8px; font-size: 12px; color: #f59e0b; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Aucune photo enregistrée pour ce membre
                  </p>
                  <p style="margin-top: 6px; font-size: 11px; color: #999; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Vous pouvez ajouter une photo via le formulaire "Ajouter un membre"
                  </p>
                </div>`;
      }
    }

    // Si ce n'est pas un membre, générer un avatar générique
    const initials = prompt
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    const colors = [
      "4a90e2",
      "2ecc71",
      "e74c3c",
      "f39c12",
      "9b59b6",
      "1abc9c",
      "e67e22",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=512&background=${randomColor}&color=fff&bold=true&format=png&rounded=true&font-size=0.4`;

    return `<div style="text-align: center;">
              <img src="${avatarUrl}" alt="${prompt}" loading="lazy" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <p style="margin-top: 12px; font-size: 13px; color: #666; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"></path></svg>
                Avatar généré: "${prompt}"
              </p>
            </div>`;
  } catch (error) {
    console.error("Erreur génération image:", error);
    return `<p style="color: #ef4444; display: flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>Erreur lors de l'affichage de l'image</p>`;
  }
}

async function callGroqAPI(userMessage, context = "") {
  try {
    // Ajouter le message utilisateur à l'historique
    conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    // Construire les messages avec l'historique
    const messages = [
      {
        role: "system",
        content: `Tu es "Assistant Destinée Glorieuse", un assistant intelligent et professionnel pour la gestion d'une église.

RÈGLES DE COMMUNICATION (TRÈS IMPORTANT):
1. **Langage simple et clair** - N'utilise JAMAIS de termes techniques comme "uploader", "action", "tag", "ID", etc.
2. **Listes systématiques** - Quand tu cites plusieurs éléments, utilise TOUJOURS des listes avec puces (•) ou numérotation
3. **Formatage** - Utilise des paragraphes, tirets, numérotation, et gras pour la lisibilité
4. **Vocabulaire accessible** - Parle comme à quelqu'un qui ne connaît pas l'informatique

CONTEXTE:
${context}

EXEMPLES DE BONNES RÉPONSES:

Question: "Qui sont les diacres?"
Réponse: "Voici les **diacres** de l'église:

• **Jean Dupont** - Tél: 0123456789
• **Marie Martin** - Tél: 0987654321

Total: **2 diacres**"

Question: "Qui a une photo?"
Réponse: "Ces membres ont une photo enregistrée:

• **Jean Dupont**
• **Marie Martin**
• **Paul Lefebvre**

Total: **3 membres** avec photo"

Question: "Liste les membres"
Réponse: "Voici tous les membres:

• **Jean Dupont** - Diacre
• **Marie Martin** - Choriste
• **Paul Lefebvre** - Jeune

Total: **3 membres**"

Question: "Comment ajouter un membre?"
Réponse: "Pour ajouter un membre:

1. Cliquez sur le bouton **+** en haut à droite
2. Choisissez **Nouveau Membre** ou **Ancien Membre**
3. Remplissez les informations
4. Cliquez sur **Enregistrer**

Le membre sera ajouté automatiquement!"

INTERDICTIONS ABSOLUES:
❌ Ne dis JAMAIS "utiliser l'action [UPDATE_MEMBER]" ou des termes techniques
❌ Ne mentionne JAMAIS les IDs, tags, ou codes internes
❌ Ne parle JAMAIS de "uploader", "tag", "action", "système"
✅ Dis plutôt "ajouter une photo", "modifier", "enregistrer"

Réponds toujours en français simple, avec des listes claires, et un formatage professionnel.`,
      },
      ...conversationHistory,
    ];

    // Détecter si on est en production (Vercel) ou en local
    const isProduction =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";
    const apiUrl = isProduction ? "/api/chat" : GROQ_API_URL;

    let response;

    if (isProduction) {
      // En production: utiliser l'API Vercel
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: messages }),
      });
    } else {
      // En local: appeler Groq directement
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Erreur API:", response.status, errorData);
      throw new Error(
        `Erreur ${response.status}: ${errorData.error?.message || "Erreur API"}`,
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Ajouter la réponse de l'assistant à l'historique
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    // Limiter l'historique aux 100 derniers messages pour éviter de surcharger l'API
    if (conversationHistory.length > 100) {
      conversationHistory = conversationHistory.slice(-100);
    }

    return assistantMessage;
  } catch (error) {
    console.error("Erreur complète:", error);
    if (error.message.includes("CORS")) {
      return '<div style="display: flex; align-items: center; gap: 8px; color: #f59e0b;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>Erreur CORS: L\'API Groq ne peut pas être appelée directement depuis le navigateur. Vous devez créer un serveur backend (voir server.js dans le projet).</div>';
    }
    return `<div style="display: flex; align-items: center; gap: 8px; color: #ef4444;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>Erreur: ${error.message}. Vérifiez votre clé API et la console pour plus de détails.</div>`;
  }
}

async function processMessage(message) {
  const lowerMessage = message.toLowerCase();

  // Préparer le contexte COMPLET avec toutes les données des membres
  const membresDetails = database.personnes.map((p) => {
    const presences = database.presences.filter((pr) => pr.membreId === p.id);
    const tauxPresence =
      presences.length > 0
        ? Math.round(
            (presences.filter((pr) => pr.present).length / presences.length) *
              100,
          )
        : 0;

    return {
      id: p.id,
      nom: `${p.prenom} ${p.nom}`,
      prenom: p.prenom,
      nomFamille: p.nom,
      age: p.age || "Non renseigné",
      telephone: p.numero || "Non renseigné",
      adresse: p.lieuHabitation || "Non spécifié",
      role: p.role || "Non spécifié",
      baptise: p.baptise || "Non renseigné",
      aPhoto: p.photo ? "OUI" : "NON",
      tauxPresence: tauxPresence + "%",
      dateArrivee: p.dateArrivee
        ? new Date(p.dateArrivee).toLocaleDateString("fr-FR")
        : "Non renseigné",
    };
  });

  const contextData = `
DONNÉES COMPLÈTES DE LA BASE:

Total membres: ${database.personnes.length}
Total présences enregistrées: ${database.presences.length}

LISTE DÉTAILLÉE DES MEMBRES:
${membresDetails
  .map(
    (m) => `
- **${m.nom}** (ID: ${m.id})
  • Téléphone: ${m.telephone}
  • Adresse: ${m.adresse}
  • Rôle: ${m.role}
  • Baptisé: ${m.baptise}
  • A une photo: ${m.aPhoto}
  • Taux présence: ${m.tauxPresence}
`,
  )
  .join("\n")}

ACTIONS DISPONIBLES (à utiliser au DÉBUT de ta réponse):
- [SHOW_MEMBER:id] - Afficher la fiche complète d'un membre
- [SHOW_PHONE:id] - Afficher le numéro de téléphone en 2 messages
- [SHOW_STATS:id] - Afficher les statistiques d'un membre
- [SHOW_ALL_STATS] - Afficher les statistiques de tous les membres
- [SHOW_IMAGE:id] - Afficher la photo d'un membre
- [LIST_MEMBERS] - Lister tous les membres avec leurs fiches
- [UPDATE_MEMBER:id:champ:valeur] - Modifier une information d'un membre

INSTRUCTIONS IMPORTANTES:
- Analyse la question intelligemment avec TOUTES les données ci-dessus
- Si l'utilisateur demande "qui a une photo", liste UNIQUEMENT les membres où "A une photo: OUI"
- Si l'utilisateur demande "qui n'a pas de photo", liste UNIQUEMENT les membres où "A une photo: NON"
- Si l'utilisateur demande un numéro, utilise [SHOW_PHONE:id] et dis "Le numéro de [Nom] est :"
- Si l'utilisateur veut voir une photo/image, utilise [SHOW_IMAGE:id]
- Si l'utilisateur demande des statistiques, utilise [SHOW_STATS:id] ou [SHOW_ALL_STATS]
- Si l'utilisateur veut la liste complète, utilise [LIST_MEMBERS]
- Si l'utilisateur veut modifier/changer/mettre à jour une info, utilise [UPDATE_MEMBER:id:champ:valeur]
- Réponds avec un formatage clair: **gras**, listes (•), numérotation (1., 2.)
- Mets l'action entre crochets au DÉBUT de ta réponse si nécessaire

CHAMPS MODIFIABLES:
- numero (téléphone)
- lieuHabitation (adresse)
- role
- baptise (oui/non/en_cours)
- sujetPriere
- infosPerso
- localisation

EXEMPLES:
Question: "Qui a une photo?"
Réponse: "Voici les membres qui ont une photo enregistrée:

• **Jean Dupont** (ID: 1)
• **Marie Martin** (ID: 3)

Total: **2 membres** avec photo."

Question: "Donne-moi le numéro de Jean"
Réponse: "[SHOW_PHONE:1] Le numéro de Jean Dupont est :"

Question: "Change le numéro de Jean en 0612345678"
Réponse: "[UPDATE_MEMBER:1:numero:0612345678] Le numéro de Jean Dupont a été mis à jour."

Question: "Mets Marie comme diacre"
Réponse: "[UPDATE_MEMBER:3:role:Diacre] Marie Martin est maintenant enregistrée comme Diacre."
`;

  // Consulter l'IA en premier
  const thinkingMessage = `<div style="display: flex; align-items: center; gap: 10px; color: #8b5cf6;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 2s linear infinite;">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 6v6l4 2"></path>
    </svg>
    <span>Réflexion...</span>
  </div>`;
  addMessage(thinkingMessage, false, true);
  const aiResponse = await callGroqAPI(message, contextData);

  // Supprimer le message de chargement
  const messages = chatMessages.children;
  if (messages.length > 0) {
    chatMessages.removeChild(messages[messages.length - 1]);
  }

  // Analyser la réponse de l'IA pour détecter les actions
  const actionMatch = aiResponse.match(
    /\[([A-Z_]+):?(\d+)?:?([^:\]]+)?:?([^\]]+)?\]/,
  );

  if (actionMatch) {
    const action = actionMatch[1];
    const membreId = actionMatch[2] ? parseInt(actionMatch[2]) : null;
    const param1 = actionMatch[3] || null;
    const param2 = actionMatch[4] || null;

    // Extraire le texte sans l'action
    const responseText = aiResponse
      .replace(/\[([A-Z_]+):?(\d+)?:?([^:\]]+)?:?([^\]]+)?\]/, "")
      .trim();

    // Afficher le texte de l'IA si présent
    if (responseText) {
      addMessage(responseText, false);
    }

    // Exécuter l'action
    switch (action) {
      case "UPDATE_MEMBER":
        if (membreId && param1 && param2) {
          const membre = database.personnes.find((p) => p.id === membreId);
          if (membre) {
            const updates = {};
            updates[param1] = param2;

            modifierMembre(membreId, updates)
              .then(() => {
                showNotification(
                  "success",
                  "Modification réussie!",
                  `Les informations de ${membre.prenom} ${membre.nom} ont été mises à jour`,
                );
              })
              .catch((error) => {
                showNotification(
                  "error",
                  "Erreur de modification",
                  error.message,
                );
              });
          }
        }
        break;

      case "SHOW_PHONE":
        if (membreId) {
          const membre = database.personnes.find((p) => p.id === membreId);
          if (membre) {
            setTimeout(() => {
              addMessage(membre.numero, false);
            }, 300);
          }
        }
        break;

      case "SHOW_MEMBER":
        if (membreId) {
          const membre = database.personnes.find((p) => p.id === membreId);
          if (membre) {
            setTimeout(() => {
              addMessage(formatPersonCard(membre), false, true);
            }, 300);
          }
        }
        break;

      case "SHOW_IMAGE":
        if (membreId) {
          const membre = database.personnes.find((p) => p.id === membreId);
          if (membre) {
            setTimeout(async () => {
              const imageHtml = await generateImage(
                `${membre.prenom} ${membre.nom}`,
              );
              addMessage(imageHtml, false, true);
            }, 300);
          }
        }
        break;

      case "SHOW_STATS":
        if (membreId) {
          const stats = getStatistiques(membreId);
          if (stats) {
            setTimeout(() => {
              const statsMessage = `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg><strong>Statistiques de ${stats.membre}:</strong></div>

• **Présences:** ${stats.totalPresences}
• **Absences:** ${stats.totalAbsences}
• **Taux de présence:** ${stats.tauxPresence}%
• **Dernière présence:** ${stats.dernierePresence !== "Aucune" ? new Date(stats.dernierePresence).toLocaleDateString("fr-FR") : "Aucune"}`;
              addMessage(statsMessage, false);
            }, 300);
          }
        }
        break;

      case "SHOW_ALL_STATS":
        const stats = getStatistiques();
        let response = `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg><strong style="font-size: 16px;">Statistiques globales</strong></div>`;
        stats.forEach((s) => {
          response += `<div class="person-card"><h3>${s.nom}</h3><p>Présences: ${s.presences} | Absences: ${s.absences} | Taux: ${s.taux}%</p></div>`;
        });
        setTimeout(() => {
          addMessage(response, false, true);
        }, 300);
        break;

      case "LIST_MEMBERS":
        let listResponse = `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg><strong>${database.personnes.length} membres enregistrés</strong></div>`;
        database.personnes.forEach((p) => {
          listResponse += formatPersonCard(p);
        });
        setTimeout(() => {
          addMessage(listResponse, false, true);
        }, 300);
        break;
    }
  } else {
    // Pas d'action spéciale, juste afficher la réponse de l'IA
    addMessage(aiResponse, false);
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

// ===== BOUTON SCROLL TO BOTTOM =====
const scrollToBottomBtn = document.getElementById("scrollToBottom");

// Fonction pour vérifier si on est en bas
function checkScrollPosition() {
  const isAtBottom =
    chatMessages.scrollHeight - chatMessages.scrollTop <=
    chatMessages.clientHeight + 100;

  if (isAtBottom) {
    scrollToBottomBtn.classList.remove("show");
  } else {
    scrollToBottomBtn.classList.add("show");
  }
}

// Écouter le scroll
chatMessages.addEventListener("scroll", checkScrollPosition);

// Clic sur le bouton
scrollToBottomBtn.addEventListener("click", () => {
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: "smooth",
  });
});

// Message d'accueil (s'affiche toujours au chargement)
setTimeout(() => {
  const welcomeMessage = `
    <div style="text-align: center; padding: 24px; background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%); border-radius: 16px; margin: 10px 0; border: 1px solid #e2e8f0;">
      <div style="width: 60px; height: 60px; margin: 0 auto 16px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <h3 style="color: #6366f1; margin-bottom: 20px; font-size: 22px; font-weight: 700;">Bienvenue sur Assistant Destinée Glorieuse</h3>
      
      <div style="text-align: left; max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <p style="margin-bottom: 16px; color: #0f172a; font-weight: 600; font-size: 15px;">Votre assistant intelligent</p>
        <p style="margin-bottom: 20px; color: #475569; line-height: 1.7; font-size: 14px;">Je gère les membres de l'église et réponds à toutes vos questions sur les coordonnées, présences et statistiques.</p>
        
        <div style="background: #f8fafc; padding: 16px; border-radius: 10px; margin-bottom: 16px;">
          <p style="margin-bottom: 12px; color: #0f172a; font-weight: 600; font-size: 14px;">Actions rapides:</p>
          <p style="margin: 8px 0; color: #475569; font-size: 13px;">• Ajouter un membre</p>
          <p style="margin: 8px 0; color: #475569; font-size: 13px;">• Rapport de présence</p>
          <p style="margin: 8px 0; color: #475569; font-size: 13px;">• Voir les statistiques</p>
        </div>
        
        <p style="margin-bottom: 10px; color: #0f172a; font-weight: 600; font-size: 14px;">Exemples de questions:</p>
        <p style="margin: 6px 0; color: #64748b; font-size: 13px;">• "Liste tous les membres"</p>
        <p style="margin: 6px 0; color: #64748b; font-size: 13px;">• "Numéro de Jean Dupont"</p>
        <p style="margin: 6px 0; color: #64748b; font-size: 13px;">• "Qui a une photo?"</p>
        <p style="margin: 6px 0; color: #64748b; font-size: 13px;">• "Change le rôle de Marie en Diacre"</p>
      </div>
      
      <p style="margin-top: 20px; font-size: 14px; color: #64748b;">Posez-moi vos questions!</p>
    </div>
  `;
  addMessage(welcomeMessage, false, true);
}, 500);

// ===== SIDEBAR MANAGEMENT =====
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("closeSidebar");
const btnAddMember = document.getElementById("btnAddMember");
const btnReport = document.getElementById("btnReport");
const btnStats = document.getElementById("btnStats");
const btnUploadPhoto = document.getElementById("btnUploadPhoto");

const addMemberSection = document.getElementById("addMemberSection");
const reportSection = document.getElementById("reportSection");
const statsSection = document.getElementById("statsSection");
const uploadPhotoSection = document.getElementById("uploadPhotoSection");

function openSidebar(section) {
  sidebar.classList.add("open");

  // Cacher toutes les sections
  addMemberSection.classList.remove("active");
  reportSection.classList.remove("active");
  statsSection.classList.remove("active");
  uploadPhotoSection.classList.remove("active");

  // Afficher la section demandée
  section.classList.add("active");

  // Mettre à jour le titre du header
  const sidebarTitle = document.getElementById("sidebarTitle");
  if (section === addMemberSection) {
    sidebarTitle.textContent = "Ajouter un Membre";
  } else if (section === reportSection) {
    sidebarTitle.textContent = "Rapport de Présence";
  } else if (section === statsSection) {
    sidebarTitle.textContent = "Statistiques";
  } else if (section === uploadPhotoSection) {
    sidebarTitle.textContent = "Modifier une Photo";
    loadMembersForPhotoUpload();
  }
}

function closeSidebarFunc() {
  sidebar.classList.remove("open");
}

closeSidebar.addEventListener("click", closeSidebarFunc);

btnAddMember.addEventListener("click", () => {
  openSidebar(addMemberSection);
});
btnReport.addEventListener("click", () => {
  openSidebar(reportSection);
  loadMembersForReport();
});
btnStats.addEventListener("click", () => {
  openSidebar(statsSection);
  loadStats();
  loadCharts();
});
btnUploadPhoto.addEventListener("click", () => {
  openSidebar(uploadPhotoSection);
});

// ===== AJOUTER MEMBRE =====
const addMemberForm = document.getElementById("addMemberForm");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const btnNewMember = document.getElementById("btnNewMember");
const btnOldMember = document.getElementById("btnOldMember");
const newMemberForm = document.getElementById("newMemberForm");
const oldMemberForm = document.getElementById("oldMemberForm");
const photoInputOld = document.getElementById("photoInputOld");
const photoPreviewOld = document.getElementById("photoPreviewOld");

// Gestion des champs conditionnels
const inputDejaChretien = document.getElementById("inputDejaChretien");
const groupEgliseOrigine = document.getElementById("groupEgliseOrigine");
const groupRoleEglise = document.getElementById("groupRoleEglise");
const inputParRecommandation = document.getElementById(
  "inputParRecommandation",
);
const groupRecommandePar = document.getElementById("groupRecommandePar");

inputDejaChretien.addEventListener("change", (e) => {
  if (e.target.value === "oui") {
    groupEgliseOrigine.style.display = "block";
    groupRoleEglise.style.display = "block";
  } else {
    groupEgliseOrigine.style.display = "none";
    groupRoleEglise.style.display = "none";
    document.getElementById("inputEgliseOrigine").value = "";
    document.getElementById("inputRole").value = "";
  }
});

inputParRecommandation.addEventListener("change", (e) => {
  if (e.target.value === "oui") {
    groupRecommandePar.style.display = "block";
  } else {
    groupRecommandePar.style.display = "none";
    document.getElementById("inputRecommandePar").value = "";
  }
});

// Toggle entre nouveau et ancien membre
btnNewMember.addEventListener("click", () => {
  btnNewMember.classList.add("active");
  btnOldMember.classList.remove("active");
  newMemberForm.style.display = "block";
  oldMemberForm.style.display = "none";

  // Activer/désactiver les champs required
  document.getElementById("inputNomComplet").required = true;
  document.getElementById("inputNomCompletOld").required = false;
});

btnOldMember.addEventListener("click", () => {
  btnOldMember.classList.add("active");
  btnNewMember.classList.remove("active");
  newMemberForm.style.display = "none";
  oldMemberForm.style.display = "block";

  // Activer/désactiver les champs required
  document.getElementById("inputNomComplet").required = false;
  document.getElementById("inputNomCompletOld").required = true;
});

// Initialiser l'état par défaut (Nouveau membre actif)
document.getElementById("inputNomComplet").required = true;
document.getElementById("inputNomCompletOld").required = false;

// Prévisualisation de la photo (nouveau membre)
photoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo">`;
    };
    reader.readAsDataURL(file);
  }
});

// Prévisualisation de la photo (ancien membre)
photoInputOld.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreviewOld.innerHTML = `<img src="${e.target.result}" alt="Photo">`;
    };
    reader.readAsDataURL(file);
  }
});

addMemberForm.addEventListener("submit", (e) => {
  e.preventDefault();

  console.log("📝 Formulaire soumis");

  // Vérifier si c'est un nouveau ou ancien membre
  if (btnNewMember.classList.contains("active")) {
    console.log("✅ Mode: Nouveau membre");
    // Nouveau membre
    const photoFile = photoInput.files[0];
    let photoData = null;

    if (photoFile) {
      console.log("📷 Photo sélectionnée");
      const reader = new FileReader();
      reader.onload = (e) => {
        photoData = e.target.result;
        saveNewMember(photoData);
      };
      reader.readAsDataURL(photoFile);
    } else {
      console.log("📷 Pas de photo");
      saveNewMember(null);
    }
  } else {
    console.log("✅ Mode: Ancien membre");
    // Ancien membre
    const photoFile = photoInputOld.files[0];
    let photoData = null;

    if (photoFile) {
      console.log("📷 Photo sélectionnée");
      const reader = new FileReader();
      reader.onload = (e) => {
        photoData = e.target.result;
        saveOldMember(photoData);
      };
      reader.readAsDataURL(photoFile);
    } else {
      console.log("📷 Pas de photo");
      saveOldMember(null);
    }
  }
});

async function saveOldMember(photoData) {
  console.log("💾 saveOldMember appelée");
  const nomComplet = document.getElementById("inputNomCompletOld").value.trim();

  if (!nomComplet) {
    alert("Veuillez remplir le nom complet");
    return;
  }

  console.log("👤 Nom complet:", nomComplet);

  // Séparer le nom complet en prénom et nom
  const parts = nomComplet.split(" ");
  const prenom = parts[0] || "";
  const nom = parts.slice(1).join(" ") || parts[0];

  const dateNaissance = document.getElementById("inputDateNaissanceOld").value;
  let age = null;

  if (dateNaissance) {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
  }

  const nouveauMembre = {
    nom: nom,
    prenom: prenom,
    dateNaissance: dateNaissance || null,
    age: age,
    invitePar: "Non renseigné",
    role:
      document.getElementById("inputRoleOld").value.trim() || "Non spécifié",
    numero:
      document.getElementById("inputNumeroOld").value.trim() || "Non renseigné",
    lieuHabitation:
      document.getElementById("inputLieuHabitationOld").value.trim() ||
      "Non spécifié",
    localisation:
      document.getElementById("inputLocalisationOld").value.trim() || "",
    photo: photoData,
    baptise: "Non renseigné",
    dateArrivee: null,
    dejaChretien: "Non renseigné",
    egliseOrigine: "",
    parRecommandation: "Non renseigné",
    recommandePar: "",
    sujetPriere: "",
    infosPerso: "",
  };

  try {
    const membre = await ajouterMembre(nouveauMembre);

    // Notification toast au lieu du message dans le chat
    showNotification(
      "success",
      "Membre ajouté avec succès!",
      `${membre.prenom} ${membre.nom} a été enregistré dans la base de données`,
    );

    // Réinitialiser le formulaire
    addMemberForm.reset();
    photoPreviewOld.innerHTML = `<svg class="photo-preview-placeholder" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                 </svg>`;
    closeSidebarFunc();
  } catch (error) {
    // Notification d'erreur au lieu du message dans le chat
    showNotification("error", "Erreur", error.message);
  }
}

function saveNewMember(photoData) {
  console.log("💾 saveNewMember appelée");
  const nomComplet = document.getElementById("inputNomComplet").value.trim();

  if (!nomComplet) {
    alert("Veuillez remplir le nom complet");
    return;
  }

  console.log("👤 Nom complet:", nomComplet);

  // Séparer le nom complet en prénom et nom
  const parts = nomComplet.split(" ");
  const prenom = parts[0] || "";
  const nom = parts.slice(1).join(" ") || parts[0];

  const dateNaissance = document.getElementById("inputDateNaissance").value;
  let age = null;

  if (dateNaissance) {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
  }

  const nouveauMembre = {
    nom: nom,
    prenom: prenom,
    dateArrivee: document.getElementById("inputDateArrivee").value || null,
    dateNaissance: dateNaissance || null,
    age: age,
    invitePar:
      document.getElementById("inputInvitePar").value.trim() || "Non renseigné",
    role: document.getElementById("inputRole").value.trim() || "Non spécifié",
    baptise: document.getElementById("inputBaptise").value || "Non renseigné",
    dejaChretien:
      document.getElementById("inputDejaChretien").value || "Non renseigné",
    egliseOrigine:
      document.getElementById("inputEgliseOrigine").value.trim() || "",
    parRecommandation:
      document.getElementById("inputParRecommandation").value ||
      "Non renseigné",
    recommandePar:
      document.getElementById("inputRecommandePar").value.trim() || "",
    lieuHabitation:
      document.getElementById("inputLieuHabitation").value.trim() ||
      "Non spécifié",
    localisation:
      document.getElementById("inputLocalisation").value.trim() || "",
    numero:
      document.getElementById("inputNumero").value.trim() || "Non renseigné",
    sujetPriere: document.getElementById("inputSujetPriere").value.trim() || "",
    infosPerso: document.getElementById("inputInfosPerso").value.trim() || "",
    photo: photoData,
  };

  // Ajouter avec async/await
  ajouterMembre(nouveauMembre)
    .then((membre) => {
      // Notification toast au lieu du message dans le chat
      showNotification(
        "success",
        "Membre ajouté avec succès!",
        `${membre.prenom} ${membre.nom} a été enregistré dans la base de données`,
      );

      // Réinitialiser le formulaire
      addMemberForm.reset();
      photoPreview.innerHTML = `<svg class="photo-preview-placeholder" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                 </svg>`;

      // Réinitialiser les champs conditionnels
      groupEgliseOrigine.style.display = "none";
      groupRoleEglise.style.display = "none";
      groupRecommandePar.style.display = "none";

      // Fermer la sidebar
      closeSidebarFunc();
    })
    .catch((error) => {
      // Notification d'erreur au lieu du message dans le chat
      showNotification("error", "Erreur", error.message);
    });
}

// ===== RAPPORT DE PRÉSENCE =====
const reportDate = document.getElementById("reportDate");
const reportEvent = document.getElementById("reportEvent");
const membersList = document.getElementById("membersList");
const saveReport = document.getElementById("saveReport");

// Définir la date par défaut à aujourd'hui
reportDate.valueAsDate = new Date();

function loadMembersForReport() {
  membersList.innerHTML = "";

  database.personnes.forEach((membre) => {
    const div = document.createElement("div");
    div.className = "member-item";
    div.innerHTML = `
            <span>${membre.prenom} ${membre.nom}</span>
            <div class="presence-toggle">
                <button class="presence-btn" data-id="${membre.id}" data-present="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Présent
                </button>
                <button class="presence-btn" data-id="${membre.id}" data-present="false">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Absent
                </button>
            </div>
        `;
    membersList.appendChild(div);
  });

  // Gérer les clics sur les boutons de présence
  document.querySelectorAll(".presence-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const parent = this.parentElement;
      parent.querySelectorAll(".presence-btn").forEach((b) => {
        b.classList.remove("present", "absent");
      });

      if (this.dataset.present === "true") {
        this.classList.add("present");
      } else {
        this.classList.add("absent");
      }
    });
  });
}

saveReport.addEventListener("click", () => {
  const date = reportDate.value;
  const evenement = reportEvent.value.trim() || "Culte du Dimanche";

  if (!date) {
    alert("Veuillez sélectionner une date");
    return;
  }

  const presencePromises = [];
  document
    .querySelectorAll(".presence-btn.present, .presence-btn.absent")
    .forEach((btn) => {
      const membreId = parseInt(btn.dataset.id);
      const present = btn.dataset.present === "true";

      presencePromises.push(
        enregistrerPresence({
          membreId: membreId,
          present: present,
          date: date,
          evenement: evenement,
          remarque: "",
        }),
      );
    });

  if (presencePromises.length > 0) {
    Promise.all(presencePromises)
      .then(() => {
        // Notification toast au lieu du message dans le chat
        showNotification(
          "info",
          "Rapport enregistré!",
          `${presencePromises.length} membre(s) enregistré(s) pour ${evenement} du ${new Date(date).toLocaleDateString("fr-FR")}`,
        );
        closeSidebarFunc();

        // Réinitialiser les boutons
        document.querySelectorAll(".presence-btn").forEach((btn) => {
          btn.classList.remove("present", "absent");
        });
      })
      .catch((error) => {
        // Notification d'erreur au lieu du message dans le chat
        showNotification("error", "Erreur", error.message);
      });
  } else {
    alert("Veuillez marquer au moins une présence/absence");
  }
});

// ===== STATISTIQUES =====
const statsFilter = document.getElementById("statsFilter");
const memberSelect = document.getElementById("memberSelect");
const statsDisplay = document.getElementById("statsDisplay");

statsFilter.addEventListener("change", () => {
  if (statsFilter.value === "individual") {
    memberSelect.style.display = "block";
    loadMemberSelect();
  } else {
    memberSelect.style.display = "none";
    loadStats();
  }
});

memberSelect.addEventListener("change", loadStats);

function loadMemberSelect() {
  memberSelect.innerHTML = '<option value="">Sélectionner un membre</option>';
  database.personnes.forEach((membre) => {
    const option = document.createElement("option");
    option.value = membre.id;
    option.textContent = `${membre.prenom} ${membre.nom}`;
    memberSelect.appendChild(option);
  });
}

function loadStats() {
  // Charger les statistiques générales
  loadGeneralStats();

  if (statsFilter.value === "all") {
    const stats = getStatistiques();
    let html =
      '<h4 style="margin-bottom: 15px; color: #6366f1; display: flex; align-items: center; gap: 8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>Statistiques par Membre</h4>';

    stats.forEach((s) => {
      html += `
                <div class="stat-item">
                    <h4>${s.nom}</h4>
                    <p>Présences: ${s.presences} | Absences: ${s.absences}</p>
                    <p>Taux de présence: <strong>${s.taux}%</strong></p>
                </div>
            `;
    });

    statsDisplay.innerHTML = html;
  } else if (statsFilter.value === "individual" && memberSelect.value) {
    const stats = getStatistiques(parseInt(memberSelect.value));
    if (stats) {
      statsDisplay.innerHTML = `
                <h4 style="margin-bottom: 15px; color: #6366f1; display: flex; align-items: center; gap: 8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>Statistiques de ${stats.membre}</h4>
                <div class="stat-item">
                    <p><strong>Total présences:</strong> ${stats.totalPresences}</p>
                    <p><strong>Total absences:</strong> ${stats.totalAbsences}</p>
                    <p><strong>Taux de présence:</strong> ${stats.tauxPresence}%</p>
                    <p><strong>Dernière présence:</strong> ${stats.dernierePresence !== "Aucune" ? new Date(stats.dernierePresence).toLocaleDateString("fr-FR") : "Aucune"}</p>
                </div>
            `;
    }
  } else {
    statsDisplay.innerHTML =
      "<p>Sélectionnez une option pour voir les statistiques</p>";
  }
}

function loadGeneralStats() {
  const totalMembres = database.personnes.length;
  const totalPresences = database.presences.length;
  const totalPresents = database.presences.filter((p) => p.present).length;
  const totalAbsents = totalPresences - totalPresents;
  const tauxGlobal =
    totalPresences > 0 ? Math.round((totalPresents / totalPresences) * 100) : 0;

  // Statistiques par événement
  const evenements = {};
  database.presences.forEach((p) => {
    const event = p.evenement || "Non spécifié";
    if (!evenements[event]) {
      evenements[event] = { total: 0, presents: 0 };
    }
    evenements[event].total++;
    if (p.present) evenements[event].presents++;
  });

  // Membres baptisés
  const baptises = database.personnes.filter((p) => p.baptise === "oui").length;
  const nonBaptises = database.personnes.filter(
    (p) => p.baptise === "non",
  ).length;

  // Statistiques par rôle/groupe
  const roles = {};
  database.personnes.forEach((p) => {
    const role = p.role || "Non spécifié";
    if (!roles[role]) {
      roles[role] = 0;
    }
    roles[role]++;
  });

  let html = `
    <div class="general-stat-item">
      <span class="label">Total Membres</span>
      <span class="value">${totalMembres}</span>
    </div>
    <div class="general-stat-item">
      <span class="label">Membres Baptisés</span>
      <span class="value">${baptises}</span>
    </div>
    <div class="general-stat-item">
      <span class="label">Non Baptisés</span>
      <span class="value">${nonBaptises}</span>
    </div>
    <div class="general-stat-item">
      <span class="label">Total Présences Enregistrées</span>
      <span class="value">${totalPresences}</span>
    </div>
    <div class="general-stat-item">
      <span class="label">Taux de Présence Global</span>
      <span class="value">${tauxGlobal}%</span>
    </div>
  `;

  // Ajouter les stats par rôle/groupe
  if (Object.keys(roles).length > 0) {
    html +=
      '<div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e2e8f0;"><p style="font-weight: 600; margin-bottom: 10px; color: #0f172a; display: flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>Par Rôle/Groupe:</p>';
    Object.entries(roles)
      .sort((a, b) => b[1] - a[1])
      .forEach(([role, count]) => {
        html += `
        <div class="general-stat-item">
          <span class="label">${role}</span>
          <span class="value">${count} membre${count > 1 ? "s" : ""}</span>
        </div>
      `;
      });
    html += "</div>";
  }

  // Ajouter les stats par événement
  if (Object.keys(evenements).length > 0) {
    html +=
      '<div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e2e8f0;"><p style="font-weight: 600; margin-bottom: 10px; color: #0f172a; display: flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Par Événement:</p>';
    Object.entries(evenements).forEach(([event, data]) => {
      const taux = Math.round((data.presents / data.total) * 100);
      html += `
        <div class="general-stat-item">
          <span class="label">${event}</span>
          <span class="value">${data.presents}/${data.total} (${taux}%)</span>
        </div>
      `;
    });
    html += "</div>";
  }

  document.getElementById("generalStats").innerHTML = html;
}

// ===== MODIFIER PHOTO =====
const photoMemberSelect = document.getElementById("photoMemberSelect");
const photoInputUpload = document.getElementById("photoInputUpload");
const photoPreviewUpload = document.getElementById("photoPreviewUpload");
const currentPhotoPreview = document.getElementById("currentPhotoPreview");
const currentPhotoImg = document.getElementById("currentPhotoImg");
const savePhotoBtn = document.getElementById("savePhotoBtn");

let selectedPhotoData = null;

function loadMembersForPhotoUpload() {
  photoMemberSelect.innerHTML =
    '<option value="">Choisir un membre...</option>';
  database.personnes.forEach((membre) => {
    const option = document.createElement("option");
    option.value = membre.id;
    option.textContent = `${membre.prenom} ${membre.nom}`;
    photoMemberSelect.appendChild(option);
  });
}

photoMemberSelect.addEventListener("change", (e) => {
  const membreId = parseInt(e.target.value);
  if (membreId) {
    const membre = database.personnes.find((p) => p.id === membreId);
    if (membre) {
      // Afficher la photo actuelle si elle existe
      if (membre.photo) {
        currentPhotoPreview.style.display = "block";
        currentPhotoImg.src = membre.photo;
      } else {
        currentPhotoPreview.style.display = "none";
      }

      // Réinitialiser la prévisualisation
      photoPreviewUpload.innerHTML = `<svg class="photo-preview-placeholder" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>`;
      photoInputUpload.value = "";
      selectedPhotoData = null;
      savePhotoBtn.disabled = true;
    }
  } else {
    currentPhotoPreview.style.display = "none";
    savePhotoBtn.disabled = true;
  }
});

photoInputUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedPhotoData = e.target.result;
      photoPreviewUpload.innerHTML = `<img src="${selectedPhotoData}" alt="Nouvelle photo">`;
      savePhotoBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }
});

savePhotoBtn.addEventListener("click", async () => {
  const membreId = parseInt(photoMemberSelect.value);
  if (!membreId || !selectedPhotoData) {
    showNotification(
      "error",
      "Erreur",
      "Veuillez sélectionner un membre et une photo",
    );
    return;
  }

  const membre = database.personnes.find((p) => p.id === membreId);
  if (!membre) {
    showNotification("error", "Erreur", "Membre introuvable");
    return;
  }

  try {
    await modifierMembre(membreId, { photo: selectedPhotoData });

    showNotification(
      "success",
      "Photo mise à jour!",
      `La photo de ${membre.prenom} ${membre.nom} a été modifiée`,
    );

    // Réinitialiser
    photoMemberSelect.value = "";
    photoPreviewUpload.innerHTML = `<svg class="photo-preview-placeholder" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>`;
    photoInputUpload.value = "";
    currentPhotoPreview.style.display = "none";
    selectedPhotoData = null;
    savePhotoBtn.disabled = true;

    closeSidebarFunc();
  } catch (error) {
    showNotification("error", "Erreur", error.message);
  }
});

// ===== GRAPHIQUES =====
let presenceChartInstance = null;
let roleChartInstance = null;
let memberChartInstance = null;

function loadCharts() {
  loadPresenceChart();
  loadRoleChart();
  loadMemberChart();
}

function loadPresenceChart() {
  const ctx = document.getElementById("presenceChart");

  // Grouper les présences par date
  const presencesByDate = {};
  database.presences.forEach((p) => {
    if (!presencesByDate[p.date]) {
      presencesByDate[p.date] = { presents: 0, absents: 0 };
    }
    if (p.present) {
      presencesByDate[p.date].presents++;
    } else {
      presencesByDate[p.date].absents++;
    }
  });

  // Trier par date et prendre les 10 dernières
  const sortedDates = Object.keys(presencesByDate).sort().slice(-10);
  const labels = sortedDates.map((d) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    }),
  );
  const presentsData = sortedDates.map((d) => presencesByDate[d].presents);
  const absentsData = sortedDates.map((d) => presencesByDate[d].absents);

  if (presenceChartInstance) {
    presenceChartInstance.destroy();
  }

  presenceChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Présents",
          data: presentsData,
          borderColor: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          tension: 0.4,
        },
        {
          label: "Absents",
          data: absentsData,
          borderColor: "#f44336",
          backgroundColor: "rgba(244, 67, 54, 0.1)",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
}

function loadRoleChart() {
  const ctx = document.getElementById("roleChart");

  // Compter les membres par rôle
  const roles = {};
  database.personnes.forEach((p) => {
    const role = p.role || "Non spécifié";
    roles[role] = (roles[role] || 0) + 1;
  });

  const labels = Object.keys(roles);
  const data = Object.values(roles);
  const colors = [
    "#4a90e2",
    "#e74c3c",
    "#f39c12",
    "#2ecc71",
    "#9b59b6",
    "#1abc9c",
    "#34495e",
    "#e67e22",
  ];

  if (roleChartInstance) {
    roleChartInstance.destroy();
  }

  roleChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 12,
            font: {
              size: 11,
            },
          },
        },
      },
    },
  });
}

function loadMemberChart() {
  const ctx = document.getElementById("memberChart");

  // Calculer le taux de présence par membre
  const memberStats = database.personnes
    .map((membre) => {
      const presences = database.presences.filter(
        (p) => p.membreId === membre.id,
      );
      const taux =
        presences.length > 0
          ? Math.round(
              (presences.filter((p) => p.present).length / presences.length) *
                100,
            )
          : 0;
      return {
        nom: `${membre.prenom} ${membre.nom.charAt(0)}.`,
        taux: taux,
      };
    })
    .sort((a, b) => b.taux - a.taux)
    .slice(0, 10);

  const labels = memberStats.map((m) => m.nom);
  const data = memberStats.map((m) => m.taux);

  if (memberChartInstance) {
    memberChartInstance.destroy();
  }

  memberChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Taux de présence (%)",
          data: data,
          backgroundColor: "#4a90e2",
          borderColor: "#357abd",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
          },
        },
        x: {
          ticks: {
            font: {
              size: 10,
            },
          },
        },
      },
    },
  });
}
