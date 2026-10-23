<div align="center">

# 🎨 Craftly AI

### Turn Waste into Wonder

**An AI-powered web app that transforms everyday household waste and recyclables into creative DIY craft projects — with step-by-step guidance.**

<br/>

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-12.x-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Groq](https://img.shields.io/badge/Groq_AI-LLaMA_4-6366F1?style=flat-square&logo=meta&logoColor=white)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

</div>

---

## 👨‍💻 Team & Contributions

| Member | Role | Responsibilities |
|--------|------|-----------------|
| **Raheem** | Frontend | UI design, React components, responsive layout, dark/light theme, sidebar & navigation, profile system |
| **Janak** | API Integration | Groq AI vision & text API, material detection, craft generation, fallback handling, JSON parsing |
| **Umair** | Backend | Express server, Anthropic Claude API endpoints, Firebase Auth & Firestore, database schema |

---

## ✨ Features

- **📸 Snap & Scan** — Upload up to 5 photos of household items; AI detects craft materials automatically
- **🤖 AI Craft Generation** — Get 4 unique, step-by-step DIY ideas tailored to your skill level and available time
- **🎯 Personalization** — Filter by skill level, time available, purpose (gift, home decor, school, kids), and tools
- **❤️ Save & Revisit** — Bookmark favourite crafts and browse your full generation history
- **👤 User Profiles** — Sign up, edit your name/bio, and track your crafting stats
- **🌙 Dark / Light Mode** — Full theme toggle that persists across sessions
- **📱 Fully Responsive** — Works seamlessly on mobile, tablet, and desktop
- **🔐 Firebase Auth** — Secure email/password authentication with per-user Firestore data
- **♻️ Eco-Friendly Focus** — Promotes recycling and sustainability through creative reuse

---

## �️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, CSS Variables, Lucide React |
| AI (Vision) | Groq API — `meta-llama/llama-4-scout-17b-16e-instruct` |
| AI (Generation) | Groq API — `llama-3.1-8b-instant` |
| Auth & Database | Firebase Authentication + Firestore |
| Backend (optional) | Node.js, Express, Anthropic Claude |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v16 or higher (LTS recommended)
- A [Firebase](https://console.firebase.google.com) project with Auth + Firestore enabled
- A [Groq](https://console.groq.com) API key (free tier available)

### Installation

**1. Clone or extract the project**
```bash
cd "C:\Users\YourName\Desktop\craftly-ai-complete"
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**

Create (or update) a `.env` file in the project root:
```env
# Groq AI
REACT_APP_GROQ_API_KEY=your_groq_api_key_here

# Firebase
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

**4. Start the app**
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Windows PowerShell note:** If you see a script execution error, run this once in an Admin PowerShell:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
> ```
> Or use **Command Prompt (cmd)** instead.

---

## 🔑 Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → create a project
2. **Authentication** → Sign-in method → enable **Email/Password**
3. **Firestore Database** → Create database → choose **Start in test mode**
4. **Project Settings** → Your Apps → Add Web App → copy the config into your `.env`

---

## 📁 Project Structure

```
craftly-ai-complete/
├── public/
│   ├── index.html          # HTML template
│   └── logo.png            # App logo
├── src/
│   ├── App.jsx             # Main app — all screens, routing, theme, sidebar
│   ├── api.js              # Groq API calls (vision + craft generation)
│   ├── firebase.js         # Firebase app initialization
│   ├── index.js            # React entry point
│   └── index.css           # Global base styles
├── server/
│   ├── index.js            # Express server (Anthropic Claude endpoints)
│   ├── package.json        # Server dependencies
│   └── .env.example        # Server environment template
├── .env                    # Frontend environment variables (create this)
├── package.json            # Frontend dependencies & scripts
└── README.md               # This file
```

---

## � Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the development server at `localhost:3000` |
| `npm run build` | Build the production-optimised bundle |
| `npm run server` | Start the optional Express backend on port `4000` |

---

## 🎯 How to Use

1. **Sign In** — Log in with your account or use a demo account from the login page
2. **Start Creating** — Click "Start Creating" from the Home screen
3. **Upload Images** — Take a photo or pick images of materials (up to 5)
4. **Review Materials** — Confirm AI-detected items, add more manually if needed
5. **Set Preferences** — Pick skill level, time, purpose, and available tools
6. **Generate Ideas** — AI creates 4 unique craft projects for you
7. **Follow Steps** — View full instructions and pro tips for each craft
8. **Save Favourites** — Bookmark crafts to find them in Saved Crafts later

---

## � Theme

The app supports **Light** and **Dark** modes. Click the moon/sun icon in the top-right corner to toggle. Your preference is saved and restored on next visit.

---

## 🚢 Deployment

### Vercel (recommended)
```bash
npm install -g vercel
npm run build
vercel
```

### Netlify
1. Run `npm run build`
2. Drag the `build/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

> Make sure to add all `REACT_APP_*` environment variables in your hosting dashboard.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm` not recognised | Node.js is not installed or not on PATH — reinstall from [nodejs.org](https://nodejs.org) and restart |
| `running scripts is disabled` | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force` in Admin PowerShell |
| Port 3000 in use | Run `set PORT=3001 && npm start` (cmd) |
| Login not working | Check Firebase Auth is enabled and `.env` variables are set correctly |
| AI not detecting materials | Check `REACT_APP_GROQ_API_KEY` is valid — the app has a built-in fallback if the key fails |
| Module not found | Delete `node_modules/` and run `npm install` again |

---

## 🤝 Contributing

Pull requests are welcome.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push and open a Pull Request

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) — ultra-fast LLM inference
- [Firebase](https://firebase.google.com) — auth and real-time database
- [Lucide React](https://lucide.dev) — icon library
- [React](https://reactjs.org) — UI framework

---

<div align="center">

Made with ❤️ by **Raheem**, **Janak** & **Umair**

♻️ *Crafting a better world, one recycled item at a time.*

</div>
