export type LanguageCode = 'ja' | 'es' | 'en' | 'zh-CN' | 'zh-TW';

export interface LanguageOption {
  readonly code: LanguageCode;
  readonly label: string;
  readonly nativeLabel: string;
}

export interface TranslationMap {
  languageSelector: {
    label: string;
  };
  linktree: {
    ariaLabel: string;
    eyebrow: string;
    title: string;
    introLine1: string;
    introLine2: string;
    introLine3: string;
    pixivLabel: string;
    xLabel: string;
    fanboxLabel: string;
    paypalLabel: string;
    pixivSmall: string;
    xSmall: string;
    fanboxSmall: string;
    paypalSmall: string;
    systemButton: string;
    systemSmall: string;
    visitCount: string;
    visitLoading: string;
  };
  music: {
    title: string;
    play: string;
    pause: string;
    loading: string;
    error: string;
  };
  accessCenter: {
    eyebrow: string;
    title: string;
    introLine1: string;
    introLine2: string;
    introLine3: string;
    loginTitle: string;
    loginDescription: string;
    requestTitle: string;
    requestDescription: string;
    statusTitle: string;
    statusDescription: string;
  };
  accessLogin: {
    eyebrow: string;
    title: string;
    description: string;
    userCode: string;
    accessKey: string;
    submit: string;
    submitting: string;
    backToAccess: string;
    validateInput: string;
    accessApproved: string;
    accessDenied: string;
    movingToGallery: string;
    genericError: string;
  };
  accessRequest: {
    eyebrow: string;
    title: string;
    description: string;
    displayName: string;
    source: string;
    fanbox: string;
    paypal: string;
    fanboxName: string;
    paypalTransactionId: string;
    proofText: string;
    contact: string;
    submit: string;
    submitting: string;
    accepted: string;
    saveRequestCode: string;
    manualReview: string;
    checkLater: string;
    validateInput: string;
    fanboxValidation: string;
    paypalValidation: string;
    submitError: string;
    backToAccess: string;
  };
  accessStatus: {
    eyebrow: string;
    title: string;
    description: string;
    requestCode: string;
    submit: string;
    submitting: string;
    pending: string;
    approved: string;
    rejected: string;
    needMoreInfo: string;
    checkFailed: string;
    accessId: string;
    accessKey: string;
    loginInstruction: string;
    enterRequestCode: string;
    adminNotes: string;
    backToAccess: string;
  };
  navbar: {
    brand: string;
    subtitle: string;
    links: string;
    access: string;
    gallery: string;
    vipBoard: string;
    toggleLabel: string;
  };
  gallery: {
    home: string;
    title: string;
    vipLabel: string;
    loading: string;
    category: string;
    vipBoard: string;
    empty: string;
    page: string;
    previous: string;
    next: string;
  };
  vipBoard: {
    eyebrow: string;
    title: string;
    welcome: string;
    description: string;
    titleField: string;
    messageField: string;
    submit: string;
    submitting: string;
    sent: string;
    sendFailed: string;
    listTitle: string;
    loading: string;
    empty: string;
    untitled: string;
    status: string;
    adminReply: string;
    galleryLink: string;
    messageRequired: string;
    sessionMissing: string;
    loadFailed: string;
  };
  backButton: {
    back: string;
    toLinktree: string;
  };
  notFound: {
    code: string;
    title: string;
    message: string;
    subMessage: string;
    backToLinktree: string;
    goToAccess: string;
  };
  statuses: {
    pending: string;
    approved: string;
    rejected: string;
    need_more_info: string;
    active: string;
    expired: string;
    disabled: string;
    reviewed: string;
    accepted: string;
    done: string;
    unknown: string;
  };
  footer: {
    copyright: string;
    warning: string;
  };
}
