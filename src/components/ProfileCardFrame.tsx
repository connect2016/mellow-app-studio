import { useRef, useState } from 'react';
import cardFrame from '@/assets/card-frame-transparent.png';

interface ProfileCardFrameProps {
  userName: string;
  profileImageUrl?: string;
}

export function ProfileCardFrame({ userName, profileImageUrl }: ProfileCardFrameProps) {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(profileImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '1768 / 2500',
        maxWidth: 400,
        width: '100%',
      }}
    >
      {/* Photo layer (bottom) */}
      <div
        onClick={() => fileInputRef.current?.click()}
        role="button"
        aria-label={photoUrl ? `Change ${userName}'s profile photo` : `Add ${userName}'s profile photo`}
        style={{
          position: 'absolute',
          left: '48.7%',
          top: '42.5%',
          width: '45%',
          aspectRatio: '1 / 1',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: 'pointer',
          background: '#d1d5db',
        }}
      >
        {photoUrl && (
          <img
            src={photoUrl}
            alt={userName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />
        )}
      </div>

      {/* Frame layer (top) */}
      <img
        src={cardFrame}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
