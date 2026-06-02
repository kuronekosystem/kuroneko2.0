import { Injectable, computed, inject, signal } from '@angular/core';
import { AccessService } from '../../../core/services/access.service';
import { KuronekoApiService } from '../../../core/services/kuroneko-api.service';
import { GalleryImage, GalleryState, SlideshowState, DEFAULT_GALLERY_STATE, DEFAULT_SLIDESHOW_STATE, DEFAULT_PAN_STATE } from '../../../core/models/gallery.models';

interface ExclusiveGalleryResponse {
  success: boolean;
  message?: string;
  items?: GalleryImage[];
}

export type GalleryLoadResult = 'success' | 'invalid-session' | 'system-error';

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private readonly minZoom = 1;
  private readonly maxZoom = 3;
  private readonly zoomStep = 0.25;
  private readonly accessService = inject(AccessService);
  private readonly api = inject(KuronekoApiService);
  private galleryState = signal<GalleryState>(DEFAULT_GALLERY_STATE);
  slideshowState = signal<SlideshowState>(DEFAULT_SLIDESHOW_STATE);
  readonly itemsPerPage = DEFAULT_GALLERY_STATE.itemsPerPage;

  readonly isLoading = computed(() => this.galleryState().isLoading);
  readonly currentCategory = computed(() => this.galleryState().currentCategory);
  readonly currentPage = computed(() => this.galleryState().currentPage);
  readonly totalPages = computed(() => this.galleryState().totalPages);
  readonly categories = computed(() => Array.from(this.galleryState().categories));
  readonly filteredImages = computed(() => this.galleryState().filteredImages);
  readonly currentImages = computed(() => {
    const state = this.galleryState();
    const start = (state.currentPage - 1) * state.itemsPerPage;
    return state.filteredImages.slice(start, start + state.itemsPerPage);
  });

  async loadImages(): Promise<GalleryLoadResult> {
    this.galleryState.update(state => ({ ...state, isLoading: true }));

    try {
      const credentials = this.accessService.getSessionCredentials();
      if (!credentials) return 'invalid-session';

      const response = await this.api.post<ExclusiveGalleryResponse>({
        action: 'get_exclusive_gallery',
        userCode: credentials.userCode,
        accessKey: credentials.accessKey
      });

      if (!response.success) {
        return this.isSessionError(response.message) ? 'invalid-session' : 'system-error';
      }

      this.updateGalleryWithImages(response.items ?? []);
      return 'success';
    } catch (error) {
      return 'system-error';
    } finally {
      this.galleryState.update(state => ({ ...state, isLoading: false }));
    }
  }

  private updateGalleryWithImages(images: GalleryImage[]): void {
    const validImages = images
      .filter(img => !!img.thumbnail)
      .map(img => ({
        ...img,
        fullSize: img.fullSize || img.thumbnail,
        category: img.category || '一般'
      }));
    const categories = new Set(['All']);
    validImages.forEach(img => categories.add(img.category));

    this.galleryState.update(state => ({
      ...state,
      allImages: validImages,
      categories,
      filteredImages: validImages
    }));

    this.updatePagination();
  }

  filterByCategory(category: string): void {
    const state = this.galleryState();
    const filtered = category === 'All'
      ? [...state.allImages]
      : state.allImages.filter(img => img.category === category);

    this.galleryState.update(state => ({
      ...state,
      currentCategory: category,
      filteredImages: filtered,
      currentPage: 1
    }));

    this.updatePagination();
  }

  setPage(page: number): void {
    const state = this.galleryState();
    const validPage = Math.max(1, Math.min(page, state.totalPages));

    if (validPage !== state.currentPage) {
      this.galleryState.update(state => ({ ...state, currentPage: validPage }));
    }
  }

  private updatePagination(): void {
    const state = this.galleryState();
    const totalPages = Math.max(1, Math.ceil(state.filteredImages.length / state.itemsPerPage));

    this.galleryState.update(state => ({
      ...state,
      totalPages,
      currentPage: Math.min(state.currentPage, totalPages)
    }));
  }

  openSlideshow(index: number): void {
    if (index < 0 || index >= this.galleryState().filteredImages.length) return;

    this.slideshowState.update(state => ({
      ...state,
      active: true,
      index,
      ...this.getResetZoomState()
    }));
  }

  closeSlideshow(): void {
    this.slideshowState.update(state => ({
      ...DEFAULT_SLIDESHOW_STATE,
      imageCache: state.imageCache
    }));
  }

  nextSlide(): void {
    const state = this.slideshowState();
    const maxIndex = this.galleryState().filteredImages.length - 1;

    if (state.index < maxIndex) {
      this.slideshowState.update(state => ({
        ...state,
        index: state.index + 1,
        ...this.getResetZoomState()
      }));
      this.preloadNextImage(state.index + 2);
    }
  }

  prevSlide(): void {
    const state = this.slideshowState();
    if (state.index > 0) {
      this.slideshowState.update(state => ({
        ...state,
        index: state.index - 1,
        ...this.getResetZoomState()
      }));
    }
  }

  toggleZoom(): void {
    const nextZoom = this.slideshowState().zoomLevel > this.minZoom ? this.minZoom : this.minZoom + this.zoomStep;
    this.setZoom(nextZoom);
  }

  zoomIn(): void {
    this.setZoom(this.slideshowState().zoomLevel + this.zoomStep);
  }

  zoomOut(): void {
    this.setZoom(this.slideshowState().zoomLevel - this.zoomStep);
  }

  resetZoom(): void {
    this.setZoom(this.minZoom);
  }

  setZoom(value: number): void {
    const zoomLevel = this.normalizeZoom(value);

    this.slideshowState.update(state => {
      const zoomed = zoomLevel > this.minZoom;
      const pan = zoomed ? this.clampPanState(state.pan, zoomLevel) : { ...DEFAULT_PAN_STATE };

      return {
        ...state,
        zoomed,
        zoomLevel,
        pan
      };
    });
  }

  toggleUI(): void {
    this.slideshowState.update(state => ({
      ...state,
      manualHidden: !state.manualHidden,
      uiHidden: !state.uiHidden
    }));
  }

  // Nuevo método: iniciar arrastre
  startPan(clientX: number, clientY: number): void {
    if (!this.slideshowState().zoomed) return;

    this.slideshowState.update(state => ({
      ...state,
      pan: {
        ...state.pan,
        isDragging: true,
        startX: clientX - state.pan.lastX,
        startY: clientY - state.pan.lastY
      }
    }));
  }

  // Actualizar arrastre
  updatePan(clientX: number, clientY: number): void {
    const state = this.slideshowState();
    if (!state.zoomed || !state.pan.isDragging) return;

    const nextPan = this.clampPanPosition(
      clientX - state.pan.startX,
      clientY - state.pan.startY,
      state.zoomLevel
    );

    this.slideshowState.update(state => ({
      ...state,
      pan: {
        ...state.pan,
        currentX: nextPan.x,
        currentY: nextPan.y,
        lastX: nextPan.x,
        lastY: nextPan.y
      }
    }));
  }

  // Finalizar arrastre
  endPan(): void {
    this.slideshowState.update(state => ({
      ...state,
      pan: {
        ...state.pan,
        isDragging: false
      }
    }));
  }

  // Resetear pan (útil al cambiar zoom)
  resetPan(): void {
    this.slideshowState.update(state => ({
      ...state,
      pan: { ...DEFAULT_PAN_STATE }
    }));
  }

  private getResetZoomState(): Pick<SlideshowState, 'zoomed' | 'zoomLevel' | 'pan'> {
    return {
      zoomed: false,
      zoomLevel: this.minZoom,
      pan: { ...DEFAULT_PAN_STATE }
    };
  }

  private normalizeZoom(value: number): number {
    const clamped = Math.max(this.minZoom, Math.min(this.maxZoom, value));
    return Math.round(clamped / this.zoomStep) * this.zoomStep;
  }

  private clampPanState(pan: SlideshowState['pan'], zoomLevel: number): SlideshowState['pan'] {
    const nextPan = this.clampPanPosition(pan.currentX, pan.currentY, zoomLevel);

    return {
      ...pan,
      currentX: nextPan.x,
      currentY: nextPan.y,
      lastX: nextPan.x,
      lastY: nextPan.y
    };
  }

  private clampPanPosition(x: number, y: number, zoomLevel: number): { x: number; y: number } {
    if (zoomLevel <= this.minZoom) return { x: 0, y: 0 };

    const maxX = window.innerWidth * (zoomLevel - 1) * 0.5;
    const maxY = window.innerHeight * (zoomLevel - 1) * 0.5;

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    };
  }

  private preloadNextImage(index: number): void {
    const images = this.galleryState().filteredImages;
    if (index < images.length) {
      const img = new Image();
      img.src = images[index].fullSize;
    }
  }

  private isSessionError(message: string | undefined): boolean {
    const normalized = (message ?? '').toLowerCase();
    return (
      normalized.includes('invalid') ||
      normalized.includes('expired') ||
      normalized.includes('not active') ||
      normalized.includes('no access') ||
      normalized.includes('access key')
    );
  }
}
