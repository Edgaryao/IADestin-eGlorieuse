// Remplacez ces valeurs par vos propres clés Supabase
const SUPABASE_URL = "https://gwrvtfcbvlouebwsjipn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OAjXhB31pLTsOuGguP9iIA_rNON91Le";

// Initialiser le client Supabase
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

// ===== FONCTIONS DATABASE SUPABASE =====

// Charger tous les membres depuis Supabase
async function loadMembresFromSupabase() {
  try {
    // Vérifier que database existe
    if (typeof database === "undefined") {
      console.error("❌ database n'est pas encore défini");
      return [];
    }

    const { data, error } = await supabaseClient
      .from("personnes")
      .select("*")
      .order("dateinscription", { ascending: false });

    if (error) throw error;

    database.personnes = data || [];
    console.log(`✅ ${data?.length || 0} membres chargés`);
    return data;
  } catch (error) {
    console.error("Erreur chargement membres:", error);
    return [];
  }
}

// Charger toutes les présences depuis Supabase
async function loadPresencesFromSupabase() {
  try {
    // Vérifier que database existe
    if (typeof database === "undefined") {
      console.error("❌ database n'est pas encore défini");
      return [];
    }

    const { data, error } = await supabaseClient
      .from("presences")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;

    database.presences = data || [];
    console.log(`✅ ${data?.length || 0} présences chargées`);
    return data;
  } catch (error) {
    console.error("Erreur chargement présences:", error);
    return [];
  }
}

// Ajouter un membre dans Supabase
async function ajouterMembreSupabase(data) {
  try {
    const { data: newMembre, error } = await supabaseClient
      .from("personnes")
      .insert([
        {
          nom: data.nom,
          prenom: data.prenom,
          datearrivee: data.dateArrivee,
          datenaissance: data.dateNaissance,
          age: data.age,
          invitepar: data.invitePar,
          role: data.role,
          baptise: data.baptise,
          dejachretien: data.dejaChretien,
          egliseorigine: data.egliseOrigine,
          parrecommandation: data.parRecommandation,
          recommandepar: data.recommandePar,
          lieuhabitation: data.lieuHabitation,
          localisation: data.localisation,
          numero: data.numero,
          sujetpriere: data.sujetPriere,
          infosperso: data.infosPerso,
          photo: data.photo,
          dateinscription: new Date().toISOString().split("T")[0],
        },
      ])
      .select()
      .single();

    if (error) throw error;

    database.personnes.push(newMembre);
    return newMembre;
  } catch (error) {
    console.error("Erreur ajout membre:", error);
    throw error;
  }
}

// Mettre à jour un membre dans Supabase
async function modifierMembreSupabase(membreId, updates) {
  try {
    // Convertir les clés camelCase en snake_case pour Supabase
    const supabaseUpdates = {};
    const keyMapping = {
      nom: "nom",
      prenom: "prenom",
      dateArrivee: "datearrivee",
      dateNaissance: "datenaissance",
      age: "age",
      invitePar: "invitepar",
      role: "role",
      baptise: "baptise",
      dejaChretien: "dejachretien",
      egliseOrigine: "egliseorigine",
      parRecommandation: "parrecommandation",
      recommandePar: "recommandepar",
      lieuHabitation: "lieuhabitation",
      localisation: "localisation",
      numero: "numero",
      sujetPriere: "sujetpriere",
      infosPerso: "infosperso",
      photo: "photo",
    };

    Object.keys(updates).forEach((key) => {
      if (keyMapping[key]) {
        supabaseUpdates[keyMapping[key]] = updates[key];
      }
    });

    const { data: updatedMembre, error } = await supabaseClient
      .from("personnes")
      .update(supabaseUpdates)
      .eq("id", membreId)
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour dans la base locale
    const index = database.personnes.findIndex((p) => p.id === membreId);
    if (index !== -1) {
      database.personnes[index] = updatedMembre;
    }

    return updatedMembre;
  } catch (error) {
    console.error("Erreur modification membre:", error);
    throw error;
  }
}

// Enregistrer une présence dans Supabase
async function enregistrerPresenceSupabase(data) {
  try {
    const { data: newPresence, error } = await supabaseClient
      .from("presences")
      .insert([
        {
          membreid: data.membreId,
          date: data.date || new Date().toISOString().split("T")[0],
          present: data.present !== false,
          evenement: data.evenement || "Culte du Dimanche",
          remarque: data.remarque || "",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    database.presences.push(newPresence);
    return newPresence;
  } catch (error) {
    console.error("Erreur enregistrement présence:", error);
    throw error;
  }
}

// Initialiser la base de données au chargement
async function initDatabase() {
  // Attendre que database soit défini (max 5 secondes)
  let attempts = 0;
  const maxAttempts = 50;

  while (typeof database === "undefined" && attempts < maxAttempts) {
    console.warn(
      `⏳ En attente de la définition de database... (tentative ${attempts + 1}/${maxAttempts})`,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (typeof database === "undefined") {
    console.error("❌ Timeout: database n'a pas pu être chargé");
    return;
  }

  try {
    console.log("🔄 Chargement des données depuis Supabase...");
    await Promise.all([loadMembresFromSupabase(), loadPresencesFromSupabase()]);
    console.log("✅ Base de données chargée depuis Supabase");
  } catch (error) {
    console.error("❌ Erreur initialisation database:", error);
  }
}

// Charger les données au démarrage (attendre que le DOM soit prêt)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDatabase);
} else {
  initDatabase();
}
