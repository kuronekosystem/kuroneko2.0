import { Component, computed, inject, input } from '@angular/core';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
  private readonly languageService = inject(LanguageService);

  readonly label = input<string | undefined>();
  readonly displayLabel = computed(() => this.label() ?? this.languageService.texts().loadingMessage.loading);
}
