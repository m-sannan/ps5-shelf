"use client";

function fillForStar(rating: number, star: number): 0 | 0.5 | 1 {
  if (rating >= star) return 1;
  if (rating >= star - 0.5) return 0.5;
  return 0;
}

function StarGlyph({ fill, size }: { fill: 0 | 0.5 | 1; size: "sm" | "md" }) {
  const text = size === "sm" ? "text-sm" : "text-2xl";
  return (
    <span className={`relative inline-block leading-none ${text}`}>
      <span className="text-white/20">★</span>
      {fill > 0 ? (
        <span
          className="absolute inset-y-0 left-0 overflow-hidden text-amber-300"
          style={{ width: fill === 0.5 ? "50%" : "100%" }}
        >
          ★
        </span>
      ) : null}
    </span>
  );
}

export function RatingStars({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: {
  value: number | null | undefined;
  onChange?: (value: number | null) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const rating = value && value > 0 ? Math.min(5, value) : 0;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <div
        className="flex items-center"
        role="img"
        aria-label={rating ? `${rating} out of 5` : "No rating"}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = fillForStar(rating, star);
          if (readOnly) {
            return <StarGlyph key={star} fill={fill} size={size} />;
          }
          return (
            <span key={star} className="relative inline-flex">
              <StarGlyph fill={fill} size={size} />
              <button
                type="button"
                className="absolute inset-y-0 left-0 w-1/2"
                aria-label={`${star - 0.5} stars`}
                onClick={() => onChange?.(rating === star - 0.5 ? null : star - 0.5)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 w-1/2"
                aria-label={`${star} stars`}
                onClick={() => onChange?.(rating === star ? null : star)}
              />
            </span>
          );
        })}
      </div>
      {rating > 0 ? (
        <span className="text-sm text-white/50">{rating.toFixed(1).replace(/\.0$/, "")}</span>
      ) : null}
    </div>
  );
}
