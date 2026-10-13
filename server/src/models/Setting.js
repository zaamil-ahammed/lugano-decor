import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  shopName: { type: String, default: 'Lugano Diecast', trim: true, maxlength: 60 },
  tagline: { type: String, default: 'Diecast cars from my own collection', trim: true, maxlength: 140 },
  whatsappNumber: { type: String, default: '' },
});

const Setting = mongoose.model('Setting', settingSchema);

export function cleanNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export async function getSettings() {
  let doc = await Setting.findOne({ key: 'main' });
  if (!doc) {
    doc = await Setting.create({
      key: 'main',
      whatsappNumber: cleanNumber(process.env.WHATSAPP_NUMBER || '919447650667'),
    });
  }
  return doc;
}

export default Setting;
