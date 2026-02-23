# Déploiement KeTeaAI (GitHub Pages + Render)

## Vue d’ensemble

- **Frontend** : hébergé sur GitHub Pages (HTTPS).
- **Backend** : API Python (Flask + Gemini) déployée sur Render (ou Railway, etc.) pour être accessible en HTTPS.

## 1. Backend sur Render

1. Créez un compte sur [Render](https://render.com).
2. **New** → **Web Service**.
3. Liez votre dépôt GitHub (KeTeaAI).
4. Paramètres :
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `python api.py`
   - **Variable d’environnement** : `GEMINI_API_KEY` = votre clé Gemini (ne pas la mettre dans le code).
5. Déployez. Notez l’URL du service (ex. `https://keteaai-api.onrender.com`).

## 2. Adapter l’URL dans le frontend

Dans **app.js**, vérifiez :

- `IS_PRODUCTION = true` pour la version déployée sur GitHub Pages.
- `API_BASE_URL_PRODUCTION = 'https://VOTRE-APP.onrender.com'` (l’URL exacte de votre service Render, sans slash final).

Puis poussez les changements et laissez GitHub Pages se mettre à jour.

## 3. Développement en local

- Mettez `IS_PRODUCTION = false` dans **app.js**.
- Définissez `GEMINI_API_KEY` (export ou `.env`) et lancez `python api.py`.
- Ouvrez **http://127.0.0.1:5000/**.

## 4. Résumé des variables

| Fichier   | Variable                  | Rôle |
|----------|---------------------------|------|
| **api.py** | `PORT` (env)             | Port fourni par Render. |
| **api.py** | `GEMINI_API_KEY` (env)   | Clé API Gemini (à définir sur Render). |
| **app.js** | `IS_PRODUCTION`          | `true` = appeler l’API Render, `false` = local. |
| **app.js** | `API_BASE_URL_PRODUCTION` | URL HTTPS de votre backend (ex. Render). |
