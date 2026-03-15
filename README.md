# ChatApp — Production Ready

Full-stack real-time chat: Node.js + React + MongoDB + Socket.IO + Tailwind CSS

---

## Local Development

```bash
# Terminal 1 — Backend
cd server
npm install
cp .env.example .env      # fill in your values
npm run dev               # → http://localhost:5000

# Terminal 2 — Frontend
cd client
npm install
npm start                 # → http://localhost:3000
```

---

## Deploy: GitHub → Railway (backend) → Vercel (frontend)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Vikasitha-Herath/ChatApp.git
git branch -M main
git push -u origin main
```

### 2. MongoDB Atlas (free database)
1. Go to mongodb.com/atlas → create free M0 cluster
2. Database Access → add a user with password
3. Network Access → Add IP → Allow from Anywhere (0.0.0.0/0)
4. Connect → Drivers → copy your connection string

### 3. Railway (backend)
1. railway.app → New Project → Deploy from GitHub repo
2. Select your repo → Settings → Root Directory: `server`
3. Add all variables from server/.env.example in the Variables tab
4. Railway gives you: `https://yourapp.up.railway.app`
5. Test: visit `https://yourapp.up.railway.app/api/health`

### 4. Vercel (frontend)
1. vercel.com → New Project → Import your GitHub repo
2. Root Directory: `client` | Build: `npm run build` | Output: `build`
3. Add environment variable: `REACT_APP_SERVER_URL` = your Railway URL
4. Deploy → Vercel gives you: `https://yourapp.vercel.app`

### 5. Connect them together
- In Railway Variables, set `CLIENT_URL` = `https://yourapp.vercel.app`
- Redeploy Railway service
- Done! Every `git push` auto-deploys both services.

---

## Environment Variables

### server/.env
| Variable | Value |
|---|---|
| `MONGODB_URI` | mongodb+srv://user:pass@cluster.mongodb.net/chatapp |
| `JWT_SECRET` | any long random string |
| `JWT_EXPIRE` | 7d |
| `CLIENT_URL` | https://yourapp.vercel.app |
| `EMAIL_HOST` | smtp.gmail.com |
| `EMAIL_PORT` | 587 |
| `EMAIL_USER` | your Gmail address |
| `EMAIL_PASS` | Gmail App Password (16 chars) |
| `FREE_MESSAGE_LIMIT` | 3 |
| `PRIVATE_CHAT_PRICE` | 99 |
| `PORT` | 5000 |

### client — set in Vercel dashboard
| Variable | Value |
|---|---|
| `REACT_APP_SERVER_URL` | https://yourapp.up.railway.app |

---

## Gmail App Password Setup
1. Google Account → Security → Enable 2-Step Verification
2. Search "App Passwords" → Generate for Mail
3. Use the 16-char password as EMAIL_PASS

---

## Project Structure
```
chatapp/
├── server/
│   ├── models/          User, Message, PrivateRoom
│   ├── routes/          auth, chat, payment
│   ├── middleware/       JWT auth
│   ├── socket.js         All real-time events
│   ├── index.js          Entry point
│   └── .env.example
│
└── client/
    ├── public/
    └── src/
        ├── context/      AuthContext, SocketContext
        ├── pages/        Login, Register, ForgotPassword, ChatPage
        └── components/   LeftSidebar, RightSidebar, GeneralChat,
                          PrivateChat, PaymentModal, Avatar
```

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS |
| Real-time | Socket.IO |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Email OTP | Nodemailer + Gmail |
| Payments | Stripe (demo mode included) |
