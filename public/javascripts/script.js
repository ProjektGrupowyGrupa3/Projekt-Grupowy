// Ustawienie zapisanej wartości trybu
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
    }

    // Pobranie tłumaczeń (zakładam, że zmienna 'translations' jest dostępna globalnie)
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
    // 1. Ustaw motyw
    applySavedTheme();
    setupThemeToggle('toggleTheme'); 

    // 2. Ustaw język
    const currentLang = localStorage.getItem('language') || 'pl';
    // Upewnij się, że obiekt translations jest już załadowany (np. w innym pliku js)
    if (typeof updatePageContent === 'function') {
        updatePageContent(currentLang);
    }

    // 3. Sprawdź sesję użytkownika (zalogowany/wylogowany)
    checkUserSession();
});