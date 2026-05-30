import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../core/i18n/language.service';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';
import { AdminService } from './admin.service';
import {
  AdminCredentials,
  AdminGalleryFilter,
  AdminGalleryItem,
  AdminGalleryItemPayload,
  GalleryItemStatus
} from './admin.types';

interface GalleryItemForm {
  title: string;
  description: string;
  thumbnail: string;
  fullSize: string;
  category: string;
  status: GalleryItemStatus;
}

@Component({
  selector: 'app-admin-gallery-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './admin-gallery-manager.component.html',
  styleUrls: ['./admin-gallery-manager.component.scss']
})
export class AdminGalleryManagerComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly languageService = inject(LanguageService);

  readonly texts = this.languageService.texts;
  readonly filters: readonly AdminGalleryFilter[] = ['all', 'active', 'disabled'];

  credentials: AdminCredentials | null = null;
  galleryItems: AdminGalleryItem[] = [];
  galleryFilter: AdminGalleryFilter = 'all';
  galleryForm: GalleryItemForm = this.createForm();
  editingGalleryItemId: string | null = null;
  isFetching = false;
  isSaving = false;
  processingItemId: string | null = null;
  processingAction: 'disable' | 'delete' | null = null;
  errorMessage = '';
  successMessage = '';
  failedPreviewIds = new Set<string>();

  async ngOnInit(): Promise<void> {
    this.credentials = this.adminService.getStoredCredentials();
    if (!this.credentials) {
      this.errorMessage = this.texts().admin.gallery.error;
      return;
    }

    await this.loadGalleryItems();
  }

  filteredItems(): AdminGalleryItem[] {
    if (this.galleryFilter === 'all') return this.galleryItems;
    return this.galleryItems.filter(item => item.status === this.galleryFilter);
  }

  filterLabel(filter: AdminGalleryFilter): string {
    const gallery = this.texts().admin.gallery;
    if (filter === 'all') return gallery.filterAll;
    return filter === 'active' ? gallery.filterActive : gallery.filterDisabled;
  }

  statusLabel(status: GalleryItemStatus): string {
    return status === 'active' ? this.texts().admin.gallery.statusActive : this.texts().admin.gallery.statusDisabled;
  }

  async loadGalleryItems(): Promise<void> {
    if (!this.credentials) return;

    this.isFetching = true;
    this.errorMessage = '';

    try {
      this.galleryItems = await this.adminService.adminGetGalleryItems(this.credentials);
      this.failedPreviewIds.clear();
    } catch {
      this.errorMessage = this.texts().admin.gallery.error;
    } finally {
      this.isFetching = false;
    }
  }

  async saveGalleryItem(): Promise<void> {
    if (!this.credentials) return;

    const payload = this.preparePayload();
    if (!payload) {
      this.errorMessage = this.texts().admin.gallery.inputError;
      this.successMessage = '';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      if (this.editingGalleryItemId) {
        await this.adminService.adminUpdateGalleryItem(this.credentials, this.editingGalleryItemId, payload);
        this.successMessage = this.texts().admin.gallery.updateSuccess;
      } else {
        await this.adminService.adminAddGalleryItem(this.credentials, payload);
        this.successMessage = this.texts().admin.gallery.addSuccess;
      }

      this.cancelEdit();
      await this.loadGalleryItems();
    } catch {
      this.errorMessage = this.texts().admin.gallery.error;
      this.successMessage = '';
    } finally {
      this.isSaving = false;
    }
  }

  editItem(item: AdminGalleryItem): void {
    this.editingGalleryItemId = item.id;
    this.galleryForm = {
      title: item.title,
      description: item.description,
      thumbnail: item.thumbnail,
      fullSize: item.fullSize,
      category: item.category || 'kuroneko',
      status: item.status
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit(): void {
    this.editingGalleryItemId = null;
    this.galleryForm = this.createForm();
  }

  async disableItem(item: AdminGalleryItem): Promise<void> {
    await this.runItemAction(item.id, 'disable', async () => {
      if (!this.credentials) return;
      await this.adminService.adminDisableGalleryItem(this.credentials, item.id);
      this.successMessage = this.texts().admin.gallery.disableSuccess;
      await this.loadGalleryItems();
    });
  }

  async deleteItem(item: AdminGalleryItem): Promise<void> {
    await this.runItemAction(item.id, 'delete', async () => {
      if (!this.credentials) return;
      await this.adminService.adminDeleteGalleryItem(this.credentials, item.id);
      this.successMessage = this.texts().admin.gallery.deleteSuccess;
      await this.loadGalleryItems();
    });
  }

  async copyUrl(item: AdminGalleryItem): Promise<void> {
    if (!navigator.clipboard || !item.fullSize) return;

    try {
      await navigator.clipboard.writeText(item.fullSize);
      this.successMessage = this.texts().admin.gallery.urlCopied;
      this.errorMessage = '';
    } catch {
      this.errorMessage = this.texts().admin.gallery.error;
      this.successMessage = '';
    }
  }

  previewUrl(item: AdminGalleryItem): string {
    return item.thumbnail || item.fullSize;
  }

  formPreviewUrl(): string {
    return this.galleryForm.thumbnail.trim() || this.galleryForm.fullSize.trim();
  }

  isPreviewAvailable(item: AdminGalleryItem): boolean {
    return !!this.previewUrl(item) && !this.failedPreviewIds.has(item.id);
  }

  markPreviewFailed(id: string): void {
    this.failedPreviewIds.add(id);
  }

  isProcessing(id: string, action?: 'disable' | 'delete'): boolean {
    return this.processingItemId === id && (!action || this.processingAction === action);
  }

  trackItem(_: number, item: AdminGalleryItem): string {
    return item.id;
  }

  private async runItemAction(
    id: string,
    action: 'disable' | 'delete',
    callback: () => Promise<void>
  ): Promise<void> {
    this.processingItemId = id;
    this.processingAction = action;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await callback();
    } catch {
      this.errorMessage = this.texts().admin.gallery.error;
      this.successMessage = '';
    } finally {
      this.processingItemId = null;
      this.processingAction = null;
    }
  }

  private preparePayload(): AdminGalleryItemPayload | null {
    const title = this.galleryForm.title.trim();
    const description = this.galleryForm.description.trim();
    const thumbnail = this.galleryForm.thumbnail.trim();
    const fullSize = this.galleryForm.fullSize.trim();
    const category = this.galleryForm.category.trim() || 'kuroneko';
    const status = this.galleryForm.status;

    if (!title || !fullSize || !this.isUrlLike(fullSize)) return null;
    if (thumbnail && !this.isUrlLike(thumbnail)) return null;
    if (status !== 'active' && status !== 'disabled') return null;

    return {
      title,
      description,
      thumbnail,
      fullSize,
      category,
      status
    };
  }

  private createForm(): GalleryItemForm {
    return {
      title: '',
      description: '',
      thumbnail: '',
      fullSize: '',
      category: 'kuroneko',
      status: 'active'
    };
  }

  private isUrlLike(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
