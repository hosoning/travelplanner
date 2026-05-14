// ═══════════════════════════════════════════════════════════════
// Travoo v3 — app.js
// ═══════════════════════════════════════════════════════════════
import { initializeApp }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, orderBy, limit, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── FIREBASE CONFIG ──────────────────────────────────────────
const FB_CFG = {
  apiKey:            "AIzaSyCyimwLDWNx92ihDmdHTdFSw4A8g34lPWI",
  authDomain:        "travoo-com.firebaseapp.com",
  projectId:         "travoo-com",
  storageBucket:     "travoo-com.firebasestorage.app",
  messagingSenderId: "544581218382",
  appId:             "1:544581218382:web:cb0511ab135f15a252931f"
};
function fbReady(){ return FB_CFG.apiKey && !FB_CFG.apiKey.startsWith('YOUR_'); }
let fbApp, db;
if(fbReady()){
  try{ fbApp=initializeApp(FB_CFG); db=getFirestore(fbApp); console.info('[Travoo] Firebase OK'); }
  catch(e){ console.warn('[FB]',e.message); }
}

// ── I18N ─────────────────────────────────────────────────────
const LANGS = {
  'zh-CN':{
    brand:'Travoo', sub:'和朋友一起记录每趟旅行',
    join:'加入行程', create:'创建新行程', or:'或',
    namePh:'名字', codePh:'6位行程码',
    myTrips:'我的行程', newTrip:'新建行程',
    today:'今天',itin:'行程',exp:'花费',ai:'助手',set:'设置',
    qa:'快捷操作',smRec:'智能提醒',xhs:'小红书推荐',
    total:'总花费',myPaid:'我付款',cnt:'笔数',
    detail:'明细',settle:'结算',
    code:'行程码',members:'成员',aiCfg:'AI 配置',
    notif:'通知',about:'关于',leave:'退出行程',
    copy:'复制',share:'分享',lang:'语言',wp:'壁纸',
    food:'餐饮',transport:'交通',attr:'景点',act:'活动',other:'其他',
    save:'保存',del:'删除',cancel:'取消',
    aiPh:'问我任何旅行问题...',
    noExp:'暂无记录',noExpSub:'点击 + 添加花费',
    paidBy:'付款人',splitW:'分摊成员',
    amount:'金额',desc:'描述',cat:'分类',
    apiEp:'API 端点',apiKey:'API Key',model:'模型',
    saveCfg:'保存配置',
    tokBudget:'Token 预算/次',tokUsed:'已用 Token',
    noCfg:'请先配置 AI',noCfgSub:'在设置中填入 API 端点和 Key',
    cfgAI:'去配置',
    msgApp:'通知应用',arrived:'我到了！',
    voiceHint:'按住说话',listening:'聆听中...',
    editItem:'编辑项目',addItem:'添加项目',
    offlineNote:'离线模式 — 云端同步需配置 Firebase',
    codeShare:'分享此行程码给朋友加入',
    free:'免费',
  },
  'zh-TW':{
    brand:'Travoo', sub:'和朋友一起記錄每趟旅行',
    join:'加入行程', create:'建立新行程', or:'或',
    namePh:'名字', codePh:'6位行程碼',
    myTrips:'我的行程', newTrip:'新建行程',
    today:'今天',itin:'行程',exp:'花費',ai:'助手',set:'設定',
    qa:'快捷操作',smRec:'智慧提醒',xhs:'小紅書推薦',
    total:'總花費',myPaid:'我付款',cnt:'筆數',
    detail:'明細',settle:'結算',
    code:'行程碼',members:'成員',aiCfg:'AI 設定',
    notif:'通知',about:'關於',leave:'退出行程',
    copy:'複製',share:'分享',lang:'語言',wp:'桌布',
    food:'餐飲',transport:'交通',attr:'景點',act:'活動',other:'其他',
    save:'儲存',del:'刪除',cancel:'取消',
    aiPh:'問我任何旅遊問題...',
    noExp:'暫無記錄',noExpSub:'點擊 + 新增花費',
    paidBy:'付款人',splitW:'分攤成員',
    amount:'金額',desc:'描述',cat:'分類',
    apiEp:'API 端點',apiKey:'API Key',model:'模型',
    saveCfg:'儲存設定',
    tokBudget:'Token 預算/次',tokUsed:'已用 Token',
    noCfg:'請先設定 AI',noCfgSub:'在設定中填入 API 端點和 Key',
    cfgAI:'去設定',
    msgApp:'通知應用',arrived:'我到了！',
    voiceHint:'按住說話',listening:'聆聽中...',
    editItem:'編輯項目',addItem:'新增項目',
    offlineNote:'離線模式 — 雲端同步需設定 Firebase',
    codeShare:'分享此行程碼給朋友加入',
    free:'免費',
  },
  'en':{
    brand:'Travoo', sub:'Plan, track & share every journey',
    join:'Join Trip', create:'Create New Trip', or:'or',
    namePh:'Name', codePh:'6-character code',
    myTrips:'My Trips', newTrip:'New Trip',
    today:'Today',itin:'Itinerary',exp:'Expenses',ai:'Assistant',set:'Settings',
    qa:'Quick Actions',smRec:'Smart Tips',xhs:'Xiaohongshu Picks',
    total:'Total',myPaid:'I Paid',cnt:'Items',
    detail:'Details',settle:'Settle Up',
    code:'Trip Code',members:'Members',aiCfg:'AI Config',
    notif:'Notifications',about:'About',leave:'Leave Trip',
    copy:'Copy',share:'Share',lang:'Language',wp:'Wallpaper',
    food:'Food',transport:'Transport',attr:'Attraction',act:'Activity',other:'Other',
    save:'Save',del:'Delete',cancel:'Cancel',
    aiPh:'Ask me anything about this trip...',
    noExp:'No expenses yet',noExpSub:'Tap + to add an expense',
    paidBy:'Paid by',splitW:'Split with',
    amount:'Amount',desc:'Description',cat:'Category',
    apiEp:'API Endpoint',apiKey:'API Key',model:'Model',
    saveCfg:'Save Config',
    tokBudget:'Token budget/msg',tokUsed:'Tokens used',
    noCfg:'AI Not Configured',noCfgSub:'Add your API endpoint and key in Settings',
    cfgAI:'Configure',
    msgApp:'Messaging App',arrived:"I've arrived!",
    voiceHint:'Hold to speak',listening:'Listening...',
    editItem:'Edit Item',addItem:'Add Item',
    offlineNote:'Offline mode — configure Firebase for cloud sync',
    codeShare:'Share this code with friends to join',
    free:'Free',
  }
};
function t(k){ return (LANGS[S.lang]||LANGS['zh-CN'])[k]||k; }

// ── STATE ─────────────────────────────────────────────────────
const S = {
  lang:       localStorage.getItem('lang')||'zh-CN',
  tripCode:   localStorage.getItem('tripCode')||null,
  memberId:   localStorage.getItem('memberId')||null,
  memberName: localStorage.getItem('memberName')||null,
  trip:       null,
  members:    {},
  expenses:   [],
  chatHistory:[],
  aiConfig:   JSON.parse(localStorage.getItem('aiConfig')||'{}'),
  tab:        'home',
  unsubs:     [],
  geo:        null,
  tokenUsed:  +localStorage.getItem('tokenUsed')||0,
  tokenBudget:+localStorage.getItem('tokenBudget')||40000,
  msgApp:     localStorage.getItem('msgApp')||'wechat',
  localTrips: JSON.parse(localStorage.getItem('localTrips')||'[]'),
};

// ── CONSTANTS ─────────────────────────────────────────────────
const COLORS=['#0A84FF','#FF453A','#30D158','#FF9F0A','#BF5AF2','#FF375F','#00C7BE'];
const CAT_COLORS={food:'#FF9F0A',transport:'#0A84FF',attr:'#30D158',act:'#BF5AF2',other:'#8E8E93'};

const APPS={
  didi:{label:'滴滴出行',scheme:'diditaxi://',web:'https://www.didiglobal.com'},
  maps:{label:'高德地图',scheme:'iosamap://path?sourceApplication=travoo',web:'https://uri.amap.com/'},
  ctrip:{label:'携程',scheme:'ctrip://',web:'https://m.ctrip.com'},
  dianping:{label:'大众点评',scheme:'dianping://',web:'https://m.dianping.com'},
  '12306':{label:'12306',scheme:'cn.12306://',web:'https://m.12306.cn'},
  xiaohongshu:{label:'小红书',scheme:'xhsdiscover://',web:'https://www.xiaohongshu.com/search_result/?keyword='},
  wechat:{label:'微信',scheme:'weixin://',web:'https://weixin.qq.com'},
  whatsapp:{label:'WhatsApp',scheme:'whatsapp://send?text=',web:'https://api.whatsapp.com/send?text='},
  line:{label:'LINE',scheme:'line://msg/text/',web:'https://line.me/R/msg/text/?'},
  telegram:{label:'Telegram',scheme:'tg://msg?text=',web:'https://t.me/share/url?text='},
};

const MSG_APPS=['wechat','whatsapp','line','telegram'];

// ── ICONS ─────────────────────────────────────────────────────
const IC={
  home:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`,
  cal:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  wallet:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12H15a2 2 0 000 4h6V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-4z"/></svg>`,
  chat:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  cog:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33A1.65 1.65 0 0014 21v.09a2 2 0 01-4 0V21a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  back:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`,
  chev:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`,
  send:`<svg viewBox="0 0 24 24"><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor"/></svg>`,
  mic:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>`,
  car:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l1.5-4.5h11L19 11M3 17h2v2h2v-2h10v2h2v-2h2v-6H3v6z"/><circle cx="7" cy="14.5" r="1.5"/><circle cx="17" cy="14.5" r="1.5"/></svg>`,
  map:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  food:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><path d="M6 2v6M10 2v6M14 2v6"/></svg>`,
  plane:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>`,
  train:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="17" rx="3"/><path d="M4 11h16M9 19l-1 3M15 19l1 3"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></svg>`,
  copy:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`,
  share:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>`,
  user:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  bell:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
  trash:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
  edit:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>`,
  camera:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  check:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  xhs:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 12h6M12 9v6"/></svg>`,
  img:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  globe:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>`,
  msg:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  bag:`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
};
function ic(n,sz=22){
  const s=IC[n]||IC.plus;
  return s.replace('<svg ','<svg width="'+sz+'" height="'+sz+'" ');
}

// ── TRIP DATA TEMPLATE ────────────────────────────────────────
function defaultDays(){
  return [
    {date:'2026-05-22',month:'5',day:'22',wd:'五',title:'抵达呼和浩特',
     items:[
       {id:'d1a',time:'全天',title:'婉先行抵达呼市，入住酒店，自由活动',
        transport:'打车从机场/火车站到酒店',sMin:30,sMax:50,lodge:'呼和浩特市区 · 酒店',
        notes:'',bag:'',apps:['didi','ctrip','maps'],type:'checkin'}
     ]},
    {date:'2026-05-23',month:'5',day:'23',wd:'六',title:'呼和浩特 · 城市游',
     items:[
       {id:'d2a',time:'09:30',title:'宁抵达呼和浩特，与婉汇合',
        transport:'打车从机场/火车站到酒店',sMin:30,sMax:50,notes:'',apps:['didi','maps'],type:'transport'},
       {id:'d2b',time:'10:30',title:'入住酒店，放行李，稍作休整',
        transport:'',sMin:null,sMax:null,notes:'呼市烧麦',apps:['ctrip'],type:'rest'},
       {id:'d2c',time:'11:30',title:'午餐',
        transport:'步行或打车',sMin:50,sMax:80,notes:'',apps:['dianping','maps'],type:'food'},
       {id:'d2d',time:'13:00',title:'游览大召寺（约1.5-2小时）',
        transport:'市区打车往返',sMin:20,sMax:20,notes:'',apps:['didi','maps'],type:'attr'},
       {id:'d2e',time:'15:30',title:'逛塞上老街，吃小吃',
        transport:'步行',sMin:30,sMax:50,notes:'',apps:['maps','dianping'],type:'leisure'},
       {id:'d2f',time:'18:00',title:'晚餐',
        transport:'步行或打车',sMin:80,sMax:120,notes:'冰煮羊或涮羊肉',apps:['dianping','didi'],type:'food'}
     ]},
    {date:'2026-05-24',month:'5',day:'24',wd:'日',title:'辉腾锡勒草原',
     items:[
       {id:'d3a',time:'07:45',title:'早餐',transport:'',sMin:null,sMax:null,notes:'',apps:[],type:'food'},
       {id:'d3b',time:'08:30',title:'包车出发前往辉腾锡勒草原',
        transport:'包车（5座，呼市→草原，含司机）',sMin:350,sMax:400,
        bag:'放车上',notes:'',apps:['maps'],type:'transport',hi:true},
       {id:'d3c',time:'11:00',title:'抵达辉腾锡勒草原，入住蒙古包',
        transport:'',sMin:null,sMax:null,lodge:'草原蒙古包',notes:'手把肉/奶茶',apps:[],type:'checkin'},
       {id:'d3d',time:'12:00',title:'午餐',
        transport:'',sMin:80,sMax:120,notes:'',apps:['dianping'],type:'food'},
       {id:'d3e',time:'14:00',title:'骑马体验（1-2小时）',
        transport:'马场',sMin:100,sMax:200,notes:'按小时计费',apps:[],type:'act'},
       {id:'d3f',time:'16:00',title:'草原自由活动：风车阵拍照 · 草地漫步',
        transport:'',sMin:0,sMax:0,notes:'',apps:[],type:'leisure'},
       {id:'d3g',time:'19:00',title:'晚餐 · 篝火晚会 · 看星空',
        transport:'',sMin:100,sMax:150,notes:'烤羊排',apps:[],type:'food'}
     ]},
    {date:'2026-05-25',month:'5',day:'25',wd:'一',title:'火山群 → 乌海',
     items:[
       {id:'d4a',time:'07:00',title:'早餐 · 退房 · 行李装车',
        transport:'',sMin:null,sMax:null,bag:'放车上',lodge:'乌海市区（目标）',notes:'',apps:[],type:'food'},
       {id:'d4b',time:'08:00',title:'出发前往乌兰哈达火山群',
        transport:'包车（草原→火山，约2小时）',sMin:null,sMax:null,notes:'',apps:['maps'],type:'transport',hi:true},
       {id:'d4c',time:'10:00',title:'游玩3号+6号火山',
        transport:'',sMin:60,sMax:100,notes:'宇航服租赁60-100元',apps:['maps'],type:'attr'},
       {id:'d4d',time:'11:30',title:'简单午餐',
        transport:'',sMin:30,sMax:50,notes:'自备或附近小餐馆',apps:['dianping'],type:'food'},
       {id:'d4e',time:'12:00',title:'出发返回呼和浩特东站',
        transport:'包车（火山→呼市东站，约2.5-3小时）',sMin:null,sMax:null,
        bag:'随身',notes:'必须准时离开',apps:['maps'],type:'transport',urgent:true,hi:true},
       {id:'d4f',time:'14:20',title:'抵达呼和浩特东站，候车',
        transport:'',sMin:null,sMax:null,notes:'',apps:[],type:'transport'},
       {id:'d4g',time:'14:26',title:'乘坐高铁前往乌海',
        transport:'高铁 D1179（二等座）',sMin:336.5,sMax:336.5,notes:'',apps:['12306'],type:'transport',hi:true},
       {id:'d4h',time:'17:30',title:'抵达乌海站，与玉汇合',
        transport:'打车到酒店（约15分钟）',sMin:5,sMax:10,notes:'',apps:['didi'],type:'transport'},
       {id:'d4i',time:'18:30',title:'入住乌海酒店',
        transport:'',sMin:80,sMax:120,lodge:'乌海市区 · 酒店',notes:'乌海杂鱼锅',apps:['ctrip'],type:'checkin'},
       {id:'d4j',time:'19:30',title:'晚餐',transport:'',sMin:null,sMax:null,notes:'',apps:['dianping'],type:'food'}
     ]},
    {date:'2026-05-26',month:'5',day:'26',wd:'二',title:'乌海湖 → 银川',
     items:[
       {id:'d5a',time:'09:00',title:'早餐',transport:'',sMin:null,sMax:null,bag:'寄存酒店前台',notes:'',apps:[],type:'food'},
       {id:'d5b',time:'10:00',title:'游玩乌海湖',
        transport:'打车往返码头（约15分钟单程）',sMin:10,sMax:15,notes:'',apps:['didi','maps'],type:'attr'},
       {id:'d5c',time:'10:30',title:'快艇 / 游船体验',
        transport:'',sMin:99,sMax:129,notes:'快艇129元 / 游船100元',apps:[],type:'act'},
       {id:'d5d',time:'12:00',title:'午餐',
        transport:'',sMin:80,sMax:120,notes:'黄河鲜',apps:['dianping'],type:'food'},
       {id:'d5e',time:'13:30',title:'乌海湖沙漠区：滑沙 / 越野车 / 骑驼',
        transport:'',sMin:130,sMax:250,notes:'滑沙约30-50，越野车约100-200',apps:['maps'],type:'act'},
       {id:'d5f',time:'17:00',title:'晚餐',
        transport:'打车从景区到餐厅',sMin:60,sMax:100,notes:'',apps:['didi','dianping'],type:'food'},
       {id:'d5g',time:'19:00',title:'返回乌海市区，取行李',
        transport:'',sMin:10,sMax:15,bag:'随身',notes:'',apps:['didi'],type:'transport'},
       {id:'d5h',time:'21:00',title:'前往乌海站',
        transport:'打车（约15分钟）',sMin:5,sMax:10,notes:'提早去准备安检',apps:['didi'],type:'transport'},
       {id:'d5i',time:'22:11',title:'乘坐高铁前往银川',
        transport:'高铁 D1067（二等座）',sMin:82,sMax:82,notes:'',apps:['12306'],type:'transport',hi:true},
       {id:'d5j',time:'23:00',title:'抵达银川站，入住酒店',
        transport:'打车到酒店（约20分钟）',sMin:10,sMax:20,lodge:'银川市区 · 酒店',notes:'',apps:['didi','ctrip'],type:'checkin'}
     ]},
    {date:'2026-05-27',month:'5',day:'27',wd:'三',title:'黄沙古渡 → 返程',
     items:[
       {id:'d6a',time:'07:00',title:'早餐 · 退房 · 行李装车/寄存',
        transport:'',sMin:null,sMax:null,bag:'寄存酒店前台',notes:'返程安排',apps:[],type:'food'},
       {id:'d6b',time:'08:00',title:'出发前往黄沙古渡',
        transport:'打车（约1小时）',sMin:30,sMax:50,notes:'',apps:['didi'],type:'transport'},
       {id:'d6c',time:'09:00',title:'黄沙古渡游玩（骑骆驼 · 滑沙等）',
        transport:'景区通票',sMin:198,sMax:198,notes:'通票含20+项目，包含骑骆驼',apps:['maps'],type:'attr'},
       {id:'d6d',time:'11:00',title:'从黄沙古渡出发，取行李 + 送婉去机场',
        transport:'打车（约1小时）',sMin:30,sMax:40,bag:'随身',
        notes:'必须准时离开',apps:['didi'],type:'transport',urgent:true},
       {id:'d6e',time:'12:00',title:'婉抵达银川河东机场，办理登机/午餐',
        transport:'',sMin:null,sMax:null,notes:'记得买午餐',apps:['ctrip'],type:'transport'},
       {id:'d6f',time:'14:00',title:'婉航班起飞',transport:'',sMin:null,sMax:null,notes:'',apps:[],type:'transport'},
       {id:'d6g',time:'14:00后',title:'可继续在银川市区活动或各自返程',
        transport:'根据各自航班安排打车',sMin:null,sMax:null,notes:'',apps:['didi','ctrip'],type:'leisure'}
     ]}
  ];
}

// ── UTILS ─────────────────────────────────────────────────────
const $  = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
function today(){ return new Date().toISOString().split('T')[0]; }
function nowH(){ return new Date().getHours(); }
function fmtMoney(n){ return n==null?'':'¥'+(Number.isInteger(n)?n:n.toFixed(1)); }
function spendStr(item){
  if(item.sMin==null) return '';
  if(item.sMin===0&&item.sMax===0) return t('free');
  if(item.sMin===item.sMax) return fmtMoney(item.sMin);
  return fmtMoney(item.sMin)+' – '+fmtMoney(item.sMax);
}
function genCode(){
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join('');
}
function memberName(id){ return id===S.memberId?'你':(S.members[id]?.name||id); }
function memberColor(id){ return S.members[id]?.color||'#8E8E93'; }
function allItemsFlat(){ return (S.trip?.days||defaultDays()).flatMap(d=>d.items); }
function findItem(id){ return allItemsFlat().find(i=>i.id===id); }
function applyWallpaper(){
  const wp=localStorage.getItem('wallpaper');
  const el=document.getElementById('wp');
  if(wp){el.style.setProperty('--wpi','url('+wp+')');el.classList.add('img');}
  else{el.classList.remove('img');}
}

// ── LOADING ───────────────────────────────────────────────────
function showLoad(){ if(!$('.load-ov')){const d=document.createElement('div');d.className='load-ov';d.innerHTML='<div class="spin"></div>';document.body.appendChild(d);} }
function hideLoad(){ $('.load-ov')?.remove(); }

// ── TOAST ─────────────────────────────────────────────────────
function toast(msg,dur=2400){
  $('.toast')?.remove();
  const d=document.createElement('div');
  d.className='toast';
  Object.assign(d.style,{
    position:'fixed',bottom:'calc(var(--tabh) + 18px)',left:'50%',
    transform:'translateX(-50%)',background:'rgba(28,28,34,.95)',
    backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',
    border:'1px solid rgba(255,255,255,.12)',borderRadius:'20px',
    padding:'9px 20px',fontSize:'14px',fontWeight:'500',zIndex:'900',
    whiteSpace:'nowrap',boxShadow:'0 6px 28px rgba(0,0,0,.4)',
    animation:'liIn .3s var(--sp2) both',color:'rgba(255,255,255,.92)'
  });
  d.textContent=msg;
  document.body.appendChild(d);
  if(dur>0) setTimeout(()=>{d.style.opacity='0';d.style.transition='opacity .3s';setTimeout(()=>d.remove(),300);},dur);
}

// ── FIREBASE OPS ──────────────────────────────────────────────
async function fbLoadTrip(code){
  if(!db){
    const raw=localStorage.getItem('lt_'+code);
    if(raw){const d=JSON.parse(raw);S.trip=d;S.members=d.members||{};return true;}
    return false;
  }
  try{
    const snap=await getDoc(doc(db,'trips',code));
    if(!snap.exists()) return false;
    S.trip=snap.data(); S.members=S.trip.members||{};
    return true;
  }catch(e){console.warn('[FB]',e);toast('网络错误：'+e.message);return false;}
}

async function fbCreateTrip(code,memberName){
  const mid='u_'+Date.now();
  const color=COLORS[0];
  const members={[mid]:{name:memberName,color}};
  const data={code,name:'我的旅行',dates:'',creatorId:mid,members,days:defaultDays(),msgApp:'wechat'};
  S.trip=data; S.members=members;
  if(db){
    const fd={...data,createdAt:serverTimestamp(),
      members:{[mid]:{name:memberName,color,joinedAt:serverTimestamp()}}};
    await setDoc(doc(db,'trips',code),fd);
  }else{
    try{localStorage.setItem('lt_'+code,JSON.stringify(data));}catch(e){}
  }
  return {memberId:mid,color};
}

async function fbJoinTrip(code,name){
  const mid='u_'+Date.now();
  const used=Object.values(S.members||{}).map(m=>m.color);
  const color=COLORS.find(c=>!used.includes(c))||COLORS[0];
  S.members[mid]={name,color};
  if(S.trip) S.trip.members=S.members;
  if(db){
    await updateDoc(doc(db,'trips',code),{[`members.${mid}`]:{name,color,joinedAt:serverTimestamp()}});
  }else{
    try{if(S.trip)localStorage.setItem('lt_'+code,JSON.stringify(S.trip));}catch(e){}
  }
  return {memberId:mid,color};
}

async function fbSaveDays(days){
  if(!S.tripCode) return;
  if(S.trip) S.trip.days=days;
  if(db){
    await updateDoc(doc(db,'trips',S.tripCode),{days});
  }else{
    try{if(S.trip)localStorage.setItem('lt_'+S.tripCode,JSON.stringify(S.trip));}catch(e){}
  }
}

async function fbAddExpense(data){
  const exp={...data,memberId:S.memberId,createdAt:new Date().toISOString()};
  if(db&&S.tripCode){
    await addDoc(collection(db,'trips',S.tripCode,'expenses'),{...exp,createdAt:serverTimestamp()});
  }else{
    S.expenses.unshift({id:'loc_'+Date.now(),...exp});
    refreshExpList();
  }
}

async function fbDelExpense(id){
  if(db&&S.tripCode) await deleteDoc(doc(db,'trips',S.tripCode,'expenses',id));
  else{S.expenses=S.expenses.filter(e=>e.id!==id);refreshExpList();}
}

async function fbSaveMsg(role,content){
  if(!db||!S.tripCode||!S.memberId) return;
  try{
    await addDoc(collection(db,'trips',S.tripCode,'chats',S.memberId,'messages'),
      {role,content,ts:serverTimestamp()});
  }catch(e){}
}

function subscribeAll(code){
  if(!db) return;
  S.unsubs.push(onSnapshot(doc(db,'trips',code),snap=>{
    if(!snap.exists()) return;
    S.trip=snap.data(); S.members=S.trip.members||{};
    if(S.tab==='home') renderHome();
  }));
  S.unsubs.push(onSnapshot(
    query(collection(db,'trips',code,'expenses'),orderBy('createdAt','desc'),limit(100)),
    snap=>{S.expenses=snap.docs.map(d=>({id:d.id,...d.data()}));refreshExpList();}
  ));
  S.unsubs.push(onSnapshot(
    query(collection(db,'trips',code,'chats',S.memberId,'messages'),orderBy('ts','asc'),limit(60)),
    snap=>{S.chatHistory=snap.docs.map(d=>d.data());refreshChatMsgs();}
  ));
}

// ── AI ────────────────────────────────────────────────────────
function sysPrompt(){
  const td=S.trip?.days?.find(d=>d.date===today());
  return `You are a smart travel assistant for the trip "${S.trip?.name||'旅程'}".
Dates: ${S.trip?.dates||''}, Destination: ${S.trip?.name||''}.
Today(${today()}): ${td?td.title:'no schedule today'}.
Members: ${Object.values(S.members).map(m=>m.name).join('、')}.
Reply in the user's language. Be concise and practical. No emoji.`;
}

async function callAI(userText){
  const cfg=S.aiConfig;
  if(!cfg.apiKey||!cfg.endpoint) throw new Error(t('noCfg'));
  const budgetPerMsg=S.tokenBudget||4000;
  const msgs=[{role:'system',content:sysPrompt()},
    ...S.chatHistory.slice(-14).map(m=>({role:m.role,content:m.content})),
    {role:'user',content:userText}];
  const res=await fetch(cfg.endpoint,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},
    body:JSON.stringify({model:cfg.model||'gpt-4o-mini',messages:msgs,max_tokens:budgetPerMsg,temperature:.75})
  });
  if(!res.ok) throw new Error('API '+res.status+': '+await res.text());
  const data=await res.json();
  const reply=data.choices?.[0]?.message?.content||'(no reply)';
  const used=(data.usage?.total_tokens||0);
  S.tokenUsed+=used; localStorage.setItem('tokenUsed',S.tokenUsed);
  return reply;
}

async function ocrReceipt(b64){
  const cfg=S.aiConfig;
  if(!cfg.apiKey||!cfg.endpoint) return null;
  try{
    const res=await fetch(cfg.endpoint,{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},
      body:JSON.stringify({model:cfg.model||'gpt-4o-mini',max_tokens:80,
        messages:[{role:'user',content:[
          {type:'text',text:'Extract from receipt. Return JSON only: {"amount":number,"description":"string","category":"food|transport|attr|act|other"}'},
          {type:'image_url',image_url:{url:b64}}
        ]}]})});
    const d=await res.json();
    const m=(d.choices?.[0]?.message?.content||'').match(/\{[\s\S]*\}/);
    return m?JSON.parse(m[0]):null;
  }catch(e){return null;}
}

// ── AI IMPORT ITINERARY ───────────────────────────────────────
async function importItineraryFromImage(b64){
  const cfg=S.aiConfig;
  if(!cfg.apiKey||!cfg.endpoint) throw new Error(t('noCfg'));
  const prompt=`Parse this travel itinerary image/document.
Return a JSON array of days (no extra text):
[{
  "date":"YYYY-MM-DD","month":"M","day":"DD","wd":"一|二|三|四|五|六|日","title":"day title",
  "items":[{
    "id":"unique string","time":"HH:MM or 全天","title":"activity name",
    "transport":"transport info or empty","sMin":number_or_null,"sMax":number_or_null,
    "lodge":"accommodation or empty","notes":"important notes or empty","bag":"luggage note or empty",
    "apps":["didi"|"maps"|"ctrip"|"dianping"|"12306"],"type":"food|transport|attr|act|checkin|rest|leisure",
    "hi":boolean,"urgent":boolean
  }]
}]`;
  const res=await fetch(cfg.endpoint,{method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},
    body:JSON.stringify({model:cfg.model||'gpt-4o-mini',max_tokens:3000,
      messages:[{role:'user',content:[
        {type:'text',text:prompt},
        {type:'image_url',image_url:{url:b64}}
      ]}]})});
  if(!res.ok) throw new Error('API '+res.status);
  const d=await res.json();
  const txt=d.choices?.[0]?.message?.content||'';
  const m=txt.match(/\[[\s\S]*\]/);
  if(!m) throw new Error('Failed to parse response');
  return JSON.parse(m[0]);
}

// ── SETTLEMENT ────────────────────────────────────────────────
function calcSettle(){
  const ids=Object.keys(S.members);
  if(ids.length<2) return [];
  const bal={};ids.forEach(id=>bal[id]=0);
  S.expenses.forEach(e=>{
    const amt=Number(e.amount)||0;
    const split=e.splitAmong||ids;
    const share=amt/split.length;
    if(bal[e.paidBy]!==undefined) bal[e.paidBy]+=amt;
    split.forEach(id=>{if(bal[id]!==undefined) bal[id]-=share;});
  });
  const txns=[];
  const deb=ids.filter(id=>bal[id]<-.01).map(id=>({id,a:-bal[id]})).sort((a,b)=>b.a-a.a);
  const crd=ids.filter(id=>bal[id]>.01).map(id=>({id,a:bal[id]})).sort((a,b)=>b.a-a.a);
  let di=0,ci=0;
  while(di<deb.length&&ci<crd.length){
    const p=Math.min(deb[di].a,crd[ci].a);
    txns.push({from:deb[di].id,to:crd[ci].id,amount:p});
    deb[di].a-=p; crd[ci].a-=p;
    if(deb[di].a<.01)di++; if(crd[ci].a<.01)ci++;
  }
  return txns;
}

// ── GEOLOCATION ───────────────────────────────────────────────
function requestGeo(){
  if(!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos=>{S.geo={lat:pos.coords.latitude,lon:pos.coords.longitude};},
    ()=>{}
  );
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function checkNotifs(){
  if(localStorage.getItem('notifsEnabled')==='false') return;
  const todayDay=(S.trip?.days||defaultDays()).find(d=>d.date===today());
  if(!todayDay) return;
  const now=new Date();
  const shown=JSON.parse(localStorage.getItem('shownNotifs')||'[]');
  todayDay.items.forEach(item=>{
    if(!item.time||item.time==='全天'||item.time.includes('后')) return;
    const[h,m]=(item.time+':00').split(':').map(Number);
    const dt=new Date(today()+'T'+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':00');
    const diff=(dt-now)/60000;
    const nid30='n30_'+item.id;
    if(diff>=28&&diff<=32&&!shown.includes(nid30)){
      shown.push(nid30);localStorage.setItem('shownNotifs',JSON.stringify(shown));
      showNotifBanner('Travoo','30分钟后：'+item.title,getSmartTip(item));
    }
    const nidNow='nnow_'+item.id;
    if(diff>=-2&&diff<=3&&!shown.includes(nidNow)){
      shown.push(nidNow);localStorage.setItem('shownNotifs',JSON.stringify(shown));
      showNotifBanner('Travoo',item.title,getSmartTip(item));
    }
  });
}
function getSmartTip(item){
  if(item.urgent) return '此行程时间紧张，务必准时出发';
  if(item.transport?.includes('高铁')) return '高铁需提前20分钟到站，请备好身份证';
  if(item.apps?.includes('didi')) return '可提前5分钟打开滴滴叫车';
  const m={food:'附近可用大众点评查看评分',attr:'建议先查好开放时间',transport:'建议提前确认交通方式',checkin:'记得备好预订确认单'};
  return m[item.type]||'祝旅途愉快';
}
function showNotifBanner(app,title,body){
  $('.nb')?.remove();
  const d=document.createElement('div');
  d.className='nb';
  d.innerHTML=`<div class="nb-hdr"><div class="nb-icon">${ic('bell',12)}</div>
    <span class="nb-app">${app}</span><span class="nb-time">现在</span></div>
    <div class="nb-title">${title}</div><div class="nb-body">${body}</div>`;
  document.body.appendChild(d);
  d.addEventListener('click',()=>dismissNB(d));
  setTimeout(()=>dismissNB(d),7000);
}
function dismissNB(d){d.classList.add('out');setTimeout(()=>d?.remove(),300);}

// ── XHS RECOMMENDATIONS ───────────────────────────────────────
function getXHSRecs(){
  const trip=S.trip||{};
  const name=trip.name||'';
  const recs=[
    {kw:'呼和浩特美食推荐 手把肉',title:'手把肉怎么吃才地道',desc:'草原正宗手把肉，蘸料是关键，当地人都这样吃'},
    {kw:'辉腾锡勒草原 攻略',title:'草原蒙古包住宿体验',desc:'亲测辉腾锡勒草原最美日落角度和篝火位置'},
    {kw:'乌兰哈达火山群 拍照',title:'火山地质奇观拍法',desc:'宇航服拍出星际质感，最佳角度在6号火山北侧'},
    {kw:'乌海湖 沙漠活动',title:'乌海沙漠骑驼体验',desc:'黄河边沙漠，越野车+骑驼全攻略，价格对比'},
    {kw:'黄沙古渡 银川',title:'黄沙古渡必打卡景点',desc:'落日余晖下的黄河，这些构图让你的照片高级100倍'},
    {kw:'内蒙古 旅行穿搭',title:'草原旅行穿搭指南',desc:'防晒+保暖两不误，亲测最实用搭配分享'},
  ];
  return recs;
}

// ── VOICE INPUT ───────────────────────────────────────────────
let recognition=null;
function startVoice(onResult){
  const SpeechRec=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRec){toast('此浏览器不支持语音识别');return;}
  // Show overlay
  const ov=document.createElement('div');
  ov.className='voice-ov';
  ov.innerHTML=`<div class="voice-ring">${ic('mic',40)}</div>
    <div class="voice-hint">${t('listening')}</div>
    <div class="voice-text" id="voice-txt"></div>
    <div class="voice-cancel">${t('cancel')}</div>`;
  document.body.appendChild(ov);
  ov.querySelector('.voice-cancel').addEventListener('click',()=>{recognition?.stop();ov.remove();});
  recognition=new SpeechRec();
  recognition.lang=S.lang==='en'?'en-US':'zh-CN';
  recognition.continuous=false; recognition.interimResults=true;
  recognition.onresult=e=>{
    const txt=[...e.results].map(r=>r[0].transcript).join('');
    const el=$('#voice-txt');
    if(el) el.textContent=txt;
  };
  recognition.onend=()=>{
    const txt=$('#voice-txt')?.textContent||'';
    ov.remove();
    if(txt.trim()) onResult(txt.trim());
  };
  recognition.onerror=()=>{ov.remove();};
  recognition.start();
}
function handleVoiceIntent(txt){
  const low=txt.toLowerCase();
  if(low.includes('记录')||low.includes('花了')||low.includes('消费')){
    const m=txt.match(/\d+(\.\d+)?/);
    if(m){
      switchTab('expenses');
      setTimeout(()=>showAddExpenseModal({amount:parseFloat(m[0]),description:txt}),300);
      return;
    }
  }
  if(low.includes('叫车')||low.includes('打车')||low.includes('didi')){
    openApp('didi'); return;
  }
  if(low.includes('导航')||low.includes('地图')){
    openApp('maps'); return;
  }
  if(low.includes('订酒店')||low.includes('携程')){
    openApp('ctrip'); return;
  }
  // Default: send to AI
  switchTab('chat');
  setTimeout(()=>sendChatMsg(txt),300);
}

// ── APP LAUNCHER ──────────────────────────────────────────────
window.openApp = function(key,extra=''){
  const app=APPS[key]; if(!app) return;
  showLoad();
  // Try native scheme, fall back to web
  let tried=false;
  if(app.scheme){
    const tmp=document.createElement('iframe');
    tmp.style.display='none';
    tmp.src=app.scheme+extra;
    document.body.appendChild(tmp);
    setTimeout(()=>{tmp.remove();if(!tried){tried=true;hideLoad();window.open(app.web+extra,'_blank');}},1400);
    setTimeout(()=>{tried=true;hideLoad();},800);
  }else{
    hideLoad();
    window.open(app.web+extra,'_blank');
  }
};

// ── MODAL ─────────────────────────────────────────────────────
let _ov=null;
function showModal(html){
  closeModal();
  const d=document.createElement('div');
  d.className='ov';
  d.innerHTML='<div class="sheet">'+html+'</div>';
  d.addEventListener('click',e=>{if(e.target===d)closeModal();});
  document.body.appendChild(d);
  _ov=d;
}
window.closeModal=function(){
  if(!_ov) return;
  _ov.style.animation='ovIn .18s ease reverse forwards';
  setTimeout(()=>{_ov?.remove();_ov=null;},200);
};

// ── RENDER SYSTEM ─────────────────────────────────────────────
function renderApp(){
  const app=document.getElementById('app');
  if(!S.tripCode||!S.memberId){
    // Trip list or onboarding
    const trips=S.localTrips;
    if(trips.length>0) renderTripList();
    else renderOnboarding();
    return;
  }
  app.innerHTML=`
    <div id="v-home" class="view"></div>
    <div id="v-itin" class="view"></div>
    <div id="v-exp"  class="view"></div>
    <div id="v-chat" class="view"></div>
    <div id="v-set"  class="view"></div>
    <nav class="tabs">
      <div class="tab" id="tb-itin" onclick="switchTab('itin')">${ic('cal',24)}</div>
      <div class="tab" id="tb-exp"  onclick="switchTab('exp')">${ic('wallet',24)}</div>
      <div class="tab tab-home" id="tb-home" onclick="switchTab('home')">${ic('home',24)}</div>
      <div class="tab" id="tb-chat" onclick="switchTab('chat')">${ic('chat',24)}</div>
      <div class="tab" id="tb-set"  onclick="switchTab('set')">${ic('cog',24)}</div>
    </nav>`;
  switchTab('home');
  subscribeAll(S.tripCode);
  setInterval(checkNotifs,60000);
  setTimeout(checkNotifs,2000);
  requestGeo();
}

window.switchTab=function(name){
  $$('.tab').forEach(t=>t.classList.remove('on'));
  $$('.view').forEach(v=>v.classList.remove('active'));
  const tmap={home:'home',itin:'itin',exp:'exp',chat:'chat',set:'set'};
  const tid='tb-'+name, vid='v-'+name;
  $(('#'+tid))?.classList.add('on');
  $(('#'+vid))?.classList.add('active');
  S.tab=name;
  ({home:renderHome,itin:renderItin,exp:renderExp,chat:renderChat,set:renderSet})[name]?.();
};

// ── ONBOARDING ────────────────────────────────────────────────
function renderOnboarding(){
  document.getElementById('app').innerHTML=`
  <div id="v-ob" class="view active">
    <div class="ob">
      <div class="ob-logo">${ic('plane',52)}</div>
      <div class="ob-brand">${t('brand')}</div>
      <div class="ob-sub">${t('sub')}</div>
      <div class="ob-form">
        <div class="inp-lbl" style="text-align:left;width:100%">${t('yourName')}</div>
        <input class="inp" id="ob-name" placeholder="${t('namePh')}" autocomplete="off">
        <input class="code-inp" id="ob-code" maxlength="6" placeholder="${t('codePh')}"
          autocomplete="off" autocapitalize="characters" spellcheck="false">
        <button class="btn btn-g btn-full" id="ob-join" onclick="handleJoin()">${t('join')}</button>
        <div class="ob-div">${t('or')}</div>
        <button class="btn btn-p btn-full" id="ob-create" onclick="handleCreate()">${t('create')}</button>
        ${!fbReady()?`<div style="font-size:12px;color:var(--t3);text-align:center;padding:6px 0;line-height:1.5">${t('offlineNote')}</div>`:''}
        <div style="display:flex;justify-content:flex-end;margin-top:4px">
          <div style="display:flex;gap:6px">
            ${['zh-CN','zh-TW','en'].map(l=>`<div class="chip ${S.lang===l?'on':''}" style="padding:5px 12px;font-size:12px" onclick="setLang('${l}')">${l}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;
  $('#ob-code').addEventListener('input',function(){this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'');});
}

window.setLang=function(l){
  S.lang=l; localStorage.setItem('lang',l);
  renderApp();
};

window.handleJoin=async function(){
  const code=$('#ob-code').value.trim().toUpperCase();
  const name=$('#ob-name').value.trim();
  if(code.length<6){$('#ob-code').classList.add('shake');setTimeout(()=>$('#ob-code')?.classList.remove('shake'),500);return;}
  if(!name){toast('请输入你的名字');return;}
  const btn=$('#ob-join');
  btn.disabled=true; btn.textContent='连接中...';
  try{
    const ok=await fbLoadTrip(code);
    if(!ok){toast('找不到此行程码'+(!fbReady()?' (离线模式无法加入他人行程)':''));btn.disabled=false;btn.textContent=t('join');return;}
    const r=await fbJoinTrip(code,name);
    _saveSession(code,r.memberId,name);
    renderApp();
  }catch(e){toast('错误：'+e.message);btn.disabled=false;btn.textContent=t('join');}
};

window.handleCreate=async function(){
  const name=$('#ob-name').value.trim();
  if(!name){toast('请先输入你的名字');return;}
  const btn=$('#ob-create');
  btn.disabled=true; btn.textContent='创建中...';
  try{
    const code=genCode();
    const r=await fbCreateTrip(code,name);
    _saveSession(code,r.memberId,name);
    _addLocalTrip(code,S.trip?.name||'我的旅行',S.trip?.dates||'');
    renderApp();
    setTimeout(()=>toast('行程码：'+code+'，分享给朋友'),400);
  }catch(e){toast('错误：'+e.message);btn.disabled=false;btn.textContent=t('create');}
};

function _saveSession(code,mid,name){
  S.tripCode=code; S.memberId=mid; S.memberName=name;
  localStorage.setItem('tripCode',code);
  localStorage.setItem('memberId',mid);
  localStorage.setItem('memberName',name);
}

function _addLocalTrip(code,name,dates){
  const trips=JSON.parse(localStorage.getItem('localTrips')||'[]');
  if(!trips.find(t=>t.code===code)) trips.push({code,name,dates});
  localStorage.setItem('localTrips',JSON.stringify(trips));
  S.localTrips=trips;
}

// ── TRIP LIST ─────────────────────────────────────────────────
function renderTripList(){
  document.getElementById('app').innerHTML=`
  <div id="v-tl" class="view active">
    <div class="nav">
      <div class="nav-large">${t('myTrips')}</div>
      <div class="nbtn" onclick="renderOnboarding()">${ic('plus',18)}</div>
    </div>
    <div class="scroller">
      <div style="height:16px"></div>
      <div class="sec li-anim">
        ${S.localTrips.map(tr=>`
          <div class="tc" onclick="enterTrip('${tr.code}')">
            <div class="tc-bg"></div>
            <div class="tc-body">
              <div class="tc-name">${tr.name||'我的旅行'}</div>
              <div class="tc-date">${tr.dates||''}</div>
              <div class="tc-code">${tr.code}</div>
            </div>
          </div>
        `).join('')}
        <button class="btn btn-g btn-full" style="margin-top:8px" onclick="renderOnboarding()">
          ${ic('plus',16)} ${t('newTrip')}
        </button>
        <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px">
          ${['zh-CN','zh-TW','en'].map(l=>`<div class="chip ${S.lang===l?'on':''}" style="padding:5px 12px;font-size:12px" onclick="setLang('${l}')">${l}</div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

window.enterTrip=async function(code){
  showLoad();
  const mid=localStorage.getItem('memberId');
  if(!mid){hideLoad();renderOnboarding();return;}
  S.memberId=mid; S.memberName=localStorage.getItem('memberName');
  S.tripCode=code; localStorage.setItem('tripCode',code);
  const ok=await fbLoadTrip(code);
  hideLoad();
  if(!ok){toast('无法加载行程');return;}
  renderApp();
};

// ── HOME ──────────────────────────────────────────────────────
function renderHome(){
  const v=$('#v-home'); if(!v) return;
  const trip=S.trip||{name:'Travoo',dates:'',days:defaultDays()};
  const days=trip.days||defaultDays();
  const todayDay=days.find(d=>d.date===today());
  const h=nowH();
  const recs=getSmartRecs(todayDay,h);
  const xhsRecs=getXHSRecs();
  const memArr=Object.entries(S.members||{});
  // Progress
  const tripDays=days.length;
  const startDate=new Date(days[0]?.date||today());
  const endDate=new Date(days[tripDays-1]?.date||today());
  const nowDate=new Date();
  const prog=Math.max(0,Math.min(100,((nowDate-startDate)/(endDate-startDate+86400000))*100));
  const msgApp=APPS[S.msgApp||'wechat'];
  v.innerHTML=`
    <div class="nav">
      <div style="font-size:13px;color:var(--t2);flex:1">${trip.name||''}</div>
      <div class="nbtn" onclick="showTripCodeModal()">${ic('share',16)}</div>
    </div>
    <div class="scroller">
      <!-- Hero -->
      <div class="hero" style="margin-top:10px">
        <div class="hero-inner">
          <div class="hero-day">${todayDay?'周'+todayDay.wd+' · '+t('today'):(nowDate<startDate?'出发倒计时':'旅程已结束')}</div>
          <div class="hero-title">${todayDay?todayDay.title:trip.name}</div>
          <div class="hero-prog"><div class="hero-fill" style="width:${prog}%"></div></div>
          <div class="hero-msg" onclick="notifyFriends()">
            ${ic('msg',15)}
            <span class="hero-msg-txt">${t('msgApp')} · ${msgApp?.label||'微信'}</span>
            <span class="hero-msg-btn">${t('arrived')}</span>
          </div>
        </div>
      </div>
      <!-- Quick Actions -->
      <div class="sec">
        <div class="sec-ttl">${t('qa')}</div>
        <div class="qa-grid">
          <div class="qa" onclick="openApp('didi')"><div class="qa-icon">${ic('car',20)}</div><div class="qa-lbl">滴滴出行</div></div>
          <div class="qa" onclick="openApp('maps')"><div class="qa-icon">${ic('map',20)}</div><div class="qa-lbl">高德地图</div></div>
          <div class="qa" onclick="openApp('dianping')"><div class="qa-icon">${ic('food',20)}</div><div class="qa-lbl">大众点评</div></div>
          <div class="qa" onclick="openApp('ctrip')"><div class="qa-icon">${ic('plane',20)}</div><div class="qa-lbl">携程</div></div>
          <div class="qa" onclick="openApp('12306')"><div class="qa-icon">${ic('train',20)}</div><div class="qa-lbl">12306</div></div>
          <div class="qa" onclick="openApp('xiaohongshu')"><div class="qa-icon">${ic('xhs',20)}</div><div class="qa-lbl">小红书</div></div>
          <div class="qa" onclick="switchTab('exp');setTimeout(showAddExpenseModal,200)"><div class="qa-icon">${ic('camera',20)}</div><div class="qa-lbl">记账</div></div>
          <div class="qa" onclick="switchTab('chat')"><div class="qa-icon">${ic('chat',20)}</div><div class="qa-lbl">AI助手</div></div>
        </div>
      </div>
      <!-- Smart Recs -->
      ${recs.length?`
      <div style="margin-bottom:18px">
        <div class="sec-ttl" style="padding:0 16px;margin-bottom:8px">${t('smRec')}</div>
        <div class="smart-strip">
          ${recs.map(r=>`
            <div class="smart-pill" onclick="${r.action||''}">
              <div class="smart-tag">${r.type}</div>
              <div class="smart-ttl">${r.title}</div>
              <div class="smart-desc">${r.desc}</div>
            </div>`).join('')}
        </div>
      </div>`:''} 
      <!-- XHS -->
      <div style="margin-bottom:18px">
        <div class="sec-ttl" style="padding:0 16px;margin-bottom:8px">${t('xhs')}</div>
        <div class="xhs-strip">
          ${xhsRecs.map(r=>`
            <div class="xhs-card" onclick="openXHS('${encodeURIComponent(r.kw)}')">
              <div class="xhs-thumb">${ic('img',32)}</div>
              <div class="xhs-body">
                <div class="xhs-ttl">${r.title}</div>
                <div class="xhs-desc">${r.desc}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <!-- Today Timeline -->
      ${todayDay?`
      <div class="sec">
        <div class="sec-ttl">${t('todayTimeline')||'今日时间轴'}</div>
        <div class="list li-anim">
          ${todayDay.items.map(item=>`
            <div class="lr" onclick="showActDetail('${item.id}')">
              <div style="width:44px;flex-shrink:0;font-size:12px;font-weight:700;color:var(--t2)">${item.time}</div>
              <div style="flex:1">
                <div style="font-size:15px;font-weight:600">${item.title}</div>
                ${spendStr(item)?`<div style="font-size:12px;color:var(--orange);margin-top:1px">${spendStr(item)}</div>`:''}
              </div>
              ${item.urgent?`<div style="width:6px;height:6px;border-radius:50%;background:var(--red);flex-shrink:0"></div>`:''}
            </div>`).join('')}
        </div>
        <button class="btn btn-g btn-full" style="margin-top:10px" onclick="switchTab('itin')">
          查看完整行程
        </button>
      </div>`:
      `<div class="sec"><div class="sec-ttl">${t('members')}</div>
      <div class="list">${memArr.map(([id,m])=>`
        <div class="lr" style="cursor:default">
          <div class="av" style="background:${m.color}">${(m.name||'?')[0]}</div>
          <span class="lr-lbl">${m.name}</span>
          ${id===S.memberId?'<span class="you-tag">你</span>':''}
        </div>`).join('')}</div></div>`}
    </div>
    <!-- Voice FAB -->
    <button class="fab" id="voice-fab" onmousedown="startVoiceFAB()" ontouchstart="startVoiceFAB()"
      title="${t('voiceHint')}">${ic('mic',22)}</button>`;
}

function getSmartRecs(todayDay,h){
  const recs=[];
  if(!todayDay) return recs;
  if(h>=7&&h<=9) recs.push({type:'早餐推荐',title:'呼市烧麦',desc:'德顺源或麦香村，早去不用排队，人均25-40元',action:"openApp('dianping')"});
  if(h>=11&&h<=13) recs.push({type:'午餐推荐',title:'当地特色午餐',desc:'大众点评搜索附近4.5+评分，体验本地口味',action:"openApp('dianping')"});
  if(S.geo) recs.push({type:'位置感知',title:'已获取当前位置',desc:'高德地图可为你规划最优路线',action:"openApp('maps')"});
  if(todayDay.items.some(i=>i.apps?.includes('didi')))
    recs.push({type:'出行建议',title:'提前叫车避免等待',desc:'高峰期滴滴等待时间较长，建议提前5-10分钟预约',action:"openApp('didi')"});
  if(todayDay.items.some(i=>i.type==='attr'))
    recs.push({type:'拍照打卡',title:'今日景点攻略',desc:'小红书搜景点名称，查看最佳拍照角度和光线时段',action:"openApp('xiaohongshu')"});
  return recs.slice(0,3);
}

window.openXHS=function(kw){
  showLoad();
  const decoded=decodeURIComponent(kw);
  // Try app scheme first, fallback to web search
  const url='https://www.xiaohongshu.com/search_result/?keyword='+kw;
  setTimeout(()=>{hideLoad();window.open(url,'_blank');},500);
};

window.notifyFriends=function(){
  const app=APPS[S.msgApp]||APPS.wechat;
  const msg=t('arrived');
  openApp(S.msgApp, msg);
};

window.startVoiceFAB=function(){
  startVoice(txt=>handleVoiceIntent(txt));
};

// ── ITINERARY (H-SWIPE) ───────────────────────────────────────
let _itinDay=0;
function renderItin(){
  const v=$('#v-itin'); if(!v) return;
  const days=(S.trip?.days)||defaultDays();
  const todayIdx=days.findIndex(d=>d.date===today());
  _itinDay=todayIdx>=0?todayIdx:0;
  v.innerHTML=`
    <div class="nav">
      <div class="nbtn" onclick="showTripEditModal()">${ic('edit',16)}</div>
      <div class="nav-title">${S.trip?.name||'行程'}</div>
      <div class="nbtn" onclick="showAddDayModal()">${ic('plus',16)}</div>
    </div>
    <div class="day-tabs" id="dtabs">
      ${days.map((d,i)=>`
        <div class="dtab ${i===_itinDay?'on':''} ${d.date===today()?'today':''}"
          id="dtab-${i}" onclick="jumpToDay(${i})">
          <div class="dtab-wd">周${d.wd}</div>
          <div class="dtab-d">${d.day}</div>
        </div>`).join('')}
    </div>
    <div class="itin-scroll" id="itin-sl">
      ${days.map((day,di)=>`
        <div class="itin-page" id="ipg-${di}">
          <div class="day-hdr">
            <div class="day-hdr-title">${day.title}</div>
            <div class="day-hdr-sub">${day.month}月${day.day}日 周${day.wd}</div>
          </div>
          <div class="li-anim">
            ${day.items.map(item=>renderActCard(item)).join('')}
          </div>
          <div style="margin:4px 16px 10px">
            <button class="btn btn-g btn-full" style="padding:10px;font-size:13px"
              onclick="showAddItemModal(${di})">${ic('plus',14)} ${t('addItem')}</button>
          </div>
        </div>`).join('')}
    </div>`;
  // Scroll to today
  const sl=$('#itin-sl');
  if(sl&&_itinDay>0) setTimeout(()=>sl.scrollTo({left:_itinDay*sl.offsetWidth,behavior:'instant'}),50);
  // Sync tab on scroll
  sl?.addEventListener('scroll',()=>{
    const idx=Math.round(sl.scrollLeft/sl.offsetWidth);
    if(idx!==_itinDay){
      _itinDay=idx;
      $$('.dtab').forEach((d,i)=>d.classList.toggle('on',i===idx));
      const tab=$('#dtab-'+idx);
      tab?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    }
  },{passive:true});
}

function renderActCard(item){
  const spend=spendStr(item);
  const isHi=item.hi&&item.transport;
  return `
    <div class="act ${item.urgent?'urgent':''}" onclick="showActDetail('${item.id}')">
      <div class="act-row">
        <div class="act-tc"><div class="act-time">${item.time}</div></div>
        <div class="act-body">
          <div class="act-title">${item.title}</div>
          <div class="act-meta">
            ${item.transport&&!isHi?`<span class="act-chip">${ic('car',10)} ${item.transport}</span>`:''}
            ${item.lodge?`<span class="act-chip">${ic('map',10)} ${item.lodge}</span>`:''}
            ${item.bag?`<span class="act-chip">${ic('bag',10)} ${item.bag}</span>`:''}
          </div>
          ${isHi?`<div class="act-ttag">${ic('train',11)} ${item.transport}</div>`:''}
          ${spend?`<div class="act-spend">${spend}</div>`:''}
          ${item.notes?`<div class="act-note">${item.notes}</div>`:''}
          ${item.urgent?`<div class="act-note urg">必须准时离开</div>`:''}
          ${item.apps?.length?`<div class="act-apps">${item.apps.map(a=>APPS[a]?`
            <div class="act-app" onclick="event.stopPropagation();openApp('${a}')">
              ${ic(_appIcon(a),12)} ${APPS[a].label}
            </div>`:'').join('')}</div>`:''}
        </div>
      </div>
      <div class="act-edit" onclick="event.stopPropagation();showEditItemModal('${item.id}')">
        ${ic('edit',13)} ${t('editItem')}
      </div>
    </div>`;
}

function _appIcon(a){return{didi:'car',maps:'map',ctrip:'plane','12306':'train',dianping:'food',xiaohongshu:'xhs'}[a]||'globe';}

window.jumpToDay=function(idx){
  _itinDay=idx;
  const sl=$('#itin-sl');
  sl?.scrollTo({left:idx*sl.offsetWidth,behavior:'smooth'});
  $$('.dtab').forEach((d,i)=>d.classList.toggle('on',i===idx));
};

window.showActDetail=function(id){
  const item=findItem(id); if(!item) return;
  const spend=spendStr(item);
  showModal(`
    <div class="sh"></div>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t3);margin-bottom:6px">${item.type}</div>
    <div style="font-size:22px;font-weight:700;line-height:1.35;margin-bottom:14px">${item.title}</div>
    ${[
      item.transport&&['<div class="lr" style="cursor:default;border-radius:var(--r2);background:var(--g1);margin-bottom:6px"><span class="lr-lbl">交通</span><span class="lr-val">${item.transport}</span></div>'],
      spend&&['<div class="lr" style="cursor:default;border-radius:var(--r2);background:var(--g1);margin-bottom:6px"><span class="lr-lbl">预计花费</span><span class="lr-val" style="color:var(--orange);font-weight:700">${spend}</span></div>'],
      item.lodge&&['<div class="lr" style="cursor:default;border-radius:var(--r2);background:var(--g1);margin-bottom:6px"><span class="lr-lbl">住宿</span><span class="lr-val">${item.lodge}</span></div>'],
      item.bag&&['<div class="lr" style="cursor:default;border-radius:var(--r2);background:rgba(255,159,10,.08);border:1px solid rgba(255,159,10,.2);margin-bottom:6px"><span class="lr-lbl" style="color:var(--orange)">行李</span><span class="lr-val" style="color:var(--orange)">${item.bag}</span></div>'],
      item.notes&&[`<div style="padding:10px 12px;background:rgba(255,159,10,.07);border-left:2px solid rgba(255,159,10,.4);border-radius:0 8px 8px 0;margin-bottom:8px;font-size:14px;line-height:1.55">${item.notes}</div>`],
      item.urgent&&['<div style="padding:10px 12px;background:rgba(255,69,58,.1);border-left:2px solid rgba(255,69,58,.5);border-radius:0 8px 8px 0;margin-bottom:8px;font-size:14px;color:rgba(255,120,110,.9);font-weight:600">必须准时离开</div>'],
    ].filter(Boolean).flat().join('')}
    ${item.apps?.length?`
      <div style="margin-top:6px;margin-bottom:12px">
        <div style="font-size:12px;color:var(--t3);font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:.4px">相关应用</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${item.apps.map(a=>APPS[a]?`<button class="btn btn-g" style="flex:1;min-width:90px;padding:10px 12px;font-size:14px" onclick="openApp('${a}');closeModal()">${APPS[a].label}</button>`:'').join('')}
        </div>
      </div>`:''}
    <button class="btn btn-g btn-full" onclick="askAIAbout('${item.title.replace(/'/g,'\\'')}');closeModal()">询问 AI 助手</button>
    <button class="btn btn-g btn-full" style="margin-top:8px" onclick="closeModal();showEditItemModal('${item.id}')">${ic('edit',15)} ${t('editItem')}</button>
  `);
};

window.showEditItemModal=function(id){
  const item=findItem(id); if(!item) return;
  showModal(`
    <div class="sh"></div>
    <div style="font-size:18px;font-weight:700;margin-bottom:14px">${t('editItem')}</div>
    <div class="inp-lbl">时间</div>
    <input class="inp" id="ei-time" value="${item.time||''}" placeholder="HH:MM" style="margin-bottom:10px">
    <div class="inp-lbl">活动名称</div>
    <input class="inp" id="ei-title" value="${item.title||''}" style="margin-bottom:10px">
    <div class="inp-lbl">交通方式</div>
    <input class="inp" id="ei-trans" value="${item.transport||''}" placeholder="可留空" style="margin-bottom:10px">
    <div class="inp-lbl">预计花费最低 (¥)</div>
    <input class="inp" id="ei-smin" type="number" value="${item.sMin??''}" placeholder="留空=不显示" style="margin-bottom:10px">
    <div class="inp-lbl">预计花费最高 (¥)</div>
    <input class="inp" id="ei-smax" type="number" value="${item.sMax??''}" placeholder="留空=不显示" style="margin-bottom:10px">
    <div class="inp-lbl">备注/提醒</div>
    <textarea class="inp" id="ei-notes" placeholder="重要提醒或备注" style="margin-bottom:10px">${item.notes||''}</textarea>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <label class="lr" style="flex:1;cursor:pointer;border-radius:var(--r2);background:var(--g1)">
        <span class="lr-lbl" style="font-size:14px">重要行程</span>
        <input type="checkbox" id="ei-hi" ${item.hi?'checked':''} style="width:18px;height:18px">
      </label>
      <label class="lr" style="flex:1;cursor:pointer;border-radius:var(--r2);background:rgba(255,69,58,.08)">
        <span class="lr-lbl" style="font-size:14px;color:var(--red)">必须准时</span>
        <input type="checkbox" id="ei-urg" ${item.urgent?'checked':''} style="width:18px;height:18px">
      </label>
    </div>
    <button class="btn btn-p btn-full" onclick="submitEditItem('${id}')" style="margin-bottom:8px">${t('save')}</button>
    <button class="btn btn-d btn-full" onclick="deleteItem('${id}')">${ic('trash',15)} ${t('del')}</button>
  `);
};

window.submitEditItem=async function(id){
  const days=JSON.parse(JSON.stringify((S.trip?.days)||defaultDays()));
  for(const day of days){
    const idx=day.items.findIndex(i=>i.id===id);
    if(idx<0) continue;
    const item=day.items[idx];
    item.time=$('#ei-time').value.trim()||item.time;
    item.title=$('#ei-title').value.trim()||item.title;
    item.transport=$('#ei-trans').value.trim();
    item.sMin=$('#ei-smin').value!==''?parseFloat($('#ei-smin').value):null;
    item.sMax=$('#ei-smax').value!==''?parseFloat($('#ei-smax').value):null;
    item.notes=$('#ei-notes').value.trim();
    item.hi=$('#ei-hi').checked;
    item.urgent=$('#ei-urg').checked;
    day.items[idx]=item;
    break;
  }
  closeModal(); showLoad();
  await fbSaveDays(days);
  hideLoad(); toast(t('save'));
  if(S.trip) S.trip.days=days;
  renderItin();
};

window.deleteItem=async function(id){
  if(!confirm('确认删除此项目？')) return;
  const days=JSON.parse(JSON.stringify((S.trip?.days)||defaultDays()));
  for(const day of days){
    const idx=day.items.findIndex(i=>i.id===id);
    if(idx>=0){day.items.splice(idx,1);break;}
  }
  closeModal(); showLoad();
  await fbSaveDays(days);
  hideLoad(); if(S.trip) S.trip.days=days; renderItin();
};

window.showAddItemModal=function(dayIdx){
  showModal(`
    <div class="sh"></div>
    <div style="font-size:18px;font-weight:700;margin-bottom:14px">${t('addItem')}</div>
    <div class="inp-lbl">时间</div>
    <input class="inp" id="ai-time" placeholder="HH:MM 或 全天" style="margin-bottom:10px">
    <div class="inp-lbl">活动名称</div>
    <input class="inp" id="ai-title" placeholder="活动名称" style="margin-bottom:10px">
    <div class="inp-lbl">交通方式</div>
    <input class="inp" id="ai-trans" placeholder="可留空" style="margin-bottom:10px">
    <div class="inp-lbl">预计花费 (¥)</div>
    <input class="inp" id="ai-spend" type="number" placeholder="可留空" style="margin-bottom:10px">
    <div class="inp-lbl">备注</div>
    <textarea class="inp" id="ai-notes" placeholder="备注" style="margin-bottom:14px"></textarea>
    <button class="btn btn-p btn-full" onclick="submitAddItem(${dayIdx})">${t('save')}</button>
  `);
};

window.submitAddItem=async function(dayIdx){
  const title=$('#ai-title').value.trim();
  if(!title){toast('请输入活动名称');return;}
  const days=JSON.parse(JSON.stringify((S.trip?.days)||defaultDays()));
  const spend=$('#ai-spend').value!==''?parseFloat($('#ai-spend').value):null;
  days[dayIdx].items.push({
    id:'u_'+Date.now(),
    time:$('#ai-time').value.trim()||'',
    title,
    transport:$('#ai-trans').value.trim(),
    sMin:spend,sMax:spend,
    notes:$('#ai-notes').value.trim(),
    apps:[],type:'leisure',hi:false,urgent:false,lodge:'',bag:''
  });
  closeModal(); showLoad();
  await fbSaveDays(days);
  hideLoad(); if(S.trip) S.trip.days=days; renderItin(); toast(t('save'));
};

window.showAddDayModal=function(){
  showModal(`
    <div class="sh"></div>
    <div style="font-size:18px;font-weight:700;margin-bottom:14px">添加新一天</div>
    <div class="inp-lbl">日期</div>
    <input class="inp" id="ad-date" type="date" style="margin-bottom:10px">
    <div class="inp-lbl">标题</div>
    <input class="inp" id="ad-title" placeholder="例：抵达上海" style="margin-bottom:14px">
    <button class="btn btn-p btn-full" onclick="submitAddDay()">添加</button>
  `);
};

window.submitAddDay=async function(){
  const date=$('#ad-date').value;
  const title=$('#ad-title').value.trim()||'新的一天';
  if(!date){toast('请选择日期');return;}
  const days=JSON.parse(JSON.stringify((S.trip?.days)||defaultDays()));
  const d=new Date(date+'T12:00:00');
  const wds=['日','一','二','三','四','五','六'];
  days.push({date,month:String(d.getMonth()+1),day:String(d.getDate()),wd:wds[d.getDay()],title,items:[]});
  days.sort((a,b)=>a.date.localeCompare(b.date));
  closeModal(); showLoad();
  await fbSaveDays(days);
  hideLoad(); if(S.trip) S.trip.days=days; renderItin(); toast('已添加');
};

window.showTripEditModal=function(){
  const trip=S.trip||{};
  showModal(`
    <div class="sh"></div>
    <div style="font-size:18px;font-weight:700;margin-bottom:14px">行程信息</div>
    <div class="inp-lbl">行程名称</div>
    <input class="inp" id="te-name" value="${trip.name||''}" placeholder="我的旅行" style="margin-bottom:10px">
    <div class="inp-lbl">日期范围</div>
    <input class="inp" id="te-dates" value="${trip.dates||''}" placeholder="2026.05.22 — 05.27" style="margin-bottom:10px">
    <div class="inp-lbl">AI 导入行程（拍照 / 截图）</div>
    <button class="btn btn-g btn-full" style="margin-bottom:14px" onclick="importFromImage()">
      ${ic('camera',16)} 拍照/上传行程截图（AI 识别）
    </button>
    <button class="btn btn-p btn-full" onclick="saveTripInfo()" style="margin-bottom:8px">${t('save')}</button>
  `);
};

window.saveTripInfo=async function(){
  const name=$('#te-name').value.trim();
  const dates=$('#te-dates').value.trim();
  if(!S.trip) return;
  S.trip.name=name; S.trip.dates=dates;
  if(db&&S.tripCode) await updateDoc(doc(db,'trips',S.tripCode),{name,dates});
  _addLocalTrip(S.tripCode,name,dates);
  closeModal(); toast(t('save')); renderHome();
};

window.importFromImage=function(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/*,application/pdf';
  inp.onchange=async()=>{
    const file=inp.files[0]; if(!file) return;
    closeModal(); showLoad();
    const reader=new FileReader();
    reader.onload=async e=>{
      try{
        const b64=e.target.result;
        const days=await importItineraryFromImage(b64);
        if(!days||!days.length) throw new Error('无法识别行程');
        await fbSaveDays(days);
        if(S.trip) S.trip.days=days;
        hideLoad(); renderItin(); toast('行程导入成功，共'+days.length+'天');
      }catch(err){hideLoad();toast('识别失败：'+err.message);}
    };
    reader.readAsDataURL(file);
  };
  inp.click();
};

window.showTripCodeModal=function(){
  showModal(`
    <div class="sh"></div>
    <div style="font-size:20px;font-weight:700;margin-bottom:14px">${t('code')}</div>
    <div class="code-disp" style="margin-bottom:14px">${S.tripCode||'------'}</div>
    <div style="font-size:13px;color:var(--t2);text-align:center;margin-bottom:14px;line-height:1.6">${t('codeShare')}</div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-g" style="flex:1" onclick="copyCode()">${ic('copy',15)} ${t('copy')}</button>
      <button class="btn btn-p" style="flex:1" onclick="shareCode()">${ic('share',15)} ${t('share')}</button>
    </div>
  `);
};

window.copyCode=function(){
  navigator.clipboard?.writeText(S.tripCode||'').then(()=>toast('行程码已复制'));
};
window.shareCode=function(){
  if(navigator.share){navigator.share({title:'Travoo',text:'用行程码 '+S.tripCode+' 加入我的旅行',url:location.href});}
  else copyCode();
};

// ── EXPENSES ──────────────────────────────────────────────────
function renderExp(){
  const v=$('#v-exp'); if(!v) return;
  v.innerHTML=`
    <div class="nav">
      <div class="nav-title">${t('exp')}</div>
      <div class="nbtn" onclick="showAddExpenseModal()">${ic('plus',18)}</div>
    </div>
    <div class="scroller">
      <div style="height:14px"></div>
      <div class="sec">
        <div id="exp-summary"></div>
        <div class="ptabs" style="margin-bottom:14px" id="exp-tabs">
          <div class="ptab on" onclick="switchExpTab('list',this)">${t('detail')}</div>
          <div class="ptab" onclick="switchExpTab('settle',this)">${t('settle')}</div>
        </div>
        <div id="exp-list-pane"><div id="exp-list" class="list"></div></div>
        <div id="exp-settle-pane" style="display:none"><div id="exp-settle" class="list"></div></div>
      </div>
    </div>
    <button class="fab" onclick="showAddExpenseModal()">${ic('plus',22)}</button>`;
  refreshExpList();
}

window.switchExpTab=function(tab,el){
  $$('.ptab').forEach(t=>t.classList.remove('on')); el.classList.add('on');
  $('#exp-list-pane').style.display=tab==='list'?'block':'none';
  $('#exp-settle-pane').style.display=tab==='settle'?'block':'none';
  if(tab==='settle') renderSettle();
};

function refreshExpList(){
  const sum=$('#exp-summary'), list=$('#exp-list'); if(!sum||!list) return;
  const tot=S.expenses.reduce((a,e)=>a+(Number(e.amount)||0),0);
  const myP=S.expenses.filter(e=>e.memberId===S.memberId).reduce((a,e)=>a+(Number(e.amount)||0),0);
  sum.innerHTML=`
    <div class="exp-sum">
      <div class="estat"><div class="estat-lbl">${t('total')}</div><div class="estat-val" style="color:var(--red)">¥${tot.toFixed(0)}</div></div>
      <div class="estat"><div class="estat-lbl">${t('myPaid')}</div><div class="estat-val" style="color:var(--orange)">¥${myP.toFixed(0)}</div></div>
      <div class="estat"><div class="estat-lbl">${t('cnt')}</div><div class="estat-val">${S.expenses.length}</div></div>
    </div>`;
  if(!S.expenses.length){list.innerHTML=`<div class="empty">${ic('wallet',52)}<div class="empty-ttl">${t('noExp')}</div><div class="empty-sub">${t('noExpSub')}</div></div>`;return;}
  list.innerHTML=S.expenses.map(e=>`
    <div class="ei" onclick="showExpDetail('${e.id}')">
      <div class="ei-ic" style="background:${CAT_COLORS[e.category]||CAT_COLORS.other}">${ic(_catIcon(e.category),20)}</div>
      <div class="ei-d">
        <div class="ei-name">${e.description||t('other')}</div>
        <div class="ei-sub">${memberName(e.paidBy)} · ${_catLabel(e.category)} · ${e.date||''}</div>
      </div>
      <div class="ei-amt" style="color:${CAT_COLORS[e.category]||CAT_COLORS.other}">¥${Number(e.amount).toFixed(0)}</div>
    </div>`).join('');
}

function _catIcon(c){return{food:'food',transport:'car',attr:'map',act:'wallet'}[c]||'wallet';}
function _catLabel(c){return{food:t('food'),transport:t('transport'),attr:t('attr'),act:t('act')}[c]||t('other');}

function renderSettle(){
  const el=$('#exp-settle'); if(!el) return;
  const txns=calcSettle();
  if(!txns.length){el.innerHTML=`<div class="empty">${ic('check',52)}<div class="empty-ttl">已结清</div><div class="empty-sub">没有待结算款项</div></div>`;return;}
  el.innerHTML=txns.map(tx=>`
    <div class="srow">
      <div class="srow-from">
        <div class="srow-name">${memberName(tx.from)}</div>
        <div class="srow-to">转给 ${memberName(tx.to)}</div>
      </div>
      <div class="srow-amt">¥${tx.amount.toFixed(2)}</div>
    </div>`).join('');
}

window.showExpDetail=function(id){
  const e=S.expenses.find(x=>x.id===id); if(!e) return;
  const splitNames=(e.splitAmong||Object.keys(S.members)).map(id=>memberName(id)).join('、');
  showModal(`
    <div class="sh"></div>
    <div style="font-size:20px;font-weight:700;margin-bottom:4px">${e.description||t('other')}</div>
    <div style="font-size:36px;font-weight:800;color:var(--red);margin:10px 0">¥${Number(e.amount).toFixed(2)}</div>
    <div class="list" style="margin-bottom:14px">
      <div class="lr" style="cursor:default"><span class="lr-lbl">${t('paidBy')}</span><span class="lr-val">${memberName(e.paidBy)}</span></div>
      <div class="lr" style="cursor:default"><span class="lr-lbl">${t('splitW')}</span><span class="lr-val">${splitNames}</span></div>
      <div class="lr" style="cursor:default"><span class="lr-lbl">${t('date')}</span><span class="lr-val">${e.date||''}</span></div>
    </div>
    <button class="btn btn-d btn-full" onclick="fbDelExpense('${id}');closeModal();toast('已删除')">
      ${ic('trash',16)} ${t('del')}
    </button>`);
};

window.showAddExpenseModal=function(prefill={}){
  const memOpts=Object.entries(S.members).map(([id,m])=>`<option value="${id}" ${id===S.memberId?'selected':''}>${m.name}${id===S.memberId?' (你)':''}</option>`).join('');
  const memCBs=Object.entries(S.members).map(([id,m])=>`
    <label style="display:flex;align-items:center;gap:8px;padding:7px 0;cursor:pointer">
      <input type="checkbox" id="sp-${id}" checked style="width:18px;height:18px;border-radius:4px;flex-shrink:0">
      <div class="av" style="width:28px;height:28px;font-size:11px;background:${m.color}">${(m.name||'?')[0]}</div>
      ${m.name}${id===S.memberId?' (你)':''}
    </label>`).join('');
  showModal(`
    <div class="sh"></div>
    <div style="font-size:18px;font-weight:700;margin-bottom:14px">${t('addExpense')}</div>
    <div id="receipt-prev"></div>
    <button class="btn btn-g btn-full" style="margin-bottom:12px" onclick="captureReceipt()">
      ${ic('camera',16)} 拍照识别账单 (AI)
    </button>
    <div class="inp-lbl">${t('amount')}</div>
    <input class="inp" id="ex-amt" type="number" placeholder="0.00" value="${prefill.amount||''}" style="margin-bottom:10px;font-size:22px;font-weight:700">
    <div class="inp-lbl">${t('desc')}</div>
    <input class="inp" id="ex-desc" placeholder="午餐、打车费、门票..." value="${prefill.description||''}" style="margin-bottom:10px">
    <div class="inp-lbl">${t('cat')}</div>
    <div class="chips" id="cat-chips" style="margin-bottom:10px">
      ${['food','transport','attr','act','other'].map((c,i)=>`<div class="chip ${i===0?'on':''}" data-c="${c}" onclick="pickCat(this)">${_catLabel(c)}</div>`).join('')}
    </div>
    <div class="inp-lbl">${t('paidBy')}</div>
    <select class="inp" id="ex-payer" style="margin-bottom:10px">${memOpts}</select>
    <div class="inp-lbl">${t('splitW')}</div>
    <div style="margin-bottom:14px">${memCBs}</div>
    <button class="btn btn-p btn-full" onclick="submitExpense()">${t('save')}</button>`);
};

window.pickCat=function(el){
  $$('#cat-chips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
};

window.captureReceipt=function(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/*'; inp.capture='environment';
  inp.onchange=async()=>{
    const f=inp.files[0]; if(!f) return;
    toast('AI 识别中...',0);
    const rd=new FileReader();
    rd.onload=async e=>{
      const b64=e.target.result;
      const prev=$('#receipt-prev');
      if(prev) prev.innerHTML=`<img src="${b64}" style="width:100%;border-radius:var(--r2);margin-bottom:10px;max-height:180px;object-fit:cover">`;
      const r=await ocrReceipt(b64);
      toast('');
      if(r){
        if(r.amount) $('#ex-amt').value=r.amount;
        if(r.description) $('#ex-desc').value=r.description;
        if(r.category) $$('#cat-chips .chip').forEach(c=>c.classList.toggle('on',c.dataset.c===r.category));
        toast('识别成功，请确认');
      }else toast('识别失败，请手动填写');
    };
    rd.readAsDataURL(f);
  };
  inp.click();
};

window.submitExpense=function(){
  const amt=parseFloat($('#ex-amt').value);
  const desc=$('#ex-desc').value.trim();
  const cat=$('#cat-chips .chip.on')?.dataset.c||'other';
  const paidBy=$('#ex-payer').value;
  const split=Object.keys(S.members).filter(id=>$('#sp-'+id)?.checked);
  if(!amt||amt<=0){toast('请输入正确金额');return;}
  fbAddExpense({amount:amt,description:desc||t('other'),category:cat,paidBy,splitAmong:split,date:today()});
  closeModal(); toast('已记录');
};

// ── CHAT ──────────────────────────────────────────────────────
function renderChat(){
  const v=$('#v-chat'); if(!v) return;
  const hasCfg=!!(S.aiConfig.apiKey&&S.aiConfig.endpoint);
  const sugs=['今天有什么推荐','附近怎么打车','景点拍照技巧','今日花费分析','叫我准时出发提醒'];
  v.innerHTML=`
    <div class="nav">
      <div class="nav-title">${t('ai')}</div>
      <div class="nbtn" onclick="showAIConfig()">${ic('cog',16)}</div>
    </div>
    ${!hasCfg?`
    <div style="margin:0 16px 12px;padding:14px;background:rgba(255,159,10,.1);border:1px solid rgba(255,159,10,.25);border-radius:var(--r2)">
      <div style="font-size:14px;font-weight:700;color:var(--orange);margin-bottom:4px">${t('noCfg')}</div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:10px">${t('noCfgSub')}</div>
      <button class="btn btn-g" style="padding:8px 16px;font-size:13px" onclick="showAIConfig()">${t('cfgAI')}</button>
    </div>`:''}
    <div class="chat-body" id="chat-body">
      ${S.chatHistory.length===0?`
      <div style="text-align:center;padding:30px 0;animation:liIn .4s var(--sp2) both">
        <div style="width:60px;height:60px;background:var(--g2);border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">${ic('chat',28)}</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:6px">${t('aiWelcome')}</div>
        <div style="font-size:13px;color:var(--t2);line-height:1.6;white-space:pre-line">${t('aiWelcomeSub')}</div>
      </div>`:S.chatHistory.map(m=>renderMsg(m)).join('')}
    </div>
    <div class="csug-wrap" id="csug-wrap">
      ${sugs.map(s=>`<div class="csug" onclick="sendSug('${s}')">${s}</div>`).join('')}
    </div>
    <div class="chat-bar">
      <button class="cvbtn" id="vbtn" onmousedown="startVoiceFAB()" ontouchstart="startVoiceFAB()">${ic('mic',18)}</button>
      <textarea class="chat-inp-el" id="chat-inp" rows="1" placeholder="${t('aiPh')}"
        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendChatMsg()}"
        oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
      <button class="csend" id="csend" onclick="sendChatMsg()">${ic('send',18)}</button>
    </div>`;
  scrollChat();
}

function renderMsg(m){
  const isU=m.role==='user';
  const time=m.ts?.toDate?m.ts.toDate().toLocaleTimeString('zh',{hour:'2-digit',minute:'2-digit'}):'';
  return `<div class="msg ${isU?'msg-u':'msg-a'}">
    <div class="mbubble">${(m.content||'').replace(/\n/g,'<br>')}</div>
    ${time?`<div class="mmeta">${time}</div>`:''}
  </div>`;
}

function refreshChatMsgs(){
  const body=$('#chat-body'); if(!body) return;
  if(S.chatHistory.length) body.innerHTML=S.chatHistory.map(m=>renderMsg(m)).join('');
  scrollChat();
}

function scrollChat(){ const b=$('#chat-body'); if(b) setTimeout(()=>b.scrollTop=b.scrollHeight,60); }

window.sendSug=function(txt){
  const inp=$('#chat-inp'); if(inp){inp.value=txt;sendChatMsg();}
};

window.askAIAbout=function(title){
  switchTab('chat');
  setTimeout(()=>sendChatMsg('关于"'+title+'"，给我一些建议和注意事项'),300);
};

window.sendChatMsg=async function(forceTxt){
  const inp=$('#chat-inp'), btn=$('#csend'), body=$('#chat-body');
  const txt=forceTxt||(inp?.value.trim()||'');
  if(!txt) return;
  if(inp){inp.value='';inp.style.height='auto';}
  if(btn) btn.disabled=true;
  // Add user msg
  const uEl=document.createElement('div');
  uEl.className='msg msg-u';
  uEl.innerHTML=`<div class="mbubble">${txt.replace(/\n/g,'<br>')}</div>`;
  body?.appendChild(uEl);
  scrollChat();
  await fbSaveMsg('user',txt);
  // Typing
  const typEl=document.createElement('div');
  typEl.className='typing-wrap';
  typEl.innerHTML=`<div class="typing-bub"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>`;
  body?.appendChild(typEl);
  scrollChat();
  // Dismiss suggestions
  const sugWrap=$('#csug-wrap');
  if(sugWrap) sugWrap.style.display='none';
  try{
    const reply=await callAI(txt);
    typEl.remove();
    const aEl=document.createElement('div');
    aEl.className='msg msg-a';
    aEl.innerHTML=`<div class="mbubble">${reply.replace(/\n/g,'<br>')}</div>`;
    body?.appendChild(aEl);
    await fbSaveMsg('assistant',reply);
    scrollChat();
  }catch(e){
    typEl.remove();
    const errEl=document.createElement('div');
    errEl.className='msg msg-a';
    errEl.innerHTML=`<div class="mbubble" style="color:var(--red)">${e.message}</div>`;
    body?.appendChild(errEl);
    scrollChat();
    if(e.message.includes(t('noCfg'))||e.message.includes('noCfg')){
      setTimeout(()=>showAIConfig(),600);
    }
  }
  if(btn) btn.disabled=false;
};

window.showAIConfig=function(){
  const cfg=S.aiConfig;
  const used=S.tokenUsed;
  const pct=Math.min(100,(used/Math.max(S.tokenBudget*100,1))*100); // rough
  showModal(`
    <div class="sh"></div>
    <div style="font-size:18px;font-weight:700;margin-bottom:14px">${t('aiCfg')}</div>
    <div style="display:flex;gap:6px;margin-bottom:14px" id="preset-chips">
      <div class="chip" onclick="presetAI('openai',this)">OpenAI</div>
      <div class="chip" onclick="presetAI('poe',this)">Poe</div>
      <div class="chip" onclick="presetAI('custom',this)">自定义</div>
    </div>
    <div class="inp-lbl">${t('apiEp')}</div>
    <input class="inp" id="cfg-ep" value="${cfg.endpoint||''}" placeholder="https://api.openai.com/v1/chat/completions" style="margin-bottom:10px">
    <div class="inp-lbl">${t('apiKey')}</div>
    <input class="inp" id="cfg-key" type="password" value="${cfg.apiKey||''}" placeholder="sk-..." style="margin-bottom:10px">
    <div class="inp-lbl">${t('model')}</div>
    <input class="inp" id="cfg-model" value="${cfg.model||'gpt-4o-mini'}" placeholder="gpt-4o-mini" style="margin-bottom:14px">
    <div class="inp-lbl">${t('tokBudget')} (tokens)</div>
    <input class="inp" id="cfg-tok" type="number" value="${S.tokenBudget}" style="margin-bottom:6px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <span style="font-size:12px;color:var(--t3)">${t('tokUsed')}:</span>
      <div class="token-row" style="flex:1">
        <div class="token-track"><div class="token-fill" style="width:${pct}%;background:${pct>80?'var(--red)':'var(--green)'}"></div></div>
        <span style="font-size:12px;color:var(--t2);white-space:nowrap">${used.toLocaleString()}</span>
      </div>
      <div class="chip" style="padding:4px 10px;font-size:12px" onclick="S.tokenUsed=0;localStorage.removeItem('tokenUsed');toast('已重置');closeModal()">重置</div>
    </div>
    <button class="btn btn-p btn-full" onclick="saveAICfg()" style="margin-bottom:8px">${t('saveCfg')}</button>
    ${cfg.apiKey?`<button class="btn btn-g btn-full" onclick="clearAICfg()">${t('del')}配置</button>`:''}
    <div style="margin-top:12px;font-size:12px;color:var(--t4);text-align:center">配置仅存在本设备，不上传云端</div>
  `);
};

window.presetAI=function(p,el){
  $$('#preset-chips .chip').forEach(c=>c.classList.remove('on'));el.classList.add('on');
  if(p==='openai'){$('#cfg-ep').value='https://api.openai.com/v1/chat/completions';$('#cfg-model').value='gpt-4o-mini';}
  if(p==='poe'){$('#cfg-ep').value='https://api.poe.com/bot/chat_completions';$('#cfg-model').value='GPT-4o-mini';}
};

window.saveAICfg=function(){
  const ep=$('#cfg-ep').value.trim(), key=$('#cfg-key').value.trim(), model=$('#cfg-model').value.trim();
  const tok=parseInt($('#cfg-tok').value)||4000;
  if(!ep||!key){toast('请填写端点和 Key');return;}
  S.aiConfig={endpoint:ep,apiKey:key,model:model||'gpt-4o-mini'};
  S.tokenBudget=tok;
  localStorage.setItem('aiConfig',JSON.stringify(S.aiConfig));
  localStorage.setItem('tokenBudget',tok);
  closeModal(); toast('AI 配置已保存'); renderChat();
};

window.clearAICfg=function(){
  S.aiConfig={}; localStorage.removeItem('aiConfig');
  closeModal(); renderChat();
};

// ── SETTINGS ──────────────────────────────────────────────────
function renderSet(){
  const v=$('#v-set'); if(!v) return;
  const memArr=Object.entries(S.members||{});
  v.innerHTML=`
    <div class="nav">
      <div class="nav-large">${t('set')}</div>
    </div>
    <div class="scroller">
      <div style="height:12px"></div>
      <div class="sec">
        <div class="sec-ttl">${t('code')}</div>
        <div class="code-disp">${S.tripCode||'------'}</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-g" style="flex:1" onclick="copyCode()">${ic('copy',15)} ${t('copy')}</button>
          <button class="btn btn-g" style="flex:1" onclick="shareCode()">${ic('share',15)} ${t('share')}</button>
        </div>
      </div>
      <div class="sec">
        <div class="sec-ttl">${t('members')}</div>
        <div class="list" id="mem-list">
          ${memArr.map(([id,m])=>`
            <div class="lr">
              <div class="av" style="background:${m.color}">${(m.name||'?')[0]}</div>
              <span class="lr-lbl">${m.name}</span>
              ${id===S.memberId?'<span class="you-tag">你</span>':''}
            </div>`).join('')}
        </div>
        <button class="btn btn-g btn-full" style="margin-top:8px" onclick="showAddMember()">
          ${ic('plus',15)} 添加成员
        </button>
      </div>
      <div class="sec">
        <div class="sec-ttl">${t('lang')}</div>
        <div class="chips">
          ${['zh-CN','zh-TW','en'].map(l=>`<div class="chip ${S.lang===l?'on':''}" onclick="setLang('${l}')">${l}</div>`).join('')}
        </div>
      </div>
      <div class="sec">
        <div class="sec-ttl">${t('wp')}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-g" style="flex:1" onclick="pickWallpaper()">
            ${ic('img',15)} 从相册选取
          </button>
          <button class="btn btn-g" style="flex:1" onclick="clearWallpaper()">
            重置默认
          </button>
        </div>
      </div>
      <div class="sec">
        <div class="sec-ttl">${t('msgApp')}</div>
        <div class="chips">
          ${MSG_APPS.map(a=>`<div class="chip ${S.msgApp===a?'on':''}" onclick="setMsgApp('${a}')">${APPS[a].label}</div>`).join('')}
        </div>
      </div>
      <div class="sec">
        <div class="sec-ttl">${t('aiCfg')}</div>
        <div class="list">
          <div class="lr" onclick="showAIConfig()">
            <span class="lr-lbl">AI 配置</span>
            <span class="lr-val">${S.aiConfig.model||'未配置'}</span>
            <span class="lr-chev">${ic('chev',16)}</span>
          </div>
          <div class="lr" onclick="S.chatHistory=[];toast('对话已清除')">
            <span class="lr-lbl">清除对话记录</span>
            <span class="lr-chev">${ic('chev',16)}</span>
          </div>
        </div>
      </div>
      <div class="sec">
        <div class="sec-ttl">${t('notif')}</div>
        <div class="list">
          <div class="lr" style="cursor:default">
            <span class="lr-lbl">行程提醒</span>
            <label class="toggle">
              <input type="checkbox" ${localStorage.getItem('notifsEnabled')!=='false'?'checked':''} 
                onchange="localStorage.setItem('notifsEnabled',this.checked)">
              <span class="tsl"></span>
            </label>
          </div>
          <div class="lr" onclick="requestGeo();toast('已获取位置权限')">
            <span class="lr-lbl">${t('locationAllow')}</span>
            <span class="lr-val">${S.geo?'已获取':'未获取'}</span>
            <span class="lr-chev">${ic('chev',16)}</span>
          </div>
        </div>
      </div>
      <div class="sec">
        <div class="sec-ttl">${t('about')}</div>
        <div class="list">
          <div class="lr" style="cursor:default"><span class="lr-lbl">版本</span><span class="lr-val">3.0.0</span></div>
          <div class="lr" style="cursor:default"><span class="lr-lbl">行程</span><span class="lr-val">${S.trip?.name||'—'}</span></div>
          <div class="lr" style="cursor:default"><span class="lr-lbl">Firebase</span><span class="lr-val">${fbReady()?'已连接':'本地模式'}</span></div>
        </div>
      </div>
      <div class="sec" style="padding-bottom:20px">
        <button class="btn btn-d btn-full" onclick="confirmLeave()">${t('leave')}</button>
      </div>
    </div>`;
}

window.setMsgApp=function(a){S.msgApp=a;localStorage.setItem('msgApp',a);renderSet();};

window.pickWallpaper=function(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/*';
  inp.onchange=()=>{
    const f=inp.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=e=>{
      try{localStorage.setItem('wallpaper',e.target.result);}
      catch(err){toast('图片过大，请选较小图片');return;}
      applyWallpaper(); toast('壁纸已更新');
    };
    rd.readAsDataURL(f);
  };
  inp.click();
};

window.clearWallpaper=function(){
  localStorage.removeItem('wallpaper'); applyWallpaper(); toast('已重置壁纸');
};

window.showAddMember=function(){
  showModal(`
    <div class="sh"></div>
    <div style="font-size:18px;font-weight:700;margin-bottom:14px">添加成员</div>
    <div class="inp-lbl">成员名字</div>
    <input class="inp" id="nm-name" placeholder="例：Aa、小宁、婉婉" style="margin-bottom:14px">
    <button class="btn btn-p btn-full" onclick="submitAddMember()">添加</button>
  `);
};

window.submitAddMember=async function(){
  const name=$('#nm-name').value.trim();
  if(!name){toast('请输入名字');return;}
  const id='u_'+Date.now();
  const used=Object.values(S.members).map(m=>m.color);
  const color=COLORS.find(c=>!used.includes(c))||COLORS[0];
  if(db&&S.tripCode) await updateDoc(doc(db,'trips',S.tripCode),{[`members.${id}`]:{name,color,joinedAt:serverTimestamp()}});
  S.members[id]={name,color};
  closeModal(); renderSet(); toast('已添加：'+name);
};

window.confirmLeave=function(){
  showModal(`
    <div class="sh"></div>
    <div style="font-size:18px;font-weight:700;margin-bottom:8px">退出行程</div>
    <div style="font-size:14px;color:var(--t2);margin-bottom:18px">退出后需重新输入行程码才能访问</div>
    <button class="btn btn-d btn-full" onclick="leaveTrip()" style="margin-bottom:8px">确认退出</button>
    <button class="btn btn-g btn-full" onclick="closeModal()">${t('cancel')}</button>
  `);
};

window.leaveTrip=function(){
  S.unsubs.forEach(u=>u()); S.unsubs=[];
  ['tripCode','memberId','memberName'].forEach(k=>localStorage.removeItem(k));
  S.tripCode=S.memberId=S.memberName=null;
  S.trip=null; S.members={}; S.expenses=[]; S.chatHistory=[];
  closeModal(); renderApp();
};

// ── INIT ──────────────────────────────────────────────────────
async function init(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(e=>console.warn('[SW]',e));
  }
  applyWallpaper();
  if(S.tripCode&&S.memberId){
    showLoad();
    await fbLoadTrip(S.tripCode);
    hideLoad();
  }
  renderApp();
  if('Notification' in window && localStorage.getItem('notifsEnabled')!=='false'){
    if(Notification.permission==='default') Notification.requestPermission();
  }
}
init();