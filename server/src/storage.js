import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

export const useCloudinary = Boolean(process.env.CLOUDINARY_URL);
if (useCloudinary) cloudinary.config({ secure: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

/** Save one uploaded image (multer memory file). Returns { url, publicId }. */
export async function saveImage(file, req) {
  if (useCloudinary) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'diecast',
          transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        },
        (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id }))
      );
      stream.end(file.buffer);
    });
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT[file.mimetype] || '.jpg'}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer);
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  return { url: `${base}/uploads/${name}`, publicId: `local:${name}` };
}

/** Best-effort removal of a stored image. */
export async function removeImage(image) {
  try {
    if (!image?.publicId) return;
    if (image.publicId.startsWith('local:')) {
      const file = path.join(UPLOAD_DIR, path.basename(image.publicId.slice(6)));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } else if (useCloudinary) {
      await cloudinary.uploader.destroy(image.publicId);
    }
  } catch (err) {
    console.warn('Could not delete image:', err.message);
  }
}
