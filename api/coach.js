// Fonction serverless Vercel — appelle Groq (gratuit) côté serveur
// pour que la clé API ne soit jamais visible dans le navigateur.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: "Clé GROQ_API_KEY manquante dans les variables d'environnement Vercel." });
    return;
  }

  const { system, messages } = req.body || {};
  if (!system || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Requête invalide.' });
    return;
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 400,
        temperature: 0.6,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      res.status(500).json({ error: data.error?.message || 'Erreur Groq.' });
      return;
    }

    const text = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur : ' + e.message });
  }
};
