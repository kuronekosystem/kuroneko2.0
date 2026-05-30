import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_LANGUAGE, LANGUAGE_OPTIONS, TRANSLATIONS } from './translations';
import { LanguageCode, TranslationMap } from './language.model';

const LANGUAGE_STORAGE_KEY = 'kuronekoLanguage';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly selectedLanguage = signal<LanguageCode>(this.readStoredLanguage());

  readonly currentLanguage = this.selectedLanguage.asReadonly();
  readonly language = this.currentLanguage;
  readonly texts = computed(() => TRANSLATIONS[this.selectedLanguage()]);
  readonly options = LANGUAGE_OPTIONS;

  setLanguage(language: LanguageCode): void {
    if (!this.isLanguageCode(language)) return;

    this.selectedLanguage.set(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  translate<K extends keyof TranslationMap>(key: K): TranslationMap[K] {
    return this.texts()[key];
  }

  t<K extends keyof TranslationMap>(key: K): TranslationMap[K] {
    return this.translate(key);
  }

  private readStoredLanguage(): LanguageCode {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const language = this.normalizeLanguageCode(stored);

    if (language) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      return language;
    }

    return DEFAULT_LANGUAGE;
  }

  private isLanguageCode(value: string | null): value is LanguageCode {
    return LANGUAGE_OPTIONS.some(option => option.code === value);
  }

  private normalizeLanguageCode(value: string | null): LanguageCode | null {
    if (!value) return null;

    const normalized = value.trim().replace(/^['"]|['"]$/g, '');
    if (this.isLanguageCode(normalized)) return normalized;
    if (normalized === 'jp') return 'ja';

    switch (normalized.toLowerCase()) {
      case 'ja':
      case 'ja-jp':
        return 'ja';
      case 'es':
      case 'es-es':
      case 'es-ar':
        return 'es';
      case 'en':
      case 'en-us':
      case 'en-gb':
        return 'en';
      case 'zh-cn':
      case 'zh-hans':
        return 'zh-CN';
      case 'zh-tw':
      case 'zh-hant':
        return 'zh-TW';
      default:
        return null;
    }
  }
}
