export interface GalleryImage {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  fullSize: string;
  category: string;
  status?: string;
  createdAt?: string;
}

export interface GalleryState {
  allImages: GalleryImage[];
  filteredImages: GalleryImage[];
  categories: Set<string>;
  currentCategory: string;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  itemsPerPage: number;
}

export interface PanState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  lastX: number;
  lastY: number;
}

export interface SlideshowState {
  active: boolean;
  index: number;
  zoomed: boolean;
  uiHidden: boolean;
  manualHidden: boolean;
  pan: PanState;
  imageCache: Set<string>;
}

export const DEFAULT_GALLERY_STATE: GalleryState = {
  allImages: [],
  filteredImages: [],
  categories: new Set(['All']),
  currentCategory: 'All',
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  itemsPerPage: 12
};

export const DEFAULT_PAN_STATE: PanState = {
  isDragging: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  lastX: 0,
  lastY: 0
};

export const DEFAULT_SLIDESHOW_STATE: SlideshowState = {
  active: false,
  index: 0,
  zoomed: false,
  uiHidden: false,
  manualHidden: false,
  pan: { ...DEFAULT_PAN_STATE },
  imageCache: new Set()
};
