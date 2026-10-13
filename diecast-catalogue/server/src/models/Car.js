import mongoose from 'mongoose';

export const CONDITIONS = ['Sealed', 'Boxed', 'Loose'];
export const STATUSES = ['available', 'reserved', 'sold'];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  { _id: false }
);

const carSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    brand: { type: String, required: true, trim: true, maxlength: 60 },
    scale: { type: String, required: true, trim: true, maxlength: 12 },
    condition: { type: String, enum: CONDITIONS, default: 'Boxed' },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    color: { type: String, default: '#c9ced1' },
    images: { type: [imageSchema], default: [] },
    status: { type: String, enum: STATUSES, default: 'available' },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Car', carSchema);
