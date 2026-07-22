"use client";

import { useCallback, useEffect, useState } from "react";
import { getVisitImageUrl } from "@/lib/storage";

type VisitImageLightboxProps = {
  imagePath: string;
  alt: string;
};

export function VisitImageLightbox({ imagePath, alt }: VisitImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imageUrl = getVisitImageUrl(imagePath);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      setIsLoaded(false);
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-3 cursor-pointer text-xs font-medium text-rose-500 transition hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
      >
        View image
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Full size visit photo"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 cursor-pointer rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
            aria-label="Close photo"
          >
            Close
          </button>

          <div
            className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            {!isLoaded ? (
              <p className="text-sm font-medium text-white/80">Loading…</p>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={alt}
              onLoad={() => setIsLoaded(true)}
              className={`max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl ${
                isLoaded ? "block" : "hidden"
              }`}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
