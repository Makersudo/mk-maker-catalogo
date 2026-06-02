import { useState } from 'react';
import { usePublicSettings } from '../../hooks/usePublicSettings';

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
};

const DEFAULT_TRANSPARENT_LOGO = '/assets/mk-maker-logo-ultra-realista.png';

function getDisplayLogoUrl(logoUrl?: string) {
  const trimmedLogoUrl = logoUrl?.trim();
  if (!trimmedLogoUrl) return '';

  if (trimmedLogoUrl.includes('/mk-maker-media/brand/mk-maker-logo-symbol.png')) {
    return DEFAULT_TRANSPARENT_LOGO;
  }

  return trimmedLogoUrl;
}

export function BrandLogo({
  className = '',
  imageClassName = 'h-16 w-32 object-contain object-left md:h-20 md:w-44',
  textClassName = 'text-lg font-black tracking-normal text-neutral-950',
}: BrandLogoProps) {
  const settings = usePublicSettings();
  const [imageFailed, setImageFailed] = useState(false);
  const storeName = settings.store_name?.trim() || 'MK MAKER';
  const logoUrl = getDisplayLogoUrl(settings.store_logo);

  return (
    <div className={`flex items-center ${className}`}>
      {logoUrl && !imageFailed ? (
        <img
          src={logoUrl}
          alt={storeName}
          className={imageClassName}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={textClassName}>{storeName}</span>
      )}
    </div>
  );
}
