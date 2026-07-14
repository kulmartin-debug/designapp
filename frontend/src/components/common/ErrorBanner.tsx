import { translateError } from '../../i18n/sk';

export function ErrorBanner({ errorCode, message }: { errorCode?: string | null; message?: string | null }) {
  if (!errorCode && !message) return null;
  return (
    <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      {errorCode ? translateError(errorCode) : message}
    </div>
  );
}
