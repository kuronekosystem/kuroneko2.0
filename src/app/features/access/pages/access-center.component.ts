import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/i18n/language.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-access-center',
  standalone: true,
  imports: [RouterLink, BackButtonComponent],
  templateUrl: './access-center.component.html',
  styleUrls: ['./access.component.scss']
})
export class AccessCenterComponent {
  private readonly languageService = inject(LanguageService);

  readonly texts = this.languageService.texts;
}
