import { Router } from 'express';
import mongoose from 'mongoose';
import Car, { CONDITIONS, STATUSES } from '../models/Car.js';
import { requireAdmin } from '../middleware/auth.js';
import { removeImage } from '../storage.js';

const router = Router();

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Pick and validate the fields an admin is allowed to set. */
function readBody(body, { partial = false } = {}) {
  const out = {};
  const errors = [];
  const text = (key, label, { required = false } = {}) => {
    if (body[key] === undefined) {
      if (required && !partial) errors.push(`${label} is required.`);
      return;
    }
    const v = String(body[key]).trim();
    if (required && !v) errors.push(`${label} is required.`);
    else out[key] = v;
  };

  text('name', 'Name', { required: true });
  text('brand', 'Brand', { required: true });
  text('scale', 'Scale', { required: true });
  text('description', 'Description');

  if (body.price !== undefined || !partial) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) errors.push('Price must be a number, 0 or more.');
    else out.price = price;
  }
  if (body.condition !== undefined) {
    if (!CONDITIONS.includes(body.condition)) errors.push(`Condition must be one of: ${CONDITIONS.join(', ')}.`);
    else out.condition = body.condition;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) errors.push(`Status must be one of: ${STATUSES.join(', ')}.`);
    else out.status = body.status;
  }
  if (body.color !== undefined) {
    if (!HEX.test(body.color)) errors.push('Colour must look like #aabbcc.');
    else out.color = body.color;
  }
  if (body.featured !== undefined) out.featured = Boolean(body.featured);
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) errors.push('Images must be a list.');
    else {
      out.images = body.images
        .filter((i) => i && typeof i.url === 'string' && i.url)
        .slice(0, 8)
        .map((i) => ({ url: i.url, publicId: typeof i.publicId === 'string' ? i.publicId : '' }));
    }
  }
  return { data: out, errors };
}

// Public: list cars. Sold cars stay visible so buyers can see the shelf is active.
router.get('/', async (req, res) => {
  const { q, brand, scale, condition, status, sort } = req.query;
  const filter = {};
  if (brand) filter.brand = brand;
  if (scale) filter.scale = scale;
  if (condition) filter.condition = condition;
  if (status) filter.status = status;
  if (q) {
    const safe = String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: new RegExp(safe, 'i') }, { brand: new RegExp(safe, 'i') }];
  }
  const sorts = {
    new: { createdAt: -1 },
    low: { price: 1 },
    high: { price: -1 },
  };
  const cars = await Car.find(filter).sort(sorts[sort] || sorts.new);
  res.json(cars);
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Car not found.' });
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ error: 'Car not found.' });
  res.json(car);
});

router.post('/', requireAdmin, async (req, res) => {
  const { data, errors } = readBody(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  const car = await Car.create(data);
  res.status(201).json(car);
});

router.put('/:id', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Car not found.' });
  const { data, errors } = readBody(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ error: 'Car not found.' });

  // Remove files for photos that were taken off this car.
  if (data.images) {
    const keep = new Set(data.images.map((i) => i.url));
    await Promise.all(car.images.filter((i) => !keep.has(i.url)).map(removeImage));
  }
  car.set(data);
  await car.save();
  res.json(car);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Car not found.' });
  const car = await Car.findByIdAndDelete(req.params.id);
  if (!car) return res.status(404).json({ error: 'Car not found.' });
  await Promise.all(car.images.map(removeImage));
  res.json({ ok: true });
});

export default router;
