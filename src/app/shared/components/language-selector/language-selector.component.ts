import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../core/i18n/language.service';
import { LanguageCode } from '../../../core/i18n/language.model';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent {
  private readonly languageService = inject(LanguageService);

  readonly language = this.languageService.language;
  readonly options = this.languageService.options;
  readonly texts = this.languageService.texts;

  changeLanguage(language: LanguageCode): void {
    this.languageService.setLanguage(language);
  }
}
