// Flashcards Script — Ukrywanie przycisków nagłówka podczas nauki
(function () {
  'use strict';

  // Funkcja pomocnicza do pobierania tłumaczeń
  function tJS(key, fallback = '') {
    try {
      const lang = (localStorage.getItem('language') || document.documentElement.lang || 'pl');
      if (typeof translations !== 'undefined' && translations[lang] && translations[lang].flashcards && translations[lang].flashcards[key]) {
        return translations[lang].flashcards[key];
      }
      return fallback;
    } catch (e) { return fallback; }
  }

  // Funkcja do formatowania tekstów
  function formatTpl(s = '', vars = {}) {
    return (s || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
  }

  const BackendService = {
    DB_KEY: 'flashcards_decks_db',
    async getDecks() {
      return new Promise(resolve => {
        setTimeout(() => {
          const raw = localStorage.getItem(this.DB_KEY);
          resolve(raw ? JSON.parse(raw) : []);
        }, 200);
      });
    },
    async saveDeck(name, cards) {
      return new Promise(resolve => {
        const decks = JSON.parse(localStorage.getItem(this.DB_KEY) || '[]');
        const existingIndex = decks.findIndex(d => d.name === name);
        const newDeck = { id: Date.now().toString(), name, cards, updatedAt: new Date().toISOString() };
        
        if (existingIndex >= 0) {
          const msg = formatTpl(tJS('overwriteSetConfirm', 'Zestaw "{name}" już istnieje. Nadpisać?'), { name: name });
          if(!confirm(msg)) return resolve(null);
          decks[existingIndex] = newDeck;
        } else {
          decks.push(newDeck);
        }
        localStorage.setItem(this.DB_KEY, JSON.stringify(decks));
        resolve(newDeck);
      });
    },
    async deleteDeck(deckId) {
      const decks = JSON.parse(localStorage.getItem(this.DB_KEY) || '[]');
      const newDecks = decks.filter(d => d.id !== deckId);
      localStorage.setItem(this.DB_KEY, JSON.stringify(newDecks));
      return true;
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    const $ = sel => document.querySelector(sel);
    
    // --- Konfiguracja i Stan ---
    const STORAGE_KEY_CURRENT = 'flashcards-current-draft'; 
    let currentCards = loadCurrentDraft(); 
    let studyQueue = [];
    let studyStats = { remembered: 0, repeated: 0 };
    let currentStudyCard = null;

    // --- Elementy DOM ---
    const els = {
      // NOWE: Kontener przycisków w nagłówku
      headerActions: $('#headerActions'),

      cardsColumn: $('#cardsColumn'),
      studyColumn: $('#studyColumn'),
      addForm: $('#addForm'),
      qInput: $('#q'),
      aInput: $('#a'),
      cardsList: $('#cardsList'),
      activeSetName: $('#activeSetName'),
      clearAll: $('#clearAll'),
      saveSetBtn: $('#saveSetBtn'),
      startBtn: $('#startBtn'),
      shuffleBtn: $('#shuffleBtn'),
      decksPanel: $('#decksPanel'),
      decksList: $('#decksList'),
      studyModeContainer: $('#studyModeContainer'),
      studyArea: $('#studyArea'),
      currentCard: $('#currentCard'),
      questionArea: $('#questionArea'),
      answerArea: $('#answerArea'),
      controls: $('#controls'),
      rememberBtn: $('#rememberBtn'),
      repeatBtn: $('#repeatBtn'),
      stopStudyBtn: $('#stopStudyBtn'),
      stateInfo: $('#stateInfo'),
      sessionSummary: $('#sessionSummary')
    };

    init();

    function init() {
      stopStudySession(); 
      renderEditorList();
      loadAndRenderDecks();
      attachEvents();
    }

    function attachEvents() {
      els.addForm?.addEventListener('submit', e => {
        e.preventDefault();
        const q = els.qInput.value.trim();
        const a = els.aInput.value.trim();
        if (!q || !a) return;
        currentCards.push({ id: Date.now().toString(36), q, a });
        saveCurrentDraft();
        renderEditorList();
        els.qInput.value = '';
        els.aInput.value = '';
        els.qInput.focus();
      });

      els.saveSetBtn?.addEventListener('click', async () => {
        if (!currentCards.length) return alert(tJS('emptyListError', 'Lista jest pusta.'));
        
        const currentNameText = els.activeSetName.innerText; 
        const defaultName = (currentNameText !== tJS('newSetLabel', 'Nowy zestaw')) ? currentNameText : '';
        
        const name = prompt(tJS('enterSetNamePrompt', 'Podaj nazwę zestawu:'), defaultName);
        if (!name) return;

        const savedDeck = await BackendService.saveDeck(name, currentCards);
        if (savedDeck) {
          els.activeSetName.innerText = savedDeck.name;
          loadAndRenderDecks(); 
          alert(tJS('setSavedAlert', 'Zestaw zapisany!'));
        }
      });

      els.startBtn?.addEventListener('click', () => {
        if (!currentCards.length) return alert(tJS('noCardsMessage', 'Brak fiszek.'));
        startStudySession();
      });

      els.currentCard?.addEventListener('click', () => {
        if (!currentStudyCard) return;
        els.answerArea.style.display = 'block';
        els.controls.classList.remove('d-none');
      });

      els.rememberBtn?.addEventListener('click', (e) => { e.stopPropagation(); handleStudyResponse(true); });
      els.repeatBtn?.addEventListener('click', (e) => { e.stopPropagation(); handleStudyResponse(false); });
      els.stopStudyBtn?.addEventListener('click', stopStudySession);

      els.shuffleBtn?.addEventListener('click', () => {
        currentCards = shuffleArray(currentCards);
        renderEditorList();
      });

      els.clearAll?.addEventListener('click', () => {
        if(confirm(tJS('confirmClearEditorFull', 'Wyczyścić edytor?'))) {
          currentCards = [];
          els.activeSetName.innerText = tJS('newSetLabel', 'Nowy zestaw');
          saveCurrentDraft();
          renderEditorList();
        }
      });
    }

    // --- Zestawy ---

    async function loadAndRenderDecks() {
      els.decksList.innerHTML = `<div class="text-muted small">${tJS('loadingSets', 'Ładowanie...')}</div>`;
      const decks = await BackendService.getDecks();
      
      els.decksList.innerHTML = '';
      if (!decks.length) {
        els.decksList.innerHTML = `<div class="text-muted small">${tJS('noSavedSets', 'Brak zapisanych zestawów.')}</div>`;
        return;
      }

      decks.forEach(deck => {
        const item = document.createElement('button');
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        item.innerHTML = `
          <div>
            <div class="fw-semibold">${escapeHtml(deck.name)}</div>
            <div class="small text-muted">${new Date(deck.updatedAt).toLocaleDateString()}</div>
          </div>
          <div class="btn btn-sm btn-outline-danger btn-del-deck" title="${tJS('deleteBtn', 'Usuń')}" style="z-index:2">×</div>
        `;

        item.addEventListener('click', (e) => {
          if (e.target.classList.contains('btn-del-deck')) return; 
          if (currentCards.length > 0 && !confirm(tJS('loadSetConfirm', 'Załadowanie zestawu nadpisze edytor. Kontynuować?'))) return;
          
          currentCards = JSON.parse(JSON.stringify(deck.cards));
          els.activeSetName.innerText = deck.name;
          saveCurrentDraft();
          renderEditorList();
        });

        const delBtn = item.querySelector('.btn-del-deck');
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const msg = formatTpl(tJS('deleteSetConfirm', 'Usunąć zestaw "{name}"?'), { name: deck.name });
          if (confirm(msg)) {
            await BackendService.deleteDeck(deck.id);
            loadAndRenderDecks();
          }
        });

        els.decksList.appendChild(item);
      });
    }

    // --- Edytor ---

    function renderEditorList() {
      els.cardsList.innerHTML = '';
      if (!currentCards.length) {
        els.cardsList.innerHTML = `<div class="text-muted small p-2">${tJS('editorEmptyState', 'Pusto...')}</div>`;
        return;
      }

      currentCards.forEach(card => {
        const col = document.createElement('div'); col.className = 'col-12';
        col.innerHTML = `
          <div class="card p-2 bg-transparent border-secondary border-opacity-25">
            <div class="d-flex justify-content-between">
              <div class="me-2 text-truncate">
                <span class="fw-bold">${escapeHtml(card.q)}</span>
                <br><span class="small text-muted">${escapeHtml(card.a)}</span>
              </div>
              <button class="btn btn-sm btn-link text-danger p-0" style="text-decoration:none">×</button>
            </div>
          </div>
        `;
        col.querySelector('button').addEventListener('click', () => {
          currentCards = currentCards.filter(c => c.id !== card.id);
          saveCurrentDraft();
          renderEditorList();
        });
        els.cardsList.appendChild(col);
      });
    }

    // --- Nauka ---

    function startStudySession() {
      studyQueue = shuffleArray([...currentCards]);
      studyStats = { remembered: 0, repeated: 0 };
      
      // UKRYWANIE ELEMENTÓW
      if (els.cardsColumn) els.cardsColumn.classList.add('d-none');
      if (els.headerActions) els.headerActions.classList.add('d-none');

      if (els.studyColumn) {
        els.studyColumn.classList.remove('col-lg-6');
        els.studyColumn.classList.add('col-lg-12');
      }

      els.decksPanel.classList.add('d-none');
      els.studyModeContainer.classList.remove('d-none');
      
      els.currentCard.classList.remove('d-none');
      els.sessionSummary.classList.add('d-none');
      els.studyArea.classList.remove('d-none'); 
      
      els.controls.classList.add('d-none'); 
      
      nextStudyCard();
    }

    function stopStudySession() {
      // POKAZYWANIE ELEMENTÓW
      if (els.cardsColumn) els.cardsColumn.classList.remove('d-none');
      if (els.headerActions) els.headerActions.classList.remove('d-none');

      if (els.studyColumn) {
        els.studyColumn.classList.remove('col-lg-12');
        els.studyColumn.classList.add('col-lg-6');
      }
      if (els.studyModeContainer) els.studyModeContainer.classList.add('d-none');
      if (els.decksPanel) els.decksPanel.classList.remove('d-none');
      currentStudyCard = null;
    }

    function nextStudyCard() {
      if (!studyQueue.length) {
        // KONIEC SESJI
        els.currentCard.classList.add('d-none');
        els.controls.classList.add('d-none');
        els.sessionSummary.classList.remove('d-none');
        
        const summaryText = formatTpl(tJS('sessionSummary', 'Koniec: {remembered} ok, {repeated} powtórki'), 
                                      { remembered: studyStats.remembered, repeated: studyStats.repeated });
        const titleText = tJS('sessionFinishedTitle', 'Koniec sesji!');
        const btnText = tJS('backToSetsBtn', 'Wróć');

        els.sessionSummary.innerHTML = `
          <h5>${titleText}</h5>
          <p class="mb-3">${summaryText}</p>
          <button class="btn btn-primary" id="finishBtn">${btnText}</button>
        `;
        document.getElementById('finishBtn').addEventListener('click', stopStudySession);
        return;
      }

      els.currentCard.classList.remove('d-none');

      currentStudyCard = studyQueue.shift();
      els.questionArea.textContent = currentStudyCard.q;
      els.answerArea.textContent = currentStudyCard.a;
      els.answerArea.style.display = 'none';
      els.controls.classList.add('d-none');
      
      const infoText = formatTpl(tJS('stateInfo', 'Pozostało: {n}'), { n: studyQueue.length + 1 });
      els.stateInfo.textContent = infoText;
    }

    function handleStudyResponse(remembered) {
      if (!currentStudyCard) return;
      if (remembered) studyStats.remembered++;
      else {
        studyStats.repeated++;
        studyQueue.push(currentStudyCard);
      }
      setTimeout(nextStudyCard, 100);
    }
    
    function loadCurrentDraft() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY_CURRENT) || '[]'); } 
      catch { return []; }
    }
    function saveCurrentDraft() {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(currentCards));
    }
    function shuffleArray(arr) {
      return arr.sort(() => Math.random() - 0.5);
    }
    function escapeHtml(s) {
      return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

  });
})();