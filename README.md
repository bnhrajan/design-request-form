# Design Request Form (HTML + Node Email Sender)

This project contains:
- `public/index.html` : the form UI (no footer/newsletter section)
- `server.js` : backend that receives the form + files and emails to **brand.biratnursinghome@gmail.com**
- `uploads/` : temporary upload folder (auto-created)

## 1) Setup (Windows)
1. Install Node.js (LTS).
2. Open this folder in VS Code.
3. In terminal (inside the project folder), run:
   ```bash
   npm install
   ```
4. Create a `.env` file (copy from `.env.example`) and set:
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD` (Google App Password)

   **Important:** regular Gmail password will NOT work if 2FA is enabled. Use an App Password.

## 2) Run
```bash
npm start
```
Open:
- http://localhost:3000

## 3) Hosting
Upload the whole project to a VPS or hosting that supports Node.
You can also put `public/` on your website and keep the Node server running behind the same domain.

## Notes
- Max 15 MB total attachments (client + server).
- Reply-To is set to the requester email so your team can reply quickly.
