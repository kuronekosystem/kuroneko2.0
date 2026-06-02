import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../../core/i18n/language.service';

@Component({
  selector: 'app-age-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './age-verification.component.html',
  styleUrls: ['./age-verification.component.scss']
})
export class AgeVerificationComponent {
  private readonly languageService = inject(LanguageService);

  readonly texts = this.languageService.texts;

  @Output() verified = new EventEmitter<boolean>();

  onUnderage(): void {
    window.location.href = 'https://www.google.com';
  }

  onAdult(): void {
    this.verified.emit(true);
  }
}
