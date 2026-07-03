"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { getVisitImageUrl } from "@/lib/storage";

type VisitImageLightboxProps = {
  imagePath: string;
  alt: string;
};

export function VisitImageLightbox({ imagePath, alt }: VisitImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const imageUrl = getVisitImageUrl(imagePath);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
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
        className="relative mt-3 block aspect-[4/3] max-h-60 w-full cursor-zoom-in overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        aria-label={`View full photo from ${alt}`}
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 672px) 100vw, 672px"
          className="object-cover transition hover:scale-[1.02]"
        />
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
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
