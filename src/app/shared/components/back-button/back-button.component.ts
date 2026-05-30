import { Location } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-back-button',
  standalone: true,
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss']
})
export class BackButtonComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);

  readonly label = input<string | undefined>();
  readonly fallbackRoute = input('/');
  readonly displayLabel = computed(() => this.label() ?? this.languageService.texts().backButton.back);

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl(this.fallbackRoute());
  }
}
