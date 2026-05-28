import { useState } from 'react';
import { usePublicSettings } from '../../hooks/usePublicSettings';

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
};

export function BrandLogo({
  className = '',
  imageClassName = 'h-10 w-36 object-contain object-left',
  textClassName = 'text-lg font-black tracking-normal text-neutral-950',
}: BrandLogoProps) {
  const settings = usePublicSettings();
  const [imageFailed, setImageFailed] = useState(false);
  const storeName = settings.store_name?.trim() || 'MK MAKER';
  const logoUrl = settings.store_logo?.trim();

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
