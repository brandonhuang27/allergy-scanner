"use client";

import { useRef, useState } from "react";
import { resizeImage } from "@/lib/resizeImage";

interface Props {
  busy: boolean;
  onAnalyze: (imageDataUrl: string) => void;
}

export function PhotoInput({ busy, onAnalyze }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setImage(await resizeImage(file));
    } catch {
      setError("Couldn't open that image. Try a JPEG or PNG photo.");
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Scan a label</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Take a clear, close photo of the ingredient list. Any language works.
        </p>
      </div>

      {/* capture="environment" opens the back camera directly; without it, phones
          offer the photo library (iPhones also offer the camera from there). */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPick}
      />
      <input ref={libraryRef} type="file" accept="image/*" className="hidden" onChange={onPick} />

      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
          <img
            src={image}
            alt="Your label photo"
            className="max-h-80 w-full rounded-xl border border-neutral-200 object-contain dark:border-neutral-800"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => libraryRef.current?.click()}
              className="flex-1 rounded-xl border border-neutral-200 py-3.5 font-medium disabled:opacity-40 dark:border-neutral-800"
            >
              Change photo
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAnalyze(image)}
              className="flex-[2] rounded-xl bg-emerald-600 py-3.5 font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Checking…" : "Check ingredients"}
            </button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-neutral-700 dark:text-neutral-400"
          >
            <span aria-hidden className="text-4xl">📷</span>
            <span className="font-medium">Take photo</span>
          </button>
          <button
            type="button"
            onClick={() => libraryRef.current?.click()}
            className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-neutral-700 dark:text-neutral-400"
          >
            <span aria-hidden className="text-4xl">🖼️</span>
            <span className="font-medium">Choose from library</span>
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </section>
  );
}
