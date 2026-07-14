import { useRef, useState } from 'react';
import type { AssetCategory } from '../../types/api';
import { uploadAsset } from '../../api/assets';
import { ApiRequestError } from '../../api/client';
import { translateError } from '../../i18n/sk';
import { sk } from '../../i18n/sk';

const MAX_BYTES = 15 * 1024 * 1024;

export function UploadDropzone({
  projectId,
  category,
  multiple,
  onUploaded,
}: {
  projectId: string;
  category: AssetCategory;
  multiple: boolean;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          setError(translateError('ERR_FILE_TOO_LARGE'));
          continue;
        }
        await uploadAsset(projectId, category, file);
      }
      onUploaded();
    } catch (err) {
      if (err instanceof ApiRequestError) setError(translateError(err.errorCode));
      else setError('Nahrávanie zlyhalo.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
          isDragOver ? 'border-brand-500 bg-brand-50' : 'border-line bg-card'
        }`}
      >
        <p className="text-ink-soft">{isUploading ? sk.upload.uploading : sk.upload.dropHint}</p>
        <p className="mt-1 text-xs tracking-wide text-ink-soft/70">{sk.upload.maxSize}</p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept="image/png,image/jpeg,application/pdf"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      {!multiple && <p className="mt-1 text-xs text-ink-soft/70">{sk.upload.single}</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
