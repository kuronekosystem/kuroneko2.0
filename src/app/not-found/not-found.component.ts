import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../core/i18n/language.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);

  readonly texts = this.languageService.texts;

  navigateToLinktree(): void {
    void this.router.navigateByUrl('/');
  }

  navigateToAccess(): void {
    void this.router.navigateByUrl('/access');
  }
}
