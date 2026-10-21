"use client";
import React, { useCallback, useState } from "react";
import ComponentCard from "@/components/admin/ComponentCard";
import { useDropzone, type FileRejection } from "react-dropzone";

interface DropzoneComponentProps {
  /** Called with the public URLs returned by /api/admin/upload. */
  onUpload: (urls: string[]) => void;
  title?: string;
}

const DropzoneComponent: React.FC<DropzoneComponentProps> = ({
  onUpload,
  title = "Фото",
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrop = useCallback(
    async (acceptedFiles: File[], _rejections: FileRejection[]) => {
      void _rejections;
      if (!acceptedFiles.length) return;

      setUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        acceptedFiles.forEach((file) => formData.append("images", file));

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as { urls?: string[] };
        const urls = Array.isArray(data.urls) ? data.urls : [];
        if (!urls.length) throw new Error("empty_response");
        onUpload(urls);
      } catch (e) {
        console.error("[Dropzone] Upload failed:", e);
        setUploadError("Не вдалося завантажити зображення. Спробуйте ще раз.");
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop: handleDrop,
      accept: {
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
        "image/webp": [".webp"],
      },
      maxSize: 15 * 1024 * 1024, // 15MB
      disabled: uploading,
    });

  return (
    <ComponentCard title={title}>
      {uploadError && (
        <div className="mb-4 rounded border border-red-300 bg-red-100 p-3 text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {uploadError}
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="mb-4 rounded border border-red-300 bg-red-100 p-3 text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-semibold">Помилка завантаження файлів:</p>
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="mt-2">
              <p className="font-medium">{file.name}:</p>
              <ul className="ml-4 list-disc">
                {errors.map((error) => (
                  <li key={error.code}>{error.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="cursor-pointer rounded-xl border border-dashed border-gray-300 transition hover:border-brand-500 dark:border-gray-700 dark:hover:border-brand-500">
        <div
          {...getRootProps()}
          className={`dropzone rounded-xl border-dashed p-7 lg:p-10 ${
            isDragActive
              ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
              : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
          } ${uploading ? "opacity-60" : ""}`}
        >
          <input {...getInputProps()} />

          <div className="dz-message m-0! flex flex-col items-center">
            <div className="mb-[22px] flex justify-center">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <svg
                  className="fill-current"
                  width="29"
                  height="28"
                  viewBox="0 0 29 28"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                  />
                </svg>
              </div>
            </div>

            <h4 className="mb-3 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
              {uploading
                ? "Завантаження..."
                : isDragActive
                ? "Відпустіть файли тут"
                : "Перетягніть фото сюди"}
            </h4>

            <span className="mb-5 block w-full max-w-[290px] text-center text-sm text-gray-700 dark:text-gray-400">
              PNG, JPG або WebP до 15 МБ. Файли будуть оптимізовані автоматично.
            </span>

            <span className="text-theme-sm font-medium text-brand-500 underline">
              Обрати файли
            </span>
          </div>
        </div>
      </div>
    </ComponentCard>
  );
};

export default DropzoneComponent;
