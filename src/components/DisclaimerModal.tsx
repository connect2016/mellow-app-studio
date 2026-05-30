import { useEffect, useState } from 'react';

const STORAGE_KEY = 'disclaimer_seen';

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-heading"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '340px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <h2
          id="disclaimer-heading"
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#1a1f2e',
            margin: 0,
            marginBottom: '12px',
          }}
        >
          Welcome to Cubbies Buddies
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: '#374151',
            lineHeight: 1.5,
            margin: 0,
            marginBottom: '20px',
          }}
        >
          This is an independent, fan-made app for connecting Cubs fans socially.
          Cubbies Buddies is not affiliated with or endorsed by Major League
          Baseball or the Chicago Cubs. All team marks belong to their respective
          owners.
        </p>
        <button
          onClick={handleDismiss}
          style={{
            width: '100%',
            height: '48px',
            background: '#0E3386',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Got it — Let's go ⚾
        </button>
      </div>
    </div>
  );
}
