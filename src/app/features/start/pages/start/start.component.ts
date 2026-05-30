import { Component, ElementRef, ViewChild, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { APP_LINKS } from '../../../../core/constants/app-links.config';
import { LanguageCode } from '../../../../core/i18n/language.model';
import { LanguageService } from '../../../../core/i18n/language.service';
import { KuronekoApiService } from '../../../../core/services/kuroneko-api.service';

interface CounterResponse {
  success: boolean;
  count?: number;
}

type StartLanguage = 'jp' | 'en';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {
  private readonly api = inject(KuronekoApiService);
  private readonly languageService = inject(LanguageService);
  readonly links = APP_LINKS;

  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  isPlaying = signal(false);
  audioLoaded = signal(false);
  currentFrequency = signal('432.5');
  visitCount = signal(0);
  isLoading = signal(true);

  readonly displayLanguage = computed<StartLanguage>(() =>
    this.languageService.currentLanguage() === 'ja' ? 'jp' : 'en'
  );

  private readonly STORAGE_KEY = 'kuroneko_visit_data';
  private readonly SESSION_KEY = 'kuroneko_session_active';

  // Textos multilingües
  messages = {
    jp: {
      title: 'ボクの隠れ家へようこそ',
      message1: '以前のXアカウント（@NekoSuiroK）が凍結されたため、',
      message2: 'これを機に、活動のスタイルを新しくすることにしました。',
      message3: 'これからはNSFWや過激な投稿を控え、',
      message4: 'ボクの作品やプロジェクトをメインに紹介していく',
      message5: 'クリエイティブな空間として運営していきます。',
      welcome: '✨ 新しい一歩を、一緒に歩んでくれたら嬉しいな ✨',
      counterLabel: '総訪問者数'
    },
    en: {
      title: 'Welcome to my lair',
      message1: 'Following the suspension of my previous X account (@NekoSuiroK),',
      message2: 'I have decided to take a new direction with my content.',
      message3: 'My current focus moves away from NSFW or suggestive material',
      message4: 'to become a space dedicated exclusively',
      message5: 'to showcasing my artistic works and projects.',
      welcome: '✨ Thank you for joining me in this new chapter ✨',
      counterLabel: 'Total visitors'
    }
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initVisitCounter();
  }

  async initVisitCounter(): Promise<void> {
    try {
      const count = await this.getCurrentCount();
      this.visitCount.set(count);

      // Si no hay sesión activa, incrementar contador
      if (!sessionStorage.getItem(this.SESSION_KEY)) {
        sessionStorage.setItem(this.SESSION_KEY, 'true');
        const newCount = await this.incrementCounter();
        this.visitCount.set(newCount);
      }
    } catch {
      // Fallback a localStorage
      const localCount = this.getLocalCount();
      this.visitCount.set(localCount);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async getCurrentCount(): Promise<number> {
    try {
      const response = await this.api.get<CounterResponse>({ counter: 'get' });
      return response.success && typeof response.count === 'number' ? response.count : this.getLocalCount();
    } catch (error) {
      return this.getLocalCount();
    }
  }

  private async incrementCounter(): Promise<number> {
    try {
      const response = await this.api.get<CounterResponse>({ counter: 'increment' });
      if (response.success && typeof response.count === 'number') {
        localStorage.setItem(this.STORAGE_KEY, response.count.toString());
        return response.count;
      }
      throw new Error('Invalid response');
    } catch (error) {
      const newCount = this.getLocalCount() + 1;
      localStorage.setItem(this.STORAGE_KEY, newCount.toString());
      return newCount;
    }
  }

  private getLocalCount(): number {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? parseInt(stored) : 0;
  }

  onAudioCanPlay(): void {
    this.audioLoaded.set(true);
    this.startFrequencyAnimation();
  }

  togglePlay(): void {
    const audio = this.audioPlayer.nativeElement;
    if (this.isPlaying()) {
      audio.pause();
      this.isPlaying.set(false);
    } else {
      audio.play();
      this.isPlaying.set(true);
    }
  }

  goToGallery(): void {
    this.router.navigate(['/gallery']);
  }

  setLanguage(language: LanguageCode): void {
    this.languageService.setLanguage(language);
  }

  private startFrequencyAnimation(): void {
    setInterval(() => {
      const base = 432.5;
      const variation = Math.sin(Date.now() / 2000) * 0.5;
      this.currentFrequency.set((base + variation).toFixed(1));
    }, 100);
  }
}
