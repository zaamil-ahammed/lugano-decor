import { Router } from 'express';
import { getSettings, cleanNumber } from '../models/Setting.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const publicShape = (s) => ({
  shopName: s.shopName,
  tagline: s.tagline,
  whatsappNumber: s.whatsappNumber,
});

router.get('/', async (req, res) => {
  res.json(publicShape(await getSettings()));
});

router.put('/', requireAdmin, async (req, res) => {
  const s = await getSettings();
  const { shopName, tagline, whatsappNumber } = req.body || {};
  if (shopName !== undefined) s.shopName = String(shopName).trim().slice(0, 60) || s.shopName;
  if (tagline !== undefined) s.tagline = String(tagline).trim().slice(0, 140);
  if (whatsappNumber !== undefined) {
    const n = cleanNumber(whatsappNumber);
    if (n.length < 11 || n.length > 15) {
      return res.status(400).json({ error: 'Enter the WhatsApp number with country code, like 919447650667.' });
    }
    s.whatsappNumber = n;
  }
  await s.save();
  res.json(publicShape(s));
});

export default router;
