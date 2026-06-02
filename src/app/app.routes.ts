import { Routes } from '@angular/router';
import { vipSessionGuard } from './core/services/access.service';

const APP_TITLE = '\u30af\u30ed\u30cd\u30b3\u30a8\u30f3\u30b8\u30f3';
const PROJECT_TITLE = '\u30af\u30ed\u30cd\u30b3\u30d7\u30ed\u30b8\u30a7\u30af\u30c8';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/linktree/pages/linktree/linktree.component').then(
        m => m.LinktreeComponent
      ),
    title: `${PROJECT_TITLE} | Link`
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
    loadComponent: () =>
      import('./admin/pages/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent),
    title: `${APP_TITLE} 2.0 | \u7ba1\u7406\u30d1\u30cd\u30eb`
  },
  {
    path: 'access',
    loadComponent: () =>
      import('./features/access/pages/access-center.component').then(m => m.AccessCenterComponent),
    title: `${APP_TITLE} | VIP\u30a2\u30af\u30bb\u30b9`
  },
  {
    path: 'access/login',
    loadComponent: () =>
      import('./features/access/pages/access-login.component').then(m => m.AccessLoginComponent),
    title: `${APP_TITLE} | \u30ed\u30b0\u30a4\u30f3`
  },
  {
    path: 'access/request',
    loadComponent: () =>
      import('./features/access/pages/access-request.component').then(
        m => m.AccessRequestComponent
      ),
    title: `${APP_TITLE} | \u7533\u8acb`
  },
  {
    path: 'access/status',
    loadComponent: () =>
      import('./features/access/pages/access-status.component').then(m => m.AccessStatusComponent),
    title: `${APP_TITLE} | \u7533\u8acb\u72b6\u6cc1`
  },
  {
    path: 'vip-board',
    canActivate: [vipSessionGuard],
    loadComponent: () =>
      import('./features/vip-board/pages/vip-board/vip-board.component').then(
        m => m.VipBoardComponent
      ),
    title: `${APP_TITLE} | VIP\u30dc\u30fc\u30c9`
  },
  {
    path: 'system',
    redirectTo: 'access',
    pathMatch: 'full'
  },
  {
    path: 'gallery',
    canActivate: [vipSessionGuard],
    loadComponent: () =>
      import('./features/gallery/pages/gallery/gallery.component').then(m => m.GalleryComponent),
    title: `${APP_TITLE} | \u9650\u5b9a\u30ae\u30e3\u30e9\u30ea\u30fc`
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
    title: `404 | ${APP_TITLE}`
  }
];
