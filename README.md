# PanelPro Market

A full-stack panel marketplace with a professional storefront, admin-controlled content, manual payment approval, user balance/history, dark/light theme, demo video embeds, and a Neon-ready data layer.

## Folder Structure

- `backend/` - Node API, admin endpoints, auth, orders, data store, tests
- `frontend/` - Storefront and admin panel static frontend
- `USER-GUIDE-BN.md` - Bengali hosting and user guide

## Default Accounts

- Admin: `admin@example.com` / `Admin@12345`
- Users register themselves with their own Gmail address and their own site password.

Change the admin password from `Admin > Security` before real hosting.

## Run Locally

```bash
cd backend
npm start
```

Open:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

The app uses `data/app-data.json` locally when `DATABASE_URL` is empty. This keeps the demo fully runnable without a database.

## Neon Database

1. Create a free Neon Postgres database.
2. Copy the pooled connection string.
3. Set it as `DATABASE_URL`.
4. Run `npm install` so the optional `pg` package is available.
5. Start the app.

The current storage model keeps one JSON document inside Postgres. That makes the MVP easy to deploy now and keeps the code ready for later payment automation or normalized tables.

## Render Hosting

This repository includes `render.yaml` with two services: backend web service and frontend static site.

1. Push the project to GitHub.
2. Create a Render Blueprint from the repo, or create a Web Service manually.
3. Backend root directory: `backend`
4. Backend build command: `npm install`
5. Backend start command: `npm start`
6. Frontend root directory: `frontend`
7. Frontend build command: `npm install && npm run build`
8. Frontend publish directory: `dist`
9. Add backend environment variables:
   - `TOKEN_SECRET`
   - `DATABASE_URL`
   - `GOOGLE_CLIENT_ID` if Google login is needed
10. Add frontend environment variable:
   - `FRONTEND_API_URL`, set to your deployed backend URL

## Admin Features

- Change site name, logo, hero text, background, intro animation, help links.
- Upload logo/background/product/category images as data URLs.
- Set bKash, Nagad, Rocket, Binance USDT, India UPI, or any future payment method.
- Set USD to BDT and USD to INR rates.
- Create unlimited sections such as Non Root Panel, Root Panel, iPhone Panel, PC Panel.
- Create products with image, demo video URL, features, panel name, badge, and variants.
- Approve or reject manual payment orders.
- Set user balances and view account history.

## Google Login

Set `GOOGLE_CLIENT_ID` in Render or in the admin settings. Users will use their own personal Gmail account. Do not ask users for their real Gmail password; the password register form is only for creating a site password.

## Future Auto Payments

Manual payment methods are modeled with method id, currency, rate key, account, and instructions. To add bKash/Nagad/Binance automatic payment later, connect the payment provider webhook to the order id and update `/api/admin/orders/:id` style approval logic to mark matching payments as approved automatically.

## Tests

```bash
npm test
```
