import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth.js';
import { saveImage } from '../storage.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG or WebP photos can be uploaded.'));
  },
});

router.post('/', requireAdmin, upload.array('photos', 8), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'Choose at least one photo.' });
  const saved = [];
  for (const file of req.files) saved.push(await saveImage(file, req));
  res.status(201).json(saved);
});

export default router;
