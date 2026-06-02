import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { APP_LINKS } from '../../../../core/constants/app-links.config';
import { LanguageService } from '../../../../core/i18n/language.service';
import { LanguageSelectorComponent } from '../../../../shared/components/language-selector/language-selector.component';
import { VipSessionStatusComponent } from '../../../../shared/components/vip-session-status/vip-session-status.component';
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
  readonly visitCount = signal<number | null>(null);
  readonly isVisitCountLoading = signal(true);
  readonly isPlaying = signal(false);
  readonly audioLoaded = signal(false);
  readonly audioError = signal(false);
  readonly isMusicLoading = signal(false);
  readonly showAdultWarning = signal(false);
  readonly showSupportModal = signal(false);
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
