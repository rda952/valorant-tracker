// --- Import des modules nécessaires ---
require('dotenv').config(); // Charge les variables d'environnement (comme la clé API)
const express = require('express');
const axios = a('axios');
const cors = require('cors');
const path = require('path');

// --- Initialisation de l'application Express ---
const app = express();
const PORT = process.env.PORT || 3000; // Le port pour le serveur (Render le fournira)

// --- Configuration des Middlewares ---
app.use(cors()); // Active CORS pour autoriser les requêtes depuis d'autres origines
app.use(express.json()); // Permet au serveur de comprendre le JSON

// Sert les fichiers statiques (votre fichier HTML, CSS, etc.) depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// --- Endpoint de l'API ---
// Cet endpoint sera appelé par votre page web pour récupérer les stats
app.get('/api/stats/:name/:tag', async (req, res) => {
    const { name, tag } = req.params;
    const riotApiKey = process.env.RIOT_API_KEY;

    if (!riotApiKey) {
        return res.status(500).json({ message: "La clé API Riot n'est pas configurée sur le serveur." });
    }

    try {
        // --- Étape 1: Obtenir le PUUID du joueur à partir de son Riot ID ---
        const accountUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}?api_key=${riotApiKey}`;
        const accountResponse = await axios.get(accountUrl);
        const puuid = accountResponse.data.puuid;

        if (!puuid) {
            return res.status(404).json({ message: "Joueur non trouvé. Vérifiez le nom et le tag." });
        }

        // --- Étape 2 (Exemple): Obtenir l'historique des matchs ---
        // Note: L'API de Riot est complexe. Obtenir des stats détaillées (K/D, etc.)
        // nécessite d'analyser chaque match individuellement. Ceci est un point de départ.
        const matchHistoryUrl = `https://europe.api.riotgames.com/valorant/v1/match-history/by-puuid/${puuid}?api_key=${riotApiKey}`;
        const matchHistoryResponse = await axios.get(matchHistoryUrl);

        // --- Étape 3 (Simulation de données supplémentaires) ---
        // L'API de base ne fournit pas facilement l'URL de la carte de joueur ou l'avatar.
        // Nous allons simuler ces données pour l'affichage.
        const simulatedData = {
            player: {
                name: accountResponse.data.gameName,
                tag: accountResponse.data.tagLine,
                level: 50 + Math.floor(Math.random() * 150), // Niveau simulé
                avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${name}`, // Avatar généré
                cardUrl: `https://picsum.photos/seed/${name}/1000/200` // Carte de fond aléatoire
            },
            matchHistory: matchHistoryResponse.data.history.slice(0, 5) // 5 derniers matchs
        };

        res.json(simulatedData);

    } catch (error) {
        console.error("Erreur lors de l'appel à l'API Riot:", error.response ? error.response.data : error.message);
        if (error.response) {
            if (error.response.status === 404) {
                return res.status(404).json({ message: "Joueur non trouvé. Le Riot ID est peut-être incorrect." });
            }
            if (error.response.status === 403) {
                return res.status(403).json({ message: "Clé API Riot invalide ou expirée." });
            }
        }
        res.status(500).json({ message: "Une erreur interne est survenue lors de la récupération des données." });
    }
});

// --- Démarrage du serveur ---
app.listen(PORT, () => {
    console.log(`Le serveur est démarré sur http://localhost:${PORT}`);
});
