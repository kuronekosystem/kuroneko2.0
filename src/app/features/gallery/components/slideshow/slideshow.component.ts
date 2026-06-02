import { Component, inject, OnDestroy, OnInit, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryService } from '../../services/gallery.service';
import { LanguageService } from '../../../../core/i18n/language.service';

@Component({
  selector: 'app-slideshow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss']
})
export class SlideshowComponent implements OnInit, OnDestroy {
  private readonly galleryService = inject(GalleryService);
  private readonly languageService = inject(LanguageService);
  readonly texts = this.languageService.texts;
  readonly isImageLoading = signal(true);
  readonly imageLoadError = signal(false);

  get slideshowState() {
    return this.galleryService.slideshowState();
  }

  get currentImage() {
    const index = this.slideshowState.index;
    return this.galleryService.filteredImages()[index];
  }

  get totalImages() {
    return this.galleryService.filteredImages().length;
  }

  get currentIndex() {
    return this.slideshowState.index + 1;
  }

  private uiTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeImageKey = '';

  ngOnInit(): void {
    this.prepareImageLoadState();
    this.preloadNextImage();
  }

  ngOnDestroy(): void {
    this.clearUITimeout();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    switch(event.key) {
      case 'ArrowRight':
        this.next();
        break;
      case 'ArrowLeft':
        this.prev();
        break;
      case 'Escape':
        this.close();
        break;
      case ' ':
        event.preventDefault();
        this.zoomIn();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
        event.preventDefault();
        this.zoomOut();
        break;
      case '0':
        event.preventDefault();
        this.resetZoom();
        break;
    }
  }

  @HostListener('mousemove')
  onMouseMove(): void {
    this.showUITemporarily();
  }

  @HostListener('touchmove')
  onTouchMove(): void {
    this.showUITemporarily();
  }

  next(): void {
    if (this.slideshowState.index < this.totalImages - 1) {
      this.galleryService.nextSlide();
      this.prepareImageLoadState();
      this.resetUITimer();
      this.preloadNextImage();
    }
  }

  prev(): void {
    if (this.slideshowState.index > 0) {
      this.galleryService.prevSlide();
      this.prepareImageLoadState();
      this.resetUITimer();
      this.preloadNextImage();
    }
  }

  close(): void {
    this.galleryService.closeSlideshow();
  }

  toggleZoom(): void {
    this.galleryService.toggleZoom();
    this.showUITemporarily();
  }

  zoomIn(): void {
    this.galleryService.zoomIn();
    this.showUITemporarily();
  }

  zoomOut(): void {
    this.galleryService.zoomOut();
    this.showUITemporarily();
  }

  resetZoom(): void {
    this.galleryService.resetZoom();
    this.showUITemporarily();
  }

  zoomPercent(): string {
    return `${Math.round(this.slideshowState.zoomLevel * 100)}%`;
  }

  imageTransform(): string {
    const { currentX, currentY } = this.slideshowState.pan;
    return `translate3d(${currentX}px, ${currentY}px, 0) scale(${this.slideshowState.zoomLevel})`;
  }

  onWheelZoom(event: WheelEvent): void {
    event.preventDefault();

    if (event.deltaY < 0) {
      this.zoomIn();
      return;
    }

    this.zoomOut();
  }

  onDoubleClick(event: MouseEvent): void {
    event.preventDefault();

    if (this.slideshowState.zoomLevel >= 3) {
      this.galleryService.resetZoom();
    } else {
      this.galleryService.zoomIn();
    }

    this.showUITemporarily();
  }

  toggleUI(): void {
    this.galleryService.toggleUI();
    this.clearUITimeout();
  }

  onImageLoad(): void {
    this.isImageLoading.set(false);
    this.imageLoadError.set(false);
  }

  onImageError(): void {
    this.isImageLoading.set(false);
    this.imageLoadError.set(true);
  }

  private showUITemporarily(): void {
    if (this.slideshowState.zoomed) return;

    this.clearUITimeout();

    if (!this.slideshowState.manualHidden) {
      if (this.slideshowState.uiHidden) {
        this.galleryService.toggleUI();
      }

      this.uiTimeout = setTimeout(() => {
        if (!this.slideshowState.zoomed && !this.slideshowState.manualHidden) {
          this.galleryService.toggleUI();
        }
      }, 3000);
    }
  }

  private resetUITimer(): void {
    this.clearUITimeout();
    if (!this.slideshowState.zoomed && !this.slideshowState.manualHidden) {
      this.uiTimeout = setTimeout(() => {
        if (!this.slideshowState.zoomed && !this.slideshowState.manualHidden) {
          this.galleryService.toggleUI();
        }
      }, 3000);
    }
  }

  private clearUITimeout(): void {
    if (this.uiTimeout) {
      clearTimeout(this.uiTimeout);
      this.uiTimeout = null;
    }
  }

  private preloadNextImage(): void {
    const nextIndex = this.slideshowState.index + 1;
    if (nextIndex < this.totalImages) {
      const nextImage = this.galleryService.filteredImages()[nextIndex];
      if (nextImage) {
        const img = new Image();
        img.src = nextImage.fullSize;
      }
    }
  }

  private prepareImageLoadState(): void {
    const image = this.currentImage;
    const imageKey = `${image?.id ?? ''}:${image?.fullSize ?? ''}`;
    if (imageKey === this.activeImageKey) return;

    this.activeImageKey = imageKey;
    this.isImageLoading.set(true);
    this.imageLoadError.set(false);
  }

  // --- Eventos de arrastre (mouse) ---
  onPanStart(event: MouseEvent | TouchEvent): void {
    if (!this.slideshowState.zoomed) return;

    event.preventDefault();
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.galleryService.startPan(clientX, clientY);
  }

  onPanMove(event: MouseEvent | TouchEvent): void {
    if (!this.slideshowState.zoomed || !this.slideshowState.pan.isDragging) return;

    event.preventDefault();
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.galleryService.updatePan(clientX, clientY);
  }

  onPanEnd(event?: MouseEvent | TouchEvent): void {
    if (!this.slideshowState.zoomed) return;

    this.galleryService.endPan();
  }
}
