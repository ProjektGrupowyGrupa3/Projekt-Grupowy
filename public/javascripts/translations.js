const translations = {
  pl: {
    login: {
      title: "Zaloguj się",
      email: "Email",
      password: "Hasło",
      loginButton: "Zaloguj",
      registerLink: "Zarejestruj się",
      resetPassword: "Odzyskaj hasło"
    },
    register: {
      title: "Rejestracja",
      name: "Imię",
      email: "Email",
      password: "Hasło",
      registerButton: "Zarejestruj się",
      loginLink: "Masz już konto? Zaloguj się"
    },
    resetPassword: {
      title: "Odzyskaj hasło",
      email: "Email",
      submitButton: "Wyślij link resetujący",
      backToLogin: "Powrót do logowania"
    },
    resetPasswordNew: {
      title: "Ustaw nowe hasło",
      newPassword: "Nowe hasło",
      confirmPassword: "Potwierdź hasło",
      changeButton: "Zmień hasło"
    },
    quizLearn: {
      title: "🧠 Tryb nauki",
      startButton: "Rozpocznij naukę",
      subject: "Przedmiot",
      timeLeft: "Pozostały czas",
      loading: "Wczytywanie...",
      nextQuestion: "Następne pytanie"
    },
    quizTest: {
      title: "Tryb testu",
      loading: "Wczytywanie...",
      numberOfQuestions: "Ilość pytań",
      time: "Czas (minuty)",
      startButton: "Rozpocznij test",
      question: "Pytanie",
      previousQuestion: "Poprzednie pytanie",
      nextQuestion: "Następne pytanie"
    },
    index: {
      welcome: "Witaj w LearnIt",
      description: "Platforma do nauki i testowania wiedzy",
      learnMode: "Tryb nauki",
      testMode: "Tryb testu"
    },
    layout:{
        login:"Logowanie",
        logout:"Wyloguj",
        register:"Rejestracja",
        learnMode:"Tryb nauki",
        flashcards:"Fiszki"
    },
    flashcards: {
      title: "Fiszki — nauka",
      subtitle: "Twórz, zapisuj zestawy i ucz się.",
      shuffleBtn: "Przemieszaj",
      startBtn: "Start nauki",
      saveSetBtn: "💾 Zapisz zestaw",
      addBtn: "Dodaj fiszkę",
      clearEditorBtn: "Wyczyść edytor",
      activeSetLabel: "Aktywny zestaw (Edytor)",
      newSetLabel: "Nowy zestaw",
      savedSetsTitle: "Zapisane zestawy",
      savedSetsSubtitle: "Kliknij na zestaw, aby go załadować do edytora.",
      loadingSets: "Ładowanie zestawów...",
      studyMode: "Tryb nauki",
      instruction: "Kliknij kartę żeby odsłonić odpowiedź.",
      questionLabel: "Pytanie",
      answerLabel: "Odpowiedź",
      noCardsMessage: "Brak aktywnej sesji. Dodaj fiszki lub wybierz zestaw.",
      editorEmptyState: "Pusto. Dodaj fiszki powyżej lub wybierz zestaw z prawej strony.",
      rememberBtn: "Zapamiętałem",
      repeatBtn: "Powtórz",
      stopStudyBtn: "Przerwij",
      sessionFinishedTitle: "Koniec sesji!",
      backToSetsBtn: "Wróć do zestawów",
      sessionSummary: "Sesja zakończona — zapamiętane: {remembered}, powtórki: {repeated}.",
      currentStats: "Zapamiętane: {remembered}, Powtórki: {repeated}.",
      confirmClearEditorFull: "Wyczyścić edytor? (Nie usunie to zapisanych zestawów)",
      confirmDeleteOne: "Usunąć tę fiszkę?",
      overwriteSetConfirm: "Zestaw \"{name}\" już istnieje. Nadpisać?",
      emptyListError: "Lista jest pusta. Dodaj fiszki przed zapisem.",
      enterSetNamePrompt: "Podaj nazwę zestawu:",
      setSavedAlert: "Zestaw zapisany!",
      noSavedSets: "Brak zapisanych zestawów. Stwórz coś w edytorze i kliknij \"Zapisz zestaw\".",
      loadSetConfirm: "Załadowanie zestawu nadpisze obecny widok edytora. Kontynuować?",
      deleteSetConfirm: "Usunąć trwale zestaw \"{name}\"?",
      stateInfo: "Pozostało: {n}",
      editBtn: "Edytuj",
      deleteBtn: "Usuń"
    }
  },
  en: {
    login: {
      title: "Sign in",
      email: "Email",
      password: "Password",
      loginButton: "Sign in",
      registerLink: "Sign up",
      resetPassword: "Reset password"
    },
    register: {
      title: "Sign up",
      name: "Name",
      email: "Email",
      password: "Password",
      registerButton: "Sign up",
      loginLink: "Already have an account? Sign in"
    },
    resetPassword: {
      title: "Reset password",
      email: "Email",
      submitButton: "Send reset link",
      backToLogin: "Back to login"
    },
    resetPasswordNew: {
      title: "Set new password",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      changeButton: "Change password"
    },
    quizLearn: {
      title: "🧠 Learning mode",
      startButton: "Start learning",
      subject: "Subject",
      timeLeft: "Time left",
      loading: "Loading...",
      nextQuestion: "Next question"
    },
    quizTest: {
      title: "Test mode",
      loading: "Loading...",
      numberOfQuestions: "Number of questions",
      time: "Time (minutes)",
      startButton: "Start test",
      question: "Question",
      previousQuestion: "Previous question",
      nextQuestion: "Next question"
    },
    index: {
      welcome: "Welcome to LearnIt",
      description: "Platform for learning and testing knowledge",
      learnMode: "Learning mode",
      testMode: "Test mode",
    },
    layout: {
        login:"Login",
        logout:"Logout",
        register:"Register",
        learnMode:"Learning Mode",
        flashcards:"Flashcards"
    },
    flashcards: {
      title: "Flashcards — learning",
      subtitle: "Create, save sets, and study.",
      shuffleBtn: "Shuffle",
      startBtn: "Start learning",
      saveSetBtn: "💾 Save set",
      addBtn: "Add flashcard",
      clearEditorBtn: "Clear editor",
      activeSetLabel: "Active set (Editor)",
      newSetLabel: "New set",
      savedSetsTitle: "Saved sets",
      savedSetsSubtitle: "Click a set to load it into the editor.",
      loadingSets: "Loading sets...",
      studyMode: "Study mode",
      instruction: "Click the card to reveal the answer.",
      questionLabel: "Question",
      answerLabel: "Answer",
      noCardsMessage: "No active session. Add flashcards or select a set.",
      editorEmptyState: "Empty. Add flashcards above or select a set from the right.",
      rememberBtn: "I remembered",
      repeatBtn: "Repeat",
      stopStudyBtn: "Stop",
      sessionFinishedTitle: "Session finished!",
      backToSetsBtn: "Back to sets",
      sessionSummary: "Session finished — remembered: {remembered}, repeats: {repeated}.",
      currentStats: "Remembered: {remembered}, Repeats: {repeated}.",
      confirmClearEditorFull: "Clear editor? (This will not delete saved sets)",
      confirmDeleteOne: "Delete this flashcard?",
      overwriteSetConfirm: "Set \"{name}\" already exists. Overwrite?",
      emptyListError: "The list is empty. Add flashcards before saving.",
      enterSetNamePrompt: "Enter set name:",
      setSavedAlert: "Set saved!",
      noSavedSets: "No saved sets. Create something in the editor and click \"Save set\".",
      loadSetConfirm: "Loading a set will overwrite the current editor view. Continue?",
      deleteSetConfirm: "Permanently delete set \"{name}\"?",
      stateInfo: "Left: {n}",
      editBtn: "Edit",
      deleteBtn: "Delete"
    }
  }
};