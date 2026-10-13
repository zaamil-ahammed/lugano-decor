# Lugano Diecast: catalogue with admin panel and WhatsApp booking

A MERN website for selling diecast cars.

- **Public catalogue:** car grid, scale tabs (1:64, 1:43, 1:24...), search, brand and condition filters, sort by price.
- **Car page:** photo gallery, scale, condition, price, and a **Book on WhatsApp** button that opens a chat with the car's name, price and link already typed in.
- **Admin panel (`/admin`):** log in, add, edit and delete cars, upload photos, mark cars Available, Reserved or Sold, and change the WhatsApp number and shop name.

The WhatsApp number is set to `919447650667`. You can change it any time in the admin panel under **Shop details**.

## Folder layout

```
server/   Express + MongoDB API (cars, login, photo upload, settings)
client/   React website (Vite)
```

## Run it on your computer

You need Node.js 18 or newer and a MongoDB database. The easiest is a free MongoDB Atlas cluster (see "Go live" below), or MongoDB installed locally.

**1. Start the server**

```bash
cd server
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Open `server/.env` and set at least `MONGODB_URI`, `JWT_SECRET`, `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Then:

```bash
npm run seed              # optional: adds 6 sample cars so you can see the site working
npm run dev
```

The API runs on http://localhost:5000.

**2. Start the website** (in a second terminal)

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. The admin panel is at http://localhost:5173/admin.

Delete the sample cars from the admin panel before you go live.

## Adding your 30+ cars

1. Photograph each car on a plain background in daylight. Take 3 to 5 photos: front three-quarter, side, back, and the box if it has one.
2. Log in at `/admin`, choose **Add a car**, fill in the details and upload the photos. The first photo is the cover; use **Make cover** to change it.
3. Pick the **paint colour** of the car. The catalogue shows that colour as a stripe under the card.
4. When a car sells, change its status to **Sold** from the list. It stays on the shelf, greyed out, so buyers can see you sell regularly. Use **Reserved** while someone is paying.

## Go live (free)

You need three free accounts: MongoDB Atlas (database), Cloudinary (photos) and Render (server). Vercel or Netlify hosts the website.

### 1. Database: MongoDB Atlas
1. Create a free cluster at mongodb.com/atlas.
2. Under **Database Access**, create a user with a password. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`).
3. Copy the connection string. It looks like `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/diecast`.

### 2. Photos: Cloudinary
Render's free plan erases files whenever the server restarts, so photos must be stored somewhere else.
1. Create a free account at cloudinary.com.
2. On the dashboard, copy the **API environment variable**. It looks like `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`.

### 3. Server: Render
1. Push this project to a GitHub repository.
2. On render.com choose **New, Web Service**, and pick the repository.
3. Set **Root Directory** to `server`, **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Add these environment variables:

| Name | Value |
| --- | --- |
| `MONGODB_URI` | your Atlas connection string |
| `JWT_SECRET` | a long random string |
| `ADMIN_USERNAME` | the username you will log in with |
| `ADMIN_PASSWORD` | a strong password |
| `WHATSAPP_NUMBER` | `919447650667` |
| `CLOUDINARY_URL` | the Cloudinary value from step 2 |
| `CORS_ORIGIN` | your website address from step 4 (add it after you deploy the site) |

5. Deploy. Your API address will look like `https://your-api.onrender.com`. Visit `/api/health` on it to check it works.

On the free plan Render puts the server to sleep after about 15 minutes without visitors, so the first page load after a quiet spell can take around 30 seconds.

### 4. Website: Vercel
1. On vercel.com choose **Add New, Project** and pick the same repository.
2. Set **Root Directory** to `client`. Vercel detects Vite automatically.
3. Add the environment variable `VITE_API_URL` with your Render address, with no slash at the end.
4. Deploy. Then go back to Render and set `CORS_ORIGIN` to your Vercel address (for example `https://shamil-diecast.vercel.app`) and redeploy the server.

If you use Netlify instead, add a rule that sends every path to `/index.html` so links like `/car/123` and `/admin` work.

## Safety notes

- Change `ADMIN_PASSWORD` and `JWT_SECRET` before deploying, and never commit your `.env` file.
- Login is limited to 10 attempts per 15 minutes per address.
- Only JPG, PNG and WebP photos up to 8 MB each can be uploaded, and only when logged in.
- This site takes bookings by WhatsApp message only. It does not handle payments, so agree the payment and delivery details with the buyer in the chat.

## How the pieces work

| File | What it does |
| --- | --- |
| `server/src/routes/cars.js` | List, create, edit and delete cars (changes need the admin login) |
| `server/src/routes/auth.js` | Admin login, returns a token valid for 7 days |
| `server/src/routes/uploads.js` | Photo upload to Cloudinary, or to `server/uploads` when Cloudinary is not set |
| `server/src/routes/settings.js` | Shop name, line under the name and WhatsApp number |
| `client/src/utils.js` | Builds the WhatsApp booking link and formats prices in rupees |
| `client/src/pages/` | Catalogue, car page, admin login, admin list, add and edit form |
