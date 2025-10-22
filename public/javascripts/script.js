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

// od razu ustaw tryb przy ładowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
});
