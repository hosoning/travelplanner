// ═══════════════════════════════════════════════════════════════
// 旅程 PWA — app.js
// ═══════════════════════════════════════════════════════════════

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, orderBy, limit, serverTimestamp, where
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getStorage, ref as stRef, uploadBytes, getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// ── FIREBASE CONFIG ──────────────────────────────────────────
// Replace with YOUR Firebase project config
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ── INIT FIREBASE ─────────────────────────────────────────────
// Guard: only init Firebase when config has been filled in
function isFirebaseReady() {
  return !!(
    FIREBASE_CONFIG.apiKey &&
    !FIREBASE_CONFIG.apiKey.startsWith('YOUR_') &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.projectId !== 'YOUR_PROJECT_ID'
  );
}

let fbApp, db, storage;
if (isFirebaseReady()) {
  try {
    fbApp   = initializeApp(FIREBASE_CONFIG);
    db      = getFirestore(fbApp);
    storage = getStorage(fbApp);
    console.info('[Travoo] Firebase connected');
  } catch(e) { console.warn('[Firebase]', e.message); }
} else {
  console.info('[Travoo] Local mode — Firebase config not set');
}

// ── STATE ─────────────────────────────────────────────────────
const S = {
  tripCode:   localStorage.getItem('tripCode')   || null,
  memberId:   localStorage.getItem('memberId')   || null,
  memberName: localStorage.getItem('memberName') || null,
  trip:       null,
  members:    {},        // {id: {name,color}}
  expenses:   [],
  chatHistory:[],
  aiConfig:   JSON.parse(localStorage.getItem('aiConfig') || '{}'),
  tab:        'home',
  fabOpen:    false,
  unsubs:     [],
  notifTimer: null
};

// ── ITINERARY DATA ────────────────────────────────────────────
const TRIP_DATA = {
  name: '内蒙古 · 宁夏',
  subtitle: '草原 · 火山 · 沙漠',
  dates: '2026.05.22 — 05.27',
  destination: '呼和浩特 → 草原 → 乌海 → 银川',
  days: [
    {
      date:'2026-05-22', month:'5月', day:'22', weekday:'周五',
      title:'抵达呼和浩特',
      items:[
        { id:'d1-1', time:'全天', title:'婉先行抵达呼市，入住酒店，自由活动',
          transport:'打车从机场/火车站到酒店', sMin:30, sMax:50,
          lodge:'呼和浩特市区 · 酒店', notes:'', bag:'',
          apps:['didi','ctrip','maps'], type:'checkin' }
      ]
    },
    {
      date:'2026-05-23', month:'5月', day:'23', weekday:'周六',
      title:'呼和浩特 · 城市游',
      items:[
        { id:'d2-1', time:'09:30', title:'宁抵达呼和浩特，与婉汇合',
          transport:'打车从机场/火车站到酒店', sMin:30, sMax:50,
          notes:'', apps:['didi','maps'], type:'transport' },
        { id:'d2-2', time:'10:30', title:'入住酒店，放行李，稍作休整',
          transport:'', sMin:null, sMax:null,
          notes:'呼市烧麦', apps:['ctrip'], type:'rest' },
        { id:'d2-3', time:'11:30', title:'午餐',
          transport:'步行或打车', sMin:50, sMax:80,
          notes:'', apps:['dianping','maps'], type:'food' },
        { id:'d2-4', time:'13:00', title:'游览大召寺（约1.5-2小时）',
          transport:'市区打车往返', sMin:20, sMax:20,
          notes:'', apps:['didi','maps'], type:'attraction' },
        { id:'d2-5', time:'15:30', title:'逛塞上老街，吃小吃',
          transport:'步行', sMin:30, sMax:50,
          notes:'', apps:['maps','dianping'], type:'leisure' },
        { id:'d2-6', time:'18:00', title:'晚餐',
          transport:'步行或打车', sMin:80, sMax:120,
          notes:'冰煮羊或涮羊肉', apps:['dianping','didi'], type:'food' }
      ]
    },
    {
      date:'2026-05-24', month:'5月', day:'24', weekday:'周日',
      title:'辉腾锡勒草原',
      items:[
        { id:'d3-1', time:'07:45', title:'早餐',
          transport:'', sMin:null, sMax:null, notes:'', apps:[], type:'food' },
        { id:'d3-2', time:'08:30', title:'包车出发前往辉腾锡勒草原',
          transport:'包车（5座，呼市→草原，含司机）', sMin:350, sMax:400,
          bag:'放车上', notes:'', apps:['maps'], type:'transport', hi:true },
        { id:'d3-3', time:'11:00', title:'抵达辉腾锡勒草原，入住蒙古包',
          transport:'', sMin:null, sMax:null,
          lodge:'草原蒙古包', notes:'手把肉/奶茶', apps:[], type:'checkin' },
        { id:'d3-4', time:'12:00', title:'午餐',
          transport:'', sMin:80, sMax:120, notes:'', apps:['dianping'], type:'food' },
        { id:'d3-5', time:'14:00', title:'骑马体验（1-2小时）',
          transport:'马场', sMin:100, sMax:200,
          notes:'按小时计费', apps:[], type:'activity' },
        { id:'d3-6', time:'16:00', title:'草原自由活动：风车阵拍照 · 草地漫步',
          transport:'', sMin:0, sMax:0, notes:'', apps:[], type:'leisure' },
        { id:'d3-7', time:'19:00', title:'晚餐 · 篝火晚会 · 看星空',
          transport:'', sMin:100, sMax:150,
          notes:'烤羊排', apps:[], type:'food' }
      ]
    },
    {
      date:'2026-05-25', month:'5月', day:'25', weekday:'周一',
      title:'火山群 → 乌海',
      items:[
        { id:'d4-1', time:'07:00', title:'早餐 · 退房 · 行李装车',
          transport:'', sMin:null, sMax:null, bag:'放车上',
          lodge:'乌海市区（目标）', notes:'', apps:[], type:'food' },
        { id:'d4-2', time:'08:00', title:'出发前往乌兰哈达火山群',
          transport:'包车（草原→火山，约2小时）', sMin:null, sMax:null,
          notes:'', apps:['maps'], type:'transport', hi:true },
        { id:'d4-3', time:'10:00', title:'游玩3号+6号火山',
          transport:'', sMin:60, sMax:100,
          notes:'宇航服租赁60-100元', apps:['maps'], type:'attraction' },
        { id:'d4-4', time:'11:30', title:'简单午餐',
          transport:'', sMin:30, sMax:50,
          notes:'自备或附近小餐馆', apps:['dianping'], type:'food' },
        { id:'d4-5', time:'12:00', title:'出发返回呼和浩特东站',
          transport:'包车（火山→呼市东站，约2.5-3小时）', sMin:null, sMax:null,
          bag:'随身', notes:'必须准时离开', apps:['maps'], type:'transport', urgent:true, hi:true },
        { id:'d4-6', time:'14:20', title:'抵达呼和浩特东站，候车',
          transport:'', sMin:null, sMax:null, notes:'', apps:[], type:'transport' },
        { id:'d4-7', time:'14:26', title:'乘坐高铁前往乌海',
          transport:'高铁 D1179（二等座）', sMin:336.5, sMax:336.5,
          notes:'', apps:['12306'], type:'transport', hi:true },
        { id:'d4-8', time:'17:30', title:'抵达乌海站，与玉汇合',
          transport:'打车到酒店（约15分钟）', sMin:5, sMax:10,
          notes:'', apps:['didi'], type:'transport' },
        { id:'d4-9', time:'18:30', title:'入住乌海酒店',
          transport:'', sMin:80, sMax:120,
          lodge:'乌海市区 · 酒店', notes:'乌海杂鱼锅', apps:['ctrip'], type:'checkin' },
        { id:'d4-10', time:'19:30', title:'晚餐',
          transport:'', sMin:null, sMax:null, notes:'', apps:['dianping'], type:'food' }
      ]
    },
    {
      date:'2026-05-26', month:'5月', day:'26', weekday:'周二',
      title:'乌海湖 → 银川',
      items:[
        { id:'d5-1', time:'09:00', title:'早餐',
          transport:'', sMin:null, sMax:null, bag:'寄存酒店前台',
          notes:'', apps:[], type:'food' },
        { id:'d5-2', time:'10:00', title:'游玩乌海湖',
          transport:'打车往返码头（约15分钟单程）', sMin:10, sMax:15,
          notes:'', apps:['didi','maps'], type:'attraction' },
        { id:'d5-3', time:'10:30', title:'快艇 / 游船体验',
          transport:'', sMin:99, sMax:129,
          notes:'快艇129元 / 游船100元', apps:[], type:'activity' },
        { id:'d5-4', time:'12:00', title:'午餐',
          transport:'', sMin:80, sMax:120,
          notes:'黄河鲜', apps:['dianping'], type:'food' },
        { id:'d5-5', time:'13:30', title:'乌海湖沙漠区：滑沙 / 越野车 / 骑驼',
          transport:'', sMin:130, sMax:250,
          notes:'滑沙约30-50，越野车约100-200', apps:['maps'], type:'activity' },
        { id:'d5-6', time:'17:00', title:'晚餐',
          transport:'打车从景区到餐厅', sMin:60, sMax:100,
          notes:'', apps:['didi','dianping'], type:'food' },
        { id:'d5-7', time:'19:00', title:'返回乌海市区，取行李',
          transport:'', sMin:10, sMax:15, bag:'随身',
          notes:'', apps:['didi'], type:'transport' },
        { id:'d5-8', time:'21:00', title:'前往乌海站',
          transport:'打车（约15分钟）', sMin:5, sMax:10,
          notes:'提早去准备安检', apps:['didi'], type:'transport' },
        { id:'d5-9', time:'22:11', title:'乘坐高铁前往银川',
          transport:'高铁 D1067（二等座）', sMin:82, sMax:82,
          notes:'', apps:['12306'], type:'transport', hi:true },
        { id:'d5-10', time:'23:00', title:'抵达银川站，入住酒店',
          transport:'打车到酒店（约20分钟）', sMin:10, sMax:20,
          lodge:'银川市区 · 酒店', notes:'', apps:['didi','ctrip'], type:'checkin' }
      ]
    },
    {
      date:'2026-05-27', month:'5月', day:'27', weekday:'周三',
      title:'黄沙古渡 → 返程',
      items:[
        { id:'d6-1', time:'07:00', title:'早餐 · 退房 · 行李装车/寄存',
          transport:'', sMin:null, sMax:null, bag:'寄存酒店前台',
          notes:'返程安排', apps:[], type:'food' },
        { id:'d6-2', time:'08:00', title:'出发前往黄沙古渡',
          transport:'打车（约1小时）', sMin:30, sMax:50,
          notes:'', apps:['didi'], type:'transport' },
        { id:'d6-3', time:'09:00', title:'黄沙古渡游玩（骑骆驼 · 滑沙等）',
          transport:'景区通票', sMin:198, sMax:198,
          notes:'通票含20+项目，包含骑骆驼', apps:['maps'], type:'attraction' },
        { id:'d6-4', time:'11:00', title:'从黄沙古渡出发，取行李 + 送婉去机场',
          transport:'打车（约1小时）', sMin:30, sMax:40,
          bag:'随身', notes:'必须准时离开', apps:['didi'], type:'transport', urgent:true },
        { id:'d6-5', time:'12:00', title:'婉抵达银川河东机场，办理登机/午餐',
          transport:'', sMin:null, sMax:null,
          notes:'记得买午餐', apps:['ctrip'], type:'transport' },
        { id:'d6-6', time:'14:00', title:'婉航班起飞',
          transport:'', sMin:null, sMax:null, notes:'', apps:[], type:'transport' },
        { id:'d6-7', time:'14:00后', title:'可继续在银川市区活动或各自返程',
          transport:'根据各自航班安排打车', sMin:null, sMax:null,
          notes:'', apps:['didi','ctrip'], type:'leisure' }
      ]
    }
  ]
};

// ── MEMBER COLORS ─────────────────────────────────────────────
const MEMBER_COLORS = ['#007AFF','#FF3B30','#34C759','#FF9500','#5856D6','#FF2D55','#00C7BE'];

// ── APP LINKS ─────────────────────────────────────────────────
const APP_LINKS = {
  didi:     { label:'滴滴出行', scheme:'diditaxi://',     web:'https://www.didiglobal.com' },
  maps:     { label:'高德地图', scheme:'iosamap://',       web:'https://amap.com' },
  ctrip:    { label:'携程',    scheme:'ctrip://',          web:'https://m.ctrip.com' },
  dianping: { label:'大众点评', scheme:'dianping://',      web:'https://m.dianping.com' },
  '12306':  { label:'12306',   scheme:'cn.12306://',       web:'https://m.12306.cn' },
  xiaohongshu:{ label:'小红书', scheme:'xhsdiscover://',   web:'https://www.xiaohongshu.com' },
  weather:  { label:'天气',    scheme:'',                  web:'https://m.weather.com.cn' }
};

// ── SVG ICONS ─────────────────────────────────────────────────
const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.55 5.45 21 6 21H9V15H15V21H18C18.55 21 19 20.55 19 20V10M9 21V18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24"><path d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  wallet: `<svg viewBox="0 0 24 24"><path d="M22 10.5V15.5C22 19 20 21 16.5 21H7.5C4 21 2 19 2 15.5V8.5C2 5 4 3 7.5 3H16.5C20 3 22 5 22 8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M22 11H19C17.34 11 16 12.34 16 14C16 15.66 17.34 17 19 17H22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  chat: `<svg viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  settings: `<svg viewBox="0 0 24 24"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>`,
  plus: `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  send: `<svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  back: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  transport: `<svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 2C7 2 3 6 3 11v7a2 2 0 002 2h14a2 2 0 002-2v-7C21 6 17 2 12 2zM7.5 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor"/></svg>`,
  map: `<svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" width="12" height="12"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  camera: `<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>`,
  share: `<svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  copy: `<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>`,
  bell: `<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  user: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  trash: `<svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  plane: `<svg viewBox="0 0 24 24"><path d="M21 16l-9-3.5L3 14 2 11l9-7 1 3 9-3.5V16zM3 19h18" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  food: `<svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 2v3M10 2v3M14 2v3" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  ai: `<svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 015 5v3a5 5 0 01-10 0V7a5 5 0 015-5zM4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="12" cy="9" r="1.5" fill="currentColor"/></svg>`,
  check: `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
};

// ── RENDER UTILITIES ──────────────────────────────────────────
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html) e.innerHTML = html; return e; };

function memberDisplay(id) {
  if (id === S.memberId) return '你';
  return S.members[id]?.name || id;
}

function memberColor(id) { return S.members[id]?.color || '#8E8E93'; }

function today() { return new Date().toISOString().split('T')[0]; }

function fmtMoney(n) {
  if (n === null || n === undefined) return '';
  return '¥' + (Number.isInteger(n) ? n : n.toFixed(1));
}

function spendStr(item) {
  if (item.sMin === null) return '';
  if (item.sMin === item.sMax) return fmtMoney(item.sMin);
  if (item.sMin === 0 && item.sMax === 0) return '免费';
  return `${fmtMoney(item.sMin)} - ${fmtMoney(item.sMax)}`;
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
}

function svgIcon(name, size = 22) {
  const s = ICONS[name] || ICONS.plus;
  return s.replace('<svg ', `<svg width="${size}" height="${size}" `);
}

// ── NOTIFICATION SYSTEM ───────────────────────────────────────
const NOTIF_STORE = 'notifShown';

function getShownNotifs() {
  return JSON.parse(localStorage.getItem(NOTIF_STORE) || '[]');
}

function markNotifShown(id) {
  const shown = getShownNotifs();
  if (!shown.includes(id)) { shown.push(id); localStorage.setItem(NOTIF_STORE, JSON.stringify(shown)); }
}

function checkTriggerNotifications() {
  if (!S.trip) return;
  const now    = new Date();
  const todayStr = today();
  const shown  = getShownNotifs();
  const todayDay = TRIP_DATA.days.find(d => d.date === todayStr);
  if (!todayDay) return;

  todayDay.items.forEach(item => {
    if (!item.time || item.time === '全天' || item.time.includes('后')) return;
    const [h, m] = item.time.split(':').map(Number);
    const itemDt = new Date(todayStr + `T${String(h).padStart(2,'0')}:${String(m||0).padStart(2,'0')}:00`);
    const diffMin = (itemDt - now) / 60000;
    const notifId = `notif-${item.id}-30`;
    if (diffMin >= 28 && diffMin <= 32 && !shown.includes(notifId)) {
      markNotifShown(notifId);
      showNotifBanner('旅程提醒', `30分钟后：${item.title}`, getSmartTip(item));
    }
    const notifId2 = `notif-${item.id}-now`;
    if (diffMin >= -2 && diffMin <= 3 && !shown.includes(notifId2)) {
      markNotifShown(notifId2);
      showNotifBanner('现在出发', item.title, getSmartTip(item));
    }
  });
}

function getSmartTip(item) {
  const tips = {
    transport: '建议提前5分钟准备，如需打车可点击快捷打开滴滴',
    food: '附近可用大众点评查看评分和排队情况',
    attraction: '建议先查看开放时间，携程/大众点评有用户攻略',
    checkin: '入住前可用携程确认预订，拍照存好确认单',
    activity: '建议提前确认活动时间和预约情况',
    leisure: '自由活动时间，可根据天气灵活调整',
    rest: '休息时间，补充体力准备下个行程'
  };
  if (item.urgent) return '此行程时间紧张，务必准时出发！';
  if (item.transport?.includes('高铁')) return '高铁乘车需提前20分钟到站，携带身份证';
  if (item.apps?.includes('didi')) return '可打开滴滴预约用车，高峰期建议提前叫车';
  return tips[item.type] || '祝旅途愉快';
}

function showNotifBanner(title, body, sub = '') {
  const existing = document.querySelector('.notif-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.className = 'notif-banner';
  banner.innerHTML = `
    <div class="notif-hdr">
      <div class="notif-icon">${svgIcon('bell', 13)}</div>
      <span class="notif-app">Travoo</span>
      <span class="notif-time">现在</span>
    </div>
    <div class="notif-title">${title}</div>
    <div class="notif-body">${body}${sub ? '<br><span style="opacity:.7">' + sub + '</span>' : ''}</div>
  `;
  document.body.appendChild(banner);
  banner.addEventListener('click', () => dismissBanner(banner));
  setTimeout(() => dismissBanner(banner), 7000);
}

function dismissBanner(banner) {
  banner.classList.add('hide');
  setTimeout(() => banner.remove(), 300);
}

// ── FIREBASE OPS ──────────────────────────────────────────────
async function loadTrip(code) {
  if (!db) {
    // Offline: check localStorage
    try {
      const raw = localStorage.getItem('lt_' + code);
      if (raw) {
        const d = JSON.parse(raw);
        S.trip = d; S.members = d.members || {};
        return true;
      }
    } catch(e) {}
    return false;
  }
  try {
    const snap = await getDoc(doc(db, 'trips', code));
    if (!snap.exists()) return false;
    S.trip    = snap.data();
    S.members = S.trip.members || {};
    return true;
  } catch(e) {
    console.warn('[FB] loadTrip', e);
    showToast('连接失败，请检查 Firebase 配置或网络');
    return false;
  }
}
async function createTrip(code, memberName) {
  const memberId = 'u_' + Date.now();
  const color    = MEMBER_COLORS[0];
  const members  = { [memberId]: { name: memberName, color } };

  if (!db) {
    const tripData = { ...TRIP_DATA, code, creatorId: memberId, members };
    S.trip = tripData; S.members = members;
    try { localStorage.setItem('lt_' + code, JSON.stringify(tripData)); } catch(e) {}
    return { memberId, color };   // was wrongly returning `true` before
  }

  const tripData = {
    ...TRIP_DATA, code,
    createdAt: serverTimestamp(), creatorId: memberId,
    members: { [memberId]: { name: memberName, color, joinedAt: serverTimestamp() } }
  };
  await setDoc(doc(db, 'trips', code), tripData);
  // Set local state immediately so renderApp doesn't race with the listener
  S.trip = { ...TRIP_DATA, code, members }; S.members = members;
  return { memberId, color };
}

async function joinTrip(code, memberName) {
  const memberId   = 'u_' + Date.now();
  const usedColors = Object.values(S.members || {}).map(m => m.color);
  const color      = MEMBER_COLORS.find(c => !usedColors.includes(c)) || MEMBER_COLORS[0];

  // Update local state immediately regardless of Firebase
  S.members[memberId] = { name: memberName, color };
  if (S.trip) { S.trip.members = { ...S.trip.members, [memberId]: { name: memberName, color } }; }

  if (!db) {
    try { if (S.trip) localStorage.setItem('lt_' + code, JSON.stringify(S.trip)); } catch(e) {}
    return { memberId, color };
  }

  await updateDoc(doc(db, 'trips', code), {
    [`members.${memberId}`]: { name: memberName, color, joinedAt: serverTimestamp() }
  });
  return { memberId, color };
}

function subscribeTrip(code) {
  if (!db) return;
  const unsub = onSnapshot(doc(db, 'trips', code), snap => {
    if (!snap.exists()) return;
    S.trip    = snap.data();
    S.members = S.trip.members || {};
    if ($('#tab-home')?.classList.contains('on')) renderHome();
  });
  S.unsubs.push(unsub);
}

function subscribeExpenses(code) {
  if (!db) return;
  const q = query(collection(db, 'trips', code, 'expenses'), orderBy('createdAt','desc'), limit(100));
  const unsub = onSnapshot(q, snap => {
    S.expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if ($('#tab-expenses')?.classList.contains('on')) refreshExpenseList();
  });
  S.unsubs.push(unsub);
}

function subscribeChat(code) {
  if (!db) return;
  const q = query(
    collection(db, 'trips', code, 'chats', S.memberId, 'messages'),
    orderBy('ts', 'asc'), limit(60)
  );
  const unsub = onSnapshot(q, snap => {
    S.chatHistory = snap.docs.map(d => d.data());
    refreshChatMessages();
  });
  S.unsubs.push(unsub);
}

async function saveMessage(role, content) {
  if (!db || !S.tripCode || !S.memberId) return;
  try {
    await addDoc(collection(db, 'trips', S.tripCode, 'chats', S.memberId, 'messages'), {
      role, content, ts: serverTimestamp()
    });
  } catch(e) {}
}

async function addExpense(data) {
  const exp = { ...data, memberId: S.memberId, createdAt: serverTimestamp() };
  if (db && S.tripCode) {
    await addDoc(collection(db, 'trips', S.tripCode, 'expenses'), exp);
  } else {
    S.expenses.unshift({ id: 'local_' + Date.now(), ...exp });
    refreshExpenseList();
  }
}

async function deleteExpense(id) {
  if (db && S.tripCode) await deleteDoc(doc(db, 'trips', S.tripCode, 'expenses', id));
  else S.expenses = S.expenses.filter(e => e.id !== id);
  refreshExpenseList();
}

// ── AI ────────────────────────────────────────────────────────
function buildSystemPrompt() {
  const todayDay = TRIP_DATA.days.find(d => d.date === today());
  const todayStr = todayDay ? `今天 ${todayDay.weekday}，行程：${todayDay.title}` : '行程结束或未开始';
  const memberList = Object.values(S.members).map(m => m.name).join('、') || '待定';
  return `你是旅行助手AI，服务于以下行程：
行程名称：${TRIP_DATA.name}
行程日期：${TRIP_DATA.dates}
目的地：${TRIP_DATA.destination}
同行成员：${memberList}
今日状态：${todayStr}

你的职责：
1. 回答行程相关问题
2. 推荐餐厅、景点、拍照地点
3. 提供实用出行建议（网约车/高铁/天气）
4. 协助记录和计算花费
5. 提供当地文化习俗知识

回答要简洁实用，以中文回复，不使用emoji。`;
}

async function sendAIMessage(userText) {
  const cfg = S.aiConfig;
  if (!cfg.apiKey || !cfg.endpoint) throw new Error('请先在设置中配置 AI');

  const history = S.chatHistory.slice(-18).map(m => ({ role: m.role, content: m.content }));
  history.push({ role: 'user', content: userText });

  const body = {
    model:    cfg.model || 'gpt-4o-mini',
    messages: [{ role:'system', content: buildSystemPrompt() }, ...history],
    max_tokens: 800,
    temperature: 0.75
  };

  const res = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + cfg.apiKey },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`AI 错误 ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || data.output?.choices?.[0]?.message?.content || '（无回复）';
}

// ── EXPENSE SETTLEMENT ────────────────────────────────────────
function calcSettlement() {
  const memberIds = Object.keys(S.members);
  if (memberIds.length < 2) return [];
  const balances = {};
  memberIds.forEach(id => balances[id] = 0);

  S.expenses.forEach(exp => {
    const amt     = Number(exp.amount) || 0;
    const paidBy  = exp.paidBy;
    const split   = exp.splitAmong || memberIds;
    const share   = amt / split.length;
    if (balances[paidBy] !== undefined) balances[paidBy] += amt;
    split.forEach(id => { if (balances[id] !== undefined) balances[id] -= share; });
  });

  const transactions = [];
  const debtors  = memberIds.filter(id => balances[id] < -0.01).map(id => ({ id, amt: -balances[id] })).sort((a,b) => b.amt-a.amt);
  const creditors = memberIds.filter(id => balances[id] > 0.01).map(id => ({ id, amt: balances[id] })).sort((a,b) => b.amt-a.amt);

  let di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const pay = Math.min(debtors[di].amt, creditors[ci].amt);
    transactions.push({ from: debtors[di].id, to: creditors[ci].id, amount: pay });
    debtors[di].amt  -= pay;
    creditors[ci].amt -= pay;
    if (debtors[di].amt  < 0.01) di++;
    if (creditors[ci].amt < 0.01) ci++;
  }
  return transactions;
}

// ── RECEIPT AI OCR ────────────────────────────────────────────
async function recognizeReceipt(imageBase64) {
  const cfg = S.aiConfig;
  if (!cfg.apiKey || !cfg.endpoint) return null;
  try {
    const res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + cfg.apiKey },
      body: JSON.stringify({
        model: cfg.model || 'gpt-4o-mini',
        messages:[{
          role:'user',
          content:[
            { type:'text', text:'识别这张收据/账单图片，只返回JSON格式：{"amount":金额数字,"description":"消费描述","category":"food/transport/attraction/activity/other"}，不要其他文字' },
            { type:'image_url', image_url:{ url: imageBase64 } }
          ]
        }],
        max_tokens: 100
      })
    });
    const data = await res.json();
    const txt  = data.choices?.[0]?.message?.content || '';
    const match = txt.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch(e) {}
  return null;
}

// ── VIEWS ─────────────────────────────────────────────────────
function renderApp() {
  const app = document.getElementById('app');
  if (S.tripCode && S.memberId) {
    app.innerHTML = `
      <div id="view-home"   class="view"></div>
      <div id="view-itin"   class="view"></div>
      <div id="view-exp"    class="view"></div>
      <div id="view-chat"   class="view"></div>
      <div id="view-set"    class="view"></div>
      <nav class="tabs">
        <div class="tab" id="tab-home"   onclick="switchTab('home')">
          <svg viewBox="0 0 24 24">${ICONS.home.replace('<svg viewBox="0 0 24 24">','')}</svg>
          <span class="tab-lbl">今日</span>
        </div>
        <div class="tab" id="tab-itin"   onclick="switchTab('itin')">
          <svg viewBox="0 0 24 24">${ICONS.calendar.replace('<svg viewBox="0 0 24 24">','')}</svg>
          <span class="tab-lbl">行程</span>
        </div>
        <div class="tab" id="tab-expenses" onclick="switchTab('expenses')">
          <svg viewBox="0 0 24 24">${ICONS.wallet.replace('<svg viewBox="0 0 24 24">','')}</svg>
          <span class="tab-lbl">花费</span>
        </div>
        <div class="tab" id="tab-chat"   onclick="switchTab('chat')">
          <svg viewBox="0 0 24 24">${ICONS.chat.replace('<svg viewBox="0 0 24 24">','')}</svg>
          <span class="tab-lbl">助手</span>
        </div>
        <div class="tab" id="tab-set"    onclick="switchTab('set')">
          <svg viewBox="0 0 24 24">${ICONS.settings.replace('<svg viewBox="0 0 24 24">','')}</svg>
          <span class="tab-lbl">设置</span>
        </div>
      </nav>
    `;
    switchTab('home');
    subscribeTrip(S.tripCode);
    subscribeExpenses(S.tripCode);
    subscribeChat(S.tripCode);
    // Check notifications every minute
    setInterval(checkTriggerNotifications, 60000);
    checkTriggerNotifications();
  } else {
    renderOnboarding();
  }
}

window.switchTab = function(name) {
  $$('.tab').forEach(t => t.classList.remove('on'));
  $$('.view').forEach(v => v.classList.remove('active'));
  $(`#tab-${name}`)?.classList.add('on');
  $(`#view-${name === 'expenses' ? 'exp' : name}`)?.classList.add('active');
  S.tab = name;
  const renders = { home: renderHome, itin: renderItinerary, expenses: renderExpenses, chat: renderChat, set: renderSettings };
  renders[name]?.();
};

// ── ONBOARDING ────────────────────────────────────────────────
function renderOnboarding() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="view-onboarding" class="view active" style="min-height:100dvh">
      <div class="onboarding">
        <div class="ob-logo">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <path d="M26 6 L42 28 L26 46 L10 28 Z" fill="none" stroke="white" stroke-width="2.5"/>
            <circle cx="26" cy="28" r="6" fill="white" opacity=".9"/>
            <path d="M18 16 L26 6 L34 16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
	 <h1 class="ob-title">Travoo</h1>
        <p class="ob-sub">Plan, track &amp; share every journey</p>
        <div class="ob-form">
          <div class="inp-label">行程码</div>
          <input class="code-input" id="trip-code-inp" maxlength="6" placeholder="6位行程码" autocomplete="off" autocapitalize="characters" spellcheck="false">
          <div class="inp-label" style="margin-top:6px">你的名字</div>
          <input class="inp" id="member-name-inp" maxlength="20" placeholder="Your Name" autocomplete="off">
          <button class="btn btn-primary btn-full" onclick="handleJoinTrip()">
            加入行程
          </button>
          <div class="ob-divider">或</div>
          <button class="btn btn-ghost btn-full" onclick="handleCreateTrip()">
            创建新行程
          </button>
        </div>
      </div>
    </div>
  `;

  // Auto-uppercase code input
  $('#trip-code-inp').addEventListener('input', function() {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
  });
}

window.handleJoinTrip = async function() {
  const code = $('#trip-code-inp').value.trim().toUpperCase();
  const name = $('#member-name-inp').value.trim();
  if (code.length < 6) return showToast('请输入6位行程码');
  if (!name)           return showToast('请输入你的名字');

  const btn = document.querySelector('#view-onboarding .btn-primary');
  const restore = () => { if (btn) { btn.disabled = false; btn.textContent = '加入行程'; } };
  if (btn) { btn.disabled = true; btn.textContent = '连接中...'; }

  try {
    const exists = await loadTrip(code);
    if (!exists) { showToast('找不到此行程码，请检查'); restore(); return; }

    const result = await joinTrip(code, name);
    localStorage.setItem('tripCode',   code);
    localStorage.setItem('memberId',   result.memberId);
    localStorage.setItem('memberName', name);
    S.tripCode = code; S.memberId = result.memberId; S.memberName = name;
    renderApp();
  } catch(e) {
    console.error('[join]', e);
    showToast('加入失败：' + (e.message || '请重试'));
    restore();
  }
};

window.handleCreateTrip = async function() {
  const name = $('#member-name-inp').value.trim();
  if (!name) return showToast('请先输入你的名字');

  const btn = document.querySelector('#view-onboarding .btn-ghost');
  const restore = () => { if (btn) { btn.disabled = false; btn.textContent = '创建新行程'; } };
  if (btn) { btn.disabled = true; btn.textContent = '创建中...'; }

  try {
    const code   = generateCode();
    const result = await createTrip(code, name);   // now always returns {memberId, color}
    localStorage.setItem('tripCode',   code);
    localStorage.setItem('memberId',   result.memberId);
    localStorage.setItem('memberName', name);
    S.tripCode = code; S.memberId = result.memberId; S.memberName = name;
    renderApp();
    showToast(`行程码：${code}，分享给朋友`);
  } catch(e) {
    console.error('[create]', e);
    showToast('创建失败：' + (e.message || '请重试'));
    restore();
  }
};

// ── HOME VIEW ─────────────────────────────────────────────────
function renderHome() {
  const view  = $('#view-home');
  if (!view) return;
  const todayStr  = today();
  const todayDay  = TRIP_DATA.days.find(d => d.date === todayStr);
  const tripStart = new Date(TRIP_DATA.days[0].date);
  const tripEnd   = new Date(TRIP_DATA.days[TRIP_DATA.days.length-1].date);
  const now       = new Date();
  const inTrip    = now >= tripStart && now <= tripEnd;
  const memberNames = Object.values(S.members).map(m => m.id === S.memberId ? '你' : m.name);

  const recs = getHomeRecommendations(todayDay);

  view.innerHTML = `
    <div class="nav">
      <div class="nav-row">
        <div style="font-size:14px;color:var(--text-2)">${TRIP_DATA.dates}</div>
        <div class="nav-title" style="text-align:right">${TRIP_DATA.name}</div>
      </div>
    </div>
    <div class="scroller">
      ${todayDay ? `
      <div class="today-banner" style="margin-top:16px">
        <div class="today-date">${todayDay.weekday}  ·  今天</div>
        <div class="today-title">${todayDay.title}</div>
        <div class="today-sub">
          ${todayDay.items.length} 个行程项目
          ${todayDay.items.find(i => i.sMin && i.sMin > 0) ? ' · 预计花费 ¥' + todayDay.items.filter(i=>i.sMin).reduce((a,i)=>a+i.sMin,0) + '+' : ''}
        </div>
      </div>
      ` : `
      <div class="today-banner" style="margin-top:16px">
        <div class="today-date">${inTrip ? '旅途中' : (now < tripStart ? '出发倒计时' : '旅程已结束')}</div>
        <div class="today-title">${TRIP_DATA.name}</div>
        <div class="today-sub">${TRIP_DATA.dates}</div>
      </div>
      `}

      <div class="sec">
        <div class="sec-title">快捷操作</div>
        <div class="quick-grid">
          <div class="qa-btn" onclick="openApp('didi')">
            ${svgIcon('transport', 28)}
            <span class="qa-label">滴滴打车</span>
          </div>
          <div class="qa-btn" onclick="openApp('maps')">
            ${svgIcon('map', 28)}
            <span class="qa-label">高德地图</span>
          </div>
          <div class="qa-btn" onclick="openApp('dianping')">
            ${svgIcon('food', 28)}
            <span class="qa-label">大众点评</span>
          </div>
          <div class="qa-btn" onclick="openApp('ctrip')">
            ${svgIcon('plane', 28)}
            <span class="qa-label">携程</span>
          </div>
          <div class="qa-btn" onclick="openApp('12306')">
            <svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 15h16M4 19h16M8 7l4-4 4 4M12 3v12" stroke="var(--primary)" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
            <span class="qa-label">12306</span>
          </div>
          <div class="qa-btn" onclick="openApp('xiaohongshu')">
            <svg width="28" height="28" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="var(--primary)" stroke-width="1.8"/><path d="M8 12h8M12 8v8" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/></svg>
            <span class="qa-label">小红书</span>
          </div>
          <div class="qa-btn" onclick="switchTab('expenses');showAddExpenseModal()">
            ${svgIcon('camera', 28)}
            <span class="qa-label">记账</span>
          </div>
          <div class="qa-btn" onclick="switchTab('chat')">
            ${svgIcon('ai', 28)}
            <span class="qa-label">AI助手</span>
          </div>
        </div>
      </div>

      ${todayDay ? `
      <div class="sec">
        <div class="sec-title">今日行程</div>
        <div class="card">
          ${todayDay.items.slice(0,4).map(item => `
            <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-bottom:1px solid var(--border)">
              <div style="width:44px;flex-shrink:0">
                <div style="font-size:12px;font-weight:700;color:var(--text-2);text-align:center">${item.time}</div>
              </div>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:600">${item.title}</div>
                ${spendStr(item) ? `<div style="font-size:12px;color:var(--warning);margin-top:2px">${spendStr(item)}</div>` : ''}
              </div>
            </div>
          `).join('')}
          ${todayDay.items.length > 4 ? `
            <div style="padding:10px;text-align:center;font-size:13px;color:var(--primary);cursor:pointer" onclick="switchTab('itin')">
              查看全部 ${todayDay.items.length} 个项目
            </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      ${recs.length ? `
      <div class="sec">
        <div class="sec-title">智能推荐</div>
        ${recs.map(r => `
          <div class="rec-card" onclick="${r.action || ''}">
            <div class="rec-type">${r.type}</div>
            <div class="rec-title">${r.title}</div>
            <div class="rec-desc">${r.desc}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="sec">
        <div class="sec-title">同行成员</div>
        <div class="list">
          ${Object.entries(S.members).map(([id, m]) => `
            <div class="list-row" style="cursor:default">
              <div class="avatar" style="background:${m.color}">${(m.name||'?')[0]}</div>
              <span class="list-row-label">${m.name}</span>
              ${id === S.memberId ? '<span class="you-badge">你</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function getHomeRecommendations(todayDay) {
  const recs = [];
  if (!todayDay) return recs;
  const now = new Date();
  const h   = now.getHours();

  if (h >= 7 && h <= 9) {
    recs.push({ type:'早餐推荐', title:'呼市烧麦', desc:'呼和浩特特色早点，推荐德顺源或麦香村，早去不用排队。人均约25-40元。', action:"openApp('dianping')" });
  }
  if (h >= 11 && h <= 13) {
    recs.push({ type:'午餐推荐', title:'当地特色午餐', desc:'可在大众点评搜索附近评分4.5+餐厅，选择本地菜系体验最佳。', action:"openApp('dianping')" });
  }
  if (todayDay.items.some(i => i.apps?.includes('didi'))) {
    recs.push({ type:'出行建议', title:'网约车预约', desc:'行程中多处需要打车，建议提前5-10分钟在滴滴下单，高峰期等待时间较长。', action:"openApp('didi')" });
  }
  if (todayDay.items.some(i => i.type === 'attraction')) {
    recs.push({ type:'拍照打卡', title:'今日景点攻略', desc:'可在小红书搜索景点名称，查看最佳拍照角度、光线时段和热门构图技巧。', action:"openApp('xiaohongshu')" });
  }
  return recs.slice(0,3);
}

// ── ITINERARY VIEW ────────────────────────────────────────────
function renderItinerary() {
  const view = $('#view-itin');
  if (!view) return;

  view.innerHTML = `
    <div class="nav">
      <div class="nav-row">
        <div class="nav-title">${TRIP_DATA.name}</div>
        <div class="nav-btn" onclick="showTripInfoModal()" title="行程信息">
          ${svgIcon('share', 18)}
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-2);text-align:center;margin-top:4px">${TRIP_DATA.dates} · ${TRIP_DATA.destination}</div>
    </div>
    <div class="scroller" id="itin-scroll">
      <div style="height:16px"></div>
      ${TRIP_DATA.days.map(day => renderDayCard(day)).join('')}
    </div>
  `;

  // Auto-open today's day
  const todayStr = today();
  const todayCard = $(`[data-date="${todayStr}"]`);
  if (todayCard) {
    toggleDay(todayCard.closest('.day-card').querySelector('.day-hdr'));
    setTimeout(() => todayCard.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
  }
}

function renderDayCard(day) {
  const isToday = day.date === today();
  const isPast  = day.date < today();
  const spend   = day.items.filter(i => i.sMin !== null).reduce((a,i) => a + (i.sMin||0), 0);

  return `
    <div class="day-card sec" data-date="${day.date}">
      <div class="day-hdr" onclick="toggleDay(this)">
        <div class="day-badge ${isToday?'today':isPast?'past':''}">
          <span class="day-badge-mo">${day.month}</span>
          <span class="day-badge-d">${day.day}</span>
        </div>
        <div class="day-info">
          <div class="day-wkd">${day.weekday}${isToday?' · 今天':''}</div>
          <div class="day-ttl">${day.title}</div>
          <div class="day-prev">${day.items.length} 个行程${spend > 0 ? ' · 预计 ¥' + spend + '+' : ''}</div>
        </div>
        <div class="day-chev">${ICONS.chevron}</div>
      </div>
      <div class="day-items">
        ${day.items.map(item => renderActivity(item)).join('')}
      </div>
    </div>
  `;
}

function renderActivity(item) {
  const spend = spendStr(item);
  const isTransportHighlight = item.hi && item.transport;
  return `
    <div class="act ${item.urgent ? 'urgent' : ''}" onclick="showActivityDetail('${item.id}')">
      <div class="act-time-col">
        <div class="act-time">${item.time}</div>
        <div class="act-dot"></div>
      </div>
      <div class="act-body">
        <div class="act-title">${item.title}</div>
        <div class="act-chips">
          ${item.transport && !isTransportHighlight ? `<span class="act-chip">${svgIcon('transport',11)} ${item.transport}</span>` : ''}
          ${item.lodge ? `<span class="act-chip">${svgIcon('map',11)} ${item.lodge}</span>` : ''}
          ${item.bag   ? `<span class="act-chip">${svgIcon('bag',11)} ${item.bag}</span>` : ''}
        </div>
        ${isTransportHighlight ? `<div class="transport-pill">${svgIcon('transport',12)} ${item.transport}</div>` : ''}
        ${spend ? `<div class="spend">${spend}</div>` : ''}
        ${item.notes ? `<div class="act-note">${item.notes}</div>` : ''}
        ${item.urgent ? `<div class="act-note" style="background:rgba(255,59,48,.09);border-left-color:var(--danger);color:var(--danger)">必须准时离开</div>` : ''}
        ${item.apps?.length ? `
        <div class="app-btns">
          ${item.apps.map(app => APP_LINKS[app] ? `
            <div class="app-btn" onclick="event.stopPropagation();openApp('${app}')">
              ${getAppMiniIcon(app)}
              ${APP_LINKS[app].label}
            </div>
          ` : '').join('')}
        </div>` : ''}
      </div>
    </div>
  `;
}

function getAppMiniIcon(app) {
  const icons = {
    didi:     `<svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3 14H9V8h6v8z" fill="var(--primary)"/></svg>`,
    maps:     `<svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="var(--primary)"/></svg>`,
    ctrip:    `<svg width="13" height="13" viewBox="0 0 24 24"><path d="M21 16l-9-3.5L3 14 2 11l9-7 1 3 9-3.5V16z" fill="var(--primary)"/></svg>`,
    dianping: `<svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" stroke-width="2"/><path d="M8 12h8M12 8v8" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/></svg>`,
    '12306':  `<svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 15h16M4 19h16M8 7l4-4 4 4M12 3v12" stroke="var(--primary)" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  };
  return icons[app] || `<svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="var(--primary)"/></svg>`;
}

window.toggleDay = function(hdr) {
  const items = hdr.nextElementSibling;
  const chev  = hdr.querySelector('.day-chev');
  const isOpen = items.classList.contains('open');
  items.classList.toggle('open', !isOpen);
  chev.classList.toggle('open', !isOpen);
};

window.showActivityDetail = function(id) {
  const item = TRIP_DATA.days.flatMap(d => d.items).find(i => i.id === id);
  if (!item) return;
  const spend = spendStr(item);

  showModal(`
    <div class="sheet-handle"></div>
    <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px">${item.type === 'food' ? '餐饮' : item.type === 'transport' ? '交通' : item.type === 'attraction' ? '景点' : item.type === 'activity' ? '活动' : '行程'}</div>
    <div style="font-size:22px;font-weight:700;margin-bottom:16px;line-height:1.35">${item.title}</div>
    ${item.transport ? `<div style="display:flex;gap:10px;align-items:center;padding:12px;background:var(--surface-2);border-radius:12px;margin-bottom:10px"><div style="font-size:13px;color:var(--text-2)">交通方式</div><div style="flex:1;text-align:right;font-size:14px;font-weight:600">${item.transport}</div></div>` : ''}
    ${spend ? `<div style="display:flex;gap:10px;align-items:center;padding:12px;background:var(--surface-2);border-radius:12px;margin-bottom:10px"><div style="font-size:13px;color:var(--text-2)">预计花费</div><div style="flex:1;text-align:right;font-size:15px;font-weight:700;color:var(--warning)">${spend}</div></div>` : ''}
    ${item.lodge ? `<div style="display:flex;gap:10px;align-items:center;padding:12px;background:var(--surface-2);border-radius:12px;margin-bottom:10px"><div style="font-size:13px;color:var(--text-2)">住宿</div><div style="flex:1;text-align:right;font-size:14px;font-weight:600">${item.lodge}</div></div>` : ''}
    ${item.bag ? `<div style="display:flex;gap:10px;align-items:center;padding:12px;background:rgba(255,149,0,.1);border-radius:12px;margin-bottom:10px"><div style="font-size:13px;color:var(--warning)">行李</div><div style="flex:1;text-align:right;font-size:14px;font-weight:600;color:var(--warning)">${item.bag}</div></div>` : ''}
    ${item.notes ? `<div style="padding:12px;background:rgba(255,149,0,.08);border-radius:12px;border-left:3px solid var(--warning);margin-bottom:10px;font-size:14px;line-height:1.55;color:var(--text)">${item.notes}</div>` : ''}
    ${item.urgent ? `<div style="padding:12px;background:rgba(255,59,48,.1);border-radius:12px;border-left:3px solid var(--danger);margin-bottom:10px;font-size:14px;font-weight:600;color:var(--danger)">必须准时离开</div>` : ''}
    ${item.apps?.length ? `
    <div style="margin-top:8px">
      <div style="font-size:13px;color:var(--text-2);font-weight:600;margin-bottom:8px">相关应用</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${item.apps.map(app => APP_LINKS[app] ? `
          <button class="btn btn-ghost" style="flex:1;min-width:100px;padding:11px 12px;font-size:14px" onclick="openApp('${app}');closeModal()">
            ${APP_LINKS[app].label}
          </button>
        ` : '').join('')}
      </div>
    </div>` : ''}
    <div style="margin-top:12px">
      <button class="btn btn-ghost btn-full" onclick="askAIAbout('${item.title.replace(/'/g, "\\'")}');closeModal()">
        询问 AI 助手
      </button>
    </div>
  `);
};

window.showTripInfoModal = function() {
  showModal(`
    <div class="sheet-handle"></div>
    <div style="font-size:22px;font-weight:700;margin-bottom:4px">${TRIP_DATA.name}</div>
    <div style="font-size:14px;color:var(--text-2);margin-bottom:20px">${TRIP_DATA.dates}</div>
    <div class="sec-title">行程码</div>
    <div class="code-display" style="margin-bottom:16px">${S.tripCode}</div>
    <button class="btn btn-primary btn-full" onclick="copyTripCode()" style="margin-bottom:10px">
      ${svgIcon('copy',18)} 复制行程码
    </button>
    <button class="btn btn-ghost btn-full" onclick="shareTripCode()">
      ${svgIcon('share',18)} 分享
    </button>
    <div style="margin-top:16px;font-size:13px;color:var(--text-2);text-align:center;line-height:1.6">
      将行程码分享给朋友，他们输入后即可加入行程<br>查看行程、记录花费、使用 AI 助手
    </div>
  `);
};

window.copyTripCode = function() {
  navigator.clipboard?.writeText(S.tripCode).then(() => showToast('行程码已复制'));
};

window.shareTripCode = function() {
  if (navigator.share) {
    navigator.share({ title: '旅程 - ' + TRIP_DATA.name, text: `用行程码 ${S.tripCode} 加入我们的旅行`, url: window.location.href });
  } else { copyTripCode(); }
};

// ── EXPENSES VIEW ─────────────────────────────────────────────
function renderExpenses() {
  const view = $('#view-exp');
  if (!view) return;
  view.innerHTML = `
    <div class="nav">
      <div class="nav-row">
        <div class="nav-title">花费记录</div>
        <div class="nav-btn" onclick="showAddExpenseModal()">${svgIcon('plus',18)}</div>
      </div>
    </div>
    <div class="scroller" id="exp-scroll">
      <div style="height:16px"></div>
      <div class="sec">
        <div id="exp-summary"></div>
        <div class="pill-tabs" style="margin-bottom:16px">
          <div class="pill-tab on" onclick="switchExpTab('list',this)">明细</div>
          <div class="pill-tab" onclick="switchExpTab('settle',this)">结算</div>
        </div>
        <div id="exp-list-pane">
          <div id="exp-list" class="list"></div>
        </div>
        <div id="exp-settle-pane" style="display:none">
          <div id="exp-settle" class="list"></div>
        </div>
      </div>
    </div>
    <button class="fab" onclick="showAddExpenseModal()">${svgIcon('plus',24)}</button>
  `;
  refreshExpenseList();
}

window.switchExpTab = function(tab, el) {
  $$('.pill-tab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  $('#exp-list-pane').style.display   = tab === 'list'   ? 'block' : 'none';
  $('#exp-settle-pane').style.display = tab === 'settle' ? 'block' : 'none';
  if (tab === 'settle') renderSettlement();
};

function refreshExpenseList() {
  const summary = $('#exp-summary');
  const list    = $('#exp-list');
  if (!summary || !list) return;

  const total  = S.expenses.reduce((a,e) => a + (Number(e.amount)||0), 0);
  const myPaid = S.expenses.filter(e => e.memberId === S.memberId).reduce((a,e) => a + (Number(e.amount)||0), 0);
  const count  = S.expenses.length;

  summary.innerHTML = `
    <div class="exp-summary" style="margin-bottom:16px">
      <div class="exp-stat">
        <div class="exp-stat-lbl">总花费</div>
        <div class="exp-stat-val" style="color:var(--danger)">¥${total.toFixed(0)}</div>
      </div>
      <div class="exp-stat">
        <div class="exp-stat-lbl">我付款</div>
        <div class="exp-stat-val" style="color:var(--warning)">¥${myPaid.toFixed(0)}</div>
      </div>
      <div class="exp-stat">
        <div class="exp-stat-lbl">笔数</div>
        <div class="exp-stat-val">${count}</div>
      </div>
    </div>
  `;

  if (S.expenses.length === 0) {
    list.innerHTML = `<div class="empty">${svgIcon('wallet',60)}<div class="empty-ttl">暂无记录</div><div class="empty-sub">点击右下角添加花费</div></div>`;
    return;
  }

  const catColors = { food:'#FF9500', transport:'#007AFF', attraction:'#34C759', activity:'#5856D6', other:'#8E8E93' };
  const catLabels = { food:'餐饮', transport:'交通', attraction:'景点', activity:'活动', other:'其他' };

  list.innerHTML = S.expenses.map(exp => `
    <div class="exp-item" onclick="showExpenseDetail('${exp.id}')">
      <div class="exp-icon" style="background:${catColors[exp.category]||catColors.other}">
        ${svgIcon(exp.category === 'food' ? 'food' : exp.category === 'transport' ? 'transport' : exp.category === 'attraction' ? 'map' : 'wallet', 20)}
      </div>
      <div class="exp-details">
        <div class="exp-name">${exp.description || '消费'}</div>
        <div class="exp-sub">${memberDisplay(exp.paidBy)} · ${catLabels[exp.category]||'其他'} · ${exp.date || '今日'}</div>
      </div>
      <div class="exp-amt" style="color:${catColors[exp.category]||catColors.other}">¥${Number(exp.amount).toFixed(0)}</div>
    </div>
  `).join('');
}

function renderSettlement() {
  const settle = $('#exp-settle');
  if (!settle) return;
  const txns = calcSettlement();
  if (txns.length === 0) {
    settle.innerHTML = `<div class="empty">${svgIcon('check',60)}<div class="empty-ttl">已结清</div><div class="empty-sub">没有待结算款项</div></div>`;
    return;
  }
  settle.innerHTML = txns.map(t => `
    <div class="settle-row">
      <div>
        <div class="settle-from">${memberDisplay(t.from)}</div>
        <div class="settle-to">转给 ${memberDisplay(t.to)}</div>
      </div>
      <div class="settle-amt">¥${t.amount.toFixed(2)}</div>
    </div>
  `).join('');
}

window.showExpenseDetail = function(id) {
  const exp = S.expenses.find(e => e.id === id);
  if (!exp) return;
  const splitNames = (exp.splitAmong || Object.keys(S.members)).map(id => memberDisplay(id)).join('、');
  showModal(`
    <div class="sheet-handle"></div>
    <div style="font-size:22px;font-weight:700;margin-bottom:4px">${exp.description || '消费'}</div>
    <div style="font-size:36px;font-weight:800;color:var(--danger);margin:12px 0">¥${Number(exp.amount).toFixed(2)}</div>
    <div class="list" style="margin-bottom:16px">
      <div class="list-row" style="cursor:default"><span class="list-row-label">付款人</span><span class="list-row-value">${memberDisplay(exp.paidBy)}</span></div>
      <div class="list-row" style="cursor:default"><span class="list-row-label">分摊</span><span class="list-row-value">${splitNames}</span></div>
      <div class="list-row" style="cursor:default"><span class="list-row-label">日期</span><span class="list-row-value">${exp.date || '今日'}</span></div>
      ${exp.category ? `<div class="list-row" style="cursor:default"><span class="list-row-label">分类</span><span class="list-row-value">${exp.category}</span></div>` : ''}
    </div>
    <button class="btn btn-danger btn-full" onclick="deleteExpense('${id}');closeModal()">
      ${svgIcon('trash',18)} 删除记录
    </button>
  `);
};

window.showAddExpenseModal = function(prefill = {}) {
  const memberOptions = Object.entries(S.members).map(([id, m]) => `<option value="${id}" ${id === S.memberId ? 'selected' : ''}>${m.name}${id === S.memberId ? ' (你)' : ''}</option>`).join('');
  const memberCheckboxes = Object.entries(S.members).map(([id, m]) => `
    <label style="display:flex;align-items:center;gap:8px;padding:8px 0">
      <input type="checkbox" id="split-${id}" checked style="width:18px;height:18px;border-radius:4px">
      <div class="avatar" style="width:28px;height:28px;font-size:11px;background:${m.color}">${(m.name||'?')[0]}</div>
      ${m.name}${id === S.memberId ? ' (你)' : ''}
    </label>
  `).join('');

  showModal(`
    <div class="sheet-handle"></div>
    <div style="font-size:20px;font-weight:700;margin-bottom:16px">记录花费</div>
    <div id="receipt-preview"></div>
    <button class="btn btn-ghost btn-full" style="margin-bottom:14px" onclick="captureReceipt()">
      ${svgIcon('camera',18)} 拍照识别账单（AI）
    </button>
    <div class="inp-label">金额</div>
    <input class="inp" id="exp-amt-inp" type="number" placeholder="0.00" value="${prefill.amount||''}" style="margin-bottom:12px;font-size:22px;font-weight:700">
    <div class="inp-label">描述</div>
    <input class="inp" id="exp-desc-inp" placeholder="例：午餐、打车费、门票" value="${prefill.description||''}" style="margin-bottom:12px">
    <div class="inp-label">分类</div>
    <div class="chip-group" style="margin-bottom:12px" id="cat-group">
      ${['food','transport','attraction','activity','other'].map((c,i) =>
        `<div class="chip ${i===0?'on':''}" onclick="selectCat(this,'${c}')" data-cat="${c}">${{food:'餐饮',transport:'交通',attraction:'景点',activity:'活动',other:'其他'}[c]}</div>`
      ).join('')}
    </div>
    <div class="inp-label">付款人</div>
    <select class="inp" id="exp-payer-inp" style="margin-bottom:12px">${memberOptions}</select>
    <div class="inp-label">分摊成员</div>
    <div style="margin-bottom:16px">${memberCheckboxes}</div>
    <button class="btn btn-primary btn-full" onclick="submitExpense()">
      保存记录
    </button>
  `);
};

window.selectCat = function(el, cat) {
  $$('#cat-group .chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
};

window.captureReceipt = function() {
  const inp = document.createElement('input');
  inp.type    = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
  inp.onchange = async () => {
    const file = inp.files[0];
    if (!file) return;
    showToast('AI 识别中...', false);
    const reader = new FileReader();
    reader.onload = async e => {
      const base64 = e.target.result;
      $('#receipt-preview').innerHTML = `<img src="${base64}" style="width:100%;border-radius:12px;margin-bottom:12px;max-height:200px;object-fit:cover">`;
      const result = await recognizeReceipt(base64);
      if (result) {
        if (result.amount) $('#exp-amt-inp').value = result.amount;
        if (result.description) $('#exp-desc-inp').value = result.description;
        if (result.category) {
          $$('#cat-group .chip').forEach(c => { c.classList.toggle('on', c.dataset.cat === result.category); });
        }
        showToast('识别成功，请确认信息');
      } else { showToast('识别失败，请手动填写'); }
    };
    reader.readAsDataURL(file);
  };
  inp.click();
};

window.submitExpense = function() {
  const amount  = parseFloat($('#exp-amt-inp').value);
  const desc    = $('#exp-desc-inp').value.trim();
  const cat     = $('#cat-group .chip.on')?.dataset.cat || 'other';
  const paidBy  = $('#exp-payer-inp').value;
  const split   = Object.keys(S.members).filter(id => $(`#split-${id}`)?.checked);
  if (!amount || amount <= 0) return showToast('请输入正确金额');
  addExpense({ amount, description: desc || '消费', category: cat, paidBy, splitAmong: split, date: today() });
  closeModal();
  showToast('已记录');
};

// ── CHAT VIEW ─────────────────────────────────────────────────
function renderChat() {
  const view = $('#view-chat');
  if (!view) return;
  const hasConfig = S.aiConfig.apiKey && S.aiConfig.endpoint;
  const suggestions = ['今天有什么推荐餐厅', '附近怎么打车', '景点拍照技巧', '今日行程总结'];

  view.innerHTML = `
    <div class="nav">
      <div class="nav-row">
        <div class="nav-title">AI 旅行助手</div>
        <div class="nav-btn" onclick="showAIConfigModal()">${svgIcon('settings',18)}</div>
      </div>
    </div>
    ${!hasConfig ? `
    <div style="margin:20px;padding:16px;background:rgba(255,149,0,.1);border:1px solid rgba(255,149,0,.3);border-radius:var(--r)">
      <div style="font-size:14px;font-weight:600;color:var(--warning);margin-bottom:4px">需要配置 AI</div>
      <div style="font-size:13px;color:var(--text-2);margin-bottom:12px">请先设置 AI 服务端点和密钥</div>
      <button class="btn btn-ghost btn-full" onclick="showAIConfigModal()" style="padding:10px">配置 AI</button>
    </div>
    ` : ''}
    <div class="chat-body" id="chat-body">
      ${S.chatHistory.length === 0 ? `
      <div style="text-align:center;padding:30px 0">
        <div style="width:60px;height:60px;background:var(--primary-dim);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
          ${svgIcon('chat',28)}
        </div>
        <div style="font-size:16px;font-weight:600;margin-bottom:6px">旅行助手</div>
        <div style="font-size:13px;color:var(--text-2);line-height:1.6">可以问我餐厅推荐、景点攻略<br>打车方式、花费分析等任何问题</div>
      </div>
      ` : S.chatHistory.map(m => renderChatMsg(m)).join('')}
    </div>
    <div class="chat-suggest" id="chat-suggest">
      ${suggestions.map(s => `<div class="suggest-pill" onclick="sendSuggestion('${s}')">${s}</div>`).join('')}
    </div>
    <div class="chat-bar">
      <textarea class="chat-inp" id="chat-inp" rows="1" placeholder="问我任何旅行问题..." 
        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendChatMessage()}"
        oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
      <button class="chat-send" id="chat-send-btn" onclick="sendChatMessage()">${svgIcon('send',18)}</button>
    </div>
  `;

  scrollChatBottom();
}

function renderChatMsg(m) {
  const isUser = m.role === 'user';
  const time   = m.ts?.toDate ? m.ts.toDate().toLocaleTimeString('zh', {hour:'2-digit',minute:'2-digit'}) : '';
  return `
    <div class="msg ${isUser ? 'msg-user' : 'msg-ai'}">
      <div class="msg-bubble">${m.content.replace(/\n/g,'<br>')}</div>
      ${time ? `<div class="msg-meta">${time}</div>` : ''}
    </div>
  `;
}

function refreshChatMessages() {
  const body = $('#chat-body');
  if (!body) return;
  body.innerHTML = S.chatHistory.map(m => renderChatMsg(m)).join('');
  scrollChatBottom();
}

function scrollChatBottom() {
  const body = $('#chat-body');
  if (body) setTimeout(() => body.scrollTop = body.scrollHeight, 50);
}

window.sendSuggestion = function(text) {
  const inp = $('#chat-inp');
  if (inp) { inp.value = text; sendChatMessage(); }
};

window.askAIAbout = function(title) {
  switchTab('chat');
  setTimeout(() => {
    const inp = $('#chat-inp');
    if (inp) { inp.value = `关于"${title}"，给我一些建议和注意事项`; sendChatMessage(); }
  }, 300);
};

window.sendChatMessage = async function() {
  const inp  = $('#chat-inp');
  const btn  = $('#chat-send-btn');
  const body = $('#chat-body');
  if (!inp || !body) return;
  const text = inp.value.trim();
  if (!text) return;

  inp.value = ''; inp.style.height = 'auto';
  if (btn) btn.disabled = true;

  // Add user message to UI
  const userMsg = { role:'user', content: text, ts: new Date() };
  body.insertAdjacentHTML('beforeend', renderChatMsg(userMsg));
  scrollChatBottom();
  await saveMessage('user', text);

  // Show typing
  const typingEl = document.createElement('div');
  typingEl.className = 'typing';
  typingEl.innerHTML = `<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  body.appendChild(typingEl);
  scrollChatBottom();

  try {
    const reply = await sendAIMessage(text);
    typingEl.remove();
    const aiMsg = { role:'assistant', content: reply, ts: new Date() };
    body.insertAdjacentHTML('beforeend', renderChatMsg(aiMsg));
    await saveMessage('assistant', reply);
    scrollChatBottom();
  } catch(e) {
    typingEl.remove();
    body.insertAdjacentHTML('beforeend', `
      <div class="msg msg-ai">
        <div class="msg-bubble" style="color:var(--danger)">${e.message}</div>
      </div>
    `);
    scrollChatBottom();
  }

  if (btn) btn.disabled = false;
};

window.showAIConfigModal = function() {
  const cfg = S.aiConfig;
  showModal(`
    <div class="sheet-handle"></div>
    <div style="font-size:20px;font-weight:700;margin-bottom:16px">AI 配置</div>

    <div class="inp-label">服务商 / 预设</div>
    <div class="chip-group" style="margin-bottom:14px">
      <div class="chip" onclick="presetAI('openai',this)">OpenAI</div>
      <div class="chip" onclick="presetAI('poe',this)">Poe</div>
      <div class="chip" onclick="presetAI('custom',this)">自定义</div>
    </div>

    <div class="inp-label">API 端点</div>
    <input class="inp" id="ai-ep" value="${cfg.endpoint||''}" placeholder="https://api.openai.com/v1/chat/completions" style="margin-bottom:12px">

    <div class="inp-label">API Key</div>
    <input class="inp" id="ai-key" type="password" value="${cfg.apiKey||''}" placeholder="sk-..." style="margin-bottom:12px">

    <div class="inp-label">模型</div>
    <input class="inp" id="ai-model" value="${cfg.model||'gpt-4o-mini'}" placeholder="gpt-4o-mini" style="margin-bottom:16px">

    <button class="btn btn-primary btn-full" onclick="saveAIConfig()">保存配置</button>
    ${cfg.apiKey ? `<button class="btn btn-ghost btn-full" style="margin-top:8px" onclick="clearAIConfig()">清除配置</button>` : ''}

    <div style="margin-top:14px;font-size:12px;color:var(--text-3);line-height:1.6;text-align:center">
      配置信息仅存储在本设备，不会上传到云端
    </div>
  `);
};

window.presetAI = function(preset, el) {
  $$('#ai-ep, #ai-key, #ai-model').forEach(i => i.value = '');
  if (preset === 'openai') {
    $('#ai-ep').value = 'https://api.openai.com/v1/chat/completions';
    $('#ai-model').value = 'gpt-4o-mini';
  } else if (preset === 'poe') {
    $('#ai-ep').value = 'https://api.poe.com/bot/chat_completions';
    $('#ai-model').value = 'GPT-4o-mini';
  }
};

window.saveAIConfig = function() {
  const cfg = {
    endpoint: $('#ai-ep').value.trim(),
    apiKey:   $('#ai-key').value.trim(),
    model:    $('#ai-model').value.trim() || 'gpt-4o-mini'
  };
  if (!cfg.endpoint || !cfg.apiKey) return showToast('请填写端点和 Key');
  S.aiConfig = cfg;
  // Remember per-provider config
  const saved = JSON.parse(localStorage.getItem('aiConfigs') || '{}');
  const provider = cfg.endpoint.includes('poe') ? 'poe' : cfg.endpoint.includes('openai') ? 'openai' : 'custom';
  saved[provider] = cfg;
  localStorage.setItem('aiConfigs', JSON.stringify(saved));
  localStorage.setItem('aiConfig',  JSON.stringify(cfg));
  closeModal();
  showToast('AI 配置已保存');
  renderChat();
};

window.clearAIConfig = function() {
  S.aiConfig = {};
  localStorage.removeItem('aiConfig');
  closeModal();
  renderChat();
};

// ── SETTINGS VIEW ─────────────────────────────────────────────
function renderSettings() {
  const view = $('#view-set');
  if (!view) return;
  view.innerHTML = `
    <div class="nav">
      <div class="nav-row">
        <div class="nav-title">设置</div>
      </div>
    </div>
    <div class="scroller">
      <div style="height:16px"></div>

      <div class="sec">
        <div class="sec-title">行程码</div>
        <div class="code-display">${S.tripCode || '------'}</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-ghost" style="flex:1" onclick="copyTripCode()">${svgIcon('copy',16)} 复制</button>
          <button class="btn btn-ghost" style="flex:1" onclick="shareTripCode()">${svgIcon('share',16)} 分享</button>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">成员</div>
        <div class="list" id="members-list">
          ${Object.entries(S.members).map(([id, m]) => `
            <div class="list-row">
              <div class="avatar" style="background:${m.color}">${(m.name||'?')[0]}</div>
              <span class="list-row-label">${m.name}</span>
              ${id === S.memberId ? '<span class="you-badge">你</span>' : ''}
            </div>
          `).join('')}
        </div>
        <button class="btn btn-ghost btn-full" style="margin-top:10px" onclick="showAddMemberModal()">
          ${svgIcon('plus',16)} 添加成员
        </button>
      </div>

      <div class="sec">
        <div class="sec-title">AI 助手</div>
        <div class="list">
          <div class="list-row" onclick="showAIConfigModal()">
            <span class="list-row-label">API 配置</span>
            <span class="list-row-value">${S.aiConfig.model || '未配置'}</span>
            <span class="list-row-chevron">${ICONS.chevron}</span>
          </div>
          <div class="list-row" onclick="clearChatHistory()">
            <span class="list-row-label">清除对话记录</span>
            <span class="list-row-chevron">${ICONS.chevron}</span>
          </div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">通知</div>
        <div class="list">
          <div class="list-row" style="cursor:default">
            <span class="list-row-label">行程提醒</span>
            <label class="toggle">
              <input type="checkbox" id="notif-toggle" ${localStorage.getItem('notifsEnabled') !== 'false' ? 'checked' : ''} onchange="toggleNotifs(this.checked)">
              <span class="t-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">关于</div>
        <div class="list">
          <div class="list-row" style="cursor:default">
            <span class="list-row-label">版本</span>
            <span class="list-row-value">1.0.0</span>
          </div>
          <div class="list-row" onclick="showToast('Travoo — 内蒙古 · 宁夏')">
            <span class="list-row-label">行程信息</span>
            <span class="list-row-value">${TRIP_DATA.name}</span>
          </div>
        </div>
      </div>

      <div class="sec" style="padding-bottom:20px">
        <button class="btn btn-ghost btn-full" onclick="confirmLeaveTrip()" style="color:var(--danger);border-color:rgba(255,59,48,.3)">
          退出当前行程
        </button>
      </div>
    </div>
  `;
}

window.toggleNotifs = function(enabled) {
  localStorage.setItem('notifsEnabled', enabled ? 'true' : 'false');
  if (enabled && 'Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
};

window.clearChatHistory = function() {
  if (!confirm('确认清除所有对话记录？')) return;
  S.chatHistory = [];
  showToast('对话已清除');
};

window.showAddMemberModal = function() {
  const colors = MEMBER_COLORS.filter(c => !Object.values(S.members).find(m => m.color === c));
  showModal(`
    <div class="sheet-handle"></div>
    <div style="font-size:20px;font-weight:700;margin-bottom:16px">添加成员</div>
    <div class="inp-label">成员名字</div>
    <input class="inp" id="new-member-name" placeholder="例：Aa、小宁、婉婉" style="margin-bottom:16px">
    <button class="btn btn-primary btn-full" onclick="submitAddMember()">添加</button>
  `);
};

window.submitAddMember = async function() {
  const name = $('#new-member-name').value.trim();
  if (!name) return showToast('请输入名字');
  const id = 'u_' + Date.now();
  const usedColors = Object.values(S.members).map(m => m.color);
  const color = MEMBER_COLORS.find(c => !usedColors.includes(c)) || MEMBER_COLORS[0];
  if (db && S.tripCode) {
    await updateDoc(doc(db, 'trips', S.tripCode), {
      [`members.${id}`]: { name, color, joinedAt: serverTimestamp() }
    });
  }
  S.members[id] = { name, color };
  closeModal();
  renderSettings();
  showToast(`已添加成员：${name}`);
};

window.confirmLeaveTrip = function() {
  showModal(`
    <div class="sheet-handle"></div>
    <div style="font-size:20px;font-weight:700;margin-bottom:8px">退出行程</div>
    <div style="font-size:15px;color:var(--text-2);margin-bottom:20px">退出后需要重新输入行程码才能访问</div>
    <button class="btn btn-danger btn-full" onclick="leaveTrip()" style="margin-bottom:8px">确认退出</button>
    <button class="btn btn-ghost btn-full" onclick="closeModal()">取消</button>
  `);
};

window.leaveTrip = function() {
  S.unsubs.forEach(u => u());
  S.unsubs = [];
  localStorage.removeItem('tripCode');
  localStorage.removeItem('memberId');
  localStorage.removeItem('memberName');
  S.tripCode = null; S.memberId = null; S.memberName = null;
  S.trip = null; S.members = {}; S.expenses = []; S.chatHistory = [];
  closeModal();
  renderApp();
};

// ── APP LAUNCHER ──────────────────────────────────────────────
window.openApp = function(appKey) {
  const app = APP_LINKS[appKey];
  if (!app) return;
  if (app.scheme) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none'; iframe.src = app.scheme;
    document.body.appendChild(iframe);
    setTimeout(() => { iframe.remove(); window.open(app.web, '_blank'); }, 1200);
  } else { window.open(app.web, '_blank'); }
};

// ── MODAL SYSTEM ──────────────────────────────────────────────
let activeModal = null;

function showModal(content) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="sheet">${content}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  activeModal = overlay;
}

window.closeModal = function() {
  if (activeModal) {
    activeModal.style.animation = 'overlayIn .2s ease reverse forwards';
    setTimeout(() => { activeModal?.remove(); activeModal = null; }, 200);
  }
};

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, autoDismiss = true) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position:fixed;bottom:calc(80px + var(--safe-b) + 16px);left:50%;transform:translateX(-50%);
    background:var(--surface);backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
    border:1px solid var(--border);border-radius:20px;padding:10px 20px;
    font-size:14px;font-weight:500;z-index:900;white-space:nowrap;
    box-shadow:0 6px 24px rgba(0,0,0,.35);
    animation:toastIn .3s var(--spring) both;
  `;
  toast.innerHTML = `<style>@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}</style>${msg}`;
  document.body.appendChild(toast);
  if (autoDismiss) setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 2500);
}

// ── INIT ──────────────────────────────────────────────────────
async function init() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('[SW]', e));
  }

  // Request notifications permission
  if ('Notification' in window && localStorage.getItem('notifsEnabled') !== 'false') {
    if (Notification.permission === 'default') Notification.requestPermission();
  }

  // Load persisted trip
  if (S.tripCode && S.memberId) {
    await loadTrip(S.tripCode);
  }

  renderApp();
}

init();