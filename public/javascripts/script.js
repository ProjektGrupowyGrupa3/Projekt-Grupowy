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

const user = JSON.parse(localStorage.getItem('user') || 'null');
if(user){
  document.getElementById('userEmail').textContent = user.email;
  if(user.userType<2){
    document.getElementById('adminPanel').style.display = 'none';
  }
  const btn = document.getElementById('authBtn');
  btn.textContent = 'Wyloguj';
  btn.href = '#';
  btn.addEventListener('click', ()=> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  });
  document.getElementById('regBtn').style.display = 'none';
}
else{
  document.getElementById('adminPanel').style.display = 'none';
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

function updatePageContent(lang) {
  const path = window.location.pathname;
  let currentPage = 'index';

  // Logika wykrywania strony
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

  // Pobranie tłumaczeń (zakładam, że zmienna 'translations' jest dostępna globalnie)
  const pageTranslations = (translations[lang] && translations[lang][currentPage]) || {};
  const layoutTranslations = (translations[lang] && translations[lang].layout) || {};

  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    if(key == "login"){
      if(user){
        //key = "logout"
      }
    }
    // Najpierw szukamy w tłumaczeniach strony, potem w ogólnym layoucie
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

// --- Obsługa Sesji Użytkownika ---

function checkUserSession() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Pobieramy elementy layoutu
  const userEmailEl = document.getElementById('userEmail');
  const authBtn = document.getElementById('authBtn');
  const regBtn = document.getElementById('regBtn');

  // Jeśli użytkownik jest w localStorage ORAZ elementy istnieją w HTML
  if (user && userEmailEl && authBtn) {
      // 1. Wyświetl nazwę/email użytkownika
      userEmailEl.textContent = user.name;

      // 2. Zmień przycisk "Zaloguj" na "Wyloguj"
      // Zmieniamy też atrybut data-translate, żeby funkcja updatePageContent() 
      // przy zmianie języka wiedziała, że teraz ma tłumaczyć słowo "logout", a nie "login"
      authBtn.setAttribute('data-translate', 'logout'); 
      authBtn.textContent = 'Wyloguj'; // Domyślny tekst zanim zadziała tłumaczenie
      authBtn.href = '#';

      // 3. Nadpisz zachowanie przycisku (Wylogowanie)
      authBtn.onclick = (e) => {
          e.preventDefault();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Przekierowanie na stronę główną lub odświeżenie
          window.location.href = '/'; 
      };

      // 4. Ukryj przycisk rejestracji
      if (regBtn) {
          regBtn.style.display = 'none';
      }
  }
}

// Główna Inicjalizacja (Wspólna dla wszystkiego) 
document.addEventListener('DOMContentLoaded', () => {
  const currentLang = localStorage.getItem('language') || 'pl';
  updatePageContent(currentLang);
});

// od razu ustaw tryb przy ładowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
});


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

