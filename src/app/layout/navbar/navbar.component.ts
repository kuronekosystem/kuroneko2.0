import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import { AccessService } from '../../core/services/access.service';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { ModalService } from '../../shared/services/modal.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LanguageSelectorComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  private readonly accessService = inject(AccessService);
  private readonly languageService = inject(LanguageService);
  private readonly modalService = inject(ModalService);
  private readonly router = inject(Router);

  readonly texts = this.languageService.texts;
  readonly vipSession = this.accessService.vipSession;
  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  async logoutVipSession(): Promise<void> {
    const confirmed = await this.modalService.confirm(
      this.texts().modal.confirm,
      this.texts().vipSession.confirmLogout,
      this.texts().modal.ok,
      this.texts().modal.cancel
    );
    if (!confirmed) return;

    this.accessService.clearSession();
    this.closeSidebar();
    void this.router.navigateByUrl('/');
  }
}
