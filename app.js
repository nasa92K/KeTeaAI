/**
 * KeTeaAI — Connexion directe à l'API Google Gemini (GitHub Pages, sans backend).
 * URL exacte : .../v1beta/models/gemini-1.5-flash:generateContent?key=VOTRE_CLE_API
 */

(function () {
  'use strict';

  // ========== CLÉ API (remplacer par la vôtre si besoin) ==========
  const API_KEY = 'AIzaSyDbwzTyFQqVhTctFJMus53FK1WJVFFJmiE';

  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY;

  // Personnalité KeTeaAI : intégrée au début du prompt envoyé à Gemini
  const KEETEAI_INSTRUCTION = 'Tu es KeTeaAI, un assistant étudiant bienveillant, pédagogique et concis. Réponds en restant utile et clair.\n\n';

  /**
   * Appel direct à l'API Gemini. Body strict : contents > parts > text.
   */
  async function callGemini(userPrompt) {
    const promptWithPersonality = KEETEAI_INSTRUCTION + userPrompt;

    const body = {
      contents: [
        { parts: [{ text: promptWithPersonality }] }
      ]
    };

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const responseText = await response.text();

    if (!response.ok) {
      if (typeof console !== 'undefined') {
        console.error('[KeTeaAI] API erreur', response.status, responseText);
      }
      let errMsg = responseText;
      try {
        const errJson = JSON.parse(responseText);
        if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
      } catch (_) {}
      if (response.status === 404) {
        errMsg = 'Modèle non trouvé (404). Vérifiez l\'URL et le nom du modèle (gemini-1.5-flash).';
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
      appendMessage('Erreur : ' + err.message, 'ai');
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
