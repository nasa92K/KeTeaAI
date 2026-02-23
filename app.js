/**
 * KeTeaAI — Connexion directe à l'API Google Gemini (GitHub Pages).
 * Modèle principal : gemini-2.0-flash. Fallback : gemini-1.5-flash.
 */

(function () {
  'use strict';

  // Clé lue depuis config.js (fichier non versionné). Voir config.example.js.
  const API_KEY = (typeof window !== 'undefined' && window.KEETEAI_API_KEY) ? window.KEETEAI_API_KEY : '';

  // Modèle principal puis fallback (gemini-1.5-flash-8b n’existe pas en v1beta)
  const MODEL_PRIMARY = 'gemini-2.0-flash';
  const MODEL_FALLBACK = 'gemini-1.5-flash';

  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

  // Instruction système invisible au début de chaque message (personnalité étudiant)
  const KEETEAI_INSTRUCTION = 'Tu es KeTeaAI, un assistant étudiant expert. Réponds de façon claire, encourageante et structure tes réponses avec des puces si nécessaire.\n\n';

  /**
   * Appel Gemini avec un modèle donné. Body strict : { contents: [{ parts: [{ text }] }] }.
   */
  async function fetchWithModel(modelId, promptText) {
    const url = BASE_URL + modelId + ':generateContent?key=' + API_KEY;
    const body = { contents: [{ parts: [{ text: promptText }] }] };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errMsg = responseText;
      try {
        const errJson = JSON.parse(responseText);
        if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
      } catch (_) {}
      if (typeof console !== 'undefined') {
        console.error('[KeTeaAI]', modelId, response.status, errMsg);
      }
      throw new Error(errMsg);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (_) {
      throw new Error('Réponse API invalide');
    }

    const candidate = data.candidates && data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      if (typeof console !== 'undefined') console.error('[KeTeaAI] Structure:', data);
      throw new Error('Réponse Gemini invalide');
    }
    return candidate.content.parts[0].text;
  }

  /**
   * Message utilisateur en cas de quota / clé révoquée.
   */
  function friendlyErrorMessage(err) {
    const msg = (err && err.message) ? err.message : String(err);
    if (/quota|limit: 0|billing|rate.limit|retry in/i.test(msg)) {
      return 'Quota ou limite atteinte. Réessayez dans quelques minutes ou consultez https://ai.google.dev/gemini-api/docs/rate-limits';
    }
    if (/leaked|invalid.*key|API key/i.test(msg)) {
      return 'Clé API invalide ou révoquée. Créez une nouvelle clé sur https://aistudio.google.com/apikey et mettez-la dans app.js (const API_KEY). Ne commitez pas la clé sur Git.';
    }
    return msg;
  }

  /**
   * Appel Gemini : essaie gemini-2.0-flash, puis gemini-1.5-flash en fallback.
   */
  async function callGemini(userPrompt) {
    if (!API_KEY || !API_KEY.trim()) {
      throw new Error('Clé API manquante. Dans app.js, définissez const API_KEY avec votre clé (https://aistudio.google.com/apikey).');
    }
    const promptWithPersonality = KEETEAI_INSTRUCTION + userPrompt;

    try {
      return await fetchWithModel(MODEL_PRIMARY, promptWithPersonality);
    } catch (err) {
      if (typeof console !== 'undefined') {
        console.warn('[KeTeaAI] Fallback vers', MODEL_FALLBACK);
      }
      try {
        return await fetchWithModel(MODEL_FALLBACK, promptWithPersonality);
      } catch (err2) {
        throw new Error(friendlyErrorMessage(err));
      }
    }
  }

  // Éléments DOM
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const chatMessages = document.getElementById('chatMessages');
  const typingIndicator = document.getElementById('typingIndicator');
  const btnSend = document.getElementById('btnSend');
  const btnNewChat = document.getElementById('btnNewChat');
  const sidebar = document.getElementById('sidebar');
  const sidebarOpen = document.getElementById('sidebarOpen');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  let isWaitingForResponse = false;

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

  function clearChatUI() {
    if (!chatMessages) return;
    const welcome = chatMessages.querySelector('.message-ai[data-role="ai"]');
    chatMessages.innerHTML = '';
    if (welcome) chatMessages.appendChild(welcome);
  }

  if (btnNewChat) {
    btnNewChat.addEventListener('click', function () {
      clearChatUI();
      closeSidebar();
    });
  }

  // Bulles Bootstrap : card, p-3, rounded
  function appendMessage(content, role) {
    if (!chatMessages || !content.trim()) return;

    const div = document.createElement('div');
    div.className = 'message message-' + role + ' mb-3 d-flex gap-2';
    div.setAttribute('data-role', role);

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar align-self-start';
    avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble card p-3 rounded-3';
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.textContent = content;
    bubble.appendChild(contentEl);

    div.appendChild(avatar);
    div.appendChild(bubble);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

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
      const reply = await callGemini(text);
      setTypingIndicator(false);
      appendMessage(reply, 'ai');
    } catch (err) {
      setTypingIndicator(false);
      var msg = err && err.message ? err.message : String(err);
      if (/quota|leaked|API key|billing/i.test(msg)) msg = friendlyErrorMessage(err);
      appendMessage('Erreur : ' + msg, 'ai');
    } finally {
      isWaitingForResponse = false;
      if (btnSend) btnSend.disabled = false;
    }
  }

  if (chatForm) chatForm.addEventListener('submit', handleSubmit);

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
})();
