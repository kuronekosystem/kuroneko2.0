import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { getUserFriendlyApiErrorMessage } from '../../../../core/errors/api-error-message';
import { AccessService } from '../../../../core/services/access.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { GalleryImage } from '../../../../core/models/gallery.models';
import { FooterComponent } from '../../../../layout/footer/footer.component';
import { NavbarComponent } from '../../../../layout/navbar/navbar.component';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { LoadingMessageComponent } from '../../../../shared/components/loading-message/loading-message.component';
import { GalleryService } from '../../services/gallery.service';
import { SlideshowComponent } from '../../components/slideshow/slideshow.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, SlideshowComponent, NavbarComponent, FooterComponent, BackButtonComponent, LoadingMessageComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly accessService = inject(AccessService);
  private readonly languageService = inject(LanguageService);
  private readonly galleryService = inject(GalleryService);
  private readonly router = inject(Router);

  // Signals públicas
  readonly isLoading = this.galleryService.isLoading;
  readonly currentCategory = this.galleryService.currentCategory;
  readonly currentPage = this.galleryService.currentPage;
  readonly totalPages = this.galleryService.totalPages;
  readonly categories = this.galleryService.categories;
  readonly filteredImages = this.galleryService.filteredImages;
  readonly currentImages = this.galleryService.currentImages;
  readonly itemsPerPage = this.galleryService.itemsPerPage;
  readonly session = this.accessService.getStoredSession();
  readonly texts = this.languageService.texts;
  errorMessage = '';

  // Getter para slideshow
  get slideshowActive(): boolean {
    return this.galleryService.slideshowState().active;
  }

  currentPath = 'Links / VIP / Gallery';

  @ViewChild('galleryGrid', { static: false }) galleryGrid?: ElementRef<HTMLElement>;

  private observer: IntersectionObserver;
  private routerSubscription?: Subscription;

  constructor() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const dataSrc = img.dataset['src'];
          if (dataSrc) {
            img.src = dataSrc;
            img.classList.add('loading');
          }
        }
      });
    }, {
      rootMargin: '100px',
      threshold: 0.1
    });
  }

  ngOnInit(): void {
    this.loadGallery();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumb();
      });
  }

  ngAfterViewInit(): void {
    this.scheduleObserver();
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateBreadcrumb(): void {
    const url = this.router.url;
    if (url.includes('gallery') || url.includes('galeria') || url.includes('galerie')) {
      this.currentPath = `${this.texts().gallery.home} / VIP / ${this.texts().gallery.title}`;
    } else {
      this.currentPath = this.texts().gallery.home;
    }
  }

  private async loadGallery(): Promise<void> {
    this.errorMessage = '';
    const result = await this.galleryService.loadImages();
    if (result === 'invalid-session') {
      this.errorMessage = getUserFriendlyApiErrorMessage('invalid access', 'gallery');
      this.accessService.clearSession();
      await new Promise(resolve => setTimeout(resolve, 700));
      await this.router.navigate(['/access/login']);
      return;
    }

    if (result === 'system-error') {
      this.errorMessage = getUserFriendlyApiErrorMessage(undefined, 'gallery');
      return;
    }

    this.scheduleObserver();
  }

  private scheduleObserver(): void {
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.setupImageObservers();
      }, 100);
    });
  }

  private setupImageObservers(): void {
    this.observer.disconnect();
    const images = document.querySelectorAll('.gallery__image[data-src]');
    images.forEach(img => this.observer.observe(img));
  }

  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.galleryService.filterByCategory(select.value);
    this.scheduleObserver();
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let page = Number.parseInt(input.value, 10);
    if (Number.isNaN(page)) page = 1;
    page = Math.max(1, Math.min(page, this.totalPages()));
    input.value = page.toString();
    this.galleryService.setPage(page);

    const gallery = document.getElementById('gallery');
    if (gallery) gallery.scrollIntoView({ behavior: 'smooth' });

    this.scheduleObserver();
  }

  onPageKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
      this.onPageInput(event);
    }
  }

  onPrevPage(): void {
    this.galleryService.setPage(this.currentPage() - 1);
    this.scheduleObserver();
  }

  onNextPage(): void {
    this.galleryService.setPage(this.currentPage() + 1);
    this.scheduleObserver();
  }

  onImageClick(index: number): void {
    this.galleryService.openSlideshow(index);
  }

  onImageLoaded(img: HTMLImageElement): void {
    img.classList.add('loaded');
    img.closest('.gallery__image-wrapper')?.classList.add('loaded');
  }

  onImageError(img: HTMLImageElement): void {
    img.classList.add('error');
    const wrapper = img.closest('.gallery__image-wrapper');
    if (wrapper) {
      wrapper.classList.add('loaded');
    }
    img.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23333\'/%3E%3Ctext x=\'50\' y=\'50\' font-size=\'14\' fill=\'%23ffd700\' text-anchor=\'middle\' dy=\'.3em\'%3E⚠️%3C/text%3E%3C/svg%3E';
  }

  trackById(index: number, item: GalleryImage): string {
    return item.id || index.toString();
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToVipBoard(): void {
    this.router.navigate(['/vip-board']);
  }
}
