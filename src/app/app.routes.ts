import { Routes } from '@angular/router';
import { vipSessionGuard } from './core/services/access.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/linktree/pages/linktree/linktree.component').then(m => m.LinktreeComponent),
    title: 'クロネコプロジェクト | Link'
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'inicio',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-panel.component').then(m => m.AdminPanelComponent),
    title: 'クロネコギャラリーシステム 2.0 | 管理パネル'
  },
  {
    path: 'access',
    loadComponent: () => import('./features/access/pages/access-center.component').then(m => m.AccessCenterComponent),
    title: 'クロネコギャラリーシステム | VIPアクセス'
  },
  {
    path: 'access/login',
    loadComponent: () => import('./features/access/pages/access-login.component').then(m => m.AccessLoginComponent),
    title: 'クロネコギャラリーシステム | ログイン'
  },
  {
    path: 'access/request',
    loadComponent: () => import('./features/access/pages/access-request.component').then(m => m.AccessRequestComponent),
    title: 'クロネコギャラリーシステム | 申請'
  },
  {
    path: 'access/status',
    loadComponent: () => import('./features/access/pages/access-status.component').then(m => m.AccessStatusComponent),
    title: 'クロネコギャラリーシステム | 申請状況'
  },
  {
    path: 'vip-board',
    canActivate: [vipSessionGuard],
    loadComponent: () => import('./features/vip-board/pages/vip-board/vip-board.component').then(m => m.VipBoardComponent),
    title: 'クロネコギャラリーシステム | VIPボード'
  },
  {
    path: 'system',
    redirectTo: 'access',
    pathMatch: 'full'
  },
  {
    path: 'gallery',
    canActivate: [vipSessionGuard],
    loadComponent: () => import('./features/gallery/pages/gallery/gallery.component').then(m => m.GalleryComponent),
    title: 'クロネコギャラリーシステム | 限定ギャラリー'
  },
  {
    path: 'galeria',
    redirectTo: 'gallery',
    pathMatch: 'full'
  },
  {
    path: 'galerie',
    redirectTo: 'gallery',
    pathMatch: 'full'
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404｜クロネコギャラリーシステム'
  }
];
