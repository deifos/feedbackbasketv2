/**
 * Utility functions for handling images in the application
 */

/**
 * Creates a proxied image URL for external images to work with Next.js Image optimization
 * @param imageUrl - The external image URL
 * @returns Proxied URL that can be used with Next.js Image component
 */
export function getProxiedImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';

  // If it's already a local image, return as-is
  if (imageUrl.startsWith('/') || imageUrl.startsWith(process.env.NEXTAUTH_URL || '')) {
    return imageUrl;
  }

  // Proxy external images through our API route
  return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Checks if an image URL is external and needs proxying
 * @param imageUrl - The image URL to check
 * @returns True if the image is external
 */
export function isExternalImage(imageUrl: string): boolean {
  if (!imageUrl) return false;
  return !imageUrl.startsWith('/') && !imageUrl.startsWith(process.env.NEXTAUTH_URL || '');
}

/**
 * Gets appropriate image props for Next.js Image component
 * @param src - The image source URL
 * @param alt - Alt text for the image
 * @param options - Additional options
 * @returns Props object for Next.js Image component
 */
export function getImageProps(
  src: string,
  alt: string,
  options: {
    width?: number;
    height?: number;
    fill?: boolean;
    priority?: boolean;
    className?: string;
  } = {}
) {
  const proxiedSrc = getProxiedImageUrl(src);

  return {
    src: proxiedSrc,
    alt,
    ...options,
    // Add unoptimized for external images as fallback
    unoptimized: isExternalImage(src),
  };
}
