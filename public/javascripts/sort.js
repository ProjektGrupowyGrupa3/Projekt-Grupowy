// Funkcja do aktualizacji selecta sortowania
function updateSortSelect(lang) {
  const sortSelect = document.getElementById('sortSelect');
  if (!sortSelect) return;

  // Zapisz aktualnie wybraną wartość
  const currentValue = sortSelect.value;

  // Pobierz tłumaczenia
  const t9n = translations[lang]?.userTestList || {};

  // Zaktualizuj wszystkie opcje
  const options = sortSelect.options;

  if (options[0]) options[0].text = t9n.sortBy || "Sortuj według...";
  if (options[1]) options[1].text = t9n.polishFirst || "Polskie pierwsze";
  if (options[2]) options[2].text = t9n.englishFirst || "Angielskie pierwsze";
  if (options[3]) options[3].text = t9n.polishOnly || "Tylko polskie";
  if (options[4]) options[4].text = t9n.englishOnly || "Tylko angielskie";
  if (options[5]) options[5].text = t9n.alphabetical || "Alfabetycznie A-Z";
  if (options[6]) options[6].text = t9n.byRating || "Najlepiej oceniane";
  if (options[7]) options[7].text = t9n.byQuestionCount || "Najwięcej pytań";
  if (options[8]) options[8].text = t9n.originalOrder || "Oryginalna kolejność";

  // Przywróć wybraną wartość
  sortSelect.value = currentValue;
}


/**
* Sortuje tablicę testów według języka
* @param {Array} testsArray - Tablica testów do posortowania
* @param {string} languageCode - Kod języka ('pl', 'en' itp.)
* @param {string} mode - Tryb sortowania: 'first' (na początku) lub 'only' (tylko)
* @returns {Array} Posortowana/filtrowana tablica testów
*/
function sortOrFilterTestsByLanguage(testsArray, languageCode, mode = 'first') {
  if (!Array.isArray(testsArray)) return [];

  // Kopiujemy tablicę, aby nie modyfikować oryginału
  let result = [...testsArray];

  if (mode === 'only') {
    // Filtrowanie - tylko testy w danym języku
    return result.filter(test => test.language === languageCode);
  } else if (mode === 'first') {
    // Sortowanie - testy w danym języku na początku
    return result.sort((a, b) => {
      const aInLang = a.language === languageCode;
      const bInLang = b.language === languageCode;

      if (aInLang && !bInLang) return -1;
      if (!aInLang && bInLang) return 1;

      // Jeśli oba w tym samym języku, sortuj alfabetycznie
      return a.title.localeCompare(b.title);
    });
  }

  return result;
}

/**
 * Sortuje testy alfabetycznie według tytułu
 * @param {Array} testsArray - Tablica testów do posortowania
 * @returns {Array} Posortowana tablica
 */
function sortTestsAlphabetically(testsArray) {
  if (!Array.isArray(testsArray)) return [];

  return [...testsArray].sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

/**
 * Sortuje testy według oceny (malejąco)
 * @param {Array} testsArray - Tablica testów do posortowania
 * @returns {Array} Posortowana tablica
 */
function sortTestsByRating(testsArray) {
  if (!Array.isArray(testsArray)) return [];

  return [...testsArray].sort((a, b) => {
    const ratingA = calculateAverageFromObject(a.ratings) || 0;
    const ratingB = calculateAverageFromObject(b.ratings) || 0;
    return ratingB - ratingA; // malejąco
  });
}

/**
 * Sortuje testy według liczby pytań (malejąco)
 * @param {Array} testsArray - Tablica testów do posortowania
 * @returns {Array} Posortowana tablica
 */
function sortTestsByQuestionCount(testsArray) {
  if (!Array.isArray(testsArray)) return [];

  return [...testsArray].sort((a, b) => {
    const countA = a.questions?.length || 0;
    const countB = b.questions?.length || 0;
    return countB - countA; // malejąco
  });
}

// ============================================
// FUNKCJA GŁÓWNA DO ZARZĄDZANIA SORTOWANIEM
// ============================================

/**
 * Główna funkcja zarządzająca sortowaniem testów
 * @param {Array} testsArray - Tablica testów do posortowania
 * @param {string} sortMode - Tryb sortowania
 * @param {string} currentLang - Aktualny język interfejsu
 * @returns {Array} Posortowana tablica testów
 */
function applySorting(testsArray, sortMode, currentLang = 'pl') {
  if (!Array.isArray(testsArray)) return [];

  let sortedTests = [...testsArray];

  switch (sortMode) {
    case 'pl_first':
      sortedTests = sortOrFilterTestsByLanguage(sortedTests, 'pl', 'first');
      break;
    case 'en_first':
      sortedTests = sortOrFilterTestsByLanguage(sortedTests, 'en', 'first');
      break;
    case 'pl_only':
      sortedTests = sortOrFilterTestsByLanguage(sortedTests, 'pl', 'only');
      break;
    case 'en_only':
      sortedTests = sortOrFilterTestsByLanguage(sortedTests, 'en', 'only');
      break;
    case 'alphabetical':
      sortedTests = sortTestsAlphabetically(sortedTests);
      break;
    case 'rating':
      sortedTests = sortTestsByRating(sortedTests);
      break;
    case 'questions':
      sortedTests = sortTestsByQuestionCount(sortedTests);
      break;
    case 'none':
    default:
      // Brak sortowania - oryginalna kolejność
      break;
  }

  return sortedTests;
}
