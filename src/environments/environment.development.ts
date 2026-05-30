export const environment = {
  production: false,
  app: {
    name: 'クロネコエンジン 2.0',
    projectName: 'クロネコプロジェクト',
    basePath: '/kuroneko2.0/'
  },
  api: {
    baseUrl: 'https://script.google.com/macros/s/AKfycbwgltvyDH_CcikA1_V54LNm1gEmaho_mtrDAaqnukfC3Ou6M3O05nbYzSHtvPG-G_P8/exec'
  },
  links: {
    pixiv: 'https://www.pixiv.net/users/120751313',
    fanbox: 'https://neko-suiro-k.fanbox.cc/',
    x: 'https://x.com/shinai_kuroneko',
    paypal: 'https://paypal.me/devusui'
  },
  assets: {
    bgm: 'music/init.mp3'
  },
  storage: {
    language: 'kuronekoLanguage',
    vipSession: 'kuronekoVipSession',
    visitCounted: 'kuronekoVisitCounted',
    adminSession: 'kuronekoAdminSession',
    adultWarningAccepted: 'kuronekoAdultWarningAccepted',
    startVisitData: 'kuroneko_visit_data',
    startSessionActive: 'kuroneko_session_active'
  },
  debug: {
    api: false
  }
} as const;
