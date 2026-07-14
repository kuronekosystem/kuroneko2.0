import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { APP_LINKS } from '../../../../core/constants/app-links.config';
import { LanguageService } from '../../../../core/i18n/language.service';
import { LanguageSelectorComponent } from '../../../../shared/components/language-selector/language-selector.component';
import { VipSessionStatusComponent } from '../../../../shared/components/vip-session-status/vip-session-status.component';
import { ModalService } from '../../../../shared/services/modal.service';
import { VisitCounterService } from '../../services/visit-counter.service';

interface SupportPlanViewModel {
  readonly id: 'supporter' | 'vip' | 'special';
  readonly imageSrc: string;
  readonly href: string;
  readonly name: string;
  readonly price: string;
  readonly description: string;
  readonly button: string;
  readonly imageAlt: string;
  readonly recommended?: string;
}

interface AccountLinkViewModel {
  readonly id: 'emergency' | 'shin' | 'nyx' | 'pixiv' | 'mika' | 'instagram';
  readonly href: string;
  readonly title: string;
  readonly subtitle: string;
  readonly ageRestricted: boolean;
}

@Component({
  selector: 'app-linktree',
  standalone: true,
  imports: [LanguageSelectorComponent, VipSessionStatusComponent],
  templateUrl: './linktree.component.html',
  styleUrls: ['./linktree.component.scss']
})
export class LinktreeComponent implements OnInit, OnDestroy {
  private readonly languageService = inject(LanguageService);
  private readonly visitCounterService = inject(VisitCounterService);
  private readonly modalService = inject(ModalService);
  private readonly router = inject(Router);
  private readonly audioSource = environment.assets.bgm;
  private readonly adultWarningAcceptedKey = environment.storage.adultWarningAccepted;
  private audio: HTMLAudioElement | null = null;

  private readonly handleAudioLoaded = (): void => {
    this.audioLoaded.set(true);
    this.isMusicLoading.set(false);
  };

  private readonly handleAudioError = (): void => {
    this.pauseMusic();
    this.audioError.set(true);
    this.isMusicLoading.set(false);
  };

  readonly links = APP_LINKS;
  readonly texts = this.languageService.texts;
  readonly projectVersion = environment.app.version;
  readonly visitCount = signal<number | null>(null);
  readonly isVisitCountLoading = signal(true);
  readonly isPlaying = signal(false);
  readonly audioLoaded = signal(false);
  readonly audioError = signal(false);
  readonly isMusicLoading = signal(false);
  readonly showAdultWarning = signal(false);
  readonly showSupportModal = signal(false);
  readonly generalAccountLinks = computed<readonly AccountLinkViewModel[]>(() => {
    const accounts = this.texts().linktree.accounts;

    return [
      {
        id: 'emergency',
        href: 'https://x.com/er_mao13619',
        title: accounts.emergency.title,
        subtitle: this.formatAccountSubtitle(accounts.emergency.username, accounts.emergency.description),
        ageRestricted: false
      },
      {
        id: 'mika',
        href: 'https://x.com/mika_kuroneko',
        title: accounts.mika.title,
        subtitle: this.formatAccountSubtitle(accounts.mika.username, accounts.mika.description),
        ageRestricted: false
      },
      {
        id: 'instagram',
        href: 'https://www.instagram.com/kuro.nekoworld/',
        title: accounts.instagram.title,
        subtitle: this.formatAccountSubtitle(accounts.instagram.username, accounts.instagram.description),
        ageRestricted: false
      }
    ];
  });
  readonly adultAccountLinks = computed<readonly AccountLinkViewModel[]>(() => {
    const accounts = this.texts().linktree.accounts;

    return [
      {
        id: 'shin',
        href: 'https://x.com/shinai_kuroneko',
        title: accounts.shin.title,
        subtitle: this.formatAccountSubtitle(accounts.shin.username, accounts.shin.description),
        ageRestricted: true
      },
      {
        id: 'nyx',
        href: 'https://x.com/nyx_kuroneko',
        title: accounts.nyx.title,
        subtitle: this.formatAccountSubtitle(accounts.nyx.username, accounts.nyx.description),
        ageRestricted: true
      },
      {
        id: 'pixiv',
        href: this.links.pixiv,
        title: this.texts().linktree.pixivLabel,
        subtitle: this.texts().linktree.pixivSmall,
        ageRestricted: true
      }
    ];
  });
  readonly supportPlans = computed<readonly SupportPlanViewModel[]>(() => {
    const supportPlans = this.texts().support.plan;

    return [
      {
        id: 'supporter',
        imageSrc: 'images/supporter-tier.webp',
        href: 'https://paypal.me/devusui/3',
        name: supportPlans.supporter.title,
        price: supportPlans.supporter.price,
        description: supportPlans.supporter.description,
        button: supportPlans.supporter.button,
        imageAlt: supportPlans.supporter.imageAlt
      },
      {
        id: 'vip',
        imageSrc: 'images/vip-tier.webp',
        href: 'https://paypal.me/devusui/7',
        name: supportPlans.vip.title,
        price: supportPlans.vip.price,
        description: supportPlans.vip.description,
        button: supportPlans.vip.button,
        imageAlt: supportPlans.vip.imageAlt,
        recommended: supportPlans.recommended
      },
      {
        id: 'special',
        imageSrc: 'images/special-supporter-tier.webp',
        href: 'https://paypal.me/devusui/10',
        name: supportPlans.special.title,
        price: supportPlans.special.price,
        description: supportPlans.special.description,
        button: supportPlans.special.button,
        imageAlt: supportPlans.special.imageAlt
      }
    ];
  });
  readonly supportValues = computed(() => {
    const value = this.texts().support.value;

    return [
      value.independent,
      value.privacy,
      value.gallery,
      value.futureIllustrations,
      value.longTerm
    ] as const;
  });
  readonly shouldShowVisitCounter = computed(() => this.isVisitCountLoading() || this.visitCount() !== null);
  readonly formattedVisitCount = computed(() => {
    const count = this.visitCount();
    if (count === null) return '';

    return new Intl.NumberFormat(this.languageService.currentLanguage()).format(count);
  });
  readonly musicButtonLabel = computed(() => (this.isPlaying() ? this.texts().music.pause : this.texts().music.play));
  readonly musicStatusText = computed(() => {
    if (this.audioError()) return this.texts().music.error;
    if (this.isMusicLoading()) return this.texts().music.loading;

    return this.musicButtonLabel();
  });

  async ngOnInit(): Promise<void> {
    this.prepareAudio();

    const count = await this.visitCounterService.loadVisitCount();
    this.visitCount.set(count);
    this.isVisitCountLoading.set(false);
  }

  ngOnDestroy(): void {
    this.destroyAudio();
  }

  async toggleMusic(): Promise<void> {
    if (this.isPlaying()) {
      this.pauseMusic();
      return;
    }

    await this.playMusic();
  }

  openVipWarning(): void {
    if (sessionStorage.getItem(this.adultWarningAcceptedKey) === 'true') {
      this.navigateToAccess();
      return;
    }

    this.showAdultWarning.set(true);
  }

  acceptAdultWarning(): void {
    sessionStorage.setItem(this.adultWarningAcceptedKey, 'true');
    this.showAdultWarning.set(false);
    this.navigateToAccess();
  }

  closeAdultWarning(): void {
    this.showAdultWarning.set(false);
  }

  openSupportModal(): void {
    this.showSupportModal.set(true);
  }

  closeSupportModal(): void {
    this.showSupportModal.set(false);
  }

  async handleExternalLinkClick(event: MouseEvent, link: AccountLinkViewModel): Promise<void> {
    if (!link.ageRestricted) return;

    event.preventDefault();
    const modal = this.texts().linktree.ageRestrictedModal;
    const confirmed = await this.modalService.confirm(
      modal.title,
      modal.message,
      modal.confirm,
      modal.cancel
    );

    if (confirmed) {
      this.openExternalLink(link.href);
    }
  }

  @HostListener('document:keydown.escape')
  closeWarningOnEscape(): void {
    if (this.showAdultWarning()) {
      this.closeAdultWarning();
      return;
    }

    if (this.showSupportModal()) {
      this.closeSupportModal();
    }
  }

  private navigateToAccess(): void {
    void this.router.navigateByUrl('/access');
  }

  private formatAccountSubtitle(username: string, description: string): string {
    return username ? `${username} · ${description}` : description;
  }

  private openExternalLink(href: string): void {
    const externalWindow = globalThis.open(href, '_blank', 'noopener,noreferrer');
    if (externalWindow) {
      externalWindow.opener = null;
    }
  }

  private prepareAudio(): void {
    if (this.audio !== null) return;

    const audio = new Audio(this.audioSource);
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = 'metadata';
    audio.addEventListener('canplaythrough', this.handleAudioLoaded);
    audio.addEventListener('error', this.handleAudioError);
    this.audio = audio;
  }

  private async playMusic(): Promise<void> {
    this.prepareAudio();

    if (this.audio === null) return;

    this.audioError.set(false);
    this.isMusicLoading.set(!this.audioLoaded());

    try {
      await this.audio.play();
      this.isPlaying.set(true);
    } catch {
      this.audioError.set(true);
      this.isPlaying.set(false);
    } finally {
      this.isMusicLoading.set(false);
    }
  }

  private pauseMusic(): void {
    this.audio?.pause();
    this.isPlaying.set(false);
    this.isMusicLoading.set(false);
  }

  private destroyAudio(): void {
    if (this.audio === null) return;

    this.pauseMusic();
    this.audio.removeEventListener('canplaythrough', this.handleAudioLoaded);
    this.audio.removeEventListener('error', this.handleAudioError);
    this.audio.src = '';
    this.audio.load();
    this.audio = null;
  }
}
