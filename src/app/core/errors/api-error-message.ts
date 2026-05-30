export type ApiErrorContext = 'access' | 'request' | 'status' | 'gallery' | 'admin' | 'vipBoard';

export function getUserFriendlyApiErrorMessage(message: string | undefined, context: ApiErrorContext): string {
  const normalized = (message ?? '').toLowerCase();

  if (isConnectionError(normalized)) {
    return systemMessage(context);
  }

  if (context === 'access') {
    if (normalized.includes('invalid user code') || normalized.includes('invalid access')) {
      return 'アクセスIDまたはキーが正しくありません。';
    }

    if (normalized.includes('expired')) {
      return 'アクセス期限が切れています。';
    }

    if (normalized.includes('not active') || normalized.includes('disabled')) {
      return 'このアクセスキーは現在有効ではありません。';
    }
  }

  if (context === 'status') {
    if (normalized.includes('not found') || normalized.includes('not exist') || normalized.includes('no request')) {
      return '申請コードが見つかりませんでした。';
    }
  }

  if (context === 'admin') {
    if (normalized.includes('invalid admin') || normalized.includes('credentials')) {
      return '管理者IDまたはキーが正しくありません。';
    }
  }

  if (context === 'gallery') {
    if (
      normalized.includes('invalid') ||
      normalized.includes('expired') ||
      normalized.includes('not active') ||
      normalized.includes('no access')
    ) {
      return 'セッションの確認ができませんでした。\nもう一度ログインしてください。';
    }
  }

  return systemMessage(context);
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

function systemMessage(context: ApiErrorContext): string {
  switch (context) {
    case 'request':
      return '申請を送信できませんでした。しばらくしてからもう一度お試しください。';
    case 'status':
      return '申請を確認できませんでした。しばらくしてからもう一度お試しください。';
    case 'gallery':
      return 'ギャラリーを読み込めませんでした。\nアクセス情報を確認して、もう一度お試しください。';
    case 'admin':
      return '管理パネルに接続できませんでした。';
    case 'vipBoard':
      return '送信できませんでした。しばらくしてからもう一度お試しください。';
    case 'access':
      return 'システムエラーが発生しました。しばらくしてからもう一度お試しください。';
  }
}
