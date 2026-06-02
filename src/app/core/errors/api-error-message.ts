import { TranslationMap } from '../i18n/language.model';

export type ApiErrorContext = 'access' | 'request' | 'status' | 'gallery' | 'admin' | 'vipBoard';

type ApiErrorMessages = TranslationMap['apiErrors'];

const DEFAULT_API_ERROR_MESSAGES: ApiErrorMessages = {
  invalidAccess: 'アクセスIDまたはキーが正しくありません。',
  expiredAccess: 'アクセス期限が切れています。',
  inactiveAccess: 'このアクセスキーは現在有効ではありません。',
  requestNotFound: '申請コードが見つかりませんでした。',
  adminInvalidCredentials: '管理者IDまたはキーが正しくありません。',
  gallerySessionInvalid: 'セッションの確認ができませんでした。\nもう一度ログインしてください。',
  requestSystem: '申請を送信できませんでした。しばらくしてからもう一度お試しください。',
  statusSystem: '申請を確認できませんでした。しばらくしてからもう一度お試しください。',
  gallerySystem: 'ギャラリーを読み込めませんでした。\nアクセス情報を確認して、もう一度お試しください。',
  adminSystem: '管理パネルに接続できませんでした。',
  vipBoardSystem: '送信できませんでした。しばらくしてからもう一度お試しください。',
  accessSystem: 'システムエラーが発生しました。しばらくしてからもう一度お試しください。'
};

export function getUserFriendlyApiErrorMessage(
  message: string | undefined,
  context: ApiErrorContext,
  messages: ApiErrorMessages = DEFAULT_API_ERROR_MESSAGES
): string {
  const normalized = (message ?? '').toLowerCase();

  if (isConnectionError(normalized)) {
    return systemMessage(context, messages);
  }

  if (context === 'access') {
    if (normalized.includes('invalid user code') || normalized.includes('invalid access')) {
      return messages.invalidAccess;
    }

    if (normalized.includes('expired')) {
      return messages.expiredAccess;
    }

    if (normalized.includes('not active') || normalized.includes('disabled')) {
      return messages.inactiveAccess;
    }
  }

  if (context === 'status') {
    if (normalized.includes('not found') || normalized.includes('not exist') || normalized.includes('no request')) {
      return messages.requestNotFound;
    }
  }

  if (context === 'admin') {
    if (normalized.includes('invalid admin') || normalized.includes('credentials')) {
      return messages.adminInvalidCredentials;
    }
  }

  if (context === 'gallery') {
    if (
      normalized.includes('invalid') ||
      normalized.includes('expired') ||
      normalized.includes('not active') ||
      normalized.includes('no access')
    ) {
      return messages.gallerySessionInvalid;
    }
  }

  return systemMessage(context, messages);
}

function isConnectionError(message: string): boolean {
  return (
    message.includes('fetch failed') ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('json')
  );
}

function systemMessage(context: ApiErrorContext, messages: ApiErrorMessages): string {
  switch (context) {
    case 'request':
      return messages.requestSystem;
    case 'status':
      return messages.statusSystem;
    case 'gallery':
      return messages.gallerySystem;
    case 'admin':
      return messages.adminSystem;
    case 'vipBoard':
      return messages.vipBoardSystem;
    case 'access':
      return messages.accessSystem;
  }
}
