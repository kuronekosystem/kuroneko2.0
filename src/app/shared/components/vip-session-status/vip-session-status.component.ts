import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../../core/i18n/language.service';
import { AccessService } from '../../../core/services/access.service';

@Component({
  selector: 'app-vip-session-status',
  standalone: true,
  templateUrl: './vip-session-status.component.html',
  styleUrls: ['./vip-session-status.component.scss']
})
export class VipSessionStatusComponent {
  private readonly accessService = inject(AccessService);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);

  readonly session = this.accessService.vipSession;
  readonly texts = this.languageService.texts;
  readonly maskedUserCode = computed(() => this.maskUserCode(this.session()?.userCode ?? ''));

  goToGallery(): void {
    void this.router.navigateByUrl('/gallery');
  }

  private maskUserCode(userCode: string): string {
    if (!userCode) return '';

    const [prefix] = userCode.split('-');
    const suffix = userCode.slice(-4);
    return `${prefix || 'KNK'}-****-${suffix}`;
  }
}
