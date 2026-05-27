"use client";

import React from "react";

type Props = {
  price: number;
  oldPrice?: number | null;
  className?: string;
  small?: boolean;
};

function formatPrice(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

export const ProductPrice = ({ price, oldPrice, className = "", small = false }: Props) => {
  const showOldPrice =
    oldPrice !== undefined && oldPrice !== null && oldPrice > 1 && oldPrice > price;
  const priceText = `$${formatPrice(price)}`;
  const oldPriceText = oldPrice ? `$${formatPrice(oldPrice)}` : null;

  const priceBoxSize = small ? "text-sm px-3 py-1" : "text-lg px-3 py-1";

  if (!showOldPrice) {
    return (
      <span className={`text-xl sm:text-2xl font-bold text-gray-900 dark:text-white ${className}`}>
        {priceText}
      </span>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through">
        {oldPriceText}
      </span>

      <div className="mt-1">
        <div
          role="status"
          className={`inline-flex items-center justify-center rounded-md ${priceBoxSize} font-extrabold text-white bg-red-600 dark:bg-red-500 border border-red-600 shadow-sm select-none`}
          aria-hidden
        >
          {priceText}
        </div>
      </div>
    </div>
  );
};

export default ProductPrice;
