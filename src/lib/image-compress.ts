/**
 * Client-side image compression for profile photos.
 * Accepts jpg/png/webp, downscales to max 800x800, encodes to webp/jpeg.
 */
const MAX_DIM = 800;
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function compressProfilePhoto(file: File): Promise<File> {
  if (!ACCEPTED.includes(file.type.toLowerCase())) {
    throw new Error('Photo must be a JPG, PNG, or WebP');
  }

  const bitmap = await createImageBitmap(file).catch(async () => {
    // Fallback: load via <img>
    return await new Promise<ImageBitmap>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = async () => {
        try {
          const bm = await createImageBitmap(img);
          URL.revokeObjectURL(url);
          resolve(bm);
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read image'));
      };
      img.src = url;
    });
  });

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const outType = 'image/webp';
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encoding failed'))),
      outType,
      0.85
    )
  );

  const baseName = (file.name.split('.').slice(0, -1).join('.') || 'photo').slice(0, 40);
  return new File([blob], `${baseName}.webp`, { type: outType });
}
