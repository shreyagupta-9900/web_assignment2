/**
 * ============================================================================
 * 🌗 THEME SWITCHER (public/js/theme.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS SCRIPT DO?
 * Manages toggling between Dark Mode and Light Mode, and saves the user's
 * preference to browser `localStorage` so it persists across page reloads.
 * ============================================================================
 */

const STORAGE_KEY = "lab_asset_theme";

/**
 * Initialize theme based on saved preference in localStorage.
 */
export function initTheme() {
  const themeBtn = document.getElementById("themeToggleBtn");

  // Check if user previously selected light theme
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    updateThemeIcon(true);
  } else {
    updateThemeIcon(false);
  }

  // Toggle theme on button click
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light-theme");
      updateThemeIcon(isLight);
      // Save setting in browser storage
      localStorage.setItem(STORAGE_KEY, isLight ? "light" : "dark");
    });
  }
}

/**
 * Switch icon between Sun and Moon based on current theme state.
 * @param {boolean} isLight 
 */
function updateThemeIcon(isLight) {
  const icon = document.querySelector("#themeToggleBtn i");
  if (icon) {
    icon.className = isLight ? "bx bx-moon" : "bx bx-sun";
  }
}
