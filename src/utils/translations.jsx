import ms from "@/i18n/ms.json";
import en from "@/i18n/en.json";
import ar from "@/i18n/ar.json";

const packs = { ms, en, ar };

let currentLang = localStorage.getItem("language") || "ms";

window.addEventListener("storage", () => {
  currentLang = localStorage.getItem("language") || "ms";
});

export function getCurrentLanguage() {
  return currentLang;
}

/**
 * Translate a key
 * @param {string} key
 * @returns string
 */
export const translate = (key) => {
  return packs[currentLang]?.[key] || packs.ms?.[key] || key;
};