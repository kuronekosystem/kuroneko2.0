import { Component, inject, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryService } from '../../services/gallery.service';

@Component({
  selector: 'app-slideshow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss']
})
export class SlideshowComponent implements OnInit, OnDestroy {
  private readonly galleryService = inject(GalleryService);

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

  ngOnInit(): void {
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
        this.toggleZoom();
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
      this.resetUITimer();
      this.preloadNextImage();
    }
  }

  prev(): void {
    if (this.slideshowState.index > 0) {
      this.galleryService.prevSlide();
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

  toggleUI(): void {
    this.galleryService.toggleUI();
    this.clearUITimeout();
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
