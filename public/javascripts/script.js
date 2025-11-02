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

  if (path.includes('quiz-learn')) {
    currentPage = 'quizLearn';
  } else if (path.includes('quiz-test')) {
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
      } else {
        element.textContent = text;
      }
    }
  });
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
