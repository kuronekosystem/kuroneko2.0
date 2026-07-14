export type LanguageCode = 'ja' | 'es' | 'en' | 'zh-CN' | 'zh-TW';

export interface LanguageOption {
  readonly code: LanguageCode;
  readonly label: string;
  readonly nativeLabel: string;
}

export interface TranslationMap {
  languageSelector: {
    label: string;
    ariaLabel: string;
  };
  appLoader: {
    brand: string;
    latinBrand: string;
    initializing: string;
    accessingMainframe: string;
    decodingSecurity: string;
    welcome: string;
  };
  loadingMessage: {
    loading: string;
    processing: string;
    slowTitle: string;
    slowDescription: string;
    verySlowTitle: string;
    verySlowDescription: string;
  };
  refresh: {
    action: string;
    success: string;
    lastUpdated: string;
  };
  modal: {
    ok: string;
    cancel: string;
    close: string;
    success: string;
    error: string;
    info: string;
    confirm: string;
  };
  linktree: {
    ariaLabel: string;
    eyebrow: string;
    title: string;
    version: {
      betaLabel: string;
      betaBadge: string;
      developmentNotice: string;
    };
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
    ageRestrictedBadge: string;
    ageRestrictedModal: {
      title: string;
      message: string;
      confirm: string;
      cancel: string;
    };
    adultSectionTitle: string;
    accounts: {
      emergency: {
        title: string;
        username: string;
        description: string;
      };
      shin: {
        title: string;
        username: string;
        description: string;
      };
      nyx: {
        title: string;
        username: string;
        description: string;
      };
      mika: {
        title: string;
        username: string;
        description: string;
      };
      instagram: {
        title: string;
        username: string;
        description: string;
      };
    };
    supportPlans: {
      title: string;
      subtitle: string;
      recommended: string;
      whyTitle: string;
      reasons: readonly string[];
      supporter: {
        name: string;
        price: string;
        description: string;
        button: string;
        imageAlt: string;
      };
      vip: {
        name: string;
        price: string;
        description: string;
        button: string;
        imageAlt: string;
      };
      special: {
        name: string;
        price: string;
        description: string;
        button: string;
        imageAlt: string;
      };
    };
  };
  support: {
    modal: {
      title: string;
      subtitle: string;
      description: string;
    };
    plan: {
      recommended: string;
      supporter: {
        title: string;
        price: string;
        description: string;
        button: string;
        imageAlt: string;
      };
      vip: {
        title: string;
        price: string;
        description: string;
        button: string;
        imageAlt: string;
      };
      special: {
        title: string;
        price: string;
        description: string;
        button: string;
        imageAlt: string;
      };
    };
    value: {
      independent: string;
      privacy: string;
      gallery: string;
      futureIllustrations: string;
      longTerm: string;
    };
  };
  music: {
    title: string;
    play: string;
    pause: string;
    loading: string;
    error: string;
  };
  adultWarning: {
    title: string;
    description1: string;
    description2: string;
    description3: string;
    description4: string;
    question: string;
    accept: string;
    cancel: string;
    shortNotice: string;
  };
  access: {
    activityHours: {
      title: string;
      shortTitle: string;
      shortDescription: string;
      description: string;
      daytime: string;
      nighttime: string;
      note: string;
    };
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
    zoom: {
      label: string;
      in: string;
      out: string;
      reset: string;
    };
    close: string;
    toggleUi: string;
    imageLoading: string;
    highResolutionNotice: string;
    imageLoadError: string;
  };
  vipBoard: {
    eyebrow: string;
    title: string;
    welcome: string;
    description: string;
    privacyNotice: string;
    titleField: string;
    messageField: string;
    submit: string;
    submitting: string;
    requestReceived: string;
    requestReceivedDescription: string;
    sent: string;
    sendFailed: string;
    listTitle: string;
    myRequests: string;
    noMyRequests: string;
    loading: string;
    empty: string;
    untitled: string;
    statusLabel: string;
    createdAt: string;
    updatedAt: string;
    status: {
      pending: string;
      reviewed: string;
      accepted: string;
      rejected: string;
      done: string;
      disabled: string;
    };
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
  vipSession: {
    active: string;
    loggedInAs: string;
    accessId: string;
    goToGallery: string;
    logout: string;
    confirmLogout: string;
  };
  notFound: {
    code: string;
    eyebrow: string;
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
  apiErrors: {
    invalidAccess: string;
    expiredAccess: string;
    inactiveAccess: string;
    requestNotFound: string;
    adminInvalidCredentials: string;
    gallerySessionInvalid: string;
    requestSystem: string;
    statusSystem: string;
    gallerySystem: string;
    adminSystem: string;
    vipBoardSystem: string;
    accessSystem: string;
  };
  admin: {
    tabs: {
      requests: string;
      keys: string;
      gallery: string;
      vipRequests: string;
    };
    requestFilters: {
      all: string;
      pending: string;
      approved: string;
      rejected: string;
      needMoreInfo: string;
      disabled: string;
    };
    requestState: {
      pendingHelp: string;
      needMoreInfoHelp: string;
      approvedHelp: string;
      rejectedHelp: string;
      disabledHelp: string;
    };
    requestActions: {
      reviewAgain: string;
      alreadyApproved: string;
      alreadyRejected: string;
      alreadyDisabled: string;
      confirmAction: string;
      confirmDisableRequest: string;
    };
    panel: {
      product: string;
      title: string;
      subtitle: string;
      sessionActive: string;
      sessionInactive: string;
      logout: string;
      loginKicker: string;
      loginTitle: string;
      loginDescription: string;
      adminUsername: string;
      adminPassword: string;
      loginSubmit: string;
      authenticating: string;
      loadingTitle: string;
      loadingDescription: string;
      processing: string;
      requestsKicker: string;
      requestsTitle: string;
      refresh: string;
      countSuffix: string;
      filterAll: string;
      filtersLabel: string;
      emptyRequests: string;
      source: string;
      contact: string;
      createdAt: string;
      updatedAt: string;
      proofText: string;
      adminNotes: string;
      durationDays: string;
      notes: string;
      approve: string;
      approving: string;
      rejectAction: string;
      needMoreInfoAction: string;
      shareIssued: string;
      copyUserCode: string;
      copyAccessKey: string;
      keysKicker: string;
      keysTitle: string;
      emptyKeys: string;
      accessKey: string;
      requestCode: string;
      startDate: string;
      endDate: string;
      hideKey: string;
      showKey: string;
      copy: string;
      disabling: string;
      disable: string;
      disableRequest: string;
      extending: string;
      extend30: string;
      inputCredentials: string;
      approveSuccess: string;
      approveFailed: string;
      rejectNotesRequired: string;
      rejectSuccess: string;
      rejectFailed: string;
      needMoreInfoNotesRequired: string;
      needMoreInfoSuccess: string;
      updateFailed: string;
      disableSuccess: string;
      disableFailed: string;
      disableRequestSuccess: string;
      disableRequestFailed: string;
      extendSuccess: string;
      extendFailed: string;
      copySuccess: string;
      copyFailed: string;
      copyAccessInfoLabel: string;
      authenticationRequired: string;
      dataLoadFailed: string;
    };
    vipRequests: {
      kicker: string;
      title: string;
      filtersLabel: string;
      empty: string;
      userCode: string;
      loading: string;
      error: string;
      completeAction: string;
      completing: string;
      confirmComplete: string;
      adminReplyPrompt: string;
      completeSuccess: string;
      updateFailed: string;
    };
    gallery: {
      kicker: string;
      title: string;
      subtitle: string;
      add: string;
      save: string;
      cancelEdit: string;
      edit: string;
      disable: string;
      delete: string;
      copyUrl: string;
      titleField: string;
      descriptionField: string;
      thumbnailUrl: string;
      fullSizeUrl: string;
      category: string;
      status: string;
      statusActive: string;
      statusDisabled: string;
      filterAll: string;
      filterActive: string;
      filterDisabled: string;
      search: string;
      searchPlaceholder: string;
      filtersLabel: string;
      allCategories: string;
      results: string;
      page: string;
      previous: string;
      next: string;
      loading: string;
      empty: string;
      saving: string;
      addSuccess: string;
      updateSuccess: string;
      disableSuccess: string;
      deleteSuccess: string;
      error: string;
      previewUnavailable: string;
      urlCopied: string;
      inputError: string;
      editMode: string;
    };
  };
  footer: {
    copyright: string;
    warning: string;
  };
}
