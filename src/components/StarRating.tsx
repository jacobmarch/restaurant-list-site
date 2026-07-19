"use client";

import { MAX_RATING, MIN_RATING, roundToHalfStar } from "@/lib/rating";

type StarRatingInteractiveProps = {
  mode?: "input";
  value: number | null;
  onChange: (rating: number) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
  required?: boolean;
};

type StarRatingDisplayProps = {
  mode: "display";
  value: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
};

type StarRatingProps = StarRatingInteractiveProps | StarRatingDisplayProps;

const SIZE_CLASS = {
  sm: "text-base",
  md: "text-2xl",
} as const;

function StarGlyph({
  fill,
  size,
}: {
  fill: "full" | "half" | "empty";
  size: "sm" | "md";
}) {
  const sizeClass = SIZE_CLASS[size];

  if (fill === "half") {
    return (
      <span
        className={`relative inline-block leading-none ${sizeClass}`}
        aria-hidden
      >
        <span className="text-stone-300">☆</span>
        <span
          className="absolute inset-0 overflow-hidden text-rose-500"
          style={{ width: "50%" }}
        >
          ★
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-block leading-none ${sizeClass} ${
        fill === "full" ? "text-rose-500" : "text-stone-300"
      }`}
      aria-hidden
    >
      {fill === "full" ? "★" : "☆"}
    </span>
  );
}

function starFillAt(index: number, displayValue: number): "full" | "half" | "empty" {
  const threshold = index;
  if (displayValue >= threshold) {
    return "full";
  }
  if (displayValue >= threshold - 0.5) {
    return "half";
  }
  return "empty";
}

export function StarRating(props: StarRatingProps) {
  const size = props.size ?? "md";

  if (props.mode === "display") {
    const rounded = roundToHalfStar(props.value);
    const stars = Array.from({ length: MAX_RATING }, (_, i) => i + 1);

    return (
      <span
        className={`inline-flex items-center gap-0.5 ${props.className ?? ""}`}
        role="img"
        aria-label={`${props.value.toFixed(props.value % 1 === 0 ? 0 : 1)} out of ${MAX_RATING} stars`}
      >
        {stars.map((star) => (
          <StarGlyph key={star} fill={starFillAt(star, rounded)} size={size} />
        ))}
        {props.showValue ? (
          <span className="ml-1 text-sm font-medium text-stone-600">
            {props.value % 1 === 0 ? props.value : props.value.toFixed(1)}
          </span>
        ) : null}
      </span>
    );
  }

  const {
    value,
    onChange,
    name = "rating",
    id = "rating",
    disabled = false,
    label = "Rating",
    required = true,
  } = props;

  const stars = Array.from({ length: MAX_RATING }, (_, i) => i + 1);

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
        {required ? null : (
          <span className="font-normal text-stone-400"> (optional)</span>
        )}
      </legend>
      <input
        type="hidden"
        name={name}
        id={id}
        value={value ?? ""}
        required={required}
      />
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label={label}
      >
        {stars.map((star) => {
          const selected = value != null && star <= value;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              disabled={disabled}
              onClick={() => onChange(star)}
              className={`cursor-pointer rounded-md p-0.5 leading-none transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60 ${SIZE_CLASS[size]} ${
                selected ? "text-rose-500" : "text-stone-300 hover:text-rose-300"
              }`}
            >
              {selected ? "★" : "☆"}
            </button>
          );
        })}
      </div>
      {value == null && required ? (
        <p className="mt-1 text-xs text-stone-400">
          Select {MIN_RATING}–{MAX_RATING} stars
        </p>
      ) : null}
    </fieldset>
  );
}
