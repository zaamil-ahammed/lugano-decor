import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Adds a few sample cars so you can see the site working. Delete them from the admin panel afterwards.
// Run: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import Car from './models/Car.js';
import { getSettings } from './models/Setting.js';

const samples = [
  { name: 'Nissan Skyline GT-R (R34)', brand: 'Mini GT', scale: '1:64', condition: 'Boxed', price: 1299, color: '#2f6fb5', description: 'Bayside Blue. Box has light shelf wear, car is mint.' },
  { name: 'Porsche 911 GT3 RS', brand: 'Hot Wheels', scale: '1:64', condition: 'Sealed', price: 799, color: '#e0a100', description: 'Premium series, real riders. Card is unopened.' },
  { name: 'Toyota Supra A80', brand: 'Tarmac Works', scale: '1:64', condition: 'Boxed', price: 1799, color: '#b3261e', description: 'Opened once for photos, kept in its case.' },
  { name: 'Mercedes-Benz G63 AMG', brand: 'Maisto', scale: '1:24', condition: 'Loose', price: 1100, color: '#2b2f33', description: 'Doors and bonnet open. No box.' },
  { name: 'Ford Mustang GT', brand: 'Bburago', scale: '1:18', condition: 'Boxed', price: 2999, color: '#4f8f5a', description: 'Large model with detailed engine bay.' },
  { name: 'Honda Civic Type R', brand: 'Majorette', scale: '1:64', condition: 'Loose', price: 349, color: '#d8dadc', status: 'sold', description: 'Sold to a collector in Calicut.' },
];

await mongoose.connect(process.env.MONGODB_URI);
await getSettings();
const existing = await Car.countDocuments();
if (existing > 0) {
  console.log(`Database already has ${existing} cars. Nothing added.`);
} else {
  await Car.insertMany(samples);
  console.log(`Added ${samples.length} sample cars.`);
}
await mongoose.disconnect();
