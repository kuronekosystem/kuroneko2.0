import { Component, computed, inject, input } from '@angular/core';
import { LanguageService } from '../../../core/i18n/language.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-loading-message',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  templateUrl: './loading-message.component.html',
  styleUrls: ['./loading-message.component.scss']
})
export class LoadingMessageComponent {
  private readonly languageService = inject(LanguageService);

  readonly title = input<string | undefined>();
  readonly description = input('');
  readonly spinnerLabel = input<string | undefined>();
  readonly slowTitle = input<string | undefined>();
  readonly slowDescription = input<string | undefined>();
  readonly verySlowTitle = input<string | undefined>();
  readonly verySlowDescription = input<string | undefined>();

  readonly displayTitle = computed(() => this.title() ?? this.languageService.texts().loadingMessage.loading);
  readonly displaySpinnerLabel = computed(() => this.spinnerLabel() ?? this.languageService.texts().loadingMessage.processing);
  readonly displaySlowTitle = computed(() => this.slowTitle() ?? this.languageService.texts().loadingMessage.slowTitle);
  readonly displaySlowDescription = computed(() => this.slowDescription() ?? this.languageService.texts().loadingMessage.slowDescription);
  readonly displayVerySlowTitle = computed(() => this.verySlowTitle() ?? this.languageService.texts().loadingMessage.verySlowTitle);
  readonly displayVerySlowDescription = computed(() =>
    this.verySlowDescription() ?? this.languageService.texts().loadingMessage.verySlowDescription
  );
}
