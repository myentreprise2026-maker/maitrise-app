// Fonction serverless Vercel — analyse une photo de repas avec Groq (vision, gratuit)
// Renvoie : calories estimées, score santé /100, couleur, et suggestions.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: "Clé GROQ_API_KEY manquante dans les variables d'environnement Vercel." });
    return;
  }

  const { imageBase64 } = req.body || {};
  if (!imageBase64) {
    res.status(400).json({ error: 'Aucune image reçue.' });
    return;
  }

  const systemPrompt = `Tu es un nutritionniste assistant intégré à une application de fitness. On te montre une photo d'un plat ou d'une boisson. Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, sans balises markdown, au format exact suivant :
{
  "aliment_detecte": "description courte du plat/boisson en français",
  "kcal_estime": nombre entier (estimation des calories totales de la portion visible),
  "score_sante": nombre entier de 0 à 100 (100 = excellent pour la santé, 0 = très mauvais),
  "couleur": "vert" si score >= 65, "orange" si score entre 35 et 64, "rouge" si score < 35,
  "resume": "une phrase courte expliquant le score, bienveillante et sans jugement",
  "suggestions": ["1 à 3 suggestions courtes et concrètes d'aliments à ajouter, changer ou enlever pour améliorer le plat"]
}
Sois honnête mais toujours bienveillant, jamais culpabilisant. Si l'image ne montre pas de nourriture, mets kcal_estime à 0 et explique-le dans resume, avec suggestions vide.`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 500,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              { type: 'image_url', image_url: { url: imageBase64 } },
            ],
          },
        ],
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      res.status(500).json({ error: data.error?.message || 'Erreur Groq.' });
      return;
    }

    const raw = data.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      res.status(500).json({ error: "Réponse de l'IA illisible, réessaie." });
      return;
    }

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur : ' + e.message });
  }
};
