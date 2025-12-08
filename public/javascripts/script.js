// funkcja obliczająca średnią dla tablic z ocenami i trudnością
function calculateAverageFromObject(obj) {
  const values = Object.values(obj || {});
  if (values.length === 0) return 0;
  const sum = values.reduce((a,b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

// ustawienie zapisanej wartości trybu
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
}

// funkcja toggle
function setupThemeToggle(toggleBtnId) {
    const toggleBtn = document.getElementById(toggleBtnId);
    if(!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if(document.body.classList.contains('light-mode')){
            localStorage.setItem('theme','light');
        } else {
            localStorage.setItem('theme','dark');
        }
    });
}

// Funkcja zmiany języka
function changeLanguage(lang) {
  localStorage.setItem('language', lang);
  updatePageContent(lang);
}

// Aktualizacja treści strony na podstawie języka
function updatePageContent(lang) {
  const path = window.location.pathname;
  let currentPage = 'index';

  if (path.includes('quiz/learn')) {
    currentPage = 'quizLearn';
  } else if (path.includes('quiz/test')) {
    currentPage = 'quizTest';
  } else if (path.includes('login')) {
    currentPage = 'login';
  } else if (path.includes('register')) {
    currentPage = 'register';
  } else if (path.includes('reset-password-new')) {
    currentPage = 'resetPasswordNew';
  } else if (path.includes('reset-password')) {
    currentPage = 'resetPassword';
  } else if (path.includes('index')) {
    currentPage = 'index';
  } else if (path.includes('flashcards')) {
    currentPage = 'flashcards';
  } else if (path.includes('user-test-list')) {
    currentPage = 'userTestList';
  } else if (path.includes('user-test-details')) {
    currentPage = 'userTestDetails';
  }

  const pageTranslations = (translations[lang] && translations[lang][currentPage]) || {};
  const layoutTranslations = (translations[lang] && translations[lang].layout) || {};


  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    const text =
      (pageTranslations && pageTranslations[key]) ||
      (layoutTranslations && layoutTranslations[key]);

    if (text) {
      if (element.tagName === 'INPUT') {
        if (element.type === 'submit' || element.type === 'button') {
          element.value = text;
        } else {
          element.placeholder = text;
        }
      } else if (element.tagName === 'TEXTAREA') {
        element.placeholder = text;
      } else {
        element.textContent = text;
      }
    }
  });
  
}

// Funkcja do aktualizacji dynamicznych treści
function updateDynamicContent(lang, currentPage) {
  // Wywołaj globalną funkcję jeśli istnieje
  if (window.updateDynamicContent) {
    window.updateDynamicContent(lang, currentPage);
  }
}

// GGlobalna funkcja pomocnicza do tłumaczeń (dla użycia w innych plikach)
window.t = function(key, params = {}) {
  const currentLang = localStorage.getItem('language') || 'pl';
  const path = window.location.pathname;
  let currentPage = 'index';

  if (path.includes('user-test-list')) {
    currentPage = 'userTestList';
  } else if (path.includes('user-test-details')) {
    currentPage = 'userTestDetails';
  }

  const pageTranslations = translations[currentLang] && translations[currentLang][currentPage];
    
  let text = (pageTranslations && pageTranslations[key]);
  
  if (!text) {
    console.warn(`Translation missing for key: ${key} in page: ${currentPage}`);
    return key;
  }
  
  // Zamień parametry {nazwa} na wartości
  Object.keys(params).forEach(param => {
    text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
  });
  
  return text;
}

// DODAJ: Funkcja pomocnicza do pobrania aktualnego języka
window.getCurrentLanguage = function() {
  return localStorage.getItem('language') || 'pl';
}

// Inicjalizacja języka przy załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
  const currentLang = localStorage.getItem('language') || 'pl';
  updatePageContent(currentLang);
});

// od razu ustaw tryb przy ładowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
});


// Funkcja do ponownego przetłumaczenia aktualnej strony
window.applyTranslations = function() {
  const currentLang = localStorage.getItem('language') || 'pl';
  updatePageContent(currentLang);
  updateDynamicContent(currentLang);
};