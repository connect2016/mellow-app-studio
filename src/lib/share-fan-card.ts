import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

const CARD_TEMPLATE_SRC = '/Wrigleyville_Profile_Card_v2.webp';
const LOGO_SRC = '/Wrigleyville_Buddies_Primary_Logo.webp';

interface ShareOpts {
  profileImage: string;
  displayName: string;
  surface: 'profile' | 'post_crop';
}

/** Fetch any image as an object URL to avoid CORS-tainted canvases. */
async function fetchAsObjectURL(src: string): Promise<string> {
  try {
    const res = await fetch(src, { mode: 'cors', cache: 'force-cache' });
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    // Fall back to the original URL — html2canvas will use useCORS
    return src;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function buildExportNode(args: {
  templateURL: string;
  logoURL: string;
  photoURL: string;
}): { host: HTMLDivElement; imgs: HTMLImageElement[] } {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: '1080px',
    height: '1920px',
    overflow: 'hidden',
    pointerEvents: 'none',
    background: 'hsl(220, 81%, 29%)',
    fontFamily: 'Inter, sans-serif',
  } as CSSStyleDeclaration);

  // Ivy vignette overlay
  const vignette = document.createElement('div');
  Object.assign(vignette.style, {
    position: 'absolute',
    inset: '0',
    background:
      'radial-gradient(ellipse at center, transparent 45%, hsla(160, 52%, 15%, 0.55) 100%)',
    pointerEvents: 'none',
  } as CSSStyleDeclaration);
  host.appendChild(vignette);

  // Card wrapper — 70% of canvas width, centered vertically biased upward
  const cardW = Math.round(1080 * 0.7); // 756
  const cardH = Math.round(cardW * (4.2 / 3)); // ~1058
  const card = document.createElement('div');
  Object.assign(card.style, {
    position: 'absolute',
    left: `${(1080 - cardW) / 2}px`,
    top: '180px',
    width: `${cardW}px`,
    height: `${cardH}px`,
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
  } as CSSStyleDeclaration);

  const tmpl = document.createElement('img');
  tmpl.src = args.templateURL;
  tmpl.crossOrigin = 'anonymous';
  Object.assign(tmpl.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'fill',
  } as CSSStyleDeclaration);
  card.appendChild(tmpl);

  // Circular photo — matches CardFrontSide: top 42.8%, width 43%
  const photoSize = Math.round(cardW * 0.43);
  const photoWrap = document.createElement('div');
  Object.assign(photoWrap.style, {
    position: 'absolute',
    left: `${(cardW - photoSize) / 2}px`,
    top: `${Math.round(cardH * 0.428) - photoSize / 2}px`,
    width: `${photoSize}px`,
    height: `${photoSize}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    background: 'hsl(220, 81%, 29%)',
  } as CSSStyleDeclaration);
  const photo = document.createElement('img');
  photo.src = args.photoURL;
  photo.crossOrigin = 'anonymous';
  Object.assign(photo.style, {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center center',
    display: 'block',
  } as CSSStyleDeclaration);
  photoWrap.appendChild(photo);
  card.appendChild(photoWrap);
  host.appendChild(card);

  // Footer lockup
  const footer = document.createElement('div');
  Object.assign(footer.style, {
    position: 'absolute',
    left: '0',
    right: '0',
    bottom: '110px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '18px',
    textAlign: 'center',
  } as CSSStyleDeclaration);

  const logo = document.createElement('img');
  logo.src = args.logoURL;
  logo.crossOrigin = 'anonymous';
  Object.assign(logo.style, {
    height: '120px',
    width: 'auto',
    display: 'block',
  } as CSSStyleDeclaration);
  footer.appendChild(logo);

  const url = document.createElement('div');
  url.textContent = 'wrigleyvillebuddies.com';
  Object.assign(url.style, {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '48px',
    color: '#FFFFFF',
    letterSpacing: '0.06em',
    lineHeight: '1',
  } as CSSStyleDeclaration);
  footer.appendChild(url);

  const tagline = document.createElement('div');
  tagline.textContent = 'Where fans find friends';
  Object.assign(tagline.style, {
    fontFamily: 'Inter, sans-serif',
    fontSize: '32px',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: '1.2',
  } as CSSStyleDeclaration);
  footer.appendChild(tagline);

  host.appendChild(footer);

  return { host, imgs: [tmpl, photo, logo] };
}

async function renderExportPNG(opts: ShareOpts): Promise<Blob> {
  const [photoURL, templateURL, logoURL] = await Promise.all([
    fetchAsObjectURL(opts.profileImage),
    fetchAsObjectURL(CARD_TEMPLATE_SRC),
    fetchAsObjectURL(LOGO_SRC),
  ]);

  const { host, imgs } = buildExportNode({ templateURL, logoURL, photoURL });
  document.body.appendChild(host);

  try {
    // Ensure fonts are ready
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    // Wait for every image to decode
    await Promise.all(
      imgs.map(
        (im) =>
          new Promise<void>((resolve) => {
            if (im.complete && im.naturalWidth > 0) return resolve();
            im.onload = () => resolve();
            im.onerror = () => resolve();
          }),
      ),
    );
    // Tiny paint settle
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const canvas = await html2canvas(host, {
      useCORS: true,
      backgroundColor: null,
      scale: 1,
      logging: false,
      width: 1080,
      height: 1920,
      windowWidth: 1080,
      windowHeight: 1920,
    });

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    });
    return blob;
  } finally {
    document.body.removeChild(host);
    // Revoke object URLs we created
    [photoURL, templateURL, logoURL].forEach((u) => {
      if (u.startsWith('blob:')) URL.revokeObjectURL(u);
    });
  }
}

/** Render and either share (mobile) or download (desktop) the fan card PNG. */
export async function shareFanCard(opts: ShareOpts): Promise<void> {
  const blob = await renderExportPNG(opts);
  const file = new File([blob], 'my-wrigleyville-card.png', { type: 'image/png' });

  const canNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  if (canNativeShare) {
    try {
      await navigator.share({
        title: 'My Wrigleyville Buddies Fan Card',
        text: 'Find your Cubs crew → wrigleyvillebuddies.com',
        files: [file],
      });
      track('fan_card_shared', { surface: opts.surface, method: 'native' });
      return;
    } catch (err) {
      // User cancelled — don't fall through to download
      if ((err as DOMException)?.name === 'AbortError') return;
      // Otherwise fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-wrigleyville-card.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('Card saved — post it and tag your crew.');
  track('fan_card_shared', { surface: opts.surface, method: 'download' });
}
