import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Upload, X, Plus, Trash2, Clock, Star, Sparkles,
  ChevronRight, Heart, Search, AlertCircle, CheckCircle,
  LogOut, User, Menu, Home, History, Bookmark,
  Edit3, Save, ChevronLeft, Sun, Moon, Settings
} from 'lucide-react';
import { detectMaterials, generateCrafts } from './api';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  { email: 'sara@craftly.com',  password: 'craft123', label: 'Sara' },
  { email: 'ahmed@craftly.com', password: 'craft123', label: 'Ahmed' },
  { email: 'mia@craftly.com',   password: 'craft123', label: 'Mia' },
];

// ─────────────────────────────────────────────────────────────────────────────
// THEME  (CSS variables — toggled by [data-theme="dark"] on <html>)
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

  /* ── LIGHT THEME ── */
  :root {
    --bg:          #F0F4F8;
    --surface:     #FFFFFF;
    --surface2:    #F8FAFC;
    --border:      #E8ECF0;
    --text:        #1A2532;
    --text2:       #5A6472;
    --text3:       #9AA3AF;
    --teal:        #3CCFCF;
    --teal-dark:   #2AB8B8;
    --teal-soft:   #E6F9F9;
    --coral:       #FF6F61;
    --coral-soft:  #FFF0EE;
    --gold:        #FFB300;
    --gold-soft:   #FFF8E1;
    --sidebar-bg:  linear-gradient(180deg, #1A2E44 0%, #162538 100%);
    --sidebar-text:#FFFFFF;
    --sidebar-sub: rgba(255,255,255,0.45);
    --sidebar-border: rgba(255,255,255,0.08);
    --sidebar-hover: rgba(255,255,255,0.08);
    --topbar-bg:   rgba(255,255,255,0.92);
    --topbar-border: rgba(0,0,0,0.06);
    --shadow-sm:   0 2px 8px rgba(0,0,0,0.06);
    --shadow-md:   0 4px 20px rgba(0,0,0,0.10);
    --shadow-lg:   0 8px 32px rgba(0,0,0,0.12);
    --input-bg:    #FAFAFA;
    --input-border:#EEEEEE;
    --hero-bg:     linear-gradient(135deg, #1A2E44 0%, #2A4A6E 100%);
    --scrollbar:   #DDD;
  }

  /* ── DARK THEME ── */
  [data-theme="dark"] {
    --bg:          #0D1117;
    --surface:     #161B22;
    --surface2:    #1C2230;
    --border:      #2A3444;
    --text:        #E6EDF3;
    --text2:       #8B949E;
    --text3:       #4A5568;
    --teal-soft:   #0D2E2E;
    --coral-soft:  #2E1A18;
    --gold-soft:   #2A2000;
    --sidebar-bg:  linear-gradient(180deg, #0D1117 0%, #080C12 100%);
    --sidebar-border: rgba(255,255,255,0.06);
    --sidebar-hover: rgba(255,255,255,0.06);
    --topbar-bg:   rgba(22,27,34,0.95);
    --topbar-border: rgba(255,255,255,0.06);
    --shadow-sm:   0 2px 8px rgba(0,0,0,0.3);
    --shadow-md:   0 4px 20px rgba(0,0,0,0.4);
    --shadow-lg:   0 8px 32px rgba(0,0,0,0.5);
    --input-bg:    #1C2230;
    --input-border:#2A3444;
    --hero-bg:     linear-gradient(135deg, #0D1117 0%, #1A2532 100%);
    --scrollbar:   #2A3444;
  }

  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

  html, body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
    transition: background 0.3s, color 0.3s;
  }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 4px; }

  /* ───────────────────────────────────────────────────────
     SHELL / LAYOUT
  ─────────────────────────────────────────────────────── */
  .shell {
    display: flex;
    min-height: 100vh;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 260px;
    min-height: 100vh;
    background: var(--sidebar-bg);
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0; top: 0; bottom: 0;
    z-index: 300;
    transition: transform 0.3s cubic-bezier(.4,0,.2,1);
    box-shadow: 4px 0 24px rgba(0,0,0,0.18);
    overflow-y: auto;
  }

  /* Desktop — sidebar visible by default */
  @media (min-width: 768px) {
    .sidebar { transform: translateX(0) !important; }
    .sidebar-overlay { display: none !important; }
    .main { margin-left: 260px; }
  }

  /* Mobile — hidden by default, shown when .open */
  @media (max-width: 767px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .main { margin-left: 0; }
  }

  .sidebar-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 299;
    backdrop-filter: blur(3px);
  }
  .sidebar-overlay.show { display: block; }

  /* Sidebar inner sections */
  .sb-logo {
    display: flex; align-items: center; gap: 12px;
    padding: 24px 20px 18px;
    border-bottom: 1px solid var(--sidebar-border);
    flex-shrink: 0;
  }
  .sb-logo img {
    width: 40px; height: 40px;
    border-radius: 10px; object-fit: contain;
  }
  .sb-logo-text {
    font-family: 'Fredoka', sans-serif;
    font-size: 21px; font-weight: 700;
    background: linear-gradient(135deg, #3CCFCF, #FF6F61);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .sb-user {
    padding: 18px 20px;
    border-bottom: 1px solid var(--sidebar-border);
    flex-shrink: 0;
  }
  .sb-avatar {
    width: 46px; height: 46px; border-radius: 50%;
    background: linear-gradient(135deg, #3CCFCF, #FF6F61);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Fredoka', sans-serif; font-size: 19px; font-weight: 700;
    color: white; margin-bottom: 9px; cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .sb-avatar:hover { transform: scale(1.06); box-shadow: 0 4px 14px rgba(60,207,207,0.4); }
  .sb-name { font-weight: 700; font-size: 14px; color: var(--sidebar-text); margin-bottom: 2px; }
  .sb-email { font-size: 11px; color: var(--sidebar-sub); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }

  .sb-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
  .sb-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--sidebar-sub);
    padding: 10px 12px 5px;
  }
  .sb-btn {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 14px; border-radius: 11px;
    background: transparent; border: none; cursor: pointer;
    color: rgba(255,255,255,0.55); font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; width: 100%; text-align: left;
    transition: all 0.18s; position: relative;
  }
  .sb-btn:hover { background: var(--sidebar-hover); color: white; }
  .sb-btn.active { background: rgba(60,207,207,0.15); color: #3CCFCF; font-weight: 600; }
  .sb-btn.active::before {
    content: ''; position: absolute; left: 0; top: 8px; bottom: 8px;
    width: 3px; background: #3CCFCF; border-radius: 0 3px 3px 0;
  }
  .sb-badge {
    margin-left: auto;
    background: #FF6F61; color: white;
    border-radius: 20px; font-size: 10px;
    padding: 2px 7px; font-weight: 700;
  }

  .sb-footer { padding: 12px 10px; border-top: 1px solid var(--sidebar-border); flex-shrink: 0; }
  .sb-logout {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 14px; border-radius: 11px;
    background: transparent; border: none; cursor: pointer;
    color: rgba(255,111,97,0.75); font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 600; width: 100%;
    transition: all 0.18s;
  }
  .sb-logout:hover { background: rgba(255,111,97,0.12); color: #FF6F61; }

  /* ── MAIN ── */
  .main {
    flex: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    transition: margin-left 0.3s cubic-bezier(.4,0,.2,1);
    min-width: 0;
  }

  /* ── TOP BAR ── */
  .topbar {
    position: sticky; top: 0; z-index: 200;
    background: var(--topbar-bg);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--topbar-border);
    height: 60px; padding: 0 20px;
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;
  }
  .topbar-left { display: flex; align-items: center; gap: 10px; }
  .topbar-right { display: flex; align-items: center; gap: 8px; }
  .topbar-title { font-family: 'Fredoka', sans-serif; font-size: 19px; font-weight: 600; color: var(--text); }

  .icon-btn-top {
    background: var(--surface2); border: 1px solid var(--border);
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text2); transition: all 0.18s; border: none;
  }
  .icon-btn-top:hover { background: var(--teal); color: white; border-color: transparent; }

  .topbar-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, #3CCFCF, #FF6F61);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Fredoka', sans-serif; font-size: 14px; font-weight: 700;
    color: white; cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(60,207,207,0.35);
  }
  .topbar-avatar:hover { transform: scale(1.08); box-shadow: 0 4px 14px rgba(60,207,207,0.5); }

  /* ── THEME TOGGLE ── */
  .theme-toggle {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--surface2); border: 1px solid var(--border);
    cursor: pointer; color: var(--text2);
    transition: all 0.2s; flex-shrink: 0;
  }
  .theme-toggle:hover { background: var(--gold); color: white; border-color: transparent; }
  [data-theme="dark"] .theme-toggle:hover { background: var(--teal); }

  /* ── PAGE ── */
  .page { padding: 28px 28px 48px; flex: 1; }

  /* ───────────────────────────────────────────────────────
     COMMON COMPONENTS
  ─────────────────────────────────────────────────────── */
  .card {
    background: var(--surface);
    border-radius: 18px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
  }
  .card-pad { padding: 22px; }

  /* Buttons */
  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 8px; padding: 13px 24px;
    background: linear-gradient(135deg, var(--teal), var(--teal-dark));
    color: white; border: none; border-radius: 13px;
    font-family: 'Fredoka', sans-serif; font-size: 16px; font-weight: 600;
    cursor: pointer; width: 100%;
    box-shadow: 0 4px 16px rgba(60,207,207,0.3);
    transition: all 0.22s;
  }
  .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(60,207,207,0.45); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-secondary {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 7px; padding: 10px 18px;
    background: var(--surface2); color: var(--text2);
    border: 1px solid var(--border); border-radius: 11px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.18s;
  }
  .btn-secondary:hover { background: var(--teal); color: white; border-color: transparent; }

  .back-btn {
    background: var(--surface); border: 1px solid var(--border);
    width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text2); transition: all 0.18s;
    box-shadow: var(--shadow-sm);
  }
  .back-btn:hover { background: var(--teal); color: white; border-color: transparent; }

  .icon-btn {
    background: var(--surface2); border: 1px solid var(--border);
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text2); transition: all 0.18s;
  }
  .icon-btn:hover { background: var(--teal); color: white; border-color: transparent; }
  .icon-btn.del:hover { background: var(--coral); border-color: transparent; }

  /* Form */
  .form-group { margin-bottom: 16px; }
  .form-label { font-size: 12px; font-weight: 700; color: var(--text2); margin-bottom: 6px; display: block; letter-spacing: 0.3px; }
  .form-input {
    width: 100%; padding: 12px 14px;
    border: 1.5px solid var(--input-border); border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    background: var(--input-bg); color: var(--text);
    outline: none; transition: all 0.2s; box-sizing: border-box;
  }
  .form-input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(60,207,207,0.12); }
  .form-input::placeholder { color: var(--text3); }
  .form-input:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Screen header */
  .screen-header {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 22px;
  }
  .screen-header-title { font-family:'Fredoka',sans-serif; font-size:21px; font-weight:600; color:var(--text); flex:1; }
  .step-badge {
    font-size: 11px; font-weight: 700; color: var(--teal);
    background: var(--teal-soft); padding: 4px 12px; border-radius: 20px;
  }

  /* Alert */
  .alert-box {
    background: var(--coral-soft); border: 1.5px solid rgba(255,111,97,0.3);
    border-radius: 12px; padding: 12px 16px;
    display: flex; gap: 9px; align-items: flex-start;
    margin-bottom: 14px; font-size: 13px; color: var(--coral);
  }
  .success-box {
    background: #F0FFF4; border: 1.5px solid #A5D6A7;
    border-radius: 12px; padding: 12px 16px;
    display: flex; gap: 9px; align-items: center;
    margin-bottom: 14px; font-size: 13px; color: #2E7D32;
  }
  [data-theme="dark"] .success-box { background: #0D2E1A; border-color: #1B5E20; color: #69F0AE; }

  /* Section heading */
  .section-heading { font-family:'Fredoka',sans-serif; font-size:19px; font-weight:600; color:var(--text); margin-bottom:14px; }

  /* ───────────────────────────────────────────────────────
     HOME / WELCOME
  ─────────────────────────────────────────────────────── */
  .hero {
    background: var(--hero-bg);
    border-radius: 22px; padding: 40px 32px;
    color: white; position: relative; overflow: hidden; margin-bottom: 24px;
  }
  .hero::before {
    content:''; position:absolute; top:-60px; right:-60px;
    width:260px; height:260px; border-radius:50%;
    background: radial-gradient(circle, rgba(60,207,207,0.2) 0%, transparent 70%);
  }
  .hero::after {
    content:''; position:absolute; bottom:-40px; left:-40px;
    width:200px; height:200px; border-radius:50%;
    background: radial-gradient(circle, rgba(255,111,97,0.18) 0%, transparent 70%);
  }
  .hero-label { font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#3CCFCF; margin-bottom:10px; position:relative; z-index:1; }
  .hero-title { font-family:'Fredoka',sans-serif; font-size:34px; font-weight:700; line-height:1.2; margin-bottom:10px; position:relative; z-index:1; }
  .hero-sub { font-size:14px; color:rgba(255,255,255,0.65); margin-bottom:24px; position:relative; z-index:1; max-width:380px; }
  .hero-btn {
    display:inline-flex; align-items:center; gap:8px;
    padding:12px 24px; background:linear-gradient(135deg,#3CCFCF,#2AB8B8);
    color:white; border:none; border-radius:13px;
    font-family:'Fredoka',sans-serif; font-size:16px; font-weight:600;
    cursor:pointer; box-shadow:0 6px 20px rgba(60,207,207,0.4);
    transition:all 0.22s; position:relative; z-index:1;
  }
  .hero-btn:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(60,207,207,0.5); }

  .stats-row {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 22px;
  }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 18px 14px; text-align: center;
    box-shadow: var(--shadow-sm); cursor: default;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .stat-icon { width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; }
  .stat-value { font-family:'Fredoka',sans-serif; font-size:26px; font-weight:700; color:var(--text); line-height:1; margin-bottom:3px; }
  .stat-label { font-size:11px; color:var(--text3); font-weight:600; }

  .feature-row { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .feature-tile {
    background: var(--surface); border: 2px solid var(--border);
    border-radius: 16px; padding: 20px;
    transition: all 0.22s; cursor: default;
    box-shadow: var(--shadow-sm);
  }
  .feature-tile:hover { border-color: var(--teal); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(60,207,207,0.15); }
  .feature-tile-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
  .feature-tile-title { font-family:'Fredoka',sans-serif; font-size:16px; font-weight:600; color:var(--text); margin-bottom:5px; }
  .feature-tile-desc { font-size:13px; color:var(--text2); line-height:1.5; }

  /* ───────────────────────────────────────────────────────
     PROFILE / EDIT PROFILE
  ─────────────────────────────────────────────────────── */
  .profile-header {
    background: var(--hero-bg);
    border-radius: 22px; padding: 32px 28px;
    display: flex; align-items: flex-start; gap: 22px;
    margin-bottom: 22px; position: relative; overflow: hidden;
  }
  .profile-header::before {
    content:''; position:absolute; top:-50px; right:-50px;
    width:200px; height:200px; border-radius:50%;
    background: radial-gradient(circle,rgba(60,207,207,0.2) 0%,transparent 70%);
  }
  .profile-avatar-lg {
    width:76px; height:76px; border-radius:50%;
    background:linear-gradient(135deg,#3CCFCF,#FF6F61);
    display:flex; align-items:center; justify-content:center;
    font-family:'Fredoka',sans-serif; font-size:30px; font-weight:700;
    color:white; flex-shrink:0; position:relative; z-index:1;
    box-shadow:0 4px 16px rgba(0,0,0,0.25);
  }
  .profile-header-info { position:relative; z-index:1; flex:1; min-width:0; }
  .profile-header-name { font-family:'Fredoka',sans-serif; font-size:24px; font-weight:700; color:white; margin-bottom:3px; }
  .profile-header-email { font-size:13px; color:rgba(255,255,255,0.5); margin-bottom:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .profile-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 12px; background:rgba(60,207,207,0.2);
    border:1px solid rgba(60,207,207,0.35); border-radius:20px;
    font-size:11px; font-weight:700; color:#3CCFCF;
  }
  .edit-profile-btn {
    position:absolute; top:18px; right:18px; z-index:2;
    background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);
    border-radius:10px; padding:7px 14px;
    color:white; font-size:13px; font-weight:600;
    cursor:pointer; display:flex; align-items:center; gap:6px;
    transition:background 0.2s;
  }
  .edit-profile-btn:hover { background:rgba(255,255,255,0.22); }

  .profile-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:22px; }
  .profile-stat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 18px;
    display: flex; align-items: center; gap: 14px;
    box-shadow: var(--shadow-sm);
  }
  .profile-stat-icon { width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .profile-stat-value { font-family:'Fredoka',sans-serif; font-size:24px; font-weight:700; color:var(--text); line-height:1; }
  .profile-stat-label { font-size:11px; color:var(--text3); margin-top:2px; }

  .info-row {
    display:flex; justify-content:space-between; align-items:flex-start;
    padding:13px 0; border-bottom:1px solid var(--border);
  }
  .info-row:last-child { border-bottom:none; }
  .info-label { font-size:12px; color:var(--text3); font-weight:700; min-width:120px; }
  .info-value { font-size:13px; color:var(--text); text-align:right; flex:1; }

  .edit-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 18px; padding: 24px;
    box-shadow: var(--shadow-sm); margin-bottom: 18px;
  }

  /* ───────────────────────────────────────────────────────
     UPLOAD / REVIEW / PREFS
  ─────────────────────────────────────────────────────── */
  .upload-drop {
    background: var(--surface); border: 2.5px dashed var(--teal);
    border-radius: 20px; padding: 48px 24px; text-align: center;
    cursor: pointer; transition: all 0.22s; margin-bottom: 18px;
  }
  .upload-drop:hover { background: var(--teal-soft); transform: scale(1.01); }
  .upload-drop-icon { width:56px; height:56px; margin:0 auto 14px; color:var(--teal); }
  .upload-drop-title { font-family:'Fredoka',sans-serif; font-size:19px; font-weight:600; color:var(--text); margin-bottom:7px; }
  .upload-drop-sub { font-size:13px; color:var(--text2); margin-bottom:20px; }
  .upload-btns { display:flex; gap:10px; justify-content:center; }
  .upload-btn {
    display:flex; align-items:center; gap:7px;
    padding:10px 20px; background:linear-gradient(135deg,#3CCFCF,#2AB8B8);
    color:white; border:none; border-radius:11px;
    font-family:'Fredoka',sans-serif; font-weight:600; font-size:14px;
    cursor:pointer; transition:all 0.2s;
  }
  .upload-btn:hover { transform:translateY(-2px); box-shadow:0 5px 14px rgba(60,207,207,0.35); }

  .img-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; margin-bottom:18px; }
  .img-thumb { position:relative; aspect-ratio:1; border-radius:13px; overflow:hidden; background:var(--surface2); box-shadow:var(--shadow-sm); }
  .img-thumb img { width:100%; height:100%; object-fit:cover; }
  .img-remove {
    position:absolute; top:5px; right:5px;
    background:rgba(0,0,0,0.55); border:none; width:26px; height:26px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; color:white; transition:background 0.18s;
  }
  .img-remove:hover { background:rgba(255,0,0,0.75); }
  .img-add {
    aspect-ratio:1; border-radius:13px;
    background:var(--surface2); border:2px dashed var(--border);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all 0.18s;
  }
  .img-add:hover { border-color:var(--teal); background:var(--teal-soft); }

  .material-list { display:flex; flex-direction:column; gap:8px; margin-bottom:18px; }
  .material-row {
    background:var(--surface); border:1.5px solid var(--border);
    border-radius:13px; padding:12px 14px;
    display:flex; align-items:center; justify-content:space-between;
    box-shadow:var(--shadow-sm); transition:border-color 0.18s;
  }
  .material-row:hover { border-color:var(--teal); }
  .mat-left { display:flex; align-items:center; gap:11px; }
  .mat-emoji {
    width:42px; height:42px; border-radius:11px;
    background:linear-gradient(135deg,#FFE8DC,#E0F7FA);
    display:flex; align-items:center; justify-content:center; font-size:20px;
  }
  .mat-name { font-family:'Fredoka',sans-serif; font-size:15px; font-weight:600; color:var(--text); }

  .pref-section {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 18px;
    box-shadow: var(--shadow-sm); margin-bottom: 14px;
  }
  .pref-title { font-family:'Fredoka',sans-serif; font-size:15px; font-weight:600; color:var(--text); margin-bottom:11px; }
  .option-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
  .option-btn {
    padding:11px; background:var(--surface2); border:1.5px solid var(--border);
    border-radius:11px; font-family:'DM Sans',sans-serif; font-size:13px;
    color:var(--text2); cursor:pointer; text-align:center; transition:all 0.18s;
  }
  .option-btn:hover { background:var(--teal-soft); border-color:var(--teal); color:var(--teal); }
  .option-btn.sel { background:var(--teal-soft); border-color:var(--teal); color:var(--teal); font-weight:700; }
  .tools-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
  .tool-check {
    display:flex; align-items:center; gap:8px;
    padding:11px 12px; background:var(--surface2); border:1.5px solid var(--border);
    border-radius:11px; cursor:pointer; transition:all 0.18s;
  }
  .tool-check:hover { background:var(--teal-soft); border-color:var(--teal); }
  .tool-check.checked { background:var(--teal-soft); border-color:var(--teal); }
  .chk-box {
    width:19px; height:19px; border:2px solid var(--border);
    border-radius:6px; display:flex; align-items:center; justify-content:center;
    transition:all 0.18s; flex-shrink:0;
  }
  .tool-check.checked .chk-box { background:var(--teal); border-color:var(--teal); }
  .tool-label { font-size:13px; font-weight:500; color:var(--text2); }
  .tool-check.checked .tool-label { color:var(--teal); font-weight:600; }

  /* ───────────────────────────────────────────────────────
     PROCESSING
  ─────────────────────────────────────────────────────── */
  .processing-wrap {
    min-height: calc(100vh - 60px);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:40px; text-align:center;
  }
  .spinner-ring {
    width:90px; height:90px;
    border:6px solid rgba(60,207,207,0.2);
    border-top-color:#3CCFCF; border-radius:50%;
    animation:spin 0.85s linear infinite; margin-bottom:24px;
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  .processing-title { font-family:'Fredoka',sans-serif; font-size:24px; font-weight:700; color:var(--text); margin-bottom:7px; }
  .processing-sub { font-size:14px; color:var(--text2); }

  /* ───────────────────────────────────────────────────────
     CRAFT CARDS / RESULTS
  ─────────────────────────────────────────────────────── */
  .results-banner {
    background:linear-gradient(135deg,#3CCFCF,#FF6F61);
    border-radius:18px; padding:24px 26px; color:white; margin-bottom:20px;
  }
  .results-banner-title { font-family:'Fredoka',sans-serif; font-size:24px; font-weight:700; margin-bottom:3px; }
  .results-banner-sub { font-size:13px; opacity:0.85; }

  .craft-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:18px; margin-bottom:20px; }
  .craft-card {
    background:var(--surface); border-radius:18px; overflow:hidden;
    box-shadow:var(--shadow-sm); cursor:pointer;
    border:1.5px solid var(--border); transition:all 0.22s;
  }
  .craft-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-md); border-color:var(--teal); }
  .craft-emoji-bg {
    height:150px; background:linear-gradient(135deg,#FFE8DC,#E0F7FA);
    display:flex; align-items:center; justify-content:center; font-size:72px;
    position:relative;
  }
  [data-theme="dark"] .craft-emoji-bg { background:linear-gradient(135deg,#2A1A14,#0D2A2E); }
  .craft-diff-badge {
    position:absolute; top:9px; right:9px;
    background:rgba(255,255,255,0.9); padding:3px 9px; border-radius:20px;
    font-size:10px; font-weight:700; color:var(--teal);
    display:flex; align-items:center; gap:3px;
  }
  [data-theme="dark"] .craft-diff-badge { background:rgba(22,27,34,0.9); }
  .craft-body { padding:16px; }
  .craft-title { font-family:'Fredoka',sans-serif; font-size:17px; font-weight:600; color:var(--text); margin-bottom:9px; }
  .craft-meta-row { display:flex; gap:12px; margin-bottom:9px; }
  .craft-meta-item { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--text2); }
  .craft-tags { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:11px; }
  .craft-tag {
    background:var(--teal-soft); border:1px solid rgba(60,207,207,0.35);
    padding:3px 9px; border-radius:9px; font-size:11px; color:var(--teal); font-weight:500;
  }
  .craft-row-btns { display:flex; gap:8px; padding-top:9px; border-top:1px solid var(--border); }
  .craft-action-btn {
    flex:1; padding:9px; background:var(--surface2); border:1px solid var(--border);
    border-radius:9px; font-family:'Fredoka',sans-serif; font-size:13px; font-weight:600;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px;
    color:var(--text2); transition:all 0.18s;
  }
  .craft-action-btn:hover { background:var(--teal); color:white; border-color:transparent; }
  .craft-action-btn.saved { background:linear-gradient(135deg,#FF6F61,#FF8A7A); color:white; border-color:transparent; }

  /* ───────────────────────────────────────────────────────
     DETAIL
  ─────────────────────────────────────────────────────── */
  .detail-emoji-bg {
    height:200px; background:linear-gradient(135deg,#FFE8DC,#E0F7FA);
    display:flex; align-items:center; justify-content:center; font-size:110px;
    position:relative;
  }
  [data-theme="dark"] .detail-emoji-bg { background:linear-gradient(135deg,#2A1A14,#0D2A2E); }
  .detail-fab {
    position:absolute; width:44px; height:44px; border-radius:50%;
    background:rgba(255,255,255,0.9); border:none;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.12); transition:all 0.2s;
  }
  [data-theme="dark"] .detail-fab { background:rgba(22,27,34,0.9); color:var(--text); }
  .detail-fab:hover { transform:scale(1.08); }
  .detail-fab-back { top:18px; left:18px; }
  .detail-fab-back:hover { background:#3CCFCF; color:white; }
  .detail-fab-save { top:18px; right:18px; color:#FF6F61; }
  .detail-fab-save:hover, .detail-fab-save.saved { background:#FF6F61; color:white; }

  .detail-body { padding:0 20px 40px; margin-top:-24px; position:relative; z-index:1; }
  .detail-card {
    background:var(--surface); border-radius:18px; padding:20px;
    box-shadow:var(--shadow-md); border:1px solid var(--border); margin-bottom:14px;
  }
  .detail-craft-title { font-family:'Fredoka',sans-serif; font-size:24px; font-weight:700; color:var(--text); margin-bottom:11px; }
  .detail-section-title { font-family:'Fredoka',sans-serif; font-size:16px; font-weight:600; color:var(--text); margin-bottom:12px; }
  .step-row {
    display:flex; gap:12px; align-items:flex-start;
    padding:12px; background:var(--surface2); border-radius:12px;
    border-left:3px solid var(--teal); margin-bottom:8px;
  }
  .step-num {
    width:28px; height:28px; flex-shrink:0;
    background:linear-gradient(135deg,#3CCFCF,#2AB8B8);
    color:white; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-weight:700; font-size:12px;
  }
  .step-t { font-weight:600; color:var(--text); font-size:13px; margin-bottom:3px; }
  .step-d { font-size:12px; color:var(--text2); line-height:1.5; }
  .tip-row {
    display:flex; gap:9px; align-items:flex-start;
    padding:11px; background:var(--gold-soft); border-radius:11px;
    border:1px solid rgba(255,179,0,0.25); margin-bottom:7px;
  }
  [data-theme="dark"] .tip-row { border-color:rgba(255,179,0,0.15); }
  .tip-t { font-size:12px; color:var(--text2); line-height:1.5; }

  /* ───────────────────────────────────────────────────────
     SAVED / HISTORY / EMPTY
  ─────────────────────────────────────────────────────── */
  .empty-center { padding:70px 24px; text-align:center; }
  .empty-icon-wrap { width:72px; height:72px; border-radius:50%; background:var(--surface2); display:flex; align-items:center; justify-content:center; margin:0 auto 18px; }
  .empty-title { font-family:'Fredoka',sans-serif; font-size:21px; color:var(--text3); margin-bottom:7px; }
  .empty-sub { font-size:13px; color:var(--text3); margin-bottom:24px; }

  .history-entry {
    background:var(--surface); border:1px solid var(--border);
    border-radius:14px; padding:16px; margin-bottom:12px; box-shadow:var(--shadow-sm);
  }
  .history-date { font-size:11px; color:var(--text3); margin-bottom:7px; font-weight:700; letter-spacing:0.3px; }
  .history-tags { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px; }
  .history-craft-row {
    display:flex; align-items:center; gap:9px;
    padding:9px 11px; background:var(--surface2); border-radius:10px;
    cursor:pointer; transition:background 0.18s; margin-bottom:5px;
    border:1px solid var(--border);
  }
  .history-craft-row:hover { background:var(--teal-soft); border-color:var(--teal); }
  .history-craft-row:last-child { margin-bottom:0; }

  /* ───────────────────────────────────────────────────────
     AUTH
  ─────────────────────────────────────────────────────── */
  .auth-shell {
    min-height: 100vh; display: flex;
    background: var(--bg); overflow: hidden;
  }
  .auth-left {
    flex: 0 0 420px; display: none;
    align-items: center; justify-content: center;
    padding: 60px; position: relative;
    background: linear-gradient(135deg, #1A2E44, #0D1B2E);
    overflow: hidden;
  }
  @media (min-width: 1024px) { .auth-left { display: flex; } }
  .auth-left-content { position:relative; z-index:1; text-align:center; }
  .auth-left-logo { width:90px; height:90px; border-radius:22px; object-fit:contain; margin-bottom:24px; box-shadow:0 10px 28px rgba(0,0,0,0.3); }
  .auth-left-title {
    font-family:'Fredoka',sans-serif; font-size:38px; font-weight:700;
    background:linear-gradient(135deg,#3CCFCF,#FF6F61);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:10px;
  }
  .auth-left-sub { font-size:14px; color:rgba(255,255,255,0.55); line-height:1.65; max-width:280px; }

  .auth-right {
    flex:1; display:flex; align-items:center; justify-content:center;
    padding:28px 20px; overflow-y:auto;
  }
  .auth-card {
    background:var(--surface); border-radius:24px; padding:36px 32px;
    width:100%; max-width:420px;
    box-shadow:var(--shadow-lg); border:1px solid var(--border);
  }
  .auth-logo-sm { width:64px; height:64px; border-radius:16px; display:block; margin:0 auto 16px; }
  .auth-title { font-family:'Fredoka',sans-serif; font-size:26px; font-weight:700; color:var(--text); text-align:center; margin-bottom:5px; }
  .auth-sub { font-size:13px; color:var(--text2); text-align:center; margin-bottom:22px; }
  .auth-error {
    background:var(--coral-soft); border:1.5px solid rgba(255,111,97,0.3);
    border-radius:11px; padding:11px 13px; margin-bottom:13px;
    font-size:13px; color:var(--coral);
  }
  .auth-input {
    width:100%; padding:12px 14px;
    border:1.5px solid var(--input-border); border-radius:12px;
    font-family:'DM Sans',sans-serif; font-size:14px;
    background:var(--input-bg); color:var(--text);
    outline:none; transition:all 0.2s; margin-bottom:11px; box-sizing:border-box;
  }
  .auth-input:focus { border-color:var(--teal); box-shadow:0 0 0 3px rgba(60,207,207,0.1); }
  .auth-input::placeholder { color:var(--text3); }
  .auth-pass-wrap { position:relative; margin-bottom:11px; }
  .auth-pass-wrap .auth-input { margin-bottom:0; padding-right:52px; }
  .pass-toggle {
    position:absolute; right:11px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer;
    font-size:11px; font-weight:700; color:var(--teal);
    font-family:'DM Sans',sans-serif; padding:3px 6px; border-radius:5px;
  }
  .pass-toggle:hover { background:var(--teal-soft); }
  .auth-btn {
    width:100%; padding:14px;
    background:linear-gradient(135deg,#3CCFCF,#2AB8B8);
    color:white; border:none; border-radius:13px;
    font-family:'Fredoka',sans-serif; font-size:16px; font-weight:600;
    cursor:pointer; margin-top:4px; margin-bottom:15px;
    box-shadow:0 4px 16px rgba(60,207,207,0.3); transition:all 0.22s;
  }
  .auth-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(60,207,207,0.45); }
  .auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
  .auth-divider { display:flex; align-items:center; gap:9px; margin-bottom:13px; }
  .auth-divider-line { flex:1; height:1px; background:var(--border); }
  .auth-divider-text { font-size:11px; color:var(--text3); font-weight:500; white-space:nowrap; }
  .demo-box {
    background:var(--teal-soft); border:1.5px solid rgba(60,207,207,0.25);
    border-radius:13px; padding:13px; margin-bottom:16px;
  }
  .demo-box-title { font-size:10px; font-weight:700; color:var(--teal); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .demo-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 10px; background:var(--surface); border-radius:9px;
    margin-bottom:5px; cursor:pointer; border:1.5px solid var(--border);
    transition:all 0.16s;
  }
  .demo-row:last-child { margin-bottom:0; }
  .demo-row:hover { border-color:var(--teal); transform:translateX(2px); box-shadow:0 2px 8px rgba(60,207,207,0.12); }
  .demo-email { font-size:12px; font-weight:600; color:var(--text); }
  .demo-pw { font-size:11px; color:var(--text3); }
  .demo-badge { font-size:10px; background:linear-gradient(135deg,#3CCFCF,#2AB8B8); color:white; padding:2px 8px; border-radius:20px; font-weight:700; flex-shrink:0; }
  .auth-switch { text-align:center; font-size:13px; color:var(--text2); }
  .auth-switch span { color:var(--teal); font-weight:700; cursor:pointer; }
  .auth-switch span:hover { text-decoration:underline; }

  /* ───────────────────────────────────────────────────────
     ANIMATIONS
  ─────────────────────────────────────────────────────── */
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp 0.35s ease-out; }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .fade-in { animation: fadeIn 0.25s ease-out; }

  /* ───────────────────────────────────────────────────────
     RESPONSIVE
  ─────────────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .feature-row { grid-template-columns: repeat(2,1fr); }
    .craft-grid { grid-template-columns: repeat(2,1fr); }
  }
  @media (max-width: 640px) {
    .feature-row { grid-template-columns: 1fr; }
    .craft-grid { grid-template-columns: 1fr; }
    .stats-row { gap:8px; }
    .stat-value { font-size:22px; }
    .profile-grid { grid-template-columns: 1fr; }
    .profile-header { flex-direction:column; align-items:center; text-align:center; }
    .edit-profile-btn { position:static; margin-top:12px; align-self:center; }
    .page { padding:16px 14px 40px; }
    .hero { padding:28px 20px; }
    .hero-title { font-size:26px; }
    .auth-card { padding:28px 18px; }
  }
  @media (max-width: 400px) {
    .stats-row { grid-template-columns: repeat(3,1fr); }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CraftlyAI() {
  const [screen, setScreen]             = useState('login');
  const [user, setUser]                 = useState(null);
  const [userProfile, setUserProfile]   = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [theme, setTheme]               = useState(() => localStorage.getItem('craftly-theme') || 'light');

  // Craft state
  const [images, setImages]                           = useState([]);
  const [detectedMaterials, setDetectedMaterials]     = useState([]);
  const [confirmedMaterials, setConfirmedMaterials]   = useState([]);
  const [preferences, setPreferences]                 = useState({ skillLevel:'beginner', timeAvailable:'15-30', purpose:'home-decor', tools:[] });
  const [craftSuggestions, setCraftSuggestions]       = useState([]);
  const [selectedCraft, setSelectedCraft]             = useState(null);
  const [savedCrafts, setSavedCrafts]                 = useState([]);
  const [craftHistory, setCraftHistory]               = useState([]);
  const [error, setError]                             = useState(null);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('craftly-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // ── Auth: listen but ONLY navigate if user explicitly signed in ────────────
  // We track whether this is the very first call from Firebase (cached session).
  // On page load we intentionally stay on 'login' so the user can see the login page.
  // Navigation to 'welcome' only happens after a successful sign-in action.
  const firstAuthCheck = useRef(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (firstAuthCheck.current) {
        firstAuthCheck.current = false;
        // If there's a cached session, load the user data silently
        // but DON'T navigate away from login — let the user sign in again.
        if (u) {
          setUser(u);
          try {
            const snap = await getDoc(doc(db, 'users', u.uid));
            if (snap.exists()) {
              const data = snap.data();
              setUserProfile(data);
              setSavedCrafts(data.savedCrafts || []);
              setCraftHistory(data.craftHistory || []);
            }
          } catch {}
          // Stay on login page — user must click Sign In
        }
        setAuthLoading(false);
        return;
      }

      // Subsequent calls: real sign-in / sign-out events
      if (u) {
        setUser(u);
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUserProfile(data);
            setSavedCrafts(data.savedCrafts || []);
            setCraftHistory(data.craftHistory || []);
          } else {
            const profile = { name: u.email.split('@')[0], email: u.email, bio:'', savedCrafts:[], craftHistory:[], createdAt: new Date().toISOString() };
            await setDoc(doc(db, 'users', u.uid), profile);
            setUserProfile(profile);
          }
        } catch {}
        setScreen('welcome');
      } else {
        setUser(null);
        setUserProfile(null);
        setSavedCrafts([]);
        setCraftHistory([]);
        setScreen('login');
      }
    });
    return () => unsub();
  }, []); // eslint-disable-line

  // Firestore helpers
  const toggleSaveCraft = async (craft) => {
    if (!user) return;
    const isSaved = savedCrafts.some(c => c.id === craft.id);
    const ref = doc(db, 'users', user.uid);
    if (isSaved) {
      setSavedCrafts(p => p.filter(c => c.id !== craft.id));
      await updateDoc(ref, { savedCrafts: arrayRemove(craft) });
    } else {
      setSavedCrafts(p => [...p, craft]);
      await updateDoc(ref, { savedCrafts: arrayUnion(craft) });
    }
  };

  const saveCraftsToHistory = async (crafts) => {
    if (!user) return;
    const entry = { id:Date.now(), date:new Date().toLocaleDateString(), crafts, materials:confirmedMaterials.map(m=>m.name) };
    setCraftHistory(p => [entry, ...p]);
    await updateDoc(doc(db,'users',user.uid), { craftHistory: arrayUnion(entry) });
  };

  const handleLogout = async () => {
    await signOut(auth);
    setSidebarOpen(false);
    // onAuthStateChanged will set screen to 'login'
  };

  const goTo = useCallback((s) => {
    setScreen(s);
    setError(null);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const resetApp = () => {
    setImages([]); setDetectedMaterials([]); setConfirmedMaterials([]);
    setCraftSuggestions([]); setSelectedCraft(null); setError(null);
    goTo('welcome');
  };

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
    : (user?.email?.[0] || 'U').toUpperCase();

  const titles = {
    welcome:'Home', upload:'Upload Materials', review:'Review Materials',
    preferences:'Preferences', processing:'Generating…', results:'Craft Ideas',
    detail:'Craft Detail', saved:'Saved Crafts', history:'My History',
    profile:'My Profile', editProfile:'Edit Profile',
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <>
      <style>{STYLES}</style>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg)' }}>
        <div className="spinner-ring" />
      </div>
    </>
  );

  // ── Auth screens ───────────────────────────────────────────────────────────
  if (screen === 'login' || screen === 'signup') return (
    <>
      <style>{STYLES}</style>
      <AuthScreen screen={screen} setScreen={setScreen} theme={theme} toggleTheme={toggleTheme} />
    </>
  );

  // ── Sidebar nav items ──────────────────────────────────────────────────────
  const isCreate = ['upload','review','preferences','processing','results'].includes(screen);
  const navItems = [
    { key:'welcome',     icon:<Home size={17}/>,     label:'Home' },
    { key:'create',      icon:<Sparkles size={17}/>, label:'Create Craft', isCreate:true },
    { key:'saved',       icon:<Bookmark size={17}/>, label:'Saved Crafts', badge: savedCrafts.length || null },
    { key:'history',     icon:<History size={17}/>,  label:'History' },
  ];
  const accountItems = [
    { key:'profile',     icon:<User size={17}/>,     label:'My Profile' },
    { key:'editProfile', icon:<Settings size={17}/>, label:'Edit Profile' },
  ];

  // ── Main shell ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div className="shell">

        {/* Overlay — mobile only */}
        <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''} fade-in`} onClick={() => setSidebarOpen(false)} />

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sb-logo">
            <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Craftly AI" />
            <span className="sb-logo-text">Craftly AI</span>
          </div>

          <div className="sb-user">
            <div className="sb-avatar" onClick={() => goTo('profile')}>{initials}</div>
            <div className="sb-name">{userProfile?.name || 'Crafter'}</div>
            <div className="sb-email">{user?.email}</div>
          </div>

          <nav className="sb-nav">
            <div className="sb-section-label">Menu</div>
            {navItems.map(item => {
              const active = item.isCreate ? isCreate : screen === item.key;
              const target = item.isCreate ? 'upload' : item.key;
              return (
                <button key={item.key} className={`sb-btn ${active ? 'active' : ''}`} onClick={() => goTo(target)}>
                  {item.icon}
                  {item.label}
                  {item.badge ? <span className="sb-badge">{item.badge}</span> : null}
                </button>
              );
            })}

            <div className="sb-section-label" style={{ marginTop:8 }}>Account</div>
            {accountItems.map(item => (
              <button key={item.key} className={`sb-btn ${screen===item.key ? 'active' : ''}`} onClick={() => goTo(item.key)}>
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          <div className="sb-footer">
            <button className="sb-logout" onClick={handleLogout}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">
          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">
              {/* Hamburger — always visible but only opens overlay on mobile; on desktop it toggles sidebar */}
              <button className="icon-btn-top" onClick={() => setSidebarOpen(o => !o)}>
                <Menu size={20} />
              </button>
              <span className="topbar-title">{titles[screen] || 'Craftly AI'}</span>
            </div>
            <div className="topbar-right">
              <button className="theme-toggle" onClick={toggleTheme} title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}>
                {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
              </button>
              <div className="topbar-avatar" onClick={() => goTo('profile')}>{initials}</div>
            </div>
          </header>

          {/* Page content */}
          <div className="page">
            {screen === 'welcome'     && <WelcomeScreen goTo={goTo} userProfile={userProfile} savedCrafts={savedCrafts} craftHistory={craftHistory} />}
            {screen === 'upload'      && <UploadScreen images={images} setImages={setImages} goTo={goTo} setDetectedMaterials={setDetectedMaterials} error={error} setError={setError} />}
            {screen === 'review'      && <ReviewScreen detectedMaterials={detectedMaterials} confirmedMaterials={confirmedMaterials} setConfirmedMaterials={setConfirmedMaterials} goTo={goTo} error={error} />}
            {screen === 'preferences' && <PreferencesScreen preferences={preferences} setPreferences={setPreferences} confirmedMaterials={confirmedMaterials} goTo={goTo} setCraftSuggestions={setCraftSuggestions} saveCraftsToHistory={saveCraftsToHistory} />}
            {screen === 'processing'  && <ProcessingScreen />}
            {screen === 'results'     && <ResultsScreen craftSuggestions={craftSuggestions} setSelectedCraft={setSelectedCraft} goTo={goTo} toggleSaveCraft={toggleSaveCraft} savedCrafts={savedCrafts} resetApp={resetApp} />}
            {screen === 'detail'      && selectedCraft && <DetailScreen craft={selectedCraft} goTo={goTo} toggleSaveCraft={toggleSaveCraft} savedCrafts={savedCrafts} />}
            {screen === 'saved'       && <SavedScreen savedCrafts={savedCrafts} setSelectedCraft={setSelectedCraft} goTo={goTo} />}
            {screen === 'history'     && <HistoryScreen craftHistory={craftHistory} setSelectedCraft={setSelectedCraft} goTo={goTo} />}
            {screen === 'profile'     && <ProfileScreen userProfile={userProfile} user={user} savedCrafts={savedCrafts} craftHistory={craftHistory} goTo={goTo} initials={initials} />}
            {screen === 'editProfile' && <EditProfileScreen userProfile={userProfile} setUserProfile={setUserProfile} user={user} goTo={goTo} />}
          </div>
        </main>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function AuthScreen({ screen, setScreen, theme, toggleTheme }) {
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [name, setName]     = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoad]  = useState(false);
  const [showPass, setShow] = useState(false);

  const fillDemo = (acc) => { setEmail(acc.email); setPass(acc.password); setError(''); };

  // Pre-register demo accounts silently
  useEffect(() => {
    DEMO_ACCOUNTS.forEach(async acc => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, acc.email, acc.password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          name:acc.label, email:acc.email, bio:'',
          savedCrafts:[], craftHistory:[], createdAt:new Date().toISOString()
        });
        await signOut(auth);
      } catch { /* already exists */ }
    });
  }, []); // eslint-disable-line

  const handleAuth = async () => {
    if (!email || !pass) { setError('Please fill in all fields.'); return; }
    if (screen === 'signup' && pass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoad(true); setError('');
    try {
      if (screen === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: name || email.split('@')[0], email, bio:'',
          savedCrafts:[], craftHistory:[], createdAt:new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      // onAuthStateChanged will handle navigation
    } catch (e) {
      const c = e.code || '';
      if (c.includes('user-not-found') || c.includes('wrong-password') || c.includes('invalid-credential')) setError('Incorrect email or password.');
      else if (c.includes('email-already-in-use')) setError('This email is already registered. Sign in instead.');
      else if (c.includes('invalid-email')) setError('Please enter a valid email address.');
      else if (c.includes('too-many-requests')) setError('Too many attempts. Please wait and try again.');
      else setError('Something went wrong. Please try again.');
    }
    setLoad(false);
  };

  return (
    <div className="auth-shell">
      {/* Left decorative panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <img src="/logo.png" alt="Craftly AI" className="auth-left-logo" />
          <div className="auth-left-title">Craftly AI</div>
          <div className="auth-left-sub">Turn everyday waste into wonderful crafts with the power of AI.</div>
        </div>
        <div style={{ position:'absolute', top:-80, right:-80, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(60,207,207,0.18) 0%,transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,111,97,0.15) 0%,transparent 70%)' }} />
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        {/* Theme toggle on auth page */}
        <button className="theme-toggle" onClick={toggleTheme}
          style={{ position:'absolute', top:18, right:18 }}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        <div className="auth-card fade-up">
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Craftly AI" className="auth-logo-sm" />
          <div className="auth-title">{screen === 'login' ? 'Welcome Back!' : 'Join Craftly AI'}</div>
          <div className="auth-sub">{screen === 'login' ? 'Sign in to access your crafts' : 'Create an account to get started'}</div>

          {error.length > 0 && <div className="auth-error">{error}</div>}

          {screen === 'signup' && (
            <input className="auth-input" type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
          )}
          <input className="auth-input" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="auth-pass-wrap">
            <input className="auth-input" type={showPass ? 'text' : 'password'} placeholder="Password"
              value={pass} onChange={e => setPass(e.target.value)} onKeyPress={e => e.key==='Enter' && handleAuth()} />
            <button className="pass-toggle" onClick={() => setShow(p=>!p)} tabIndex={-1}>{showPass?'Hide':'Show'}</button>
          </div>

          <button className="auth-btn" onClick={handleAuth} disabled={loading}>
            {loading ? 'Please wait…' : screen === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {screen === 'login' && (
            <>
              <div className="auth-divider">
                <div className="auth-divider-line"/>
                <span className="auth-divider-text">or try a demo account</span>
                <div className="auth-divider-line"/>
              </div>
              <div className="demo-box">
                <div className="demo-box-title">Demo Accounts — click to autofill</div>
                {DEMO_ACCOUNTS.map(acc => (
                  <div key={acc.email} className="demo-row" onClick={() => fillDemo(acc)}>
                    <div>
                      <div className="demo-email">{acc.email}</div>
                      <div className="demo-pw">Password: {acc.password}</div>
                    </div>
                    <span className="demo-badge">Use</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="auth-switch">
            {screen === 'login'
              ? <>Don't have an account? <span onClick={() => { setScreen('signup'); setError(''); }}>Sign Up</span></>
              : <>Already have an account? <span onClick={() => { setScreen('login'); setError(''); }}>Sign In</span></>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME / HOME
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeScreen({ goTo, userProfile, savedCrafts, craftHistory }) {
  const name = userProfile?.name?.split(' ')[0] || 'Crafter';
  const totalCrafts = craftHistory.reduce((a, e) => a + (e.crafts?.length || 0), 0);
  return (
    <div className="fade-up">
      <div className="hero">
        <div className="hero-label">Welcome back</div>
        <div className="hero-title">Hey {name},<br/>Ready to Create?</div>
        <div className="hero-sub">Turn everyday waste into wonderful crafts with AI-powered ideas.</div>
        <button className="hero-btn" onClick={() => goTo('upload')}>
          <Sparkles size={16}/> Start Creating
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'linear-gradient(135deg,#E0F7FA,#B2EBF2)' }}>
            <Sparkles size={18} color="#3CCFCF"/>
          </div>
          <div className="stat-value">{totalCrafts}</div>
          <div className="stat-label">Crafts Made</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'linear-gradient(135deg,#FFE8DC,#FFCCBC)' }}>
            <Heart size={18} color="#FF6F61"/>
          </div>
          <div className="stat-value">{savedCrafts.length}</div>
          <div className="stat-label">Saved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'var(--gold-soft)' }}>
            <History size={18} color="#FFB300"/>
          </div>
          <div className="stat-value">{craftHistory.length}</div>
          <div className="stat-label">Sessions</div>
        </div>
      </div>

      <div className="feature-row">
        <div className="feature-tile">
          <div className="feature-tile-icon" style={{ background:'var(--teal-soft)' }}><Camera size={20} color="#3CCFCF"/></div>
          <div className="feature-tile-title">Snap & Scan</div>
          <div className="feature-tile-desc">Photograph household items and let AI detect materials.</div>
        </div>
        <div className="feature-tile">
          <div className="feature-tile-icon" style={{ background:'var(--coral-soft)' }}><Sparkles size={20} color="#FF6F61"/></div>
          <div className="feature-tile-title">AI Ideas</div>
          <div className="feature-tile-desc">Get 4 unique, step-by-step craft ideas instantly.</div>
        </div>
        <div className="feature-tile">
          <div className="feature-tile-icon" style={{ background:'var(--gold-soft)' }}><Star size={20} color="#FFB300"/></div>
          <div className="feature-tile-title">Easy Steps</div>
          <div className="feature-tile-desc">Follow clear, beginner-friendly instructions.</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────
function ProfileScreen({ userProfile, user, savedCrafts, craftHistory, goTo, initials }) {
  const totalCrafts = craftHistory.reduce((a, e) => a + (e.crafts?.length || 0), 0);
  const daysActive  = userProfile?.createdAt ? Math.floor((Date.now() - new Date(userProfile.createdAt)) / 86400000) : 0;

  return (
    <div className="fade-up">
      <div className="profile-header">
        <div className="profile-avatar-lg">{initials}</div>
        <div className="profile-header-info">
          <div className="profile-header-name">{userProfile?.name || 'Crafter'}</div>
          <div className="profile-header-email">{user?.email}</div>
          {userProfile?.bio && <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginBottom:10, lineHeight:1.5 }}>{userProfile.bio}</div>}
          <div className="profile-badge"><Star size={11}/> Active Member</div>
        </div>
        <button className="edit-profile-btn" onClick={() => goTo('editProfile')}>
          <Edit3 size={13}/> Edit
        </button>
      </div>

      <div className="profile-grid">
        {[
          { icon:<Sparkles size={20} color="#3CCFCF"/>, bg:'var(--teal-soft)',  val:totalCrafts,       label:'Total Crafts' },
          { icon:<Heart    size={20} color="#FF6F61"/>, bg:'var(--coral-soft)', val:savedCrafts.length, label:'Saved' },
          { icon:<History  size={20} color="#FFB300"/>, bg:'var(--gold-soft)',  val:craftHistory.length,label:'Sessions' },
          { icon:<Star     size={20} color="#9C27B0"/>, bg:'#F3E5F5',           val:daysActive,         label:'Days Active' },
        ].map(({ icon, bg, val, label }) => (
          <div key={label} className="profile-stat-card">
            <div className="profile-stat-icon" style={{ background:bg }}>{icon}</div>
            <div>
              <div className="profile-stat-value">{val}</div>
              <div className="profile-stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-heading">Account Details</div>
      <div className="edit-card">
        {[
          { label:'Full Name', value: userProfile?.name || '—' },
          { label:'Email', value: user?.email || '—' },
          { label:'Bio', value: userProfile?.bio || 'No bio added yet.' },
          { label:'Member Since', value: userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="info-row">
            <span className="info-label">{label}</span>
            <span className="info-value">{value}</span>
          </div>
        ))}
        <div style={{ paddingTop:16 }}>
          <button className="btn-primary" onClick={() => goTo('editProfile')}>
            <Edit3 size={15}/> Edit Profile
          </button>
        </div>
      </div>

      {savedCrafts.length > 0 && (
        <>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div className="section-heading" style={{ marginBottom:0 }}>Recent Saves</div>
            <button className="btn-secondary" onClick={() => goTo('saved')}>View All <ChevronRight size={13}/></button>
          </div>
          <div className="craft-grid" style={{ marginBottom:0 }}>
            {savedCrafts.slice(0,4).map(craft => (
              <div key={craft.id} className="craft-card">
                <div className="craft-emoji-bg" style={{ height:110, fontSize:52 }}>{craft.emoji}</div>
                <div className="craft-body" style={{ padding:'12px 14px' }}>
                  <div className="craft-title" style={{ fontSize:14, marginBottom:4 }}>{craft.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{craft.time} · {craft.difficulty}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT PROFILE
// ─────────────────────────────────────────────────────────────────────────────
function EditProfileScreen({ userProfile, setUserProfile, user, goTo }) {
  const [name, setName]     = useState(userProfile?.name || '');
  const [bio, setBio]       = useState(userProfile?.bio || '');
  const [newPass, setNP]    = useState('');
  const [confPass, setCP]   = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setOk]    = useState('');
  const [err, setErr]       = useState('');

  const saveProfile = async () => {
    if (!name.trim()) { setErr('Name cannot be empty.'); return; }
    setSaving(true); setErr(''); setOk('');
    try {
      await updateDoc(doc(db,'users',user.uid), { name:name.trim(), bio:bio.trim() });
      setUserProfile(p => ({ ...p, name:name.trim(), bio:bio.trim() }));
      setOk('Profile updated successfully!');
    } catch { setErr('Failed to save. Please try again.'); }
    setSaving(false);
  };

  const changePass = async () => {
    if (newPass.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (newPass !== confPass) { setErr('Passwords do not match.'); return; }
    setSaving(true); setErr(''); setOk('');
    try {
      await updatePassword(user, newPass);
      setOk('Password changed successfully!');
      setNP(''); setCP('');
    } catch (e) {
      setErr(e.code === 'auth/requires-recent-login' ? 'Sign out and back in before changing your password.' : 'Failed to change password.');
    }
    setSaving(false);
  };

  return (
    <div className="fade-up">
      <div className="screen-header">
        <button className="back-btn" onClick={() => goTo('profile')}><ChevronLeft size={18}/></button>
        <div className="screen-header-title">Edit Profile</div>
      </div>

      {err  && <div className="alert-box"><AlertCircle size={15}/>{err}</div>}
      {success && <div className="success-box"><CheckCircle size={15}/>{success}</div>}

      <div className="edit-card">
        <div className="section-heading" style={{ marginBottom:16 }}>Personal Info</div>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={user?.email||''} disabled/>
          <span style={{ fontSize:11, color:'var(--text3)', marginTop:4, display:'block' }}>Email cannot be changed.</span>
        </div>
        <div className="form-group" style={{ marginBottom:0 }}>
          <label className="form-label">Bio</label>
          <textarea className="form-input" rows={3} value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell us about yourself…" style={{ resize:'vertical' }}/>
        </div>
        <div style={{ marginTop:16 }}>
          <button className="btn-primary" onClick={saveProfile} disabled={saving}>
            <Save size={15}/> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="edit-card">
        <div className="section-heading" style={{ marginBottom:16 }}>Change Password</div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input className="form-input" type="password" value={newPass} onChange={e=>setNP(e.target.value)} placeholder="Min 6 characters"/>
        </div>
        <div className="form-group" style={{ marginBottom:0 }}>
          <label className="form-label">Confirm Password</label>
          <input className="form-input" type="password" value={confPass} onChange={e=>setCP(e.target.value)} placeholder="Repeat new password"/>
        </div>
        <div style={{ marginTop:16 }}>
          <button className="btn-primary" onClick={changePass} disabled={saving || !newPass}
            style={{ background:newPass ? 'linear-gradient(135deg,#FF6F61,#FF8A7A)' : undefined,
                     boxShadow:newPass ? '0 4px 16px rgba(255,111,97,0.3)' : undefined }}>
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────────────────────────────────────────
function UploadScreen({ images, setImages, goTo, setDetectedMaterials, error, setError }) {
  const fileRef   = useRef(null);
  const cameraRef = useRef(null);

  const handleFiles = (files) => {
    if (images.length + files.length > 5) { setError('Maximum 5 images allowed.'); return; }
    const arr = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        arr.push({ id: Date.now() + Math.random(), url: e.target.result, file });
        if (arr.length === files.length) setImages(p => [...p, ...arr]);
      };
      reader.readAsDataURL(file);
    });
  };

  const analyze = async () => {
    if (!images.length) { setError('Please upload at least one image.'); return; }
    setError(null);
    try {
      const all = []; const seen = new Set();
      for (const img of images) {
        const mats = await detectMaterials(img.url.split(',')[1], img.file.type);
        mats.forEach(m => { if (!seen.has(m.name.toLowerCase())) { seen.add(m.name.toLowerCase()); all.push(m); } });
      }
      if (!all.length) { setError('No materials detected. Try a clearer photo.'); return; }
      setDetectedMaterials(all);
      goTo('review');
    } catch (e) { setError('Detection error: ' + e.message); }
  };

  return (
    <div className="fade-up">
      <div className="screen-header">
        <button className="back-btn" onClick={() => goTo('welcome')}><ChevronLeft size={18}/></button>
        <div className="screen-header-title">Upload Materials</div>
        <span className="step-badge">Step 1 / 3</span>
      </div>

      {error && <div className="alert-box"><AlertCircle size={15}/>{error}</div>}

      {images.length === 0 ? (
        <div className="upload-drop" onClick={() => fileRef.current?.click()}>
          <Upload className="upload-drop-icon"/>
          <div className="upload-drop-title">Add Your Materials</div>
          <div className="upload-drop-sub">Take a photo or pick from gallery (up to 5)</div>
          <div className="upload-btns" onClick={e => e.stopPropagation()}>
            <button className="upload-btn" onClick={() => cameraRef.current?.click()}><Camera size={15}/>Camera</button>
            <button className="upload-btn" onClick={() => fileRef.current?.click()}><Upload size={15}/>Gallery</button>
          </div>
        </div>
      ) : (
        <div className="img-grid">
          {images.map(img => (
            <div key={img.id} className="img-thumb">
              <img src={img.url} alt=""/>
              <button className="img-remove" onClick={() => setImages(p => p.filter(i => i.id !== img.id))}><X size={12}/></button>
            </div>
          ))}
          {images.length < 5 && (
            <div className="img-add" onClick={() => fileRef.current?.click()}><Plus size={24} color="var(--text3)"/></div>
          )}
        </div>
      )}

      <input ref={fileRef}   type="file" accept="image/*" multiple onChange={e=>handleFiles(Array.from(e.target.files))} style={{display:'none'}}/>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={e=>handleFiles(Array.from(e.target.files))} style={{display:'none'}}/>

      <button className="btn-primary" onClick={analyze} disabled={!images.length} style={{ marginTop: images.length ? 18 : 0 }}>
        <Sparkles size={16}/> Detect Materials
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW
// ─────────────────────────────────────────────────────────────────────────────
function ReviewScreen({ detectedMaterials, confirmedMaterials, setConfirmedMaterials, goTo, error }) {
  const [newMat, setNewMat] = useState('');

  useEffect(() => {
    if (!confirmedMaterials.length) setConfirmedMaterials(detectedMaterials);
  }, [detectedMaterials]); // eslint-disable-line

  const addMat = () => {
    if (!newMat.trim()) return;
    setConfirmedMaterials(p => [...p, { name: newMat.trim().toLowerCase(), emoji:'📦' }]);
    setNewMat('');
  };

  return (
    <div className="fade-up">
      <div className="screen-header">
        <button className="back-btn" onClick={() => goTo('upload')}><ChevronLeft size={18}/></button>
        <div className="screen-header-title">Review Materials</div>
        <span className="step-badge">Step 2 / 3</span>
      </div>

      {error && <div className="alert-box"><AlertCircle size={15}/>{error}</div>}

      <div className="material-list">
        {confirmedMaterials.map((m, i) => (
          <div key={i} className="material-row">
            <div className="mat-left">
              <div className="mat-emoji">{m.emoji}</div>
              <div className="mat-name">{m.name}</div>
            </div>
            <button className="icon-btn del" onClick={() => setConfirmedMaterials(p => p.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          </div>
        ))}
      </div>

      <div className="pref-section">
        <div className="pref-title">Add More Materials</div>
        <div style={{ display:'flex', gap:8 }}>
          <input className="form-input" style={{ marginBottom:0, flex:1 }} type="text"
            placeholder="e.g. toilet paper roll" value={newMat}
            onChange={e=>setNewMat(e.target.value)} onKeyPress={e=>e.key==='Enter'&&addMat()}/>
          <button className="upload-btn" style={{ borderRadius:11, padding:'0 18px', flexShrink:0 }} onClick={addMat}><Plus size={15}/>Add</button>
        </div>
      </div>

      <button className="btn-primary" onClick={() => goTo('preferences')} disabled={!confirmedMaterials.length}>
        Continue <ChevronRight size={16}/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────
function PreferencesScreen({ preferences, setPreferences, confirmedMaterials, goTo, setCraftSuggestions, saveCraftsToHistory }) {
  const toggle = t => setPreferences(p => ({
    ...p, tools: p.tools.includes(t) ? p.tools.filter(x=>x!==t) : [...p.tools, t]
  }));

  const generate = async () => {
    goTo('processing');
    try {
      const crafts = await generateCrafts(confirmedMaterials.map(m=>m.name), preferences);
      const final = crafts.length ? crafts : generateFallbackCrafts(confirmedMaterials, preferences);
      setCraftSuggestions(final);
      await saveCraftsToHistory(final);
      setTimeout(() => goTo('results'), 1200);
    } catch {
      const fb = generateFallbackCrafts(confirmedMaterials, preferences);
      setCraftSuggestions(fb);
      await saveCraftsToHistory(fb);
      setTimeout(() => goTo('results'), 1200);
    }
  };

  return (
    <div className="fade-up">
      <div className="screen-header">
        <button className="back-btn" onClick={() => goTo('review')}><ChevronLeft size={18}/></button>
        <div className="screen-header-title">Your Preferences</div>
        <span className="step-badge">Step 3 / 3</span>
      </div>

      <div className="pref-section">
        <div className="pref-title">Skill Level</div>
        <div className="option-grid">
          {['beginner','intermediate'].map(v => (
            <button key={v} className={`option-btn${preferences.skillLevel===v?' sel':''}`}
              onClick={() => setPreferences(p=>({...p,skillLevel:v}))}>
              {v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="pref-section">
        <div className="pref-title">Time Available</div>
        <div className="option-grid">
          {[['5-10','5–10 mins'],['15-30','15–30 mins']].map(([v,l]) => (
            <button key={v} className={`option-btn${preferences.timeAvailable===v?' sel':''}`}
              onClick={() => setPreferences(p=>({...p,timeAvailable:v}))}>{l}</button>
          ))}
        </div>
      </div>

      <div className="pref-section">
        <div className="pref-title">Purpose</div>
        <div className="option-grid">
          {[['home-decor','Home Decor'],['gift','Gift'],['school','School Project'],['kids','Kids Craft']].map(([v,l]) => (
            <button key={v} className={`option-btn${preferences.purpose===v?' sel':''}`}
              onClick={() => setPreferences(p=>({...p,purpose:v}))}>{l}</button>
          ))}
        </div>
      </div>

      <div className="pref-section">
        <div className="pref-title">Available Tools</div>
        <div className="tools-grid">
          {['Scissors','Glue','Paint','Tape'].map(t => (
            <div key={t} className={`tool-check${preferences.tools.includes(t)?' checked':''}`} onClick={() => toggle(t)}>
              <div className="chk-box">{preferences.tools.includes(t) && <CheckCircle size={13} color="white"/>}</div>
              <span className="tool-label">{t}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={generate}>
        <Sparkles size={16}/> Generate Craft Ideas
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESSING
// ─────────────────────────────────────────────────────────────────────────────
function ProcessingScreen() {
  return (
    <div className="processing-wrap fade-in">
      <div className="spinner-ring"/>
      <div className="processing-title">Creating Your Crafts</div>
      <div className="processing-sub">Our AI is working its magic…</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────────────────
function ResultsScreen({ craftSuggestions, setSelectedCraft, goTo, toggleSaveCraft, savedCrafts, resetApp }) {
  return (
    <div className="fade-up">
      <div className="results-banner">
        <div className="results-banner-title">Your Craft Ideas</div>
        <div className="results-banner-sub">{craftSuggestions.length} creative projects ready!</div>
      </div>
      <div className="craft-grid">
        {craftSuggestions.map(craft => {
          const isSaved = savedCrafts.some(c => c.id === craft.id);
          return (
            <div key={craft.id} className="craft-card" onClick={() => { setSelectedCraft(craft); goTo('detail'); }}>
              <div className="craft-emoji-bg">
                {craft.emoji}
                <div className="craft-diff-badge"><Star size={10}/>{craft.difficulty}</div>
              </div>
              <div className="craft-body">
                <div className="craft-title">{craft.name}</div>
                <div className="craft-meta-row">
                  <div className="craft-meta-item"><Clock size={12} color="var(--teal)"/>{craft.time}</div>
                </div>
                <div className="craft-tags">
                  {craft.materials.slice(0,3).map((m,i) => <span key={i} className="craft-tag">{m}</span>)}
                  {craft.materials.length > 3 && <span className="craft-tag">+{craft.materials.length-3}</span>}
                </div>
                <div className="craft-row-btns">
                  <button className="craft-action-btn" onClick={e=>{e.stopPropagation();setSelectedCraft(craft);goTo('detail');}}>
                    View Steps <ChevronRight size={13}/>
                  </button>
                  <button className={`craft-action-btn${isSaved?' saved':''}`} onClick={e=>{e.stopPropagation();toggleSaveCraft(craft);}}>
                    <Heart size={13} fill={isSaved?'white':'none'}/>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button className="btn-primary" onClick={resetApp}>
        <Plus size={16}/> Create New Project
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function DetailScreen({ craft, goTo, toggleSaveCraft, savedCrafts }) {
  const isSaved = savedCrafts.some(c => c.id === craft.id);
  return (
    <div className="fade-up">
      <div className="detail-emoji-bg">
        {craft.emoji}
        <button className="detail-fab detail-fab-back" onClick={() => goTo('results')}><ChevronLeft size={20}/></button>
        <button className={`detail-fab detail-fab-save${isSaved?' saved':''}`} onClick={() => toggleSaveCraft(craft)}>
          <Heart size={18} fill={isSaved?'white':'none'}/>
        </button>
      </div>

      <div className="detail-body">
        <div className="detail-card">
          <div className="detail-craft-title">{craft.name}</div>
          <div className="craft-meta-row" style={{ marginBottom:12 }}>
            <div className="craft-meta-item"><Star size={13} color="var(--teal)"/>{craft.difficulty}</div>
            <div className="craft-meta-item"><Clock size={13} color="var(--teal)"/>{craft.time}</div>
          </div>
          <div className="craft-tags">
            {craft.materials.map((m,i) => <span key={i} className="craft-tag">{m}</span>)}
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-section-title">Step-by-Step Instructions</div>
          {craft.steps.map((step, i) => (
            <div key={i} className="step-row">
              <div className="step-num">{i+1}</div>
              <div><div className="step-t">{step.title}</div><div className="step-d">{step.description}</div></div>
            </div>
          ))}
        </div>

        {craft.tips?.length > 0 && (
          <div className="detail-card">
            <div className="detail-section-title">Pro Tips</div>
            {craft.tips.map((tip,i) => (
              <div key={i} className="tip-row">
                <Sparkles size={14} color="#FFB300" style={{ flexShrink:0 }}/>
                <div className="tip-t">{tip}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVED
// ─────────────────────────────────────────────────────────────────────────────
function SavedScreen({ savedCrafts, setSelectedCraft, goTo }) {
  if (!savedCrafts.length) return (
    <div className="empty-center fade-up">
      <div className="empty-icon-wrap"><Heart size={28} color="var(--text3)"/></div>
      <div className="empty-title">No Saved Crafts</div>
      <div className="empty-sub">Save your favourite projects to find them here.</div>
      <button className="btn-primary" style={{ maxWidth:220, margin:'0 auto' }} onClick={() => goTo('results')}>
        <Search size={15}/> Explore Crafts
      </button>
    </div>
  );
  return (
    <div className="fade-up">
      <div className="results-banner" style={{ background:'linear-gradient(135deg,#FF6F61,#FF8A7A)' }}>
        <div className="results-banner-title">Saved Crafts</div>
        <div className="results-banner-sub">{savedCrafts.length} project{savedCrafts.length!==1?'s':''} saved</div>
      </div>
      <div className="craft-grid">
        {savedCrafts.map(craft => (
          <div key={craft.id} className="craft-card" onClick={() => { setSelectedCraft(craft); goTo('detail'); }}>
            <div className="craft-emoji-bg">{craft.emoji}
              <div className="craft-diff-badge"><Star size={10}/>{craft.difficulty}</div>
            </div>
            <div className="craft-body">
              <div className="craft-title">{craft.name}</div>
              <div className="craft-meta-row"><div className="craft-meta-item"><Clock size={12} color="var(--teal)"/>{craft.time}</div></div>
              <div className="craft-tags">{craft.materials.slice(0,3).map((m,i)=><span key={i} className="craft-tag">{m}</span>)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────────────────────────────────────
function HistoryScreen({ craftHistory, setSelectedCraft, goTo }) {
  if (!craftHistory.length) return (
    <div className="empty-center fade-up">
      <div className="empty-icon-wrap"><History size={28} color="var(--text3)"/></div>
      <div className="empty-title">No History Yet</div>
      <div className="empty-sub">Your generated craft sessions will appear here.</div>
      <button className="btn-primary" style={{ maxWidth:220, margin:'0 auto' }} onClick={() => goTo('welcome')}>
        <Sparkles size={15}/> Start Creating
      </button>
    </div>
  );
  return (
    <div className="fade-up">
      {craftHistory.map(entry => (
        <div key={entry.id} className="history-entry">
          <div className="history-date">{entry.date}</div>
          <div className="history-tags">
            {entry.materials?.map((m,i) => <span key={i} className="craft-tag">{m}</span>)}
          </div>
          {entry.crafts?.map(craft => (
            <div key={craft.id} className="history-craft-row" onClick={() => { setSelectedCraft(craft); goTo('detail'); }}>
              <span style={{ fontSize:24 }}>{craft.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{craft.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{craft.time} · {craft.difficulty}</div>
              </div>
              <ChevronRight size={15} color="var(--text3)"/>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK CRAFTS
// ─────────────────────────────────────────────────────────────────────────────
function generateFallbackCrafts(materials) {
  const mats = materials.map(m => m.name);
  const ts = Date.now();
  return [
    { id:`craft-${ts}-1`, name:'Colorful Pen Holder', emoji:'✏️', difficulty:'Easy ⭐', time:'15 mins',
      materials:mats.slice(0,2), steps:[{title:'Prepare',description:'Clean and dry your container.'},{title:'Decorate',description:'Wrap with paper or paint in your favourite colour.'},{title:'Personalize',description:'Glue on buttons or ribbon.'},{title:'Fill',description:'Add your pens and pencils!'}], tips:['Use bright colours','Let paint dry fully'] },
    { id:`craft-${ts}-2`, name:'Mini Terrarium', emoji:'🌱', difficulty:'Easy ⭐', time:'20 mins',
      materials:mats.slice(0,2), steps:[{title:'Base',description:'Add small pebbles for drainage.'},{title:'Soil',description:'Fill halfway with potting soil.'},{title:'Plant',description:'Arrange small succulents.'},{title:'Decorate',description:'Add tiny pebbles or figurines.'}], tips:['Choose drought-resistant plants','Water once a week'] },
    { id:`craft-${ts}-3`, name:'Wall Art', emoji:'🎨', difficulty:'Easy ⭐', time:'25 mins',
      materials:mats, steps:[{title:'Canvas',description:'Cut cardboard to size.'},{title:'Background',description:'Paint a base colour.'},{title:'Texture',description:'Glue on paper or fabric.'},{title:'Details',description:'Add finishing touches.'}], tips:['Use complementary colours','Layer for depth'] },
    { id:`craft-${ts}-4`, name:'Gift Box', emoji:'🎁', difficulty:'Easy ⭐', time:'18 mins',
      materials:mats, steps:[{title:'Shape',description:'Fold cardboard into a box.'},{title:'Cover',description:'Wrap with decorative paper.'},{title:'Ribbon',description:'Tie a ribbon around it.'},{title:'Tag',description:'Add a message tag.'}], tips:['Double-sided tape for clean edges','Match ribbon to paper'] },
  ];
}
