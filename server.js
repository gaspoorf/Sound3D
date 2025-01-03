const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Importer le middleware CORS

const app = express();
const PORT = 3000;

// Utiliser le middleware CORS pour autoriser toutes les origines
app.use(cors());

// Route pour la recherche de morceaux (déjà existante)
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    const response = await axios.get(`https://api.deezer.com/search`, {
      params: { q: query },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Erreur avec l\'API Deezer');
  }
});

// Nouvelle route pour récupérer un fichier audio depuis Deezer
app.get('/api/audio', async (req, res) => {
  try {
    const audioUrl = req.query.url; // L'URL du fichier audio Deezer

    // Vérifier si l'URL est fournie
    if (!audioUrl) {
      return res.status(400).send('L\'URL du fichier audio est requise');
    }

    // Récupérer le fichier audio depuis Deezer
    const response = await axios.get(audioUrl, {
      responseType: 'arraybuffer', // Nous récupérons les données sous forme binaire
    });

    // Spécifier le type de contenu pour un fichier audio MP3
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data); // Envoie les données binaires (le fichier audio) au frontend
  } catch (error) {
    console.error('Erreur lors de la récupération du fichier audio:', error);
    res.status(500).send('Erreur avec la récupération du fichier audio');
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur proxy en écoute sur http://localhost:${PORT}`);
});
