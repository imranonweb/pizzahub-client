"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_PIZZA_IMAGE = "/images/auth-pizza-hero.jpg";

export function PizzaImage({
  src,
  alt,
  unoptimized,
  ...props
}: Omit<ImageProps, "src"> & { src?: string | null }) {
  const resolvedInitial =
    typeof src === "string" && src.trim().length > 0
      ? src.trim()
      : FALLBACK_PIZZA_IMAGE;

  const [imgSrc, setImgSrc] = useState(resolvedInitial);

  useEffect(() => {
    setImgSrc(resolvedInitial);
  }, [resolvedInitial]);

  const isExternal = /^https?:\/\//i.test(imgSrc);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={unoptimized ?? isExternal}
      onError={() => {
        if (imgSrc !== FALLBACK_PIZZA_IMAGE) {
          setImgSrc(FALLBACK_PIZZA_IMAGE);
        }
      }}
    />
  );
}
