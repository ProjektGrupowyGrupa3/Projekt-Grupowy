// Flashcards — localStorage, sesja nauki, powtórki (kontrolki pod panelem, bez tłumaczeń)
(function () {
  'use strict';

  window.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'flashcards-v1';
    const $ = sel => document.querySelector(sel);

    function getAppLang() {
      try { return localStorage.getItem('language') || document.documentElement.lang || 'pl'; }
      catch { return document.documentElement.lang || 'pl'; }
    }
    function tJS(key, fallback = '') {
      try {
        const lang = getAppLang();
        return (typeof translations !== 'undefined' && translations[lang] && translations[lang].flashcards && translations[lang].flashcards[key]) || fallback;
      } catch (e) { return fallback; }
    }
    function formatTpl(s = '', vars = {}) {
      return (s || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
    }


    // elementy DOM
    const addForm = $('#addForm');
    const qInput = $('#q');
    const aInput = $('#a');
    const cardsList = $('#cardsList');
    const clearAll = $('#clearAll');
    const startBtn = $('#startBtn');
    const shuffleBtn = $('#shuffleBtn');
    const studyArea = $('#studyArea');
    const studyColumn = $('#studyColumn');
    const currentCard = $('#currentCard');
    const questionArea = $('#questionArea');
    const answerArea = $('#answerArea');
    const controls = $('#controls');
    const rememberBtn = $('#rememberBtn');
    const repeatBtn = $('#repeatBtn');
    const stateInfo = $('#stateInfo');
    const sessionSummary = $('#sessionSummary');
    const noCards = $('#noCards');
    const cardsColumn = $('#cardsColumn');

    if (!addForm || !qInput || !aInput || !cardsList) {
      console.warn('[flashcardsScript] brak wymaganych elementów DOM — sprawdź views/flashcards.html');
      return;
    }

    let cards = loadCards();
    let studyQueue = [];
    let current = null;
    let stats = { remembered: 0, repeated: 0 };

    renderCards();
    attachEvents();

    function attachEvents() {
      addForm.addEventListener('submit', e => {
        e.preventDefault();
        addCard(qInput.value.trim(), aInput.value.trim());
        qInput.value = '';
        aInput.value = '';
        qInput.focus();
      });

      clearAll && clearAll.addEventListener('click', () => {
        const ok = confirm(tJS('confirmDeleteAll', 'Usunąć wszystkie fiszki?'));
        if (!ok) return;
        cards = [];
        saveCards();
        renderCards();
        resetSession();
      });

      startBtn && startBtn.addEventListener('click', () => {
        if (!cards.length) { alert(tJS('noFlashcardsList', 'Brak fiszek do nauki')); return; }
        startStudy();
      });

      shuffleBtn && shuffleBtn.addEventListener('click', () => {
        cards = shuffleArray(cards);
        saveCards();
        renderCards();
      });

      // kliknięcie na kartę - odsłania odpowiedź i pokazuje kontrolki
      currentCard && currentCard.addEventListener('click', () => {
        if (!current) return;
        if (!answerArea) return;
        answerArea.style.display = 'block';
        controls && controls.classList.remove('d-none');
      });

      rememberBtn && rememberBtn.addEventListener('click', () => handleKnown(true));
      repeatBtn && repeatBtn.addEventListener('click', () => handleKnown(false));
    }

    function addCard(question, answer) {
      if (!question || !answer) { alert(tJS('fillFields', 'Wypełnij pytanie i odpowiedź')); return; }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
      cards.push({ id, q: question, a: answer });
      saveCards();
      renderCards();
    }

    function renderCards() {
      cardsList.innerHTML = '';
      if (!cards.length) {
        cardsList.innerHTML = '<div class="muted" data-translate="noFlashcardsList">Brak fiszek — dodaj pierwszą!</div>';
        return;
      }
      for (const card of cards) {
        const col = document.createElement('div'); col.className = 'col-12';
        const cardEl = document.createElement('div'); cardEl.className = 'card p-2';
        cardEl.innerHTML = `
          <div class="d-flex align-items-start justify-content-between">
            <div class="me-3" style="flex:1">
              <div class="fw-semibold">${escapeHtml(excerpt(card.q,120))}</div>
              <div class="small text-muted">${escapeHtml(excerpt(card.a,180))}</div>
            </div>
            <div class="d-flex gap-1 align-items-start">
              <button data-id="${card.id}" class="btn btn-sm btn-outline-secondary btn-edit" data-translate="editBtn">Edytuj</button>
              <button data-id="${card.id}" class="btn btn-sm btn-danger btn-del" data-translate="deleteBtn">Usuń</button>
            </div>
          </div>
        `;
        col.appendChild(cardEl);
        cardsList.appendChild(col);

        const delBtn = cardEl.querySelector('.btn-del');
        delBtn.addEventListener('click', () => {
          if (!confirm(tJS('confirmDeleteOne','Usunąć tę fiszkę?'))) return;
          cards = cards.filter(c => c.id !== card.id);
          saveCards();
          renderCards();
          resetSession();
        });

        const editBtn = cardEl.querySelector('.btn-edit');
        editBtn.addEventListener('click', () => {
          const newQ = prompt(tJS('promptNewQuestion','Nowe pytanie'), card.q);
          const newA = prompt(tJS('promptNewAnswer','Nowa odpowiedź'), card.a);
          card.q = newQ.trim(); card.a = newA.trim();
          saveCards();
          renderCards();
          resetSession();
        });
      }
    }

    function startStudy() {
      studyQueue = shuffleArray(cards.slice());
      stats = { remembered: 0, repeated: 0 };
      sessionSummary && sessionSummary.classList.add('d-none');
      noCards && noCards.classList.add('d-none');
      studyArea && studyArea.classList.remove('d-none');

      // ukryj lewą kolumnę i pokaż prawą jako pełną szerokość
      cardsColumn && cardsColumn.classList.add('d-none');
      if (studyColumn) {
        studyColumn.classList.remove('d-none');
        studyColumn.classList.remove('col-lg-6');
        studyColumn.classList.add('col-lg-12');
      }

      // na start ukryj kontrolki aż do odsłonięcia odpowiedzi
      controls && controls.classList.add('d-none');

      nextCard();
    }

    function nextCard() {
      if (!studyQueue.length) {
        finishSession();
        return;
      }
      current = studyQueue.shift();
      questionArea && (questionArea.textContent = current.q);
      if (answerArea) {
        answerArea.textContent = current.a;
        answerArea.style.display = 'none';
      }
      controls && controls.classList.add('d-none');
      stateInfo && (stateInfo.textContent = formatTpl(tJS('stateInfo', '{n} kart(y) w tej sesji'), { n: studyQueue.length + 1 }));
    }

    function handleKnown(isRemembered) {
      if (!current) return;
      if (isRemembered) stats.remembered++;
      else { stats.repeated++; studyQueue.push(current); }
      controls && controls.classList.add('d-none');
      answerArea && (answerArea.style.display = 'none');
      stateInfo && (stateInfo.textContent = formatTpl(tJS('currentStats', 'Zapamiętane: {remembered}, Powtórki: {repeated}.'), { remembered: stats.remembered, repeated: stats.repeated }));
      setTimeout(nextCard, 250);
    }

    function finishSession() {
      if (sessionSummary) {
        const tpl = tJS('sessionSummary', 'Sesja zakończona — zapamiętane: {remembered}, powtórki: {repeated}.');
        sessionSummary.classList.remove('d-none');
        sessionSummary.textContent = formatTpl(tpl, { remembered: stats.remembered, repeated: stats.repeated });
      }
      stateInfo && (stateInfo.textContent = '');
      noCards && noCards.classList.remove('d-none');
      studyArea && studyArea.classList.add('d-none');

      // przywróć lewą kolumnę i ukryj prawą
      cardsColumn && cardsColumn.classList.remove('d-none');
      if (studyColumn) {
        studyColumn.classList.remove('col-lg-12');
        studyColumn.classList.add('col-lg-6');
        studyColumn.classList.add('d-none');
      }

      // zresetuj kolejkę i aktualną kartę
      studyQueue = [];
      current = null;
      controls && controls.classList.add('d-none');
    }

    function resetSession() {
      studyQueue = [];
      current = null;
      studyArea && studyArea.classList.add('d-none');
      noCards && noCards.classList.remove('d-none');

      if (cardsColumn) cardsColumn.classList.remove('d-none');
      if (studyColumn) {
        studyColumn.classList.remove('col-lg-12');
        studyColumn.classList.add('col-lg-6');
        studyColumn.classList.add('d-none');
      }
      controls && controls.classList.add('d-none');
    }

    /* storage */
    function loadCards() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error('[flashcardsScript] Błąd odczytu localStorage', e);
        return [];
      }
    }
    function saveCards() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      } catch (e) {
        console.error('[flashcardsScript] Błąd zapisu localStorage', e);
      }
    }

    /* utils */
    function shuffleArray(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    function escapeHtml(s) {
      return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function excerpt(text, n) {
      if (!text) return '';
      return text.length <= n ? text : text.slice(0,n) + '…';
    }
  }); // DOMContentLoaded
})();