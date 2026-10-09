# Mapuan Marketplace

A multi-page campus marketplace for verified Mapua student emails.

## Stack
- HTML + CSS + Vanilla JavaScript
- Node.js + Express
- MySQL
- JWT authentication
- bcrypt password hashing
- Multer image uploads

## Setup

1. Open the folder in VS Code.
2. In Terminal:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`.
4. Edit `.env` and set your MySQL password and JWT secret.
5. Create/import the database:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
6. Start:
   ```bash
   npm run dev
   ```
7. Open:
   http://localhost:3000

## Admin account
Register a normal account first, then run this SQL in MySQL:
```sql
USE mapuan_marketplace;
UPDATE users SET role = 'admin' WHERE email = 'yourname@mymail.mapua.edu.ph';
```
Log out and log in again.

## Main pages
- `index.html`
- `browse.html`
- `listing.html`
- `sell.html`
- `messages.html`
- `my-listings.html`
- `profile.html`
- `login.html`
- `register.html`
- `admin.html`

All pages are linked in the interface and also visible directly in VS Code.
