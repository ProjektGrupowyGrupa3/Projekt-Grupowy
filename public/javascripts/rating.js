/**
 * rating.js
 * - logika gwiazdek (średnia, highlight, init eventów)
 * - trzyma minimalny stan w window (selectedRating/selectedDifficulty)
 *
 * Backend: powinien zwracać mapy:
 *  - ratings: { userId: rating }
 *  - difficultyRatings: { userId: difficulty }
 *
 * Front używa calculateAverageFromObject(obj) (z script.js) do liczenia średniej.
 */

(function(){
    // Bez redeklaracji - korzystamy z window
    window.selectedRating = window.selectedRating || 0;
    window.selectedDifficulty = window.selectedDifficulty || 0;
  
    /**
     * generateStarHTML(avg, max)
     * - generuje HTML gwiazdek (używane do wyświetlania średniej)
     */
    function generateStarHTML(avg, max = 5) {
      const rounded = Math.round(avg || 0);
      let html = '';
      for (let i=0;i<rounded;i++) html += '<span class="star-filled">★</span>';
      for (let i=rounded;i<max;i++) html += '<span class="star-empty">☆</span>';
      return html;
    }
  
    function generateDifficultyStarHTML(avg) {
      return generateStarHTML(avg, 3);
    }
  
    /* --- highlight helpers for interactive stars --- */
    function highlightStars(count) {
      document.querySelectorAll('#ratingStars span').forEach(s=>{
        const val = parseInt(s.dataset.star || s.textContent) || 0;
        s.classList.toggle('active', val <= count);
      });
    }
  
    function highlightDifficulty(count) {
      document.querySelectorAll('#difficultyStars span').forEach(s=>{
        const val = parseInt(s.dataset.diff || s.textContent) || 0;
        s.classList.toggle('active', val <= count);
      });
    }

  
    // expose for pages
    window.generateStarHTML = generateStarHTML;
    window.generateDifficultyStarHTML = generateDifficultyStarHTML;
    window.highlightStars = highlightStars;
    window.highlightDifficulty = highlightDifficulty;
  })();
  