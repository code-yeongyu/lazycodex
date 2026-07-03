import type { JSX } from "react"

interface BrandImageProps {
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
  readonly className?: string
  readonly priority?: boolean
}

export function BrandImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
}: BrandImageProps): JSX.Element {
  // Strip extension to get base path
  const basePath = src.replace(/\.[^/.]+$/, "")

  return (
    <picture>
      <source srcSet={`${basePath}.avif`} type="image/avif" />
      <source srcSet={`${basePath}.webp`} type="image/webp" />
      <img
        src={`${basePath}.png`}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
      />
    </picture>
  )
}
