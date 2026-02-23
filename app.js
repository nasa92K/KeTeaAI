/**
 * KeTeaAI — Logique frontend (séparée du HTML)
 * Branchez votre API backend dans sendMessageToAPI() via fetch().
 */

(function () {
  'use strict';

  // ========== CONFIGURATION API ==========
  // Remplacez par l’URL de votre backend (ex: Flask, FastAPI, Express)
  const API_BASE_URL = '/api';  // ex: 'http://localhost:5000/api' ou 'https://votre-domaine.com/api'
  const API_CHAT_ENDPOINT = `${API_BASE_URL}/chat`;  // Endpoint pour envoyer un message et recevoir la réponse IA

  // Éléments DOM
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const chatMessages = document.getElementById('chatMessages');
  const typingIndicator = document.getElementById('typingIndicator');
  const btnSend = document.getElementById('btnSend');
  const btnNewChat = document.getElementById('btnNewChat');
  const chatHistory = document.getElementById('chatHistory');
  const sidebar = document.getElementById('sidebar');
  const sidebarOpen = document.getElementById('sidebarOpen');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  // État simple (à remplacer par un store si besoin)
  let isWaitingForResponse = false;

  // ========== SIDEBAR (mobile) ==========
  function openSidebar() {
    if (sidebar) sidebar.classList.add('show');
    if (sidebarOverlay) sidebarOverlay.classList.add('show');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('show');
    if (sidebarOverlay) sidebarOverlay.classList.remove('show');
  }

  if (sidebarOpen) sidebarOpen.addEventListener('click', openSidebar);
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // ========== NOUVELLE CONVERSATION ==========
  function clearChatUI() {
    if (!chatMessages) return;
    // Garder uniquement le premier message (bienvenue IA)
    const welcome = chatMessages.querySelector('.message-ai[data-role="ai"]');
    chatMessages.innerHTML = '';
    if (welcome) chatMessages.appendChild(welcome);
  }

  if (btnNewChat) {
    btnNewChat.addEventListener('click', function () {
      clearChatUI();
      closeSidebar();
      // Ici : réinitialiser l’historique côté backend si votre API gère des sessions
      // exemple : fetch(API_BASE_URL + '/new-session', { method: 'POST' });
    });
  }

  // ========== AFFICHAGE DES MESSAGES ==========
  /**
   * Ajoute une bulle de message dans la zone de chat.
   * @param {string} content - Texte du message
   * @param {'user'|'ai'} role - 'user' ou 'ai'
   */
  function appendMessage(content, role) {
    if (!chatMessages || !content.trim()) return;

    const div = document.createElement('div');
    div.className = `message message-${role} mb-3`;
    div.setAttribute('data-role', role);

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.textContent = content;
    bubble.appendChild(contentEl);

    div.appendChild(avatar);
    div.appendChild(bubble);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Affiche ou masque l’indicateur « l’IA tape ».
   * @param {boolean} show
   */
  function setTypingIndicator(show) {
    if (!typingIndicator) return;
    if (show) {
      typingIndicator.classList.remove('d-none');
      typingIndicator.classList.add('d-flex');
    } else {
      typingIndicator.classList.add('d-none');
      typingIndicator.classList.remove('d-flex');
    }
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ========== APPEL API (À BRANCHER SUR VOTRE BACKEND) ==========
  /**
   * Envoie le message utilisateur à votre API et retourne la réponse IA.
   * Adaptez l’URL, la méthode et le format (JSON) selon votre backend.
   *
   * Exemple attendu côté backend :
   *   POST /api/chat
   *   Body: { "message": "Texte du message utilisateur" }
   *   Response: { "reply": "Réponse de l’IA" }
   *
   * @param {string} userMessage - Message envoyé par l’utilisateur
   * @returns {Promise<string>} - Réponse texte de l’IA
   */
  async function sendMessageToAPI(userMessage) {
    const response = await fetch(API_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer VOTRE_TOKEN',  // si votre API exige une auth
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Erreur ${response.status}`);
    }

    const data = await response.json();
    // Adaptez selon le nom du champ renvoyé par votre API (ex: "reply", "response", "text")
    return data.reply ?? data.response ?? data.text ?? String(data);
  }

  // ========== ENVOI DU MESSAGE (FORMULAIRE) ==========
  function getTrimmedValue() {
    return messageInput ? messageInput.value.trim() : '';
  }

  function clearInput() {
    if (messageInput) {
      messageInput.value = '';
      messageInput.style.height = 'auto';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = getTrimmedValue();
    if (!text || isWaitingForResponse) return;

    appendMessage(text, 'user');
    clearInput();
    if (btnSend) btnSend.disabled = true;
    isWaitingForResponse = true;
    setTypingIndicator(true);

    try {
      const reply = await sendMessageToAPI(text);
      setTypingIndicator(false);
      appendMessage(reply, 'ai');
    } catch (err) {
      setTypingIndicator(false);
      appendMessage('Désolé, une erreur est survenue. Vérifiez que le backend est démarré et que l’URL dans app.js (API_CHAT_ENDPOINT) est correcte. Détail : ' + err.message, 'ai');
    } finally {
      isWaitingForResponse = false;
      if (btnSend) btnSend.disabled = false;
    }
  }

  if (chatForm) chatForm.addEventListener('submit', handleSubmit);

  // ========== AUTO-RESIZE TEXTAREA ==========
  if (messageInput) {
    messageInput.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
    messageInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  // Optionnel : charger l’historique des conversations depuis le localStorage ou votre API
  // function loadHistory() { ... }
  // loadHistory();
})();
