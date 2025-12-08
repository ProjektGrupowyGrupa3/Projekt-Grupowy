// Ustawienie zapisanej wartości trybu
// funkcja obliczająca średnią dla tablic z ocenami i trudnością
function calculateAverageFromObject(obj) {
    const values = Object.values(obj || {});
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
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

// Funkcja obsługująca przełącznik
function setupThemeToggle(toggleBtnId) {
    const toggleBtn = document.getElementById(toggleBtnId);
    if (!toggleBtn) return; // Jeśli nie ma przycisku na danej podstronie, przerywamy

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }
    });
}

function changeLanguage(lang) {
    localStorage.setItem('language', lang);
    updatePageContent(lang);
    
    // Dodano: Aktualizacja dynamicznych treści (jeśli funkcja istnieje)
    if (typeof updateDynamicContent === 'function') {
        updateDynamicContent(lang);
    }
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

    // Używamy bezpieczniejszego dostępu przez window.translations (z Twojej wersji HEAD)
    const pageTranslations = (window.translations && window.translations[lang] && window.translations[lang][currentPage]) || {};
    const layoutTranslations = (window.translations && window.translations[lang] && window.translations[lang].layout) || {};

    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
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
                // Dodano obsługę TEXTAREA (z wersji origin)
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        }
    });
}

// --- NOWE FUNKCJE Z SERWERA (Niezbędne dla nowych funkcjonalności) ---

// Funkcja do aktualizacji dynamicznych treści
function updateDynamicContent(lang, currentPage) {
    // Wywołaj globalną funkcję jeśli istnieje (definiowaną w plikach poszczególnych widoków)
    if (window.updateDynamicContent) {
        window.updateDynamicContent(lang, currentPage);
    }
}

// Globalna funkcja pomocnicza do tłumaczeń (używana w JS, np. w alertach czy generowaniu HTML)
window.t = function(key, params = {}) {
    const currentLang = localStorage.getItem('language') || 'pl';
    const path = window.location.pathname;
    let currentPage = 'index';

    if (path.includes('user-test-list')) {
        currentPage = 'userTestList';
    } else if (path.includes('user-test-details')) {
        currentPage = 'userTestDetails';
    }

    // Zabezpieczenie: szukamy w window.translations
    const transObj = window.translations || (typeof translations !== 'undefined' ? translations : {});
    const pageTranslations = transObj[currentLang] && transObj[currentLang][currentPage];
    
    let text = (pageTranslations && pageTranslations[key]);
  
    if (!text) {
        // Opcjonalnie: console.warn(`Translation missing for key: ${key}`);
        return key;
    }
  
    // Zamień parametry {nazwa} na wartości
    Object.keys(params).forEach(param => {
        text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });
  
    return text;
}

// Funkcja pomocnicza do pobrania aktualnego języka
window.getCurrentLanguage = function() {
    return localStorage.getItem('language') || 'pl';
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
        authBtn.setAttribute('data-translate', 'logout'); 
        authBtn.textContent = 'Wyloguj'; 
        authBtn.href = '#';

        // 3. Nadpisz zachowanie przycisku (Wylogowanie)
        authBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/'; 
        };

        // 4. Ukryj przycisk rejestracji
        if (regBtn) {
            regBtn.style.display = 'none';
        }
    }
}

// --- Główna Inicjalizacja ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Ustaw motyw
    applySavedTheme();
    // Upewnij się, że ID przycisku w HTML to 'toggleTheme'. 
    // Jeśli używasz nowej wersji z ikoną księżyca, może to być 'themeToggleBtn'.
    // Dla pewności zostawiam obie opcje:
    setupThemeToggle('toggleTheme'); 
    setupThemeToggle('themeToggleBtn'); 

    // 2. Ustaw język
    const currentLang = localStorage.getItem('language') || 'pl';
    if (typeof updatePageContent === 'function') {
        updatePageContent(currentLang);
    }

    // 3. Sprawdź sesję użytkownika
    checkUserSession();
});

// Funkcja pomocnicza dla zewnętrznych skryptów (z wersji origin)
window.applyTranslations = function() {
    const currentLang = localStorage.getItem('language') || 'pl';
    updatePageContent(currentLang);
    updateDynamicContent(currentLang);
};