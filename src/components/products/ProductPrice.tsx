"use client";

import React from "react";

type Props = {
  price: number;
  oldPrice?: number | null;
  className?: string;
  small?: boolean;
  align?: "left" | "center";
};

function formatPrice(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

export const ProductPrice = ({
  price,
  oldPrice,
  className = "",
  small = false,
  align = "center",
}: Props) => {
  const showOldPrice =
    oldPrice !== undefined && oldPrice !== null && oldPrice > 1 && oldPrice > price;
  const priceText = `$${formatPrice(price)}`;
  const oldPriceText = oldPrice ? `$${formatPrice(oldPrice)}` : null;

  const priceSize = small ? "text-sm" : "text-lg sm:text-xl";
  const regularPriceSize = small ? "text-sm" : "text-xl sm:text-2xl";
  const containerAlign =
    align === "left" ? "justify-start text-left" : "justify-center text-center";

  if (!showOldPrice) {
    return (
      <span
        className={`block ${regularPriceSize} font-semibold text-foreground ${
          align === "left" ? "text-left" : "text-center"
        } ${className}`}
      >
        {priceText}
      </span>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${containerAlign} ${className}`}
    >
      <span className="text-xs font-medium text-muted-foreground line-through">
        {oldPriceText}
      </span>

      <span
        role="status"
        className={`${priceSize} font-semibold text-red-600 dark:text-red-400`}
      >
        {priceText}
      </span>
    </div>
  );
};

export default ProductPrice;
