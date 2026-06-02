import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../core/i18n/language.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalService } from '../../../shared/services/modal.service';
import { AdminService } from '../../services/admin.service';
import {
  AdminCredentials,
  AdminGalleryFilter,
  AdminGalleryItem,
  AdminGalleryItemPayload,
  GalleryItemStatus
} from '../../models/admin.types';

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
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly languageService = inject(LanguageService);
  private readonly modalService = inject(ModalService);

  readonly texts = this.languageService.texts;
  readonly filters: readonly AdminGalleryFilter[] = ['all', 'active', 'disabled'];
  readonly itemsPerPage = 12;

  credentials: AdminCredentials | null = null;
  galleryItems: AdminGalleryItem[] = [];
  galleryFilter: AdminGalleryFilter = 'all';
  categoryFilter = 'all';
  searchTerm = '';
  currentPage = 1;
  galleryForm: GalleryItemForm = this.createForm();
  editingGalleryItemId: string | null = null;
  isFetching = false;
  isSaving = false;
  processingItemId: string | null = null;
  processingAction: 'disable' | 'delete' | null = null;
  errorMessage = '';
  successMessage = '';
  lastUpdatedAt: Date | null = null;
  failedPreviewIds = new Set<string>();

  async ngOnInit(): Promise<void> {
    this.credentials = this.adminService.getStoredCredentials();
    if (!this.credentials) {
      this.errorMessage = this.texts().admin.gallery.error;
      this.markViewForUpdate();
      return;
    }

    await this.loadGalleryItems();
  }

  filteredItems(): AdminGalleryItem[] {
    const normalizedSearch = this.normalizeSearch(this.searchTerm);

    return this.galleryItems.filter(item => {
      const matchesStatus = this.galleryFilter === 'all' || item.status === this.galleryFilter;
      const matchesCategory = this.categoryFilter === 'all' || item.category === this.categoryFilter;
      const matchesSearch = !normalizedSearch || this.itemSearchText(item).includes(normalizedSearch);

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }

  paginatedItems(): AdminGalleryItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredItems().slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredItems().length / this.itemsPerPage));
  }

  categories(): string[] {
    const categories = new Set<string>();
    this.galleryItems.forEach(item => {
      const category = item.category.trim();
      if (category) categories.add(category);
    });

    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }

  filterLabel(filter: AdminGalleryFilter): string {
    const gallery = this.texts().admin.gallery;
    if (filter === 'all') return gallery.filterAll;
    return filter === 'active' ? gallery.filterActive : gallery.filterDisabled;
  }

  statusLabel(status: GalleryItemStatus): string {
    return status === 'active' ? this.texts().admin.gallery.statusActive : this.texts().admin.gallery.statusDisabled;
  }

  isGalleryFormInvalid(): boolean {
    return this.preparePayload() === null;
  }

  setGalleryFilter(filter: AdminGalleryFilter): void {
    this.galleryFilter = filter;
    this.currentPage = 1;
    this.markViewForUpdate();
  }

  setCategoryFilter(category: string): void {
    this.categoryFilter = category;
    this.currentPage = 1;
    this.markViewForUpdate();
  }

  setSearchTerm(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
    this.markViewForUpdate();
  }

  onPrevPage(): void {
    this.setPage(this.currentPage - 1);
  }

  onNextPage(): void {
    this.setPage(this.currentPage + 1);
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsedPage = Number.parseInt(input.value, 10);
    this.setPage(Number.isNaN(parsedPage) ? 1 : parsedPage);
    input.value = this.currentPage.toString();
  }

  async refreshGalleryItems(): Promise<void> {
    await this.loadGalleryItems(true);
  }

  lastUpdatedLabel(): string {
    if (!this.lastUpdatedAt) return '';
    return `${this.texts().refresh.lastUpdated}: ${this.formatTime(this.lastUpdatedAt)}`;
  }

  async loadGalleryItems(showSuccessMessage = false): Promise<void> {
    if (!this.credentials) return;

    this.isFetching = true;
    this.errorMessage = '';
    if (showSuccessMessage) {
      this.successMessage = '';
    }
    this.markViewForUpdate();

    try {
      this.galleryItems = await this.adminService.adminGetGalleryItems(this.credentials);
      this.failedPreviewIds.clear();
      this.clampCurrentPage();
      this.lastUpdatedAt = new Date();
      if (showSuccessMessage) {
        this.modalService.showSuccess(this.texts().modal.success, this.texts().refresh.success, 1500);
      }
    } catch {
      if (showSuccessMessage) {
        this.modalService.showError(this.texts().modal.error, this.texts().admin.gallery.error);
      } else {
        this.errorMessage = this.texts().admin.gallery.error;
      }
    } finally {
      this.isFetching = false;
      this.markViewForUpdate();
    }
  }

  async saveGalleryItem(): Promise<void> {
    if (!this.credentials) return;

    const payload = this.preparePayload();
    if (!payload) {
      this.errorMessage = this.texts().admin.gallery.inputError;
      this.successMessage = '';
      this.markViewForUpdate();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.markViewForUpdate();

    try {
      if (this.editingGalleryItemId) {
        await this.adminService.adminUpdateGalleryItem(this.credentials, this.editingGalleryItemId, payload);
        this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.gallery.updateSuccess, 1500);
      } else {
        await this.adminService.adminAddGalleryItem(this.credentials, payload);
        this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.gallery.addSuccess, 1500);
      }

      this.cancelEdit();
      await this.loadGalleryItems();
    } catch {
      const message = this.texts().admin.gallery.error;
      this.errorMessage = '';
      this.successMessage = '';
      this.modalService.showError(this.texts().modal.error, message);
    } finally {
      this.isSaving = false;
      this.markViewForUpdate();
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
    this.markViewForUpdate();
  }

  cancelEdit(): void {
    this.editingGalleryItemId = null;
    this.galleryForm = this.createForm();
    this.markViewForUpdate();
  }

  async disableItem(item: AdminGalleryItem): Promise<void> {
    if (!(await this.confirmSensitiveAction())) return;

    await this.runItemAction(item.id, 'disable', async () => {
      if (!this.credentials) return;
      await this.adminService.adminDisableGalleryItem(this.credentials, item.id);
      this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.gallery.disableSuccess, 1500);
      await this.loadGalleryItems();
    });
  }

  async deleteItem(item: AdminGalleryItem): Promise<void> {
    if (!(await this.confirmSensitiveAction())) return;

    await this.runItemAction(item.id, 'delete', async () => {
      if (!this.credentials) return;
      await this.adminService.adminDeleteGalleryItem(this.credentials, item.id);
      this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.gallery.deleteSuccess, 1500);
      await this.loadGalleryItems();
    });
  }

  async copyUrl(item: AdminGalleryItem): Promise<void> {
    if (!navigator.clipboard || !item.fullSize) return;

    try {
      await navigator.clipboard.writeText(item.fullSize);
      this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.gallery.urlCopied, 1500);
      this.errorMessage = '';
    } catch {
      const message = this.texts().admin.gallery.error;
      this.errorMessage = '';
      this.successMessage = '';
      this.modalService.showError(this.texts().modal.error, message);
    } finally {
      this.markViewForUpdate();
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
    this.markViewForUpdate();
  }

  isProcessing(id: string, action?: 'disable' | 'delete'): boolean {
    return this.processingItemId === id && (!action || this.processingAction === action);
  }

  trackItem(_: number, item: AdminGalleryItem): string {
    return item.id;
  }

  private setPage(page: number): void {
    this.currentPage = Math.max(1, Math.min(page, this.totalPages()));
    this.markViewForUpdate();
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
    this.markViewForUpdate();

    try {
      await callback();
    } catch {
      const message = this.texts().admin.gallery.error;
      this.errorMessage = '';
      this.successMessage = '';
      this.modalService.showError(this.texts().modal.error, message);
    } finally {
      this.processingItemId = null;
      this.processingAction = null;
      this.markViewForUpdate();
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

  private clampCurrentPage(): void {
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages()));
  }

  private normalizeSearch(value: string): string {
    return value.trim().toLowerCase();
  }

  private itemSearchText(item: AdminGalleryItem): string {
    return this.normalizeSearch([
      item.id,
      item.title,
      item.description,
      item.category,
      item.fullSize,
      item.thumbnail,
      item.status
    ].join(' '));
  }

  private confirmSensitiveAction(): Promise<boolean> {
    return this.modalService.confirm(
      this.texts().modal.confirm,
      this.texts().admin.requestActions.confirmAction,
      this.texts().modal.ok,
      this.texts().modal.cancel
    );
  }

  private markViewForUpdate(): void {
    this.changeDetectorRef.markForCheck();
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
