// Funkcja obliczająca średnią dla tablic z ocenami i trudnością
function calculateAverageFromObject(obj) {
    const values = Object.values(obj || {});
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / values.length) * 10) / 10;
}

const user = JSON.parse(localStorage.getItem('user') || 'null');
if(user){
  document.getElementById('userEmail').textContent = user.email;
  if(user.userType<2){
    document.getElementById('adminPanel').style.display = 'none';
  }
}
else{
  document.getElementById('adminPanel').style.display = 'none';
}


// Pomocnicza funkcja do ustawiania ikony motywu (Słońce/Księżyc)
function updateThemeIcon(isDark) {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;

    if (isDark) {
        // Tryb ciemny -> Pokaż SŁOŃCE
        icon.className = 'bi bi-sun-fill';
    } else {
        // Tryb jasny -> Pokaż KSIĘŻYC
        icon.className = 'bi bi-moon-stars-fill';
    }
}

// Ustawienie zapisanej wartości motywu
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    // Sprawdzamy czy zapisany jest 'light', w przeciwnym razie domyślnie 'dark'
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcon(false); // Ikona księżyca
    } else {
        document.body.classList.remove('light-mode');
        updateThemeIcon(true);  // Ikona słońca
    }
}

// Obsługa przełącznika motywu
function setupThemeToggle(toggleBtnId) {
    const toggleBtn = document.getElementById(toggleBtnId);
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        
        const isLightMode = document.body.classList.contains('light-mode');
        
        if (isLightMode) {
            localStorage.setItem('theme', 'light');
            updateThemeIcon(false);
        } else {
            localStorage.setItem('theme', 'dark');
            updateThemeIcon(true);
        }
    });
}


// Funkcja pomocnicza do aktualizacji wyglądu przycisku języka
function updateLangButtonUI(lang) {
    const label = document.getElementById('currentLangLabel');
    const items = document.querySelectorAll('.lang-select');
    
    if (label) {
        label.textContent = lang.toUpperCase();
    }

    items.forEach(item => {
        const itemLang = item.getAttribute('data-lang');
        
        if (itemLang === lang) {
            item.classList.add('active-lang');
        } else {
            item.classList.remove('active-lang');
        }
    });
}

// Funkcja zmiany języka
function changeLanguage(lang) {
    localStorage.setItem('language', lang);
    updatePageContent(lang);
    updateLangButtonUI(lang);

    // Wyślij zdarzenie globalne
    const event = new CustomEvent('languageChanged', { detail: { newLang: lang } });
    document.dispatchEvent(event);
}

function updatePageContent(lang) {
  const path = window.location.pathname;
  let currentPage = 'index';

    // Logika wykrywania strony
    if (path.includes('quiz/learn')) currentPage = 'quizLearn';
    else if (path.includes('quiz/test')) currentPage = 'quizTest';
    else if (path.includes('login')) currentPage = 'login';
    else if (path.includes('register')) currentPage = 'register';
    else if (path.includes('reset-password-new')) currentPage = 'resetPasswordNew';
    else if (path.includes('reset-password')) currentPage = 'resetPassword';
    else if (path.includes('index')) currentPage = 'index';
    else if (path.includes('flashcards')) currentPage = 'flashcards';
    else if (path.includes('user-test-list')) currentPage = 'userTestList';
    else if (path.includes('user-test-details')) currentPage = 'userTestDetails';
    else if (path.includes('rank')) currentPage = 'rank';
    else if (path.includes('dashboard')) currentPage = 'dashboard';
    else if (path.includes('notification')) currentPage = 'notification';


    // Pobieranie tłumaczeń
    const transObj = window.translations || (typeof translations !== 'undefined' ? translations : {});
    const pageTranslations = (transObj[lang] && transObj[lang][currentPage]) || {};
    const layoutTranslations = (transObj[lang] && transObj[lang].layout) || {};

    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        
        // Surowy tekst tłumaczenia 
        let text =
            (pageTranslations && pageTranslations[key]) ||
            (layoutTranslations && layoutTranslations[key]);

        if (text) {
            const paramsAttr = element.getAttribute('data-params');
            
            if (paramsAttr) {
                try {
                    const params = JSON.parse(paramsAttr);
                    
                    Object.keys(params).forEach(paramKey => {
                        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
                    });
                } catch (e) {
                    console.error('Błąd parsowania data-params dla klucza:', key, e);
                }
            }

            if (element.tagName === 'INPUT') {
                if (element.type === 'submit' || element.type === 'button') {
                    element.value = text;
                } else {
                    element.placeholder = text;
                }
            } else if (element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                element.innerHTML = text;
            }
        }
    });
}

// Funkcje Globalne (Wymagane przez inne skrypty) 

function updateDynamicContent(lang, currentPage) {
    if (window.updateDynamicContent) {
        window.updateDynamicContent(lang, currentPage);
    }
}

window.t = function(key, params = {}) {
    const currentLang = localStorage.getItem('language') || 'pl';
    const path = window.location.pathname;
    let currentPage = 'index';

    console.log('t()', {
        path,
        currentPage,
        currentLang,
        key
        });

    if (path.includes('dashboard')) currentPage = 'dashboard';
    if (path.includes('quiz/test')) currentPage = 'quizTest';
    if (path.includes('user-test-list')) currentPage = 'userTestList';
    else if (path.includes('user-test-details')) currentPage = 'userTestDetails';

    const transObj = window.translations || (typeof translations !== 'undefined' ? translations : {});
    const pageTranslations = transObj[currentLang] && transObj[currentLang][currentPage];
    
    let text = (pageTranslations && pageTranslations[key]);
  
    if (!text) return key;
  
    Object.keys(params).forEach(param => {
        text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });
  
    return text;
}

// Funkcja pomocnicza do pobrania aktualnego języka
window.getCurrentLanguage = function() {
    return localStorage.getItem('language') || 'pl';
}

window.applyTranslations = function() {
    const currentLang = localStorage.getItem('language') || 'pl';
    updatePageContent(currentLang);
    updateDynamicContent(currentLang);
};

// Funkcja pomocnicza dostępna globalnie
function renderSubjectsCommon(containerId, mode, lang) {
    const container = document.getElementById(containerId);
    if (!container) return; 

    container.innerHTML = ''; 

    const subjects = window.subjectsData || []; 

    if (subjects.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Brak przedmiotów.</p>';
        return;
    }

    subjects.forEach(subject => {
        let name = subject.name;
        if (translations[lang] && translations[lang].subjects && translations[lang].subjects[subject._id]) {
            name = translations[lang].subjects[subject._id];
        }

        const linkHref = mode === 'learn' 
            ? `/quiz-learn?id=${subject._id}` 
            : `/quiz-test?id=${subject._id}`;

        const card = document.createElement('div');
        card.className = 'col-md-4 mb-3';
        card.innerHTML = `
            <a href="${linkHref}" class="text-decoration-none text-dark">
                <div class="card h-100 hover-shadow transition-style">
                    <div class="card-body text-center">
                        <h5 class="card-title my-3">${name}</h5>
                    </div>
                </div>
            </a>
        `;
        container.appendChild(card);
    });
}

async function addPointsAPI(type, amount, questionId) {
      try {
          const token = localStorage.getItem("token");

          const res = await fetch("/api/points/add", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": "Bearer " + token
              },
              body: JSON.stringify({ type, amount, questionId })
          });

          return await res.json();
          
      } catch (err) {
          console.error("❌ Błąd API:", err);
      }
  }

// Obsługa Sesji i Bezpieczeństwa (Użytkownik niezalogowany nie ma dostępu do podstrony)

function requireAuth() {
    const token = localStorage.getItem('token');
    // Lista stron chronionych
    const protectedPaths = ['quiz', 'flashcards', 'user-test'];
    const currentPath = window.location.pathname;

    const isProtected = protectedPaths.some(path => currentPath.includes(path));

    if (isProtected && !token) {
        console.warn("Brak autoryzacji! Przekierowanie...");
        window.location.href = '/login?alert=auth_required';
        return false;
    }
    return true;
}
function checkUserSession() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // Pobieramy kontenery
    const userNav = document.getElementById('user-nav');
    const guestNav = document.getElementById('guest-nav');
    
    // Elementy wewnątrz
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userPointsValue = document.getElementById('userPointsValue');
    const logoutLink = document.getElementById('logoutLink');

    if (user) {
        // Gdy użytkownik jest zalogowany
        
        // Przełącz widoczność sekcji
        if(userNav) userNav.style.display = 'flex';
        if(guestNav) guestNav.style.setProperty('display', 'none', 'important');
        


        // Ustaw nazwę użytkownika w przycisku Dropdown
        if (userEmail) userEmail.textContent = user.name;

        // Ustaw punkty
        if (userPointsValue) {
            userPointsValue.textContent = user.points || 0;
        }

        // Obsługa Wylogowania (podpięta pod element w menu)
        if (logoutLink) {
            logoutLink.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/'; 
            };
        }

    } else {
        // Gdy użytkownik nie jest zalogowany
        
        // Pokaż przyciski logowania/rejestracji
        if(guestNav) guestNav.style.display = 'flex'; // lub 'block' zależnie od stylów
        if(userNav) userNav.style.setProperty('display', 'none', 'important');
    }
}

function updateUserPointsUI(addedPoints) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
        user.points = (user.points || 0) + addedPoints;
        localStorage.setItem('user', JSON.stringify(user));
    }

    const pointsValue = document.getElementById('userPointsValue');
    const pointsBadge = document.getElementById('userPointsBadge');
    
    if (pointsValue) {
        pointsValue.textContent = user ? user.points : 0;
        if (pointsBadge) {
            pointsBadge.classList.add('bg-success', 'text-white');
            pointsBadge.classList.remove('bg-warning');
            setTimeout(() => {
                pointsBadge.classList.remove('bg-success', 'text-white');
                pointsBadge.classList.add('bg-warning');
            }, 1000);
        }
    }
    
    const currentLang = localStorage.getItem('language') || 'pl';
    
    const t = (typeof translations !== 'undefined' && translations[currentLang]) 
              ? translations[currentLang] 
              : { toast_points_gained: "Zdobyłeś +{points} pkt!" };

    const messageTemplate = t.toast_points_gained || "Zdobyłeś +{points} pkt!";
    const message = messageTemplate.replace('{points}', addedPoints);
    
    // Pokaż Powiadomienie
    showToast(message, 'success');
}

// Uniwersalna funkcja do wyświetlania powiadomień
function showToast(message, type = 'success') {
    let toastEl = document.getElementById('systemToast');
    let toastBody = document.getElementById('systemToastBody');
    let toastIcon = document.getElementById('systemToastIcon');

    const config = {
        success: { class: 'text-bg-success', icon: '🎉' },
        warning: { class: 'text-bg-warning', icon: '⚠️' },
        danger:  { class: 'text-bg-danger',  icon: '⛔' }
    };
    
    const currentConfig = config[type] || config.success;

    // Tworzenie HTML jeśli nie istnieje
    if (!toastEl) {
        const toastHTML = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 9999">
              <div id="systemToast" class="toast align-items-center border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                  <div class="toast-body fs-6">
                    <span id="systemToastIcon" class="me-2"></span>
                    <span id="systemToastBody"></span>
                  </div>
                  <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
              </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        toastEl = document.getElementById('systemToast');
        toastBody = document.getElementById('systemToastBody');
        toastIcon = document.getElementById('systemToastIcon');
    }

    toastEl.className = `toast align-items-center border-0 ${currentConfig.class}`;
    
    const btnClose = toastEl.querySelector('.btn-close');
    if (type === 'warning') {
        toastEl.classList.remove('text-bg-warning');
        toastEl.style.backgroundColor = '#ffc107'; 
        toastEl.style.color = '#000';
        if(btnClose) btnClose.classList.remove('btn-close-white');
    } else {
        if(btnClose) btnClose.classList.add('btn-close-white');
        toastEl.removeAttribute('style');
    }

    toastBody.textContent = message;
    toastIcon.textContent = currentConfig.icon;

    const bs = window.bootstrap || bootstrap;
    if (bs) {
        const toast = bs.Toast.getOrCreateInstance(toastEl, { delay: 4000 });
        toast.show();
    }
}

function checkUrlAlerts() {
    const urlParams = new URLSearchParams(window.location.search);
    const alertType = urlParams.get('alert');

    if (!alertType) return; 

    const currentLang = localStorage.getItem('language') || 'pl';

    // Konfiguracja: mapujemy parametr z URL na klucz tłumaczenia i typ toasta
    const alertConfig = {
        auth_required: { key: 'alert_auth_required', type: 'warning' },
        registered:    { key: 'alert_registered',    type: 'success' },
        login_success: { key: 'alert_login_success', type: 'success' }, 
        login_bonus:   { key: 'alert_login_bonus',   type: 'success' } 
    };

    const config = alertConfig[alertType];

    if (config) {
        // Pobieranie tłumaczenia
        const t = (typeof translations !== 'undefined' && translations[currentLang]) 
                  ? translations[currentLang] 
                  : {}; 
        
        
        const messageText = t[config.key] || "Wystąpił komunikat systemowy.";

        showToast(messageText, config.type);

        // Czyszczenie URL (bez przeładowania strony)
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

// Główna Inicjalizacja 

document.addEventListener('DOMContentLoaded', () => {
    if (requireAuth() === false) return;
    
    // Ustawienia początkowe
    applySavedTheme();
    setupThemeToggle('themeToggleBtn'); 
    
    // Język
    const currentLang = localStorage.getItem('language') || 'pl';
    updateLangButtonUI(currentLang);
    updatePageContent(currentLang);
    
    const langContainer = document.querySelector('.lang-dropdown-container');
    const langBtn = document.getElementById('langDropdown');
    
    if (langContainer && langBtn) {
        const bsDropdown = new bootstrap.Dropdown(langBtn);

        langContainer.addEventListener('mouseenter', () => {
            bsDropdown.show();
        });

        langContainer.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!langContainer.matches(':hover')) {
                    bsDropdown.hide();
                }
            }, 150);
        });
    }

    // Obsługa kliknięć w dropdown języka
    const langLinks = document.querySelectorAll('.lang-select');
    langLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            const selectedLang = link.getAttribute('data-lang');
            changeLanguage(selectedLang);
        });
    });

    // Sesja i Powiadomienia
    checkUserSession();
    checkUrlAlerts();
});
