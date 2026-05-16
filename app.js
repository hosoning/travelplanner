// ═══════════════════════════════════════════════════════════════
// Travoo v9 — app.js
// ═══════════════════════════════════════════════════════════════
import { initializeApp }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, orderBy, limit, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FB_CFG={
  apiKey:"AIzaSyCyimwLDWNx92ihDmdHTdFSw4A8g34lPWI",
  authDomain:"travoo-com.firebaseapp.com",projectId:"travoo-com",
  storageBucket:"travoo-com.firebasestorage.app",
  messagingSenderId:"544581218382",appId:"1:544581218382:web:cb0511ab135f15a252931f"
};
function fbReady(){ return !!(FB_CFG.apiKey&&!FB_CFG.apiKey.startsWith('YOUR_')); }
var fbApp,db;
if(fbReady()){
  try{ fbApp=initializeApp(FB_CFG); db=getFirestore(fbApp); console.info('[Travoo] Firebase OK'); }
  catch(e){ console.warn('[FB]',e.message); }
}

if(!localStorage.getItem('deviceId'))
  localStorage.setItem('deviceId','dev_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36));
var DEVICE_ID=localStorage.getItem('deviceId');

// ── THEMES ───────────────────────────────────────────────────
const THEMES={
  dark:   {name:'Dark',   mode:'dark', bg:'linear-gradient(158deg,#1a1610 0%,#111318 52%,#13100f 100%)',accent:'#ffffff',accentRgb:'255,255,255',swatch:'#333'},
  purple: {name:'Purple', mode:'dark', bg:'linear-gradient(158deg,#0d0011 0%,#16002a 52%,#0a0016 100%)',accent:'#BF5AF2',accentRgb:'191,90,242',swatch:'#6a0dad'},
  ocean:  {name:'Ocean',  mode:'dark', bg:'linear-gradient(158deg,#001524 0%,#002030 52%,#001018 100%)',accent:'#00C7BE',accentRgb:'0,199,190',swatch:'#006d6b'},
  forest: {name:'Forest', mode:'dark', bg:'linear-gradient(158deg,#001209 0%,#002015 52%,#000d08 100%)',accent:'#30D158',accentRgb:'48,209,88',swatch:'#1a6b2e'},
  sunset: {name:'Sunset', mode:'dark', bg:'linear-gradient(158deg,#1a0800 0%,#2a1200 52%,#150600 100%)',accent:'#FF9F0A',accentRgb:'255,159,10',swatch:'#8b4f00'},
  rose:   {name:'Rose',   mode:'dark', bg:'linear-gradient(158deg,#1a0010 0%,#2a0020 52%,#150008 100%)',accent:'#FF375F',accentRgb:'255,55,95',swatch:'#8b0030'},
  indigo: {name:'Indigo', mode:'dark', bg:'linear-gradient(158deg,#00081a 0%,#001030 52%,#000818 100%)',accent:'#0A84FF',accentRgb:'10,132,255',swatch:'#003080'},
  warm:   {name:'Warm',   mode:'dark', bg:'linear-gradient(158deg,#12100d 0%,#1e1a14 52%,#0e0c08 100%)',accent:'#D2A55F',accentRgb:'210,165,95',swatch:'#7a5c28'},
  lsilver:{name:'Silver', mode:'light',bg:'#eeeff2',accent:'#5856D6',accentRgb:'88,86,214',swatch:'#c8c8d4',lightKey:'silver'},
  livory: {name:'Ivory',  mode:'light',bg:'#f5f0e8',accent:'#FF6B35',accentRgb:'255,107,53',swatch:'#d4c4a8',lightKey:'ivory'},
  lsky:   {name:'Sky',    mode:'light',bg:'#e8f0f5',accent:'#007AFF',accentRgb:'0,122,255',swatch:'#a8c4d4',lightKey:'sky'},
  lmint:  {name:'Mint',   mode:'light',bg:'#e8f5ee',accent:'#34C759',accentRgb:'52,199,89',swatch:'#a8d4b4',lightKey:'mint'},
  auto:   {name:'Auto',   mode:'auto', bg:'',accent:'#007AFF',accentRgb:'0,122,255',swatch:'auto'},
};

window.applyTheme=function(key){
  var theme=THEMES[key]||THEMES.dark;
  var html=document.documentElement;
  html.setAttribute('data-color-mode',theme.mode);
  if(theme.lightKey) html.setAttribute('data-theme-light',theme.lightKey);
  else html.removeAttribute('data-theme-light');
  var wp=document.getElementById('wp');
  if(wp&&!localStorage.getItem('wallpaper')&&theme.mode==='dark') wp.style.background=theme.bg;
  document.documentElement.style.setProperty('--theme-accent',theme.accent);
  document.documentElement.style.setProperty('--theme-accent-rgb',theme.accentRgb);
  if(theme.mode==='light') document.body.style.background=theme.bg;
  else if(theme.mode==='dark') document.body.style.background='';
  else document.body.style.background='';
  localStorage.setItem('theme',key); S.theme=key;
};

// ── CURRENCIES ───────────────────────────────────────────────
const CURRENCY_LIST={
  CNY:{symbol:'¥',  name:'人民币 CNY',flag:'🇨🇳',decimals:2},
  HKD:{symbol:'HK$',name:'港元 HKD',  flag:'🇭🇰',decimals:2},
  KRW:{symbol:'₩',  name:'韩元 KRW',  flag:'🇰🇷',decimals:0},
  JPY:{symbol:'¥',  name:'日元 JPY',  flag:'🇯🇵',decimals:0},
  USD:{symbol:'$',  name:'美元 USD',  flag:'🇺🇸',decimals:2},
  EUR:{symbol:'€',  name:'欧元 EUR',  flag:'🇪🇺',decimals:2},
  TWD:{symbol:'NT$',name:'台币 TWD',  flag:'🇹🇼',decimals:0},
  SGD:{symbol:'S$', name:'新加坡元',  flag:'🇸🇬',decimals:2},
  THB:{symbol:'฿',  name:'泰铢 THB',  flag:'🇹🇭',decimals:2},
  GBP:{symbol:'£',  name:'英镑 GBP',  flag:'🇬🇧',decimals:2},
  AUD:{symbol:'A$', name:'澳元 AUD',  flag:'🇦🇺',decimals:2},
  MYR:{symbol:'RM', name:'令吉 MYR',  flag:'🇲🇾',decimals:2},
};
async function fetchRates(){
  try{
    var res=await fetch('https://open.er-api.com/v6/latest/'+S.baseCurrency);
    if(!res.ok) throw new Error('HTTP '+res.status);
    var data=await res.json();
    if(data.result==='success'){
      S.rates=data.rates; S.fxBase=S.baseCurrency;
      S.fxDate=data.time_last_update_utc||'';
      localStorage.setItem('fxRates',JSON.stringify(S.rates));
      localStorage.setItem('fxBase',S.fxBase);
      localStorage.setItem('fxDate',S.fxDate);
      return true;
    }
    return false;
  }catch(e){ console.warn('[FX]',e.message); return false; }
}
function getRate(from,to){ if(from===to) return 1; var r=S.rates,b=S.fxBase; if(!r||!Object.keys(r).length) return 1; if(from===b) return r[to]||1; if(to===b) return r[from]?1/r[from]:1; if(r[from]&&r[to]) return r[to]/r[from]; return 1; }
function fmtCurrency(amount,currency){ var c=CURRENCY_LIST[currency]||{symbol:currency,decimals:2}; var n=c.decimals===0?Math.round(amount):parseFloat(amount).toFixed(c.decimals); return c.symbol+(c.decimals===0?Number(n).toLocaleString():n); }
function toBase(amount,fromCurrency){ return amount*getRate(fromCurrency,S.baseCurrency); }

// ── WEATHER ──────────────────────────────────────────────────
// FIX #4: Complete SVG icons with stroke="currentColor"
const WX_SVG={
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  cloudsun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M4.22 4.22l1.42 1.42M2 12h2M19.07 4.93l-1.41 1.41"/><path d="M17.5 12a5.5 5.5 0 10-11 0H4a3 3 0 000 6h14a3 3 0 100-6h-.5z"/></svg>',
  cloud:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>',
  rain:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/><line x1="8" y1="19" x2="8" y2="23"/><line x1="8" y1="19" x2="8" y2="19"/><line x1="16" y1="16" x2="16" y2="20"/><line x1="12" y1="21" x2="12" y2="23"/></svg>',
  snow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 15.25"/><line x1="12" y1="14" x2="12" y2="20"/><polyline points="9 17 12 20 15 17"/><polyline points="9 20 12 17 15 20"/></svg>',
  thunder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 16.9A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/><polyline points="13 11 9 17 13 17 9 23"/></svg>',
  fog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="5" y1="18" x2="19" y2="18"/></svg>',
  drizzle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/><line x1="8" y1="19" x2="9" y2="21"/><line x1="12" y1="17" x2="13" y2="19"/><line x1="16" y1="19" x2="17" y2="21"/></svg>',
};
const WMO_MAP={
  0:'sun',1:'sun',2:'cloudsun',3:'cloud',
  45:'fog',48:'fog',
  51:'drizzle',53:'drizzle',55:'drizzle',
  61:'rain',63:'rain',65:'rain',
  66:'snow',67:'snow',71:'snow',73:'snow',75:'snow',77:'snow',
  80:'rain',81:'rain',82:'thunder',
  85:'snow',86:'snow',
  95:'thunder',96:'thunder',99:'thunder',
};
// FIX #4: Add stroke="currentColor" via function
function wxSvg(code,size){
  var key=WMO_MAP[code]||'sun';
  var s=WX_SVG[key]||WX_SVG.sun;
  return s.replace('<svg ','<svg width="'+(size||20)+'" height="'+(size||20)+'" ');
}
const WMO_DESC={
  'zh-CN':{0:'晴朗',1:'基本晴',2:'多云',3:'阴天',45:'有雾',51:'小毛雨',61:'小雨',63:'中雨',65:'大雨',71:'小雪',73:'中雪',80:'阵雨',95:'雷阵雨'},
  'zh-TW':{0:'晴朗',1:'基本晴',2:'多雲',3:'陰天',45:'有霧',61:'小雨',63:'中雨',65:'大雨',71:'小雪',80:'陣雨',95:'雷陣雨'},
  'en':{0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',51:'Light drizzle',61:'Light rain',63:'Moderate rain',65:'Heavy rain',71:'Light snow',73:'Moderate snow',80:'Showers',95:'Thunderstorm'},
};
function wxDesc(code){ var m=WMO_DESC[S.lang]||WMO_DESC['en']; return m[code]||m[0]||'Clear'; }

// Clothing icons (SVG-based)
const CLOTH_SVG={
  jacket:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 00-.78-1.58L14 7l-2 2-2-2-5.22 4.42A2 2 0 004 13v8h4v-5h8v5z"/></svg>',
  tshirt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>',
  umbrella:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 12a11.05 11.05 0 00-22 0zm-5 7a3 3 0 01-6 0v-7"/></svg>',
  hat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M5 20v-8a7 7 0 0114 0v8"/><path d="M9 10a3 3 0 006 0"/></svg>',
  gloves:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 00-4 0v5M14 10V4a2 2 0 00-4 0v6M10 10.5V6a2 2 0 00-4 0v8a6 6 0 0012 0v-3a2 2 0 00-4 0"/></svg>',
  scarf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6c0 0 2-2 8-2s8 2 8 2v5c0 2-3 3-8 3S4 13 4 11V6z"/><path d="M12 14v8"/></svg>',
  bottle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4l-2 3v11a2 2 0 002 2h8a2 2 0 002-2V9l-2-3V2"/><line x1="8" y1="2" x2="16" y2="2"/><line x1="8" y1="13" x2="16" y2="13"/></svg>',
  spf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="20" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/></svg>',
};
function clothSvg(key,sz){ var s=CLOTH_SVG[key]||CLOTH_SVG.tshirt; return s.replace('<svg ','<svg width="'+(sz||14)+'" height="'+(sz||14)+'" '); }

function getClothingRecs(tMax,tMin,precipProb,windSpeed){
  var avg=(tMax+tMin)/2,recs=[],en=S.lang==='en';
  if(avg<0)    recs=[['jacket',en?'Heavy down jacket':'厚羽绒服'],['gloves',en?'Gloves':'手套'],['scarf',en?'Scarf':'围巾']];
  else if(avg<8)  recs=[['jacket',en?'Down jacket':'羽绒服'],['gloves',en?'Gloves':'手套'],['scarf',en?'Scarf':'围巾']];
  else if(avg<14) recs=[['jacket',en?'Heavy coat':'厚外套'],['tshirt',en?'Layering':'叠穿']];
  else if(avg<20) recs=[['jacket',en?'Light jacket':'薄外套'],['tshirt',en?'Long sleeve':'长袖']];
  else if(avg<26) recs=[['tshirt',en?'T-shirt':'T恤'],['jacket',en?'Evening jacket':'晚备外套']];
  else            recs=[['tshirt',en?'Light top':'薄上衣'],['hat',en?'Sun hat':'防晒帽'],['spf',en?'SPF50+':'防晒霜']];
  if(precipProb>35) recs.push(['umbrella',en?'Umbrella':'雨伞']);
  if(avg>30) recs.push(['bottle',en?'Stay hydrated':'多喝水']);
  return recs.slice(0,5);
}

async function fetchWeather(){
  if(!S.geo) return;
  try{
    // FIX #4: 7 days
    var url='https://api.open-meteo.com/v1/forecast?latitude='+S.geo.lat+'&longitude='+S.geo.lon+
      '&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m'+
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode'+
      '&timezone=auto&forecast_days=7&wind_speed_unit=kmh';
    var res=await fetch(url); if(!res.ok) throw new Error('HTTP '+res.status);
    S.weather=await res.json();
    localStorage.setItem('wxCache',JSON.stringify({data:S.weather,ts:Date.now()}));
    if(S.tab==='home') renderHome();
  }catch(e){ console.warn('[Weather]',e.message); }
}

function renderWeatherWidget(){
  var en=S.lang==='en';
  if(!S.geo){
    return '<div class="wx-widget" onclick="reqGeoWeather()" style="padding:12px 14px;display:flex;align-items:center;gap:12px">'+
      '<div style="width:36px;height:36px;background:rgba(var(--sf),.08);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--t2)">'+wxSvg(1,18)+'</div>'+
      '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--t1)">'+(en?'Tap to enable weather':'开启位置获取天气')+'</div>'+
      '<div style="font-size:11px;color:var(--t3)">'+(en?'Clothing tips & 7-day forecast':'穿搭建议 · 7天预报')+'</div></div>'+
      '<div class="btn-label">'+(en?'Allow':'允许')+'</div>'+
    '</div>';
  }
  if(!S.weather){
    return '<div class="wx-widget" style="padding:12px 14px;display:flex;align-items:center;gap:10px">'+
      '<div style="width:36px;height:36px;background:rgba(var(--sf),.08);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--t2)">'+wxSvg(1,18)+'</div>'+
      '<div style="font-size:13px;color:var(--t2)">'+(en?'Loading weather…':'天气加载中…')+'</div>'+
    '</div>';
  }
  var cur=S.weather.current,daily=S.weather.daily;
  if(!cur||!daily) return '';
  var temp=Math.round(cur.temperature_2m),wind=Math.round(cur.windspeed_10m),hum=cur.relative_humidity_2m;
  var desc=wxDesc(cur.weathercode);
  var wdsEN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],wdsZH=['日','一','二','三','四','五','六'];
  // 7-day forecast
  var fHtml='';
  var fLen=Math.min(7,daily.time.length);
  for(var i=0;i<fLen;i++){
    var d=new Date(daily.time[i]+'T12:00:00');
    var dl=i===0?(en?'Today':'今天'):(en?wdsEN[d.getDay()]:'周'+wdsZH[d.getDay()]);
    var prec=daily.precipitation_probability_mean[i]||0;
    fHtml+='<div class="wx-fday">'+
      '<div style="font-size:9px;color:var(--t3);margin-bottom:2px">'+dl+'</div>'+
      '<div style="display:flex;justify-content:center;color:var(--t2)">'+wxSvg(daily.weathercode[i],14)+'</div>'+
      '<div style="font-size:11px;font-weight:600;color:var(--t1);margin-top:1px">'+Math.round(daily.temperature_2m_max[i])+'°</div>'+
      '<div style="font-size:9px;color:var(--t3)">'+Math.round(daily.temperature_2m_min[i])+'°</div>'+
      (prec>20?'<div style="font-size:9px;color:#60a0ff">'+prec+'%</div>':'')+
    '</div>';
  }
  var tMax=daily.temperature_2m_max[0],tMin=daily.temperature_2m_min[0];
  var prec0=daily.precipitation_probability_mean[0]||0;
  var clothes=getClothingRecs(tMax,tMin,prec0,wind);
  var cHtml=clothes.map(function(c){ return '<div class="wx-pill">'+clothSvg(c[0],12)+' <span>'+escHtml(c[1])+'</span></div>'; }).join('');

  return '<div class="wx-widget" onclick="showWeatherDetail()">'+
    '<div class="wx-row">'+
      '<div style="flex:1">'+
        '<div style="font-size:11px;color:var(--t3);margin-bottom:4px">'+(en?'Local Weather':'当地天气')+'</div>'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<div style="color:var(--t1)">'+wxSvg(cur.weathercode,34)+'</div>'+
          '<div>'+
            '<div style="font-size:26px;font-weight:700;line-height:1;color:var(--t1)">'+temp+'°C</div>'+
            '<div style="font-size:11px;color:var(--t2)">'+desc+' · '+hum+'%</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="wx-forecast" style="display:flex;gap:0;flex:1;max-width:200px">'+fHtml+'</div>'+
    '</div>'+
    (cHtml?'<div class="wx-clothes">'+cHtml+'</div>':'')+
  '</div>';
}

window.reqGeoWeather=function(){ requestGeo(); setTimeout(function(){ if(S.geo) fetchWeather(); else toast(S.lang==='en'?'Allow location first':'请先允许位置权限'); },1200); };

window.showWeatherDetail=function(){
  if(!S.weather) return;
  var cur=S.weather.current,daily=S.weather.daily,en=S.lang==='en';
  if(!cur||!daily) return;
  var temp=Math.round(cur.temperature_2m),wind=Math.round(cur.windspeed_10m);
  var tMax=daily.temperature_2m_max[0],tMin=daily.temperature_2m_min[0],prec0=daily.precipitation_probability_mean[0]||0;
  var clothes=getClothingRecs(tMax,tMin,prec0,wind);
  var wdsEN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],wdsZH=['日','一','二','三','四','五','六'];
  var fLen=Math.min(7,daily.time.length);
  var fRows='';
  for(var i=0;i<fLen;i++){
    var d=new Date(daily.time[i]+'T12:00:00');
    var dl=i===0?(en?'Today':'今天'):(en?wdsEN[d.getDay()]:'周'+wdsZH[d.getDay()]);
    var prec=daily.precipitation_probability_mean[i]||0;
    fRows+='<div class="lr" style="cursor:default">'+
      '<div style="color:var(--t2)">'+wxSvg(daily.weathercode[i],22)+'</div>'+
      '<span class="lr-lbl" style="font-size:14px">'+dl+'</span>'+
      '<span class="lr-val">'+Math.round(daily.temperature_2m_min[i])+'° – '+Math.round(daily.temperature_2m_max[i])+'°C</span>'+
      (prec>15?'<span style="font-size:12px;color:#60a0ff;margin-left:6px">'+prec+'%</span>':'')+
    '</div>';
  }
  var cDiv=clothes.map(function(c){ return '<div style="padding:6px 12px;background:rgba(var(--sf),.07);border-radius:100px;font-size:13px;color:var(--t1);display:flex;align-items:center;gap:6px">'+clothSvg(c[0],14)+' '+c[1]+'</div>'; }).join('');
  showModal(
    '<div class="sh"></div>'+
    '<div style="text-align:center;padding:8px 0 16px">'+
      '<div style="margin:0 auto;width:64px;height:64px;background:rgba(var(--sf),.08);border-radius:18px;display:flex;align-items:center;justify-content:center;color:var(--t1)">'+wxSvg(cur.weathercode,34)+'</div>'+
      '<div style="font-size:40px;font-weight:800;margin:8px 0 2px;color:var(--t1)">'+temp+'°C</div>'+
      '<div style="font-size:14px;color:var(--t2)">'+wxDesc(cur.weathercode)+'</div>'+
      '<div style="font-size:12px;color:var(--t3);margin-top:3px">'+cur.relative_humidity_2m+'% · '+wind+'km/h</div>'+
    '</div>'+
    '<div class="sec-ttl" style="margin-bottom:8px">'+(en?'7-Day Forecast':'7天预报')+'</div>'+
    '<div class="list" style="margin-bottom:14px">'+fRows+'</div>'+
    '<div class="sec-ttl" style="margin-bottom:8px">'+(en?'What to wear today':'今日穿搭建议')+'</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:8px">'+cDiv+'</div>'
  );
};

// ── REGION + APP CATALOG ──────────────────────────────────────
const ALL_APPS={
  didi:       {label:'滴滴出行',   labelEN:'DiDi',      scheme:'diditaxi://',            web:'https://www.didiglobal.com',          icon:'car'},
  baidu:      {label:'百度地图',   labelEN:'Baidu Maps',scheme:'baidumap://',             web:'https://map.baidu.com',               icon:'map'},
  meituan:    {label:'美团外卖',   labelEN:'Meituan',   scheme:'imeituan://',             web:'https://www.meituan.com',             icon:'food'},
  dianping:   {label:'大众点评',   labelEN:'Dianping',  scheme:'dianping://',             web:'https://m.dianping.com',              icon:'food'},
  fliggy:     {label:'飞猪旅行',   labelEN:'Fliggy',    scheme:'taobao://',               web:'https://www.fliggy.com',              icon:'plane'},
  '12306':    {label:'12306',      labelEN:'12306',     scheme:'cn.12306://',             web:'https://m.12306.cn',                  icon:'train'},
  xiaohongshu:{label:'小红书',     labelEN:'RedNote',   scheme:'xhsdiscover://search?keyword=',web:'https://www.xiaohongshu.com/search_result?keyword=',icon:'xhs'},
  wechat:     {label:'微信',       labelEN:'WeChat',    scheme:'weixin://',               web:'https://weixin.qq.com',               icon:'msg'},
  alipayhk:   {label:'AlipayHK',  labelEN:'AlipayHK',  scheme:'alipayhk://',             web:'https://www.alipayhk.com',            icon:'wallet'},
  alipay:     {label:'支付宝',     labelEN:'Alipay',    scheme:'alipay://',               web:'https://www.alipay.com',              icon:'wallet'},
  googlemaps: {label:'Google地图', labelEN:'Google Maps',scheme:'comgooglemaps://',       web:'https://maps.google.com',             icon:'map'},
  uber:       {label:'Uber',       labelEN:'Uber',      scheme:'uber://',                 web:'https://m.uber.com',                  icon:'car'},
  foodpanda:  {label:'Foodpanda',  labelEN:'Foodpanda', scheme:'foodpanda://',            web:'https://www.foodpanda.com',           icon:'food'},
  grab:       {label:'Grab',       labelEN:'Grab',      scheme:'grab://',                 web:'https://www.grab.com',                icon:'car'},
  agoda:      {label:'Agoda',      labelEN:'Agoda',     scheme:'agoda://',                web:'https://www.agoda.com',               icon:'plane'},
  airbnb:     {label:'Airbnb',     labelEN:'Airbnb',    scheme:'airbnb://',               web:'https://www.airbnb.com',              icon:'home'},
  klook:      {label:'Klook',      labelEN:'Klook',     scheme:'klook://',                web:'https://www.klook.com',               icon:'bag'},
  kkday:      {label:'KKday',      labelEN:'KKday',     scheme:'kkday://',                web:'https://www.kkday.com',               icon:'bag'},
  ctrip:      {label:'携程旅行',   labelEN:'Trip.com',  scheme:'ctrip://',                web:'https://www.trip.com',                icon:'plane'},
  navermap:   {label:'Naver地图',  labelEN:'Naver Map', scheme:'nmap://',                 web:'https://map.naver.com',               icon:'map'},
  kakaotaxi:  {label:'Kakao T',    labelEN:'Kakao T',   scheme:'kakaotaxi://',            web:'https://t.kakao.com',                 icon:'car'},
  baemin:     {label:'배달의민족', labelEN:'Baemin',    scheme:'baemin://',               web:'https://www.baemin.com',              icon:'food'},
  mtr:        {label:'港铁',       labelEN:'MTR',       scheme:'mtr://',                  web:'https://www.mtr.com.hk',              icon:'train'},
  octopus:    {label:'八达通',     labelEN:'Octopus',   scheme:'octopuscard://',          web:'https://www.octopus.com.hk',          icon:'wallet'},
  payme:      {label:'PayMe',      labelEN:'PayMe',     scheme:'payme://',                web:'https://payme.hsbc.com.hk',           icon:'wallet'},
  whatsapp:   {label:'WhatsApp',   labelEN:'WhatsApp',  scheme:'whatsapp://send?text=',   web:'https://api.whatsapp.com/send?text=', icon:'msg'},
  line:       {label:'LINE',       labelEN:'LINE',      scheme:'line://msg/text/',        web:'https://line.me/R/msg/text/?',        icon:'msg'},
  telegram:   {label:'Telegram',   labelEN:'Telegram',  scheme:'tg://msg?text=',          web:'https://t.me/share/url?text=',        icon:'msg'},
  tripadvisor:{label:'猫途鹰',     labelEN:'Tripadvisor',scheme:'tripadvisor://',         web:'https://www.tripadvisor.com',         icon:'globe'},
};
const MSG_APPS=['wechat','whatsapp','line','telegram'];
const PAYMENT_APPS=['wechat','whatsapp','alipay','alipayhk','payme','octopus'];

const REGION_PRESETS={
  korea:   {detect:/首尔|釜山|济州|韩国|korea|seoul|busan|jeju/i,         apps:['navermap','kakaotaxi','baemin','ctrip','klook','kkday']},
  china:   {detect:/北京|上海|广州|深圳|成都|中国|china|beijing|shanghai/i,apps:['baidu','didi','meituan','fliggy','dianping','12306']},
  hk:      {detect:/香港|hong kong|hk\b|hkg/i,                            apps:['googlemaps','uber','didi','foodpanda','mtr','octopus']},
  japan:   {detect:/日本|东京|大阪|京都|japan|tokyo|osaka|kyoto/i,         apps:['googlemaps','uber','agoda','klook','ctrip']},
  sea:     {detect:/泰国|曼谷|新加坡|越南|malaysia|thailand|bangkok|singapore/i,apps:['googlemaps','grab','foodpanda','agoda','klook']},
  default: {detect:null, apps:['googlemaps','uber','tripadvisor','airbnb','klook','kkday']},
};

function detectRegion(){
  var name=(S.trip&&S.trip.name)||''; var dates=(S.trip&&S.trip.dates)||'';
  var combined=name+' '+dates;
  for(var r in REGION_PRESETS){
    if(REGION_PRESETS[r].detect&&REGION_PRESETS[r].detect.test(combined)) return r;
  }
  return 'default';
}
function getQuickApps(){
  if(S.customApps&&S.customApps.length>=4) return S.customApps.slice(0,8);
  return (REGION_PRESETS[detectRegion()]||REGION_PRESETS.default).apps.slice(0,8);
}
function getAppLabel(key){ var app=ALL_APPS[key]; if(!app) return key; return S.lang==='en'?app.labelEN:app.label; }

// ── XHS TOPICS (region-aware) ─────────────────────────────────
const XHS_TOPICS={
  korea:['弘大美食','东大门购物','韩服体验','景福宫攻略','汉江野餐','汗蒸幕推荐','首尔咖啡厅','仁川免税','韩国便利店','釜山西面','济州岛自驾'],
  china: ['北京故宫','上海外滩','成都美食','重庆洪崖洞','西安古城墙','云南大理','厦门鼓浪屿','杭州西湖'],
  hk:    ['香港美食推荐','尖沙咀打卡','铜锣湾购物','大埔海滨公园','西贡海鲜','赤柱市集','港岛夜景','天星小轮'],
  japan: ['东京涩谷拍照','大阪道顿堀美食','京都岚山攻略','日本便利店必买','富士山攻略','日本药妆必买'],
  sea:   ['曼谷夜市推荐','新加坡景点攻略','普吉岛海滩','越南河粉','巴厘岛网红地','吉隆坡美食'],
  default:['旅行穿搭技巧','旅行摄影构图','行李打包攻略','旅行必备APP','机场免税攻略','酒店选择指南'],
};
function getXHSTopics(){
  var region=detectRegion();
  var topics=XHS_TOPICS[region]||XHS_TOPICS.default;
  return topics;
}

// ── TIMEZONE ──────────────────────────────────────────────────
const TZ_MAP={
  korea:'Asia/Seoul',china:'Asia/Shanghai',hk:'Asia/Hong_Kong',
  japan:'Asia/Tokyo',sea:'Asia/Bangkok',default:'UTC',
};
const TZ_CITIES={
  'zh-CN':{korea:'首尔',china:'北京',hk:'香港',japan:'东京',sea:'曼谷',default:'目的地'},
  'zh-TW':{korea:'首爾',china:'北京',hk:'香港',japan:'東京',sea:'曼谷',default:'目的地'},
  'en':   {korea:'Seoul',china:'Beijing',hk:'Hong Kong',japan:'Tokyo',sea:'Bangkok',default:'Destination'},
};
function renderTimezoneBar(){
  var region=detectRegion();
  var tz=TZ_MAP[region];
  if(!tz||tz==='UTC') return '';
  try{
    var now=new Date();
    var homeTime=now.toLocaleTimeString(S.lang==='en'?'en-US':'zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});
    var destTime=now.toLocaleTimeString(S.lang==='en'?'en-US':'zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:tz});
    var destCity=(TZ_CITIES[S.lang]||TZ_CITIES['zh-CN'])[region]||region;
    var homeCity=S.lang==='en'?'Home':'当地';
    if(homeTime===destTime) return '';
    return '<div class="tz-widget" onclick="showTimezoneDetail()">'+
      '<div style="color:var(--t2)">'+ic('globe',18)+'</div>'+
      '<div class="tz-clocks">'+
        '<div class="tz-clock"><div class="tz-time">'+destTime+'</div><div class="tz-label">'+escHtml(destCity)+'</div></div>'+
        '<div style="color:var(--t4);margin:0 4px;font-size:18px;align-self:center">·</div>'+
        '<div class="tz-clock"><div class="tz-time" style="color:var(--t2)">'+homeTime+'</div><div class="tz-label">'+homeCity+'</div></div>'+
      '</div>'+
    '</div>';
  }catch(e){ return ''; }
}
window.showTimezoneDetail=function(){
  var region=detectRegion(); var tz=TZ_MAP[region];
  if(!tz) return;
  var now=new Date();
  var destCity=(TZ_CITIES[S.lang]||TZ_CITIES['zh-CN'])[region];
  var fmtOpts={weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false};
  var destFull=now.toLocaleString(S.lang==='en'?'en-US':'zh-CN',Object.assign({},fmtOpts,{timeZone:tz}));
  var homeFull=now.toLocaleString(S.lang==='en'?'en-US':'zh-CN',fmtOpts);
  var destOffset=new Date().toLocaleString('en',{timeZone:tz,timeZoneName:'short'}).split(' ').pop();
  var homeOffset=new Date().toLocaleString('en',{timeZoneName:'short'}).split(' ').pop();
  var en=S.lang==='en';
  showModal(
    '<div class="sh"></div>'+
    '<div style="font-size:18px;font-weight:700;margin-bottom:18px;color:var(--t1)">'+(en?'Time Zone':'时区换算')+'</div>'+
    '<div class="list">'+
      '<div class="lr" style="cursor:default">'+
        '<div style="color:var(--t2)">'+ic('globe',20)+'</div>'+
        '<div style="flex:1"><div class="lr-lbl">'+(en?'Destination':'目的地')+' ('+destCity+')</div>'+
        '<div style="font-size:14px;color:var(--t1);font-family:monospace">'+destFull+'</div>'+
        '<div style="font-size:11px;color:var(--t3)">'+tz+' '+destOffset+'</div></div>'+
      '</div>'+
      '<div class="lr" style="cursor:default">'+
        '<div style="color:var(--t2)">'+ic('home',20)+'</div>'+
        '<div style="flex:1"><div class="lr-lbl">'+(en?'Your local time':'本地时间')+'</div>'+
        '<div style="font-size:14px;color:var(--t1);font-family:monospace">'+homeFull+'</div></div>'+
      '</div>'+
    '</div>'
  );
};

// ── TRANSLATION LINKS ─────────────────────────────────────────
const TRANSLATE_APPS=[
  {key:'gtranslate',label:'Google翻译',labelEN:'Google Translate',scheme:'googletranslate://',web:'https://translate.google.com',icon:'globe'},
  {key:'deepl',     label:'DeepL',     labelEN:'DeepL',           scheme:'deepl://',           web:'https://www.deepl.com/translator',icon:'globe'},
  {key:'papago',    label:'Papago',    labelEN:'Papago',           scheme:'papago://',           web:'https://papago.naver.com',icon:'globe'},
];
function renderTranslateBar(){
  var en=S.lang==='en';
  var ttl=en?'Translate':'翻译';
  var btns=TRANSLATE_APPS.map(function(a){
    return '<div class="translate-btn" onclick="openTranslate(\''+a.key+'\')">'+
      ic('globe',14)+' '+(en?a.labelEN:a.label)+
    '</div>';
  }).join('');
  // AI photo translate if configured
  if(S.aiConfig.apiKey&&S.aiConfig.endpoint&&S.aiToggles&&S.aiToggles.recs!==false){
    btns+='<div class="translate-btn" onclick="showPhotoTranslate()">'+ic('camera',14)+' '+(en?'Photo':'拍照翻译')+'</div>';
  }
  return '<div style="margin-bottom:18px">'+
    '<div class="sec-ttl" style="padding:0 16px;margin-bottom:8px">'+ttl+'</div>'+
    '<div class="translate-strip">'+btns+'</div>'+
  '</div>';
}
window.openTranslate=function(key){
  var app=TRANSLATE_APPS.find(function(a){ return a.key===key; }); if(!app) return;
  showLoad(); var opened=false, timer;
  function onHide(){ if(document.hidden){ opened=true; clearTimeout(timer); hideLoad(); } }
  document.addEventListener('visibilitychange',onHide);
  timer=setTimeout(function(){ document.removeEventListener('visibilitychange',onHide); if(!opened){ hideLoad(); window.open(app.web,'_blank'); } },1800);
  try{ window.location.href=app.scheme; }catch(e){ clearTimeout(timer); document.removeEventListener('visibilitychange',onHide); hideLoad(); window.open(app.web,'_blank'); }
};
window.showPhotoTranslate=function(){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.capture='environment';
  inp.onchange=async function(){
    var f=inp.files[0]; if(!f) return; showLoad();
    var rd=new FileReader();
    rd.onload=async function(e){
      var b64=e.target.result;
      var cfg=S.aiConfig;
      if(!cfg.apiKey||!cfg.endpoint){ hideLoad(); toast(t('noCfg')); return; }
      try{
        var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},
          body:JSON.stringify({model:cfg.model||'gpt-4o',max_tokens:400,messages:[{role:'user',content:[
            {type:'text',text:'Translate all text in this image to '+(S.lang==='en'?'English':'Chinese (Simplified)')+'. Return only the translated text, preserving line breaks. No explanations.'},
            {type:'image_url',image_url:{url:b64}}
          ]}]})});
        var d=await res.json();
        var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';
        hideLoad();
        showModal('<div class="sh"></div>'+
          '<div style="font-size:18px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+(S.lang==='en'?'Translation':'翻译结果')+'</div>'+
          '<img src="'+b64+'" style="width:100%;border-radius:var(--r2);margin-bottom:14px;max-height:200px;object-fit:cover">'+
          '<div style="padding:14px;background:rgba(var(--sf),.07);border-radius:var(--r2);font-size:15px;line-height:1.7;color:var(--t1);white-space:pre-wrap">'+escHtml(txt)+'</div>');
      }catch(err){ hideLoad(); toast('Translation failed: '+err.message); }
    };
    rd.readAsDataURL(f);
  };
  inp.click();
};

// ── I18N ─────────────────────────────────────────────────────
const LANGS={
'zh-CN':{
  brand:'Travoo',sub:'和朋友一起记录每趟旅行',
  join:'加入行程',create:'创建新行程',or:'或',
  yourName:'你的名字',namePh:'名字',codePh:'6位行程码',
  myTrips:'我的行程',newTrip:'新建行程',
  today:'今天',itin:'行程',exp:'花费',ai:'管家',set:'设置',
  qa:'快捷操作',smRec:'智能提醒',xhs:'小红书搜索',
  total:'总花费',myPaid:'我付款',cnt:'笔数',
  detail:'明细',settle:'结算',
  code:'行程码',members:'成员',aiCfg:'AI 配置',
  notif:'通知',about:'关于',leave:'退出行程',
  copy:'复制',share:'分享',lang:'语言',wp:'壁纸',
  food:'餐饮',transport:'交通',attr:'景点',act:'活动',other:'其他',
  save:'保存',del:'删除',cancel:'取消',
  aiPh:'问我任何旅行问题…',
  aiWelcome:'Travoo 管家',aiWelcomeSub:'餐厅推荐、景点攻略、打车方式\n花费分析，随时为你解答',
  noExp:'暂无记录',noExpSub:'点击此处添加花费',
  paidBy:'付款人',splitW:'分摊成员',
  amount:'金额',desc:'描述',cat:'分类',date:'日期',
  apiEp:'API 端点',apiKey:'API Key',model:'模型',
  saveCfg:'保存配置',tokBudget:'Token 预算/次',tokUsed:'已用 Token',
  noCfg:'请先配置 AI',noCfgSub:'在设置中填入 API 端点和 Key',cfgAI:'去配置',
  msgApp:'消息应用',arrived:'我到了！',voiceHint:'按住说话',listening:'聆听中…',
  editItem:'编辑',addItem:'添加项目',todayTimeline:'今日时间轴',
  locationAllow:'允许位置权限',addExpense:'记录花费',
  offlineNote:'离线模式 — 云端同步需配置 Firebase',
  codeShare:'分享此行程码给朋友加入',free:'免费',
  you:'你',viewFull:'查看完整行程',
  settled:'已结清',settledSub:'没有待结算款项',
  addMember:'添加成员',logExp:'记账',aiAsst:'管家',
  importXlsx:'导入 Excel (.xlsx)',pasteImport:'粘贴文字导入',
  invite:'邀请',nMembers:'名成员',confirmDelItem:'确认删除？',
  chatSug1:'今天有什么推荐',chatSug2:'附近怎么打车',
  chatSug3:'景点拍照技巧',chatSug4:'今日花费分析',chatSug5:'叫我准时出发',
  pickFromAlbum:'从相册选取',resetDefault:'重置默认',clearChat:'清除对话记录',
  version:'版本',connected:'已连接',localMode:'本地模式',
  confirmLeaveMsg:'退出后需重新输入行程码才能访问',confirmLeaveBtn:'确认退出',
  addMemberPh:'名字',
  timeLabel:'时间',actNameLabel:'活动名称',transLabel:'交通（可留空）',
  spendMinLabel:'最低花费',spendMaxLabel:'最高花费',
  noteLabel:'备注',importantLabel:'重要',mustOnTime:'必须准时',
  addNewDay:'添加新一天',tripInfoTitle:'行程信息',tripNameLabel:'行程名称',dateRangeLabel:'日期范围',
  importDataLabel:'导入行程',importHint:'支持 .xlsx 或粘贴文字（无需 AI）',
  importHint2:'★ 推荐：复制 Excel 内容粘贴',
  pasteImportTitle:'粘贴行程文字',
  pasteHint:'支持格式：\n① Excel 复制粘贴\n② 每行：2000/1/1 08:00 晚餐\n③ 日期行 + 活动行',
  aiImgImport:'图片识别 (AI)',aiImgHint:'配置 AI 后可用',
  geoObtained:'已获取',geoNotObtained:'未获取',
  wallUpdated:'壁纸已更新',wallReset:'已重置壁纸',imgTooLarge:'图片过大',
  codeCopied:'行程码已复制',aiConfigSaved:'AI 配置已保存',chatCleared:'对话已清除',
  locationReqOk:'已请求位置权限',
  recognizing:'AI 识别中...',recognizeOk:'识别成功，请确认',recognizeFail:'识别失败',
  logged:'已记录',deleted:'已删除',
  importOk:'导入成功',importFail:'解析失败，请检查格式',addedDay:'已添加',
  transferTo:'转给',relatedApps:'相关应用',askAIBtn:'询问 Travoo 管家',
  notPlanned:'未有行程',countdown:'出发倒计时',tripEnded:'旅程已结束',
  themes:'主题颜色',loginTitle:'设备同步',history:'历史行程',
  editAvatar:'更换头像',editNickname:'修改昵称',
  xhsRefresh:'换一批',travelDocs:'旅行证件',editDayTitle:'修改标题',
  butlerName:'Travoo 管家',
  currency:'货币设置',baseCurrency:'主货币（结算）',localCurrency:'旅行货币',
  rateDate:'更新时间',refreshRate:'刷新汇率',rateUnavailable:'汇率未加载',expCurrency:'货币',rateInfo:'换算',
  appearance:'外观与显示',appearanceDesc:'主题 · 语言 · 壁纸',
  deviceSync:'设备同步',deviceId:'设备 ID',
  confirmClearChat:'确认清除所有对话？',confirmClearChatSub:'此操作不可撤销',clearChatConfirmBtn:'确认清除',
  lists:'清单',shopping:'购物清单',todo:'待办事项',packing:'行李打包',
  addListItem:'添加',listPre:'出发前',listDuring:'旅行中',listPost:'回来后',
  period:'生理期预测',periodAdd:'添加记录',
  periodConflict:'生理期可能与旅行重叠，注意准备相关用品',
  customApps:'快捷应用',editApps:'编辑',regionDetected:'根据目的地推荐',
  exportData:'导出数据',importData:'导入数据',exportDesc:'备份或迁移设备',
  importDesc:'选择之前导出的 JSON 文件',importSuccess:'数据导入成功',
  markPaid:'标记已付',payVia:'通过',
  moveUp:'向前移',moveDown:'向后移',
  aiFeatures:'AI 功能',aiForPacking:'AI 打包建议',aiForRecs:'AI 智能推荐',aiForImport:'AI 行程导入',
  notConfigured:'未配置',importNote:'点击导入行程',
  journal:'旅行手账',journalPh:'写下今天的感想…',journalAddPhoto:'添加照片',
  journalEmpty:'今天还没有记录',
  translate:'翻译',
  souvenir:'纪念品清单',
  darkThemes:'深色',lightThemes:'浅色',autoTheme:'跟随系统',
},
'zh-TW':{
  brand:'Travoo',sub:'和朋友一起記錄每趟旅行',
  join:'加入行程',create:'建立新行程',or:'或',
  yourName:'你的名字',namePh:'名字',codePh:'6位行程碼',
  myTrips:'我的行程',newTrip:'新建行程',
  today:'今天',itin:'行程',exp:'花費',ai:'管家',set:'設定',
  qa:'快捷操作',smRec:'智慧提醒',xhs:'小紅書搜尋',
  total:'總花費',myPaid:'我付款',cnt:'筆數',
  detail:'明細',settle:'結算',
  code:'行程碼',members:'成員',aiCfg:'AI 設定',
  notif:'通知',about:'關於',leave:'退出行程',
  copy:'複製',share:'分享',lang:'語言',wp:'桌布',
  food:'餐飲',transport:'交通',attr:'景點',act:'活動',other:'其他',
  save:'儲存',del:'刪除',cancel:'取消',
  aiPh:'問我任何旅遊問題…',
  aiWelcome:'Travoo 管家',aiWelcomeSub:'餐廳推薦、景點攻略、叫車方式\n花費分析，隨時為你解答',
  noExp:'暫無記錄',noExpSub:'點擊此處添加花費',
  paidBy:'付款人',splitW:'分攤成員',
  amount:'金額',desc:'描述',cat:'分類',date:'日期',
  apiEp:'API 端點',apiKey:'API Key',model:'模型',
  saveCfg:'儲存設定',tokBudget:'Token 預算/次',tokUsed:'已用 Token',
  noCfg:'請先設定 AI',noCfgSub:'在設定中填入 API 端點和 Key',cfgAI:'去設定',
  msgApp:'訊息應用',arrived:'我到了！',voiceHint:'按住說話',listening:'聆聽中…',
  editItem:'編輯',addItem:'新增項目',todayTimeline:'今日時間軸',
  locationAllow:'允許位置權限',addExpense:'記錄花費',
  offlineNote:'離線模式 — 雲端同步需設定 Firebase',
  codeShare:'分享此行程碼給朋友加入',free:'免費',
  you:'你',viewFull:'查看完整行程',
  settled:'已結清',settledSub:'沒有待結算款項',
  addMember:'添加成員',logExp:'記帳',aiAsst:'管家',
  importXlsx:'匯入 Excel (.xlsx)',pasteImport:'貼上文字匯入',
  invite:'邀請',nMembers:'名成員',confirmDelItem:'確認刪除？',
  chatSug1:'今天有什麼推薦',chatSug2:'附近怎麼叫車',
  chatSug3:'景點拍照技巧',chatSug4:'今日花費分析',chatSug5:'提醒我準時出發',
  pickFromAlbum:'從相冊選取',resetDefault:'重置預設',clearChat:'清除對話記錄',
  version:'版本',connected:'已連接',localMode:'本地模式',
  confirmLeaveMsg:'退出後需重新輸入行程碼才能訪問',confirmLeaveBtn:'確認退出',
  addMemberPh:'名字',
  timeLabel:'時間',actNameLabel:'活動名稱',transLabel:'交通（可留空）',
  spendMinLabel:'最低花費',spendMaxLabel:'最高花費',
  noteLabel:'備注',importantLabel:'重要',mustOnTime:'必須準時',
  addNewDay:'添加新一天',tripInfoTitle:'行程資訊',tripNameLabel:'行程名稱',dateRangeLabel:'日期範圍',
  importDataLabel:'匯入行程',importHint:'支援 .xlsx 或貼上文字（無需 AI）',
  importHint2:'★ 推薦：複製 Excel 內容貼上',
  pasteImportTitle:'貼上行程文字',
  pasteHint:'支援格式：\n① Excel 複製貼上\n② 每行：2000/1/1 08:00 晚餐\n③ 日期行 + 活動行',
  aiImgImport:'圖片識別 (AI)',aiImgHint:'設定 AI 後可用',
  geoObtained:'已獲取',geoNotObtained:'未獲取',
  wallUpdated:'桌布已更新',wallReset:'已重置桌布',imgTooLarge:'圖片過大',
  codeCopied:'行程碼已複製',aiConfigSaved:'AI 設定已儲存',chatCleared:'對話已清除',
  locationReqOk:'已請求位置權限',
  recognizing:'AI 識別中...',recognizeOk:'識別成功，請確認',recognizeFail:'識別失敗',
  logged:'已記錄',deleted:'已刪除',
  importOk:'匯入成功',importFail:'解析失敗，請檢查格式',addedDay:'已添加',
  transferTo:'轉給',relatedApps:'相關應用',askAIBtn:'詢問 Travoo 管家',
  notPlanned:'未有行程',countdown:'出發倒數',tripEnded:'旅程已結束',
  themes:'主題顏色',loginTitle:'設備同步',history:'歷史行程',
  editAvatar:'更換頭像',editNickname:'修改暱稱',
  xhsRefresh:'換一批',travelDocs:'旅行證件',editDayTitle:'修改標題',
  butlerName:'Travoo 管家',
  currency:'貨幣設定',baseCurrency:'主貨幣（結算）',localCurrency:'旅行貨幣',
  rateDate:'更新時間',refreshRate:'重新整理匯率',rateUnavailable:'匯率未載入',expCurrency:'貨幣',rateInfo:'換算',
  appearance:'外觀與顯示',appearanceDesc:'主題 · 語言 · 桌布',
  deviceSync:'設備同步',deviceId:'設備 ID',
  confirmClearChat:'確認清除所有對話？',confirmClearChatSub:'此操作不可撤銷',clearChatConfirmBtn:'確認清除',
  lists:'清單',shopping:'購物清單',todo:'待辦事項',packing:'行李打包',
  addListItem:'添加',listPre:'出發前',listDuring:'旅行中',listPost:'回來後',
  period:'生理期預測',periodAdd:'添加記錄',
  periodConflict:'生理期可能與旅行重疊，注意準備相關用品',
  customApps:'快捷應用',editApps:'編輯',regionDetected:'根據目的地推薦',
  exportData:'匯出資料',importData:'匯入資料',exportDesc:'備份或遷移設備',
  importDesc:'選擇之前匯出的 JSON 檔案',importSuccess:'資料匯入成功',
  markPaid:'標記已付',payVia:'透過',
  moveUp:'向前移',moveDown:'向後移',
  aiFeatures:'AI 功能',aiForPacking:'AI 打包建議',aiForRecs:'AI 智慧推薦',aiForImport:'AI 行程匯入',
  notConfigured:'未配置',importNote:'點擊匯入行程',
  journal:'旅行手帳',journalPh:'寫下今天的感想…',journalAddPhoto:'添加照片',
  journalEmpty:'今天還沒有記錄',
  translate:'翻譯',
  souvenir:'紀念品清單',
  darkThemes:'深色',lightThemes:'淺色',autoTheme:'跟隨系統',
},
'en':{
  brand:'Travoo',sub:'Plan, track & share every journey',
  join:'Join Trip',create:'Create New Trip',or:'or',
  yourName:'Your name',namePh:'Name',codePh:'6-character code',
  myTrips:'My Trips',newTrip:'New Trip',
  today:'Today',itin:'Itinerary',exp:'Expenses',ai:'Butler',set:'Settings',
  qa:'Quick Actions',smRec:'Smart Tips',xhs:'RedNote Search',
  total:'Total',myPaid:'I Paid',cnt:'Items',
  detail:'Details',settle:'Settle Up',
  code:'Trip Code',members:'Members',aiCfg:'AI Config',
  notif:'Notifications',about:'About',leave:'Leave Trip',
  copy:'Copy',share:'Share',lang:'Language',wp:'Wallpaper',
  food:'Food',transport:'Transport',attr:'Attraction',act:'Activity',other:'Other',
  save:'Save',del:'Delete',cancel:'Cancel',
  aiPh:'Ask me anything about this trip…',
  aiWelcome:'Travoo Butler',aiWelcomeSub:'Ask about restaurants, attractions,\ntransport, expenses and more',
  noExp:'No expenses yet',noExpSub:'Tap here to add an expense',
  paidBy:'Paid by',splitW:'Split with',
  amount:'Amount',desc:'Description',cat:'Category',date:'Date',
  apiEp:'API Endpoint',apiKey:'API Key',model:'Model',
  saveCfg:'Save Config',tokBudget:'Token budget/msg',tokUsed:'Tokens used',
  noCfg:'AI Not Configured',noCfgSub:'Add your API endpoint and key in Settings',cfgAI:'Configure',
  msgApp:'Messaging App',arrived:"I've arrived!",voiceHint:'Hold to speak',listening:'Listening…',
  editItem:'Edit',addItem:'Add Item',todayTimeline:"Today's Timeline",
  locationAllow:'Allow Location',addExpense:'Log Expense',
  offlineNote:'Offline mode — configure Firebase for cloud sync',
  codeShare:'Share this code with friends to join',free:'Free',
  you:'You',viewFull:'View Full Itinerary',
  settled:'All Settled',settledSub:'No pending payments',
  addMember:'Add Member',logExp:'Log',aiAsst:'Butler',
  importXlsx:'Import Excel (.xlsx)',pasteImport:'Paste Text',
  invite:'Invite',nMembers:'members',confirmDelItem:'Delete this item?',
  chatSug1:"What's on today",chatSug2:'How to get a taxi',
  chatSug3:'Photo tips for sights',chatSug4:'Expense summary',chatSug5:'Remind me to depart',
  pickFromAlbum:'Pick from Album',resetDefault:'Reset Default',clearChat:'Clear Chat',
  version:'Version',connected:'Connected',localMode:'Local Mode',
  confirmLeaveMsg:"You'll need the trip code to rejoin",confirmLeaveBtn:'Confirm Leave',
  addMemberPh:'Name',
  timeLabel:'Time',actNameLabel:'Activity',transLabel:'Transport (optional)',
  spendMinLabel:'Min spend',spendMaxLabel:'Max spend',
  noteLabel:'Notes',importantLabel:'Important',mustOnTime:'Must be on time',
  addNewDay:'Add New Day',tripInfoTitle:'Trip Info',tripNameLabel:'Trip Name',dateRangeLabel:'Date Range',
  importDataLabel:'Import Itinerary',importHint:'Import .xlsx or paste text — no AI needed',
  importHint2:'★ Recommended: Copy all from Excel and paste',
  pasteImportTitle:'Paste Itinerary',
  pasteHint:'Supported formats:\n① Copy all from Excel\n② Per line: 2000/1/1 08:00 Dinner\n③ Date heading + activities',
  aiImgImport:'Image Recognition (AI)',aiImgHint:'Configure AI first',
  geoObtained:'Obtained',geoNotObtained:'Not obtained',
  wallUpdated:'Wallpaper updated',wallReset:'Wallpaper reset',imgTooLarge:'Image too large',
  codeCopied:'Code copied',aiConfigSaved:'AI config saved',chatCleared:'Chat cleared',
  locationReqOk:'Location requested',
  recognizing:'AI recognizing...',recognizeOk:'Recognized, please confirm',recognizeFail:'Recognition failed',
  logged:'Logged',deleted:'Deleted',
  importOk:'Import successful',importFail:'Parse failed, check format',addedDay:'Added',
  transferTo:'pays',relatedApps:'Related Apps',askAIBtn:'Ask Travoo Butler',
  notPlanned:'Not Planned',countdown:'Countdown',tripEnded:'Trip Ended',
  themes:'Theme Color',loginTitle:'Device Sync',history:'Trip History',
  editAvatar:'Change Photo',editNickname:'Edit Name',
  xhsRefresh:'Refresh',travelDocs:'Travel Documents',editDayTitle:'Edit Title',
  butlerName:'Travoo Butler',
  currency:'Currency',baseCurrency:'Home Currency',localCurrency:'Trip Currency',
  rateDate:'Last Updated',refreshRate:'Refresh Rate',rateUnavailable:'Rate unavailable',expCurrency:'Currency',rateInfo:'Converted',
  appearance:'Appearance',appearanceDesc:'Theme · Language · Wallpaper',
  deviceSync:'Device Sync',deviceId:'Device ID',
  confirmClearChat:'Clear all chat messages?',confirmClearChatSub:'This cannot be undone',clearChatConfirmBtn:'Clear',
  lists:'Lists',shopping:'Shopping',todo:'To-Do',packing:'Packing',
  addListItem:'Add',listPre:'Before trip',listDuring:'During trip',listPost:'After trip',
  period:'Period Tracker',periodAdd:'Add Record',
  periodConflict:'Period may overlap with your trip — pack accordingly',
  customApps:'Quick Apps',editApps:'Edit',regionDetected:'Recommended for destination',
  exportData:'Export Data',importData:'Import Data',exportDesc:'Backup or transfer to another device',
  importDesc:'Select a previously exported JSON file',importSuccess:'Data imported successfully',
  markPaid:'Mark Paid',payVia:'Pay via',
  moveUp:'Move Earlier',moveDown:'Move Later',
  aiFeatures:'AI Features',aiForPacking:'AI Packing List',aiForRecs:'AI Smart Tips',aiForImport:'AI Import',
  notConfigured:'Not configured',importNote:'Tap to import itinerary',
  journal:'Travel Journal',journalPh:'Write about today…',journalAddPhoto:'Add Photo',
  journalEmpty:'No entries today',
  translate:'Translate',
  souvenir:'Souvenir List',
  darkThemes:'Dark',lightThemes:'Light',autoTheme:'Auto',
},
};
function t(k){ return (LANGS[S.lang]||LANGS['zh-CN'])[k]||k; }

// ── STATE ─────────────────────────────────────────────────────
const S={
  lang:          localStorage.getItem('lang')          ||'zh-CN',
  tripCode:      localStorage.getItem('tripCode')      ||null,
  memberId:      localStorage.getItem('memberId')      ||null,
  memberName:    localStorage.getItem('memberName')    ||null,
  trip:null,members:{},expenses:[],chatHistory:[],
  aiConfig:      JSON.parse(localStorage.getItem('aiConfig')     ||'{}'),
  tab:'home',unsubs:[],geo:null,
  tokenUsed:     +(localStorage.getItem('tokenUsed')   ||0),
  tokenBudget:   +(localStorage.getItem('tokenBudget') ||500),
  msgApp:        localStorage.getItem('msgApp')        ||'wechat',
  localTrips:    JSON.parse(localStorage.getItem('localTrips')   ||'[]'),
  theme:         localStorage.getItem('theme')         ||'dark',
  avatars:       JSON.parse(localStorage.getItem('memberAvatars')||'{}'),
  baseCurrency:  localStorage.getItem('baseCurrency')  ||'HKD',
  localCurrency: localStorage.getItem('localCurrency') ||'KRW',
  rates:         JSON.parse(localStorage.getItem('fxRates')      ||'{}'),
  fxBase:        localStorage.getItem('fxBase')        ||'HKD',
  fxDate:        localStorage.getItem('fxDate')        ||'',
  weather:null,
  customApps:    JSON.parse(localStorage.getItem('customApps')   ||'null'),
  // Local personal data
  shoppingList:  JSON.parse(localStorage.getItem('shoppingList') ||'[]'),
  todoList:      JSON.parse(localStorage.getItem('todoList')     ||'{"pre":[],"during":[],"post":[]}'),
  packingItems:  JSON.parse(localStorage.getItem('packingItems') ||'[]'),
  souvenirList:  JSON.parse(localStorage.getItem('souvenirList') ||'[]'),
  journalData:   JSON.parse(localStorage.getItem('journalData')  ||'{}'),
  periodData:    JSON.parse(localStorage.getItem('periodData')   ||'{"records":[],"cycleLen":28,"duration":5}'),
  settledRows:   JSON.parse(localStorage.getItem('settledRows')  ||'{}'),
  aiToggles:     JSON.parse(localStorage.getItem('aiToggles')    ||'{"packing":true,"recs":true,"import":true}'),
  paymentApp:    localStorage.getItem('paymentApp')    ||'wechat',
};
(function(){
  var wc=localStorage.getItem('wxCache');
  if(wc){ try{ var p=JSON.parse(wc); if(Date.now()-p.ts<3600000) S.weather=p.data; }catch(e){} }
})();

// ── CONSTANTS ─────────────────────────────────────────────────
const COLORS=['#0A84FF','#FF453A','#30D158','#FF9F0A','#BF5AF2','#FF375F','#00C7BE'];
const CAT_COLORS={food:'#FF9F0A',transport:'#0A84FF',attr:'#30D158',act:'#BF5AF2',other:'#8E8E93'};

// ── ICONS ─────────────────────────────────────────────────────
const IC={
  home:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>',
  cal:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  wallet:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12H15a2 2 0 000 4h6V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-4z"/></svg>',
  chat:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  cog:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33A1.65 1.65 0 0014 21v.09a2 2 0 01-4 0V21a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  plus:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  chev:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  send:    '<svg viewBox="0 0 24 24"><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor"/></svg>',
  mic:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10v2a7 7 0 0014 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  car:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l1.5-4.5h11L19 11M3 17h2v2h2v-2h10v2h2v-2h2v-6H3v6z"/><circle cx="7" cy="14.5" r="1.5"/><circle cx="17" cy="14.5" r="1.5"/></svg>',
  map:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  food:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><path d="M6 2v6M10 2v6M14 2v6"/></svg>',
  plane:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  train:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="17" rx="3"/><path d="M4 11h16M9 19l-1 3M15 19l1 3"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></svg>',
  copy:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  share:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>',
  user:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  bell:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
  trash:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  edit:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>',
  camera:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  check:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  xhs:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 12h6M12 9v6"/></svg>',
  img:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  globe:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>',
  msg:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  bag:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
  xlsx:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 100 20c1.1 0 2-.9 2-2v-.5c0-.83.67-1.5 1.5-1.5H17a3 3 0 003-3 8 8 0 00-8-8z"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><circle cx="11" cy="7" r="1.5" fill="currentColor"/><circle cx="15" cy="7" r="1.5" fill="currentColor"/><circle cx="17" cy="11" r="1.5" fill="currentColor"/></svg>',
  list:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  book:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  cart:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-7.43H6"/></svg>',
  suitcase:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>',
  download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  upload:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>',
  arrowup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  arrowdn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  search:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  heart:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  phone:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.17a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .5h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
  wallet2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
};
function ic(n,sz){ var s=IC[n]||IC.plus; var z=sz||22; return s.replace('<svg ','<svg width="'+z+'" height="'+z+'" '); }

// ── UTILS ─────────────────────────────────────────────────────
var $=function(s,el){ return (el||document).querySelector(s); };
var $$=function(s,el){ return Array.prototype.slice.call((el||document).querySelectorAll(s)); };
function today(){ return new Date().toISOString().split('T')[0]; }
function nowH(){ return new Date().getHours(); }
function fmtMoney(n){ return n==null?'':(Number.isInteger(n)?'¥'+n:'¥'+n.toFixed(1)); }
function spendStr(item){ if(item.sMin==null) return ''; if(item.sMin===0&&item.sMax===0) return t('free'); if(item.sMin===item.sMax) return fmtMoney(item.sMin); return fmtMoney(item.sMin)+' – '+fmtMoney(item.sMax); }
function genCode(){ var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r=''; for(var i=0;i<6;i++) r+=c[Math.floor(Math.random()*c.length)]; return r; }
function getWdLabel(wd){ if(S.lang==='en'){ var m={'一':'Mon','二':'Tue','三':'Wed','四':'Thu','五':'Fri','六':'Sat','日':'Sun'}; return m[wd]||wd; } return '周'+wd; }
function memberName(id){ return id===S.memberId?t('you'):(S.members[id]?S.members[id].name:id); }
function memberAvatar(id){ return S.avatars[id]||null; }
function renderAv(id,size){
  size=size||34; var m=S.members[id]||{name:'?',color:'#8E8E93'}; var img=memberAvatar(id);
  if(img) return '<div class="av" style="width:'+size+'px;height:'+size+'px"><img src="'+img+'" alt=""></div>';
  return '<div class="av" style="width:'+size+'px;height:'+size+'px;background:'+m.color+';font-size:'+(size*0.38)+'px">'+(m.name||'?')[0]+'</div>';
}
function renderMentions(text){
  if(!text) return '';
  var escaped=escHtml(text);
  Object.entries(S.members).forEach(function(entry){
    var id=entry[0],m=entry[1]; if(!m.name||m.name.length<1) return;
    var safe=m.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    var dn=id===S.memberId?t('you'):m.name;
    var span='<span style="background:'+m.color+'22;color:'+m.color+';border-radius:4px;padding:0 4px;font-weight:600">@'+escHtml(dn)+'</span>';
    try{ escaped=escaped.replace(new RegExp(escHtml(safe),'g'),span); }catch(e){}
  });
  return escaped;
}
function getDays(){ return (S.trip&&S.trip.days)?S.trip.days:[]; }
function allItemsFlat(){ return getDays().reduce(function(a,d){ return a.concat(d.items); },[]); }
function findItem(id){ return allItemsFlat().find(function(i){ return i.id===id; }); }
function applyWallpaper(){
  var wp=localStorage.getItem('wallpaper'); var el=document.getElementById('wp'); if(!el) return;
  if(wp){ el.style.setProperty('--wpi','url('+wp+')'); el.classList.add('img'); }
  else { el.classList.remove('img'); window.applyTheme(S.theme); }
}
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── LOADING & TOAST ───────────────────────────────────────────
function showLoad(){ if($('.load-ov')) return; var d=document.createElement('div'); d.className='load-ov'; d.innerHTML='<div class="spin"></div>'; document.body.appendChild(d); }
function hideLoad(){ var d=$('.load-ov'); if(d) d.remove(); }
function toast(msg,dur){
  var e=$('.toast'); if(e) e.remove(); if(!msg) return;
  var d=document.createElement('div'); d.className='toast'; d.textContent=msg;
  Object.assign(d.style,{position:'fixed',bottom:'calc(var(--tabh) + 18px)',left:'50%',transform:'translateX(-50%)',background:'rgba(22,22,28,.96)',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',border:'0.5px solid rgba(255,255,255,.12)',borderRadius:'100px',padding:'9px 20px',fontSize:'14px',fontWeight:'500',zIndex:'900',whiteSpace:'nowrap',boxShadow:'0 6px 28px rgba(0,0,0,.35)',color:'#fff',transition:'opacity .3s'});
  document.body.appendChild(d);
  var ms=(dur===undefined)?2400:dur;
  if(ms>0) setTimeout(function(){ d.style.opacity='0'; setTimeout(function(){ d.remove(); },300); },ms);
}

// ── FIREBASE OPS ──────────────────────────────────────────────
async function fbLoadTrip(code){
  if(!db){ var raw=localStorage.getItem('lt_'+code); if(raw){ var d=JSON.parse(raw); S.trip=d; S.members=d.members||{}; return true; } return false; }
  try{ var snap=await getDoc(doc(db,'trips',code)); if(!snap.exists()) return false; S.trip=snap.data(); S.members=S.trip.members||{}; return true; }
  catch(e){ toast('网络错误：'+e.message); return false; }
}
async function fbCreateTrip(code,name){
  var mid='u_'+Date.now(),color=COLORS[0],members={};
  members[mid]={name:name,color:color};
  var data={code:code,name:'我的旅行',dates:'',creatorId:mid,members:members,days:[],msgApp:'wechat'};
  S.trip=data; S.members=members;
  if(db){ var fd=Object.assign({},data,{createdAt:serverTimestamp()}); fd.members={}; fd.members[mid]={name:name,color:color,joinedAt:serverTimestamp()}; await setDoc(doc(db,'trips',code),fd); }
  else { try{ localStorage.setItem('lt_'+code,JSON.stringify(data)); }catch(e){} }
  return {memberId:mid,color:color};
}
async function fbJoinTrip(code,name){
  var mid='u_'+Date.now(); var used=Object.values(S.members||{}).map(function(m){ return m.color; }); var color=COLORS.find(function(c){ return used.indexOf(c)<0; })||COLORS[0];
  S.members[mid]={name:name,color:color}; if(S.trip) S.trip.members=S.members;
  if(db){ var upd={}; upd['members.'+mid]={name:name,color:color,joinedAt:serverTimestamp()}; await updateDoc(doc(db,'trips',code),upd); }
  else { try{ if(S.trip) localStorage.setItem('lt_'+code,JSON.stringify(S.trip)); }catch(e){} }
  return {memberId:mid,color:color};
}
async function fbSaveDays(days){
  if(!S.tripCode) return; if(S.trip) S.trip.days=days;
  if(db){ await updateDoc(doc(db,'trips',S.tripCode),{days:days}); }
  else { try{ if(S.trip) localStorage.setItem('lt_'+S.tripCode,JSON.stringify(S.trip)); }catch(e){} }
}
async function fbAddExpense(data){
  var exp=Object.assign({memberId:S.memberId,createdAt:new Date().toISOString()},data);
  if(db&&S.tripCode){ await addDoc(collection(db,'trips',S.tripCode,'expenses'),Object.assign({},exp,{createdAt:serverTimestamp()})); }
  else { S.expenses.unshift(Object.assign({id:'loc_'+Date.now()},exp)); refreshExpList(); }
}
async function fbDelExpense(id){
  if(db&&S.tripCode){ await deleteDoc(doc(db,'trips',S.tripCode,'expenses',id)); }
  else { S.expenses=S.expenses.filter(function(e){ return e.id!==id; }); refreshExpList(); }
}
async function fbSaveMsg(role,content){
  if(!db||!S.tripCode||!S.memberId) return;
  try{ await addDoc(collection(db,'trips',S.tripCode,'chats',S.memberId,'messages'),{role:role,content:content,ts:serverTimestamp()}); }catch(e){}
}
function subscribeAll(code){
  if(!db) return;
  S.unsubs.push(onSnapshot(doc(db,'trips',code),function(snap){ if(!snap.exists()) return; S.trip=snap.data(); S.members=S.trip.members||{}; if(S.tab==='home') renderHome(); }));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'expenses'),orderBy('createdAt','desc'),limit(100)),function(snap){ S.expenses=snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); refreshExpList(); }));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'chats',S.memberId,'messages'),orderBy('ts','asc'),limit(60)),function(snap){ S.chatHistory=snap.docs.map(function(d){ return d.data(); }); refreshChatMsgs(); }));
}

// ── EXPORT / IMPORT ───────────────────────────────────────────
window.exportTripData=function(){
  var data={version:3,exported:new Date().toISOString(),
    tripCode:S.tripCode,memberId:S.memberId,memberName:S.memberName,
    trip:S.trip,members:S.members,expenses:S.expenses,localTrips:S.localTrips,
    shoppingList:S.shoppingList,todoList:S.todoList,packingItems:S.packingItems,
    souvenirList:S.souvenirList,journalData:S.journalData,
    aiConfig:S.aiConfig,aiToggles:S.aiToggles,
    baseCurrency:S.baseCurrency,localCurrency:S.localCurrency,
    theme:S.theme,lang:S.lang,msgApp:S.msgApp,customApps:S.customApps,avatars:S.avatars,
  };
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob); var a=document.createElement('a');
  a.href=url; a.download='travoo_'+(S.tripCode||'backup')+'_'+today()+'.json';
  a.click(); URL.revokeObjectURL(url);
  toast(S.lang==='en'?'Exported':'导出成功');
};
window.importTripData=function(){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='.json';
  inp.onchange=function(){
    var f=inp.files[0]; if(!f) return;
    var rd=new FileReader();
    rd.onload=function(e){
      try{
        var data=JSON.parse(e.target.result);
        if(!data.version||!data.tripCode) throw new Error('Invalid file');
        if(data.tripCode){ S.tripCode=data.tripCode; localStorage.setItem('tripCode',data.tripCode); }
        if(data.memberId){ S.memberId=data.memberId; localStorage.setItem('memberId',data.memberId); }
        if(data.memberName){ S.memberName=data.memberName; localStorage.setItem('memberName',data.memberName); }
        if(data.trip){ S.trip=data.trip; try{ localStorage.setItem('lt_'+data.tripCode,JSON.stringify(data.trip)); }catch(e2){} }
        if(data.members) S.members=data.members;
        if(data.expenses) S.expenses=data.expenses;
        ['localTrips','shoppingList','todoList','packingItems','souvenirList','journalData','aiToggles','avatars'].forEach(function(k){
          if(data[k]){ S[k]=data[k]; localStorage.setItem(k==='localTrips'?'localTrips':k,JSON.stringify(data[k])); }
        });
        if(data.aiConfig){ S.aiConfig=data.aiConfig; localStorage.setItem('aiConfig',JSON.stringify(data.aiConfig)); }
        ['theme','lang','baseCurrency','localCurrency','msgApp'].forEach(function(k){ if(data[k]){ S[k]=data[k]; localStorage.setItem(k,data[k]); } });
        if(data.customApps){ S.customApps=data.customApps; localStorage.setItem('customApps',JSON.stringify(data.customApps)); }
        toast(t('importSuccess')); closeModal();
        setTimeout(function(){ renderApp(); },400);
      }catch(err){ toast('导入失败：'+err.message); }
    };
    rd.readAsText(f);
  };
  inp.click();
};

// ── AI ────────────────────────────────────────────────────────
function sysPrompt(){
  var td=getDays().find(function(d){ return d.date===today(); });
  var lc=CURRENCY_LIST[S.baseCurrency]||{name:S.baseCurrency};
  return 'You are Travoo Butler for trip "'+((S.trip&&S.trip.name)||'Trip')+'".\nToday: '+today()+(td?' - '+td.title:'')+'. Members: '+Object.values(S.members).map(function(m){ return m.name; }).join(', ')+'. Base currency: '+lc.name+'. Reply in user\'s language. Be concise and helpful.';
}
async function callAI(userText){
  var cfg=S.aiConfig; if(!cfg.apiKey||!cfg.endpoint) throw new Error(t('noCfg'));
  var msgs=[{role:'system',content:sysPrompt()}]; var hist=S.chatHistory.slice(-14);
  for(var i=0;i<hist.length;i++) msgs.push({role:hist[i].role,content:hist[i].content});
  msgs.push({role:'user',content:userText});
  var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model||'gpt-4o-mini',messages:msgs,max_tokens:S.tokenBudget||4000,temperature:0.75})});
  if(!res.ok) throw new Error('API '+res.status+': '+await res.text());
  var data=await res.json();
  var reply=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'(no reply)';
  var used=(data.usage&&data.usage.total_tokens)||0; S.tokenUsed+=used; localStorage.setItem('tokenUsed',S.tokenUsed);
  return reply;
}
async function ocrReceipt(b64){
  var cfg=S.aiConfig; if(!cfg.apiKey||!cfg.endpoint) return null;
  try{
    var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model||'gpt-4o-mini',max_tokens:80,messages:[{role:'user',content:[{type:'text',text:'Extract from receipt. Return JSON only: {"amount":number,"description":"string","category":"food|transport|attr|act|other"}'},{type:'image_url',image_url:{url:b64}}]}]})});
    var d=await res.json(); var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||''; var m=txt.match(/\{[\s\S]*\}/); return m?JSON.parse(m[0]):null;
  }catch(e){ return null; }
}
function buildItinPrompt(){
  return 'Parse travel itinerary. Output JSON array ONLY:\n[{"date":"YYYY-MM-DD","month":"M","day":"DD","wd":"一|二|三|四|五|六|日","title":"short day summary","items":[{"id":"d1_1","time":"HH:MM or 全天","title":"activity","transport":"","sMin":null,"sMax":null,"lodge":"","notes":"","bag":"","apps":["didi","googlemaps","ctrip","dianping","12306"],"type":"food|transport|attr|act|checkin|rest|leisure","hi":false,"urgent":false}]}]\nRules: 5/22（五）→"2026-05-22",wd:"五"; spend "30-50"→sMin:30,sMax:50; hi=true for 高铁/包车; ids:d1_1,d1_2...';
}
async function importItineraryFromImage(b64){
  var cfg=S.aiConfig; if(!cfg.apiKey||!cfg.endpoint) throw new Error(t('noCfg'));
  var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model||'gpt-4o',max_tokens:4000,messages:[{role:'user',content:[{type:'text',text:buildItinPrompt()},{type:'image_url',image_url:{url:b64,detail:'high'}}]}]})});
  if(!res.ok) throw new Error('API '+res.status);
  var d=await res.json(); var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';
  var m=txt.match(/\[[\s\S]*\]/); if(!m) throw new Error('解析失败'); var days=JSON.parse(m[0]); if(!days||!days.length) throw new Error('未识别到数据'); return days;
}
async function importItineraryFromText(text){
  var cfg=S.aiConfig; if(!cfg.apiKey||!cfg.endpoint) throw new Error(t('noCfg'));
  var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model||'gpt-4o-mini',max_tokens:4000,messages:[{role:'user',content:buildItinPrompt()+'\n\nItinerary text:\n'+text}]})});
  if(!res.ok) throw new Error('API '+res.status);
  var d=await res.json(); var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';
  var m=txt.match(/\[[\s\S]*\]/); if(!m) throw new Error('解析失败'); var days=JSON.parse(m[0]); if(!days||!days.length) throw new Error('未识别到数据'); return days;
}

// ── LOCAL PARSER ─────────────────────────────────────────────
function extractDate(str){
  var wds=['日','一','二','三','四','五','六'],year=new Date().getFullYear();
  var m1=str.match(/(\d{1,2})[\/\-\.](\d{1,2})(?:[（(]([一二三四五六日])[）)])?/);
  if(m1){ var mo=parseInt(m1[1]),dy=parseInt(m1[2]); if(mo>=1&&mo<=12&&dy>=1&&dy<=31){ var ds=year+'-'+(mo<10?'0':'')+mo+'-'+(dy<10?'0':'')+dy; var d=new Date(ds+'T12:00:00'); return {date:ds,month:String(mo),day:String(dy),wd:m1[3]||wds[d.getDay()]}; } }
  var m2=str.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if(m2){ var ds=m2[1]+'-'+m2[2]+'-'+m2[3]; var d=new Date(ds+'T12:00:00'); return {date:ds,month:String(parseInt(m2[2])),day:String(parseInt(m2[3])),wd:wds[d.getDay()]}; }
  return null;
}
function guessType(text){
  var t2=text||'';
  if(/早餐|午餐|晚餐|早飯|午飯|晚飯|食饭|餐廳|餐厅|小吃|美食|咖啡|食嘢|eat|breakfast|lunch|dinner|restaurant|food|meal|cafe/i.test(t2)) return 'food';
  if(/入住|抵達|抵达|到達|到达|接機|接机|check.?in|酒店|民宿|賓館|宾馆/i.test(t2)) return 'checkin';
  if(/打的|打車|打车|搭車|搭车|的士|滴滴|高鐵|高铁|火車|火车|飛機|飞机|地鐵|地铁|巴士|公交|包車|包车|出發|出发|返程|taxi|train|flight|bus|uber|grab/i.test(t2)) return 'transport';
  if(/遊覧|游览|參觀|参观|景區|景区|景點|景点|博物館|博物馆|公園|公园|古城|寺廟|寺庙|草原|沙漠|火山|海灘|海滩|beach|museum|park|temple|attraction/i.test(t2)) return 'attr';
  if(/骑马|滑沙|體驗|体验|活動|活动|徒步|漂流|攀岩|hiking|activity|experience/i.test(t2)) return 'act';
  if(/休息|休整|自由|購物|购物|shopping|free|rest/i.test(t2)) return 'rest';
  return 'leisure';
}
function guessApps(text){
  var apps=[],t2=text||'';
  if(/打的|打車|打车|搭的|滴滴|taxi|uber|grab/i.test(t2)) apps.push('didi');
  if(/景區|景點|景区|景点|參觀|游览|導航|地圖|地图|map/i.test(t2)) apps.push('googlemaps');
  if(/高鐵|高铁|火車|火车|train|KTX/i.test(t2)) apps.push('12306');
  if(/酒店|入住|民宿|hotel|hostel/i.test(t2)) apps.push('ctrip');
  if(/餐廳|餐厅|吃|食|dinner|lunch|breakfast|restaurant/i.test(t2)) apps.push('dianping');
  return apps;
}
function parseSpend(str){
  if(!str) return {sMin:null,sMax:null};
  str=str.replace(/[¥￥,，]/g,'').trim();
  if(/^[—\-–]+$/.test(str)||str==='') return {sMin:null,sMax:null};
  var m=str.match(/(\d+(?:\.\d+)?)\s*[-~–]\s*(\d+(?:\.\d+)?)/); if(m) return {sMin:parseFloat(m[1]),sMax:parseFloat(m[2])};
  var s=str.match(/(\d+(?:\.\d+)?)/); if(s) return {sMin:parseFloat(s[1]),sMax:parseFloat(s[1])};
  return {sMin:null,sMax:null};
}
function parseTableFormat(lines){
  var days={},dayOrder=[],headerIdx=-1,colMap={date:0,time:1,title:2,transport:3,spend:4,lodge:5,bag:6,notes:7};
  for(var i=0;i<Math.min(lines.length,5);i++){
    var cells=lines[i].split('\t'),str=cells.join(' ');
    if(/日期|时间|行程/.test(str)){ headerIdx=i; cells.forEach(function(c,j){ c=c.trim(); if(/日期/.test(c)) colMap.date=j; else if(/时间/.test(c)) colMap.time=j; else if(/行程|活动|内容/.test(c)) colMap.title=j; else if(/交通/.test(c)) colMap.transport=j; else if(/花费|消费|Spending|费用/.test(c)) colMap.spend=j; else if(/住宿/.test(c)) colMap.lodge=j; else if(/行李/.test(c)) colMap.bag=j; else if(/备注|推荐|notes/i.test(c)) colMap.notes=j; }); break; }
  }
  var currentDate=null,startRow=headerIdx>=0?headerIdx+1:0;
  for(var i=startRow;i<lines.length;i++){
    var cells=lines[i].split('\t'); if(cells.every(function(c){ return !c.trim(); })) continue;
    var dateCell=(cells[colMap.date]||'').trim(); if(dateCell){ var di=extractDate(dateCell); if(di) currentDate=di; }
    if(!currentDate) continue;
    var titleCell=(cells[colMap.title]||'').trim(); if(!titleCell) continue;
    var timeCell=(cells[colMap.time]||'').trim(),transCell=(cells[colMap.transport]||'').trim(),spendCell=(cells[colMap.spend]||'').trim(),lodgeCell=(cells[colMap.lodge]||'').trim(),bagCell=(cells[colMap.bag]||'').trim(),notesCell=(cells[colMap.notes]||'').trim();
    var sp=parseSpend(spendCell);
    if(!days[currentDate.date]){ days[currentDate.date]={date:currentDate.date,month:currentDate.month,day:currentDate.day,wd:currentDate.wd,title:currentDate.date,items:[]}; dayOrder.push(currentDate.date); }
    var dd=days[currentDate.date];
    dd.items.push({id:currentDate.date.replace(/-/g,'')+'_'+(dd.items.length+1),time:timeCell||'全天',title:titleCell,transport:transCell,sMin:sp.sMin,sMax:sp.sMax,lodge:lodgeCell,bag:bagCell,notes:notesCell,apps:guessApps(titleCell+' '+transCell),type:guessType(titleCell+' '+transCell),hi:/高铁|包车|飞机/.test(transCell),urgent:/准时/.test(notesCell)});
  }
  dayOrder.forEach(function(d){ var day=days[d]; var main=day.items.find(function(i){ return i.type==='attr'||i.type==='checkin'; })||day.items.find(function(i){ return i.type!=='food'; })||day.items[0]; if(main) day.title=main.title.substring(0,16); });
  return dayOrder.map(function(d){ return days[d]; });
}
function parseFreeText(lines){
  var days={},dayOrder=[],currentDate=null;
  lines.forEach(function(line){
    line=line.trim(); if(!line||/^[-=─═]+$/.test(line)) return;
    var di=extractDate(line);
    if(di){ currentDate=di; if(!days[currentDate.date]){ var tp=line.replace(/\d{1,2}[\/\-\.]\d{1,2}[（(][一二三四五六日][）)]?\s*/,'').replace(/\d{4}[\/\-]\d{2}[\/\-]\d{2}\s*/,'').trim(); days[currentDate.date]={date:currentDate.date,month:currentDate.month,day:currentDate.day,wd:currentDate.wd,title:tp||currentDate.date,items:[]}; dayOrder.push(currentDate.date); } return; }
    if(!currentDate) return;
    var time='全天'; var timeM=line.match(/^(\d{1,2}:\d{2})/); if(timeM){ time=timeM[1]; line=line.substring(timeM[0].length).trim(); } else if(/^全天/.test(line)){ time='全天'; line=line.replace(/^全天\s*/,''); }
    line=line.replace(/^[\s·\-]+/,''); if(!line) return;
    var dd=days[currentDate.date];
    dd.items.push({id:currentDate.date.replace(/-/g,'')+'_'+(dd.items.length+1),time:time,title:line.substring(0,40),transport:'',sMin:null,sMax:null,lodge:'',bag:'',notes:'',apps:guessApps(line),type:guessType(line),hi:/高铁|包车|飞机/.test(line),urgent:false});
  });
  dayOrder.forEach(function(d){ var day=days[d]; if(day.title===d||!day.title){ var main=day.items.find(function(i){ return i.type!=='food'&&i.type!=='rest'; })||day.items[0]; if(main) day.title=main.title.substring(0,16); } });
  return dayOrder.map(function(d){ return days[d]; });
}
function parseItineraryLocal(text){
  if(!text||text.length<5) return [];
  var lines=text.split(/\r?\n/).filter(function(l){ return l.trim(); });
  var isTable=lines.some(function(l){ return l.indexOf('\t')>=0; });
  return (isTable?parseTableFormat(lines):parseFreeText(lines)).filter(function(d){ return d.items.length>0; });
}
window.importFromXlsx=function(){
  if(typeof XLSX==='undefined'){ toast('Excel 库加载中，请刷新后重试'); return; }
  var inp=document.createElement('input'); inp.type='file'; inp.accept='.xlsx,.xls,.csv';
  inp.onchange=function(){
    var file=inp.files[0]; if(!file) return; closeModal(); showLoad();
    var reader=new FileReader();
    reader.onload=async function(e){
      try{ var data=new Uint8Array(e.target.result); var wb=XLSX.read(data,{type:'array'}); var ws=wb.Sheets[wb.SheetNames[0]]; var tsv=XLSX.utils.sheet_to_csv(ws,{FS:'\t'}); var days=parseItineraryLocal(tsv); if(!days||!days.length) throw new Error('未识别到行程数据'); await fbSaveDays(days); _updateTripDates(days); hideLoad(); renderItin(); toast(t('importOk')+'：'+days.length+'天'); }
      catch(err){ hideLoad(); toast(t('importFail')+'：'+err.message); }
    };
    reader.readAsArrayBuffer(file);
  };
  inp.click();
};
function _updateTripDates(days){
  if(!S.trip||!days.length) return;
  var first=days[0],last=days[days.length-1],autoDates=first.month+'/'+first.day+' — '+last.month+'/'+last.day;
  S.trip.dates=autoDates; if(db&&S.tripCode) updateDoc(doc(db,'trips',S.tripCode),{dates:autoDates}).catch(function(){});
  _addLocalTrip(S.tripCode,S.trip.name||'我的旅行',autoDates);
}

// ── PACKING SUGGESTIONS ───────────────────────────────────────
function getPackingSuggestions(){
  var en=S.lang==='en';
  var wx=S.weather,tMax=wx&&wx.daily?wx.daily.temperature_2m_max[0]:20,tMin=wx&&wx.daily?wx.daily.temperature_2m_min[0]:15;
  var prec=wx&&wx.daily?wx.daily.precipitation_probability_mean[0]||0:0;
  var clothes=getClothingRecs(tMax,tMin,prec,0);
  var items=[];
  // Clothing from weather
  clothes.forEach(function(c,i){ items.push({id:'wx_'+i,text:c[1],done:false,category:'clothes',auto:true}); });
  // Documents
  var docs=en?['Passport','Travel insurance','Hotel confirmation','Flight/train tickets','Emergency contacts']:
    ['护照','旅行保险','酒店预订单','机票/火车票','紧急联系人'];
  docs.forEach(function(d,i){ items.push({id:'doc_'+i,text:d,done:false,category:'docs',auto:true}); });
  // Electronics
  var elec=en?['Charger cable','Power bank','Adapter','Earphones']:['充电线','充电宝','转换插头','耳机'];
  elec.forEach(function(d,i){ items.push({id:'el_'+i,text:d,done:false,category:'electronics',auto:true}); });
  // Toiletries
  var toil=en?['Toothbrush','Sunscreen','Medications']:['牙刷牙膏','防晒霜','常备药'];
  toil.forEach(function(d,i){ items.push({id:'toil_'+i,text:d,done:false,category:'toiletries',auto:true}); });
  // Activity-specific
  var flat=allItemsFlat();
  if(flat.some(function(i){ return /游泳|泳|swim/i.test(i.title+i.notes); })){
    var si=en?['Swimwear','Swim cap','Goggles']:['泳衣','泳帽','泳镜'];
    si.forEach(function(s,i){ items.push({id:'swim_'+i,text:s,done:false,category:'clothes',auto:true}); });
  }
  // Period
  if(periodConflict()){
    var pd=en?['Sanitary pads','Painkillers','Heat patches']:['卫生棉','止痛药','暖贴'];
    pd.forEach(function(s,i){ items.push({id:'period_'+i,text:s,done:false,category:'toiletries',auto:true}); });
  }
  return items;
}

// ── PERIOD TRACKER ────────────────────────────────────────────
function periodConflict(){
  var pd=S.periodData; if(!pd.records||!pd.records.length) return false;
  var days=getDays(); if(!days.length) return false;
  var tripStart=new Date(days[0].date+'T00:00:00');
  var tripEnd=new Date(days[days.length-1].date+'T23:59:59');
  var lastDate=new Date(pd.records[pd.records.length-1]+'T00:00:00');
  var cycleLen=pd.cycleLen||28,dur=pd.duration||5;
  for(var i=0;i<3;i++){
    var pStart=new Date(lastDate.getTime()+(i+1)*cycleLen*86400000);
    var pEnd=new Date(pStart.getTime()+dur*86400000);
    if(pStart<=tripEnd&&pEnd>=tripStart) return true;
  }
  return false;
}
function getPeriodPredictions(){
  var pd=S.periodData; if(!pd.records||!pd.records.length) return [];
  var lastDate=new Date(pd.records[pd.records.length-1]+'T00:00:00');
  var cycleLen=pd.cycleLen||28,dur=pd.duration||5;
  return [0,1,2].map(function(i){
    var pStart=new Date(lastDate.getTime()+(i+1)*cycleLen*86400000);
    return {start:pStart.toISOString().split('T')[0],days:dur};
  });
}

// ── SETTLEMENT ────────────────────────────────────────────────
function calcSettle(){
  var ids=Object.keys(S.members); if(ids.length<2) return [];
  var bal={}; ids.forEach(function(id){ bal[id]=0; });
  S.expenses.forEach(function(e){ var amt=Number(e.baseAmount||e.amount)||0; var split=e.splitAmong||ids; var share=amt/split.length; if(bal[e.paidBy]!==undefined) bal[e.paidBy]+=amt; split.forEach(function(id){ if(bal[id]!==undefined) bal[id]-=share; }); });
  var txns=[],deb=ids.filter(function(id){ return bal[id]<-0.01; }).map(function(id){ return {id:id,a:-bal[id]}; }).sort(function(a,b){ return b.a-a.a; }),crd=ids.filter(function(id){ return bal[id]>0.01; }).map(function(id){ return {id:id,a:bal[id]}; }).sort(function(a,b){ return b.a-a.a; });
  var di=0,ci=0;
  while(di<deb.length&&ci<crd.length){ var p=Math.min(deb[di].a,crd[ci].a); txns.push({from:deb[di].id,to:crd[ci].id,amount:p}); deb[di].a-=p; crd[ci].a-=p; if(deb[di].a<0.01) di++; if(crd[ci].a<0.01) ci++; }
  return txns;
}

// ── GEO ──────────────────────────────────────────────────────
function requestGeo(){
  if(!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(function(pos){ S.geo={lat:pos.coords.latitude,lon:pos.coords.longitude}; fetchWeather(); },function(){});
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function checkNotifs(){
  if(localStorage.getItem('notifsEnabled')==='false') return;
  var todayDay=getDays().find(function(d){ return d.date===today(); }); if(!todayDay) return;
  var now=new Date(),shown=JSON.parse(localStorage.getItem('shownNotifs')||'[]');
  todayDay.items.forEach(function(item){
    if(!item.time||item.time==='全天') return;
    var parts=(item.time+':00').split(':'),h=parseInt(parts[0]),m=parseInt(parts[1]);
    var dt=new Date(today()+'T'+(h<10?'0':'')+h+':'+(m<10?'0':'')+m+':00'); var diff=(dt-now)/60000;
    var nid30='n30_'+item.id;
    if(diff>=28&&diff<=32&&shown.indexOf(nid30)<0){ shown.push(nid30); localStorage.setItem('shownNotifs',JSON.stringify(shown)); showNotifBanner('Travoo','30分钟后：'+item.title,getSmartTip(item)); }
    var nidNow='nnow_'+item.id;
    if(diff>=-2&&diff<=3&&shown.indexOf(nidNow)<0){ shown.push(nidNow); localStorage.setItem('shownNotifs',JSON.stringify(shown)); showNotifBanner('Travoo',item.title,getSmartTip(item)); }
  });
}
function getSmartTip(item){
  if(item.urgent) return '此行程时间紧张，务必准时出发';
  if(item.transport&&/高铁|高鐵|KTX|train|flight|飞机|飛機/.test(item.transport)) return t('travelDocs')+'，请提前到场';
  if(item.apps&&(item.apps.indexOf('didi')>=0||item.apps.indexOf('uber')>=0)) return '可提前5分钟打开应用叫车';
  var tips={food:'附近可用点评查看评分',attr:'建议先查好开放时间',transport:'提前确认交通',checkin:'记得备好预订单'};
  return tips[item.type]||'祝旅途愉快';
}
function showNotifBanner(app,title,body){
  var e=$('.nb'); if(e) e.remove();
  var d=document.createElement('div'); d.className='nb';
  d.innerHTML='<div class="nb-hdr"><div class="nb-icon">'+ic('bell',12)+'</div><span class="nb-app">'+escHtml(app)+'</span><span class="nb-time">现在</span></div><div class="nb-title">'+escHtml(title)+'</div><div class="nb-body">'+escHtml(body)+'</div>';
  document.body.appendChild(d);
  d.addEventListener('click',function(){ d.classList.add('out'); setTimeout(function(){ d.remove(); },300); });
  setTimeout(function(){ d.classList.add('out'); setTimeout(function(){ d.remove(); },300); },7000);
}

// ── VOICE ─────────────────────────────────────────────────────
var recognition=null;
function showVoiceFallback(onResult){
  showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:6px;color:var(--t1)">语音不可用</div><div style="font-size:13px;color:var(--t2);margin-bottom:14px">请手动输入</div><input class="inp" id="vf-inp" placeholder="输入内容" style="margin-bottom:14px"><button class="btn btn-p btn-full" onclick="submitVoiceFallback()">确认</button>');
  window._voiceFallbackCb=onResult;
}
window.submitVoiceFallback=function(){ var txt=$('#vf-inp')&&$('#vf-inp').value.trim(); closeModal(); if(txt&&window._voiceFallbackCb) window._voiceFallbackCb(txt); };

function startVoice(onResult){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR){ showVoiceFallback(onResult); return; }
  var finalText='',isDone=false;
  var ov=document.createElement('div'); ov.className='voice-ov';
  ov.innerHTML=
    '<div class="voice-ring" id="vring">'+ic('mic',40)+'</div>'+
    '<div class="voice-hint" id="vhint">'+t('listening')+'</div>'+
    '<div class="voice-text" id="voice-txt"></div>'+
    '<div style="display:flex;gap:12px;margin-top:28px">'+
      '<div class="voice-cancel" id="v-done" style="background:rgba(255,255,255,.18);color:#fff;font-weight:700;padding:10px 28px">完成</div>'+
      '<div class="voice-cancel" id="v-cancel">'+t('cancel')+'</div>'+
    '</div>';
  document.body.appendChild(ov);
  function finish(){ if(isDone) return; isDone=true; try{ if(recognition) recognition.stop(); }catch(e){} ov.remove(); var result=finalText.trim()||(($('#voice-txt')&&$('#voice-txt').textContent)||'').trim(); if(result) onResult(result); }
  function cancel(){ isDone=true; try{ if(recognition) recognition.stop(); }catch(e){} ov.remove(); }
  $('#v-done').addEventListener('click',finish); $('#v-cancel').addEventListener('click',cancel);
  recognition=new SR(); recognition.lang=S.lang==='en'?'en-US':'cmn-Hans-CN'; recognition.continuous=true; recognition.interimResults=true;
  recognition.onstart=function(){ var r=$('#vring'); if(r) r.style.animation='vring 0.8s ease-in-out infinite'; };
  recognition.onresult=function(e){ var interim=''; for(var i=e.resultIndex;i<e.results.length;i++){ var seg=e.results[i][0].transcript; if(e.results[i].isFinal){ finalText+=seg; }else{ interim+=seg; } } var el=$('#voice-txt'); if(el) el.innerHTML='<span style="color:rgba(255,255,255,.95)">'+escHtml(finalText)+'</span>'+(interim?'<span style="color:rgba(255,255,255,.45)">'+escHtml(interim)+'</span>':''); };
  recognition.onerror=function(e){
    var hint=$('#vhint');
    var errMap={'no-speech':'没听到声音','audio-capture':'麦克风不可用','not-allowed':'请允许麦克风权限','network':'网络错误'};
    if(hint){ hint.textContent=errMap[e.error]||('错误：'+e.error); hint.style.color='rgba(255,100,80,.9)'; }
    if(e.error==='no-speech'&&!isDone) setTimeout(function(){ try{ recognition.start(); }catch(er){} },200);
  };
  recognition.onend=function(){ if(!isDone) setTimeout(function(){ try{ recognition.start(); }catch(e){ finish(); } },150); };
  try{ recognition.start(); }catch(e){ ov.remove(); showVoiceFallback(onResult); }
}
function handleVoiceIntent(txt){
  var low=txt.toLowerCase();
  if(/記錄|记录|花了|消費|消费|spent|expense/.test(low)){ var m=txt.match(/\d+(\.\d+)?/); if(m){ switchTab('exp'); setTimeout(function(){ showAddExpenseModal({amount:parseFloat(m[0]),description:txt}); },300); return; } }
  if(/叫車|叫车|打車|打车|的士|taxi|uber|grab/.test(low)){ openApp('didi'); return; }
  if(/導航|导航|地圖|地图|map/.test(low)){ openApp('googlemaps'); return; }
  switchTab('chat'); setTimeout(function(){ sendChatMsg(txt); },300);
}

// ── APP LAUNCHER ──────────────────────────────────────────────
window.openApp=function(key,extra){
  var app=ALL_APPS[key]; if(!app) return; extra=extra||'';
  if(!app.scheme){ window.open(app.web+extra,'_blank'); return; }
  showLoad(); var webUrl=app.web+extra,schemeUrl=app.scheme+extra,opened=false,timer;
  function onHide(){ if(document.hidden){ opened=true; clearTimeout(timer); hideLoad(); } }
  document.addEventListener('visibilitychange',onHide);
  timer=setTimeout(function(){ document.removeEventListener('visibilitychange',onHide); if(!opened){ hideLoad(); window.open(webUrl,'_blank'); } },1800);
  try{ window.location.href=schemeUrl; }catch(e){ clearTimeout(timer); document.removeEventListener('visibilitychange',onHide); hideLoad(); window.open(webUrl,'_blank'); }
};
// XHS uses search via openApp
window.openXHS=function(kw){ openApp('xiaohongshu',encodeURIComponent(kw||'旅行推荐')); };
window.submitXHSSearch=function(){
  var inp=$('#xhs-inp'); var q=inp?inp.value.trim():''; if(!q) return;
  openXHS(q);
};

// ── MODAL ─────────────────────────────────────────────────────
var _ov=null;
function showModal(html){ closeModal(); var d=document.createElement('div'); d.className='ov'; d.innerHTML='<div class="sheet">'+html+'</div>'; d.addEventListener('click',function(e){ if(e.target===d) closeModal(); }); document.body.appendChild(d); _ov=d; }
window.closeModal=function(){ if(!_ov) return; _ov.style.animation='ovIn .18s ease reverse forwards'; var ov=_ov; _ov=null; setTimeout(function(){ ov.remove(); },200); };

// ── RENDER APP ────────────────────────────────────────────────
function renderApp(){
  var app=document.getElementById('app');
  if(!S.tripCode||!S.memberId){ if(S.localTrips.length>0) renderTripList(); else renderOnboarding(); return; }
  app.innerHTML=
    '<div id="v-home" class="view"></div><div id="v-itin" class="view"></div>'+
    '<div id="v-exp"  class="view"></div><div id="v-chat" class="view"></div>'+
    '<div id="v-set"  class="view"></div>'+
    '<nav class="tabs">'+
      '<div class="tab" id="tb-itin" onclick="switchTab(\'itin\')">'+ic('cal',24)+'</div>'+
      '<div class="tab" id="tb-exp"  onclick="switchTab(\'exp\')">'+ic('wallet',24)+'</div>'+
      '<div class="tab tab-home" id="tb-home" onclick="switchTab(\'home\')">'+ic('home',26)+'</div>'+
      '<div class="tab" id="tb-chat" onclick="switchTab(\'chat\')">'+ic('chat',24)+'</div>'+
      '<div class="tab" id="tb-set"  onclick="switchTab(\'set\')">'+ic('cog',24)+'</div>'+
    '</nav>';
  switchTab('home');
  subscribeAll(S.tripCode);
  setInterval(checkNotifs,60000); setTimeout(checkNotifs,2000);
  requestGeo();
  ['gfab-mic','gfab-add'].forEach(function(id){ var el=document.getElementById(id); if(el) el.remove(); });
  var micFab=document.createElement('button'); micFab.id='gfab-mic'; micFab.className='gfab'; micFab.setAttribute('hidden',''); micFab.innerHTML=ic('mic',22);
  micFab.addEventListener('mousedown',function(){ startVoice(handleVoiceIntent); });
  micFab.addEventListener('touchstart',function(e){ e.preventDefault(); startVoice(handleVoiceIntent); });
  document.getElementById('app').appendChild(micFab);
  var addFab=document.createElement('button'); addFab.id='gfab-add'; addFab.className='gfab'; addFab.setAttribute('hidden',''); addFab.innerHTML=ic('plus',22);
  addFab.addEventListener('click',function(){ showAddExpenseModal(); });
  document.getElementById('app').appendChild(addFab);
}
window.switchTab=function(name){
  $$('.tab').forEach(function(tb){ tb.classList.remove('on'); }); $$('.view').forEach(function(v){ v.classList.remove('active'); });
  var tb=$('#tb-'+name),vw=$('#v-'+name); if(tb) tb.classList.add('on'); if(vw) vw.classList.add('active');
  S.tab=name;
  var fn={home:renderHome,itin:renderItin,exp:renderExp,chat:renderChat,set:renderSet};
  if(fn[name]) fn[name]();
  var mf=document.getElementById('gfab-mic'),af=document.getElementById('gfab-add');
  if(mf){ if(name==='home') mf.removeAttribute('hidden'); else mf.setAttribute('hidden',''); }
  if(af){ if(name==='exp') af.removeAttribute('hidden'); else af.setAttribute('hidden',''); }
};

// ── ONBOARDING ────────────────────────────────────────────────
function renderOnboarding(){
  var offlineNote=fbReady()?'':'<div style="font-size:12px;color:var(--t3);text-align:center;padding:6px 0;line-height:1.5">'+t('offlineNote')+'</div>';
  var LL={'zh-CN':'简','zh-TW':'繁','en':'EN'};
  var langChips=['zh-CN','zh-TW','en'].map(function(l){ return '<div class="chip '+(S.lang===l?'on':'')+'" style="font-weight:600;padding:6px 16px" onclick="setLang(\''+l+'\')">'+LL[l]+'</div>'; }).join('');
  document.getElementById('app').innerHTML=
    '<div id="v-ob" class="view active"><div class="ob">'+
      '<div class="ob-logo">'+ic('plane',52)+'</div>'+
      '<div class="ob-brand">'+t('brand')+'</div><div class="ob-sub">'+t('sub')+'</div>'+
      '<div class="ob-form">'+
        '<div class="inp-lbl" style="text-align:left">'+t('yourName')+'</div>'+
        '<input class="inp" id="ob-name" placeholder="'+t('namePh')+'" autocomplete="off">'+
        '<input class="code-inp" id="ob-code" maxlength="6" placeholder="'+t('codePh')+'" autocomplete="off" autocapitalize="characters" spellcheck="false">'+
        '<button class="btn btn-g btn-full" id="ob-join" onclick="handleJoin()">'+t('join')+'</button>'+
        '<div class="ob-div">'+t('or')+'</div>'+
        '<button class="btn btn-p btn-full" id="ob-create" onclick="handleCreate()">'+t('create')+'</button>'+
        offlineNote+
        '<div style="display:flex;justify-content:flex-end;margin-top:4px;gap:6px">'+langChips+'</div>'+
      '</div></div></div>';
  var ci=$('#ob-code'); if(ci) ci.addEventListener('input',function(){ this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,''); });
}
window.setLang=function(l){ S.lang=l; localStorage.setItem('lang',l); renderApp(); };
window.handleJoin=async function(){
  var code=($('#ob-code')&&$('#ob-code').value.trim().toUpperCase())||'',name=($('#ob-name')&&$('#ob-name').value.trim())||'';
  if(code.length<6){ var ci=$('#ob-code'); if(ci){ ci.classList.add('shake'); setTimeout(function(){ ci.classList.remove('shake'); },500); } return; }
  if(!name){ toast('请输入你的名字'); return; }
  var btn=$('#ob-join'); if(btn){ btn.disabled=true; btn.textContent='连接中...'; }
  try{ var ok=await fbLoadTrip(code); if(!ok){ toast('找不到此行程码'); if(btn){ btn.disabled=false; btn.textContent=t('join'); } return; } var r=await fbJoinTrip(code,name); _saveSession(code,r.memberId,name); renderApp(); }
  catch(e){ toast('错误：'+e.message); if(btn){ btn.disabled=false; btn.textContent=t('join'); } }
};
window.handleCreate=async function(){
  var name=($('#ob-name')&&$('#ob-name').value.trim())||'';
  if(!name){ toast('请先输入你的名字'); return; }
  var btn=$('#ob-create'); if(btn){ btn.disabled=true; btn.textContent='创建中...'; }
  try{ var code=genCode(); var r=await fbCreateTrip(code,name); _saveSession(code,r.memberId,name); _addLocalTrip(code,(S.trip&&S.trip.name)||'我的旅行',(S.trip&&S.trip.dates)||''); renderApp(); setTimeout(function(){ toast('行程码：'+code+'，分享给朋友'); },400); }
  catch(e){ toast('错误：'+e.message); if(btn){ btn.disabled=false; btn.textContent=t('create'); } }
};
function _saveSession(code,mid,name){ S.tripCode=code; S.memberId=mid; S.memberName=name; localStorage.setItem('tripCode',code); localStorage.setItem('memberId',mid); localStorage.setItem('memberName',name); }
function _addLocalTrip(code,name,dates){ var trips=JSON.parse(localStorage.getItem('localTrips')||'[]'); if(!trips.find(function(tt){ return tt.code===code; })) trips.push({code:code,name:name,dates:dates}); localStorage.setItem('localTrips',JSON.stringify(trips)); S.localTrips=trips; }

// ── TRIP LIST ─────────────────────────────────────────────────
function renderTripList(){
  var cards=S.localTrips.map(function(tr){ return '<div class="tc" onclick="enterTrip(\''+tr.code+'\')"><div class="tc-bg"></div><div class="tc-body"><div class="tc-name">'+escHtml(tr.name||'我的旅行')+'</div><div class="tc-date">'+escHtml(tr.dates||'—')+'</div></div></div>'; }).join('');
  document.getElementById('app').innerHTML=
    '<div id="v-tl" class="view active"><div class="nav"><div class="nav-large">'+t('myTrips')+'</div><div class="nbtn" onclick="renderOnboarding()">'+ic('plus',18)+'</div></div>'+
    '<div class="scroller"><div style="height:16px"></div><div class="sec li-anim">'+cards+
      '<button class="btn btn-g btn-full" style="margin-top:8px" onclick="renderOnboarding()">'+ic('plus',16)+' '+t('newTrip')+'</button>'+
    '</div></div></div>';
}
window.enterTrip=async function(code){
  var mid=localStorage.getItem('memberId'); if(!mid){ renderOnboarding(); return; }
  S.memberId=mid; S.memberName=localStorage.getItem('memberName'); S.tripCode=code; localStorage.setItem('tripCode',code);
  showLoad(); var ok=await fbLoadTrip(code); hideLoad(); if(!ok){ toast('无法加载行程'); return; } renderApp();
};

// ── HOME ──────────────────────────────────────────────────────
function renderHome(){
  var v=$('#v-home'); if(!v) return;
  var trip=S.trip||{name:'Travoo',dates:'',days:[]},days=trip.days||[];
  var todayDay=days.find(function(d){ return d.date===today(); }),h=nowH();
  var nowDate=new Date();
  var startDate=days.length>0?new Date(days[0].date):nowDate;
  var endDate=days.length>0?new Date(days[days.length-1].date):nowDate;
  var prog=days.length>0?Math.max(0,Math.min(100,((nowDate-startDate)/(endDate-startDate+86400000))*100)):0;

  var recs=buildSmartRecs(todayDay,h),recsHtml='';
  if(recs.length){
    recsHtml='<div style="margin-bottom:16px"><div class="sec-ttl" style="padding:0 16px;margin-bottom:8px">'+t('smRec')+'</div><div class="smart-strip">';
    recs.forEach(function(r){ recsHtml+='<div class="smart-pill" onclick="'+(r.action||'')+'"><div class="smart-tag">'+escHtml(r.type)+'</div><div class="smart-ttl">'+escHtml(r.title)+'</div><div class="smart-desc">'+escHtml(r.desc)+'</div></div>'; });
    recsHtml+='</div></div>';
  }

  // FIX #1: XHS as search launcher
  var topics=getXHSTopics();
  var xhsHtml='<div style="margin-bottom:16px">'+
    '<div style="display:flex;align-items:center;padding:0 16px;margin-bottom:10px">'+
      '<div class="sec-ttl" style="margin-bottom:0;flex:1">'+t('xhs')+'</div>'+
      '<div onclick="refreshXHS()" class="btn-label">'+ic('refresh',12)+' '+t('xhsRefresh')+'</div>'+
    '</div>'+
    '<div class="xhs-launcher">'+
      '<div class="xhs-search-row">'+
        '<div class="xhs-search-field">'+
          ic('search',16)+
          '<input class="xhs-search-inp" id="xhs-inp" placeholder="'+(S.lang==='en'?'Search on RedNote…':'搜索小红书…')+'" onkeydown="if(event.key===\'Enter\') submitXHSSearch()">'+
        '</div>'+
        '<button class="xhs-go-btn" onclick="submitXHSSearch()">'+ic('send',15)+'</button>'+
      '</div>'+
      '<div class="xhs-topics">';
  topics.forEach(function(topic){
    xhsHtml+='<div class="xhs-topic" onclick="openXHS(\''+escHtml(encodeURIComponent(topic))+'\')">'+ic('search',11)+' '+escHtml(topic)+'</div>';
  });
  xhsHtml+='</div></div></div>';

  // Rate bar
  var lc=CURRENCY_LIST[S.localCurrency]||{flag:'',symbol:S.localCurrency},bc=CURRENCY_LIST[S.baseCurrency]||{flag:'',symbol:S.baseCurrency};
  var rateVal=getRate(S.localCurrency,S.baseCurrency);
  var rateStr=Object.keys(S.rates).length>0?('1 '+S.localCurrency+' = '+fmtCurrency(rateVal,S.baseCurrency)):'—';
  var rateBar='<div class="rate-bar" onclick="switchTab(\'set\')">'+
    '<div style="font-size:16px">'+lc.flag+'</div>'+
    '<div style="font-size:11px;color:var(--t3)">→</div>'+
    '<div style="font-size:16px">'+bc.flag+'</div>'+
    '<div style="flex:1">'+
      '<div style="font-size:13px;font-weight:600;color:var(--t1)">'+escHtml(rateStr)+'</div>'+
      (S.fxDate?'<div style="font-size:10px;color:var(--t3)">'+S.fxDate.substring(0,16)+'</div>':'<div style="font-size:10px;color:var(--t3)">'+t('rateUnavailable')+'</div>')+
    '</div>'+
    '<div onclick="event.stopPropagation();doFetchRates()" style="padding:5px 10px;background:rgba(var(--sf),.08);border-radius:100px;font-size:12px;color:var(--t2);display:flex;align-items:center;gap:4px;transition:all .15s var(--sp)" ontouchstart="this.style.opacity=\'.6\'">'+
      ic('refresh',12)+' '+t('refreshRate')+
    '</div>'+
  '</div>';

  // Bottom
  var bottomHtml='';
  if(todayDay&&todayDay.items.length){
    bottomHtml='<div class="sec"><div class="sec-ttl">'+t('todayTimeline')+'</div><div class="list li-anim">';
    todayDay.items.forEach(function(item){
      var sp=spendStr(item),spHtml=sp?'<div style="font-size:12px;color:var(--orange);margin-top:1px">'+escHtml(sp)+'</div>':'';
      var urgDot=item.urgent?'<div style="width:5px;height:5px;border-radius:50%;background:var(--red);flex-shrink:0"></div>':'';
      bottomHtml+='<div class="lr" onclick="showActDetail(\''+item.id+'\')">'+
        '<div style="width:44px;flex-shrink:0;font-size:12px;font-weight:700;color:var(--t2)">'+escHtml(item.time)+'</div>'+
        '<div style="flex:1"><div style="font-size:15px;font-weight:600;color:var(--t1)">'+renderMentions(item.title)+'</div>'+spHtml+'</div>'+urgDot+'</div>';
    });
    bottomHtml+='</div><button class="btn btn-g btn-full" style="margin-top:10px" onclick="switchTab(\'itin\')">'+t('viewFull')+'</button></div>';
  } else if(Object.keys(S.members).length){
    var memHtml='<div class="list">';
    Object.entries(S.members).forEach(function(entry){ var id=entry[0],m=entry[1]; var youTag=id===S.memberId?'<span class="you-tag">'+t('you')+'</span>':''; memHtml+='<div class="lr" style="cursor:default">'+renderAv(id)+'<span class="lr-lbl">'+escHtml(m.name)+'</span>'+youTag+'</div>'; });
    memHtml+='</div>';
    bottomHtml='<div class="sec"><div class="sec-ttl">'+t('members')+'</div>'+memHtml+'</div>';
  }

  var heroDay,heroTitle;
  if(days.length===0){ heroDay=t('notPlanned'); heroTitle=trip.name||'Travoo'; }
  else if(todayDay){ heroDay=getWdLabel(todayDay.wd)+' · '+t('today'); heroTitle=todayDay.title; }
  else if(nowDate<startDate){ heroDay=t('countdown'); heroTitle=trip.name||'Travoo'; }
  else { heroDay=t('tripEnded'); heroTitle=trip.name||'Travoo'; }

  var memberEntries=Object.entries(S.members),avatarsHtml='';
  memberEntries.slice(0,5).forEach(function(entry){ var id=entry[0],m=entry[1]; var img=memberAvatar(id); avatarsHtml+=img?'<div class="hav"><img src="'+img+'" alt=""></div>':'<div class="hav" style="background:'+m.color+'">'+((m.name||'?')[0])+'</div>'; });
  if(memberEntries.length>5) avatarsHtml+='<div class="hav" style="background:rgba(var(--sf),.15)">+'+(memberEntries.length-5)+'</div>';
  var memberRow=memberEntries.length>0?'<div class="hero-members"><div style="display:flex">'+avatarsHtml+'</div><span class="hero-mem-info">'+memberEntries.length+' '+t('nMembers')+'</span><div class="hero-share-btn" onclick="showTripCodeModal()">'+ic('share',13)+' '+t('invite')+'</div></div>':'';

  // Quick Actions
  var qaApps=getQuickApps();
  var qaHtml='';
  qaApps.slice(0,6).forEach(function(key){ var app=ALL_APPS[key]; if(!app) return; qaHtml+='<div class="qa" onclick="openApp(\''+key+'\')"><div class="qa-icon">'+ic(app.icon||'globe',20)+'</div><div class="qa-lbl">'+escHtml(getAppLabel(key))+'</div></div>'; });
  qaHtml+='<div class="qa" onclick="switchTab(\'exp\');setTimeout(showAddExpenseModal,200)"><div class="qa-icon">'+ic('camera',20)+'</div><div class="qa-lbl">'+t('logExp')+'</div></div>';
  qaHtml+='<div class="qa" onclick="showListsModal()"><div class="qa-icon">'+ic('list',20)+'</div><div class="qa-lbl">'+t('lists')+'</div></div>';

  var tzBar=renderTimezoneBar();
  var trBar=renderTranslateBar();

  v.innerHTML=
    '<div class="nav"><div style="font-size:13px;color:var(--t2);flex:1">'+escHtml(trip.name||'')+'</div><div class="nbtn" onclick="showTripCodeModal()">'+ic('share',16)+'</div></div>'+
    '<div class="scroller">'+
      '<div class="hero" style="margin-top:10px"><div class="hero-inner">'+
        '<div class="hero-day">'+heroDay+'</div>'+
        '<div class="hero-title">'+escHtml(heroTitle)+'</div>'+
        '<div class="hero-prog"><div class="hero-fill" style="width:'+prog+'%"></div></div>'+
        memberRow+'</div></div>'+
      renderWeatherWidget()+
      rateBar+
      (tzBar||'')+
      '<div class="sec">'+
        '<div style="display:flex;align-items:center;margin-bottom:8px">'+
          '<div class="sec-ttl" style="margin-bottom:0;flex:1">'+t('qa')+'</div>'+
          '<div onclick="showCustomAppsModal()" class="btn-label">'+ic('edit',12)+' '+t('editApps')+'</div>'+
        '</div>'+
        '<div class="qa-grid">'+qaHtml+'</div>'+
      '</div>'+
      recsHtml+
      trBar+
      xhsHtml+
      bottomHtml+
    '</div>';
}

window.doFetchRates=async function(){ toast('获取汇率中...',0); var ok=await fetchRates(); toast(ok?'汇率已更新':'获取失败'); renderHome(); };

function buildSmartRecs(todayDay,h){
  var recs=[]; if(!todayDay) return recs;
  if(h>=7&&h<=9) recs.push({type:S.lang==='en'?'Breakfast':'早餐推荐',title:S.lang==='en'?'Find breakfast nearby':'附近早餐',desc:S.lang==='en'?'Search review apps':'搜索附近评分',action:"openApp('dianping')"});
  if(h>=11&&h<=13) recs.push({type:S.lang==='en'?'Lunch':'午餐推荐',title:S.lang==='en'?'Local lunch':'当地特色',desc:S.lang==='en'?'Highly-rated nearby':'搜索好评餐厅',action:"openApp('dianping')"});
  if(S.geo) recs.push({type:S.lang==='en'?'Location':'位置感知',title:S.lang==='en'?'Location available':'已获取位置',desc:S.lang==='en'?'Plan optimal routes':'规划最优路线',action:"openApp('googlemaps')"});
  return recs.slice(0,3);
}

// ── CUSTOM APPS ───────────────────────────────────────────────
window.showCustomAppsModal=function(){
  var current=getQuickApps().slice();
  var html='<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:4px;color:var(--t1)">'+t('customApps')+'</div>'+
    '<div style="font-size:13px;color:var(--t2);margin-bottom:14px">'+t('customAppsDesc')+'（最多8个）</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">';
  Object.keys(ALL_APPS).forEach(function(key){
    var on=current.indexOf(key)>=0;
    html+='<div class="chip'+(on?' on':'')+'" id="qa-chip-'+key+'" onclick="toggleQAApp(\''+key+'\')">'+getAppLabel(key)+'</div>';
  });
  html+='</div><button class="btn btn-p btn-full" onclick="saveCustomApps()" style="margin-bottom:8px">'+t('save')+'</button>'+
    '<button class="btn btn-g btn-full" onclick="resetCustomApps()">'+t('resetDefault')+'</button>';
  showModal(html);
  S._customAppsTemp=current.slice();
};
window.toggleQAApp=function(key){
  if(!S._customAppsTemp) S._customAppsTemp=getQuickApps().slice();
  var idx=S._customAppsTemp.indexOf(key);
  var chip=$('#qa-chip-'+key);
  if(idx>=0){ S._customAppsTemp.splice(idx,1); if(chip) chip.classList.remove('on'); }
  else { if(S._customAppsTemp.length>=8){ toast(S.lang==='en'?'Max 8 apps':'最多8个'); return; } S._customAppsTemp.push(key); if(chip) chip.classList.add('on'); }
};
window.saveCustomApps=function(){ S.customApps=S._customAppsTemp||getQuickApps(); localStorage.setItem('customApps',JSON.stringify(S.customApps)); closeModal(); renderHome(); toast(t('save')); };
window.resetCustomApps=function(){ S.customApps=null; localStorage.removeItem('customApps'); closeModal(); renderHome(); };
window.refreshXHS=function(){ renderHome(); };

// ── LISTS MODAL ───────────────────────────────────────────────
window.showListsModal=function(){
  S._listPane=S._listPane||'shopping';
  renderListsModal();
};
function renderListsModal(){
  var pane=S._listPane||'shopping';
  var tabs=['shopping','todo','packing','souvenir'].map(function(k){
    var labels={shopping:t('shopping'),todo:t('todo'),packing:t('packing'),souvenir:t('souvenir')};
    return '<div class="ptab'+(pane===k?' on':'')+'" onclick="switchListPane(\''+k+'\')">'+labels[k]+'</div>';
  }).join('');
  var content='';
  if(pane==='shopping') content=renderNotesListPane(S.shoppingList,'shoppingList',t('shopping'));
  else if(pane==='todo') content=renderTodoPaneNew();
  else if(pane==='packing') content=renderPackingPaneNew();
  else content=renderNotesListPane(S.souvenirList,'souvenirList',t('souvenir'));
  showModal(
    '<div class="sh"></div>'+
    '<div class="ptabs" style="margin-bottom:14px">'+tabs+'</div>'+
    '<div id="list-modal-content">'+content+'</div>'
  );
}
window.switchListPane=function(pane){ S._listPane=pane; renderListsModal(); };

// Notes-style list renderer (Shopping, Souvenir)
function renderNotesListPane(items,storeKey,title){
  var en=S.lang==='en';
  var html='<div style="padding:0 0 4px">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
      '<input class="inp" id="nl-inp-'+storeKey+'" placeholder="'+(en?'Add item…':'添加…')+'" style="flex:1;border-radius:100px" '+
        'onkeydown="if(event.key===\'Enter\') addNotesItem(\''+storeKey+'\')">'+
      '<button class="btn btn-p" style="width:40px;height:40px;padding:0;border-radius:50%;flex-shrink:0" onclick="addNotesItem(\''+storeKey+'\')">'+ic('plus',18)+'</button>'+
    '</div>';
  if(!items.length){
    html+='<div style="text-align:center;padding:24px;color:var(--t4);font-size:14px">'+(en?'Nothing yet — tap to add':'暂无内容，点击添加')+'</div>';
  } else {
    html+='<div class="notes-list">';
    items.forEach(function(item,i){
      html+='<div class="notes-item">'+
        '<div class="notes-check'+(item.done?' done':'')+'" onclick="toggleNotesItem(\''+storeKey+'\','+i+')">'+
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'+
        '</div>'+
        '<span class="notes-text'+(item.done?' done':'')+'" contenteditable="true" '+
          'onblur="editNotesItem(\''+storeKey+'\','+i+',this.textContent)" '+
          'onclick="this.focus()">'+escHtml(item.text)+'</span>'+
        '<div class="notes-del" onclick="removeNotesItem(\''+storeKey+'\','+i+')">'+ic('trash',14)+'</div>'+
      '</div>';
    });
    html+='</div>';
  }
  html+='</div>';
  return html;
}

window.addNotesItem=function(storeKey){
  var inp=$('#nl-inp-'+storeKey); if(!inp) return;
  var text=inp.value.trim(); if(!text) return;
  S[storeKey].push({id:'nl_'+Date.now(),text:text,done:false});
  localStorage.setItem(storeKey,JSON.stringify(S[storeKey]));
  inp.value='';
  var div=$('#list-modal-content'); if(div) div.innerHTML=renderNotesListPane(S[storeKey],storeKey,storeKey);
};
window.toggleNotesItem=function(storeKey,i){ if(S[storeKey][i]) S[storeKey][i].done=!S[storeKey][i].done; localStorage.setItem(storeKey,JSON.stringify(S[storeKey])); var div=$('#list-modal-content'); if(div) div.innerHTML=renderNotesListPane(S[storeKey],storeKey,storeKey); };
window.removeNotesItem=function(storeKey,i){ S[storeKey].splice(i,1); localStorage.setItem(storeKey,JSON.stringify(S[storeKey])); var div=$('#list-modal-content'); if(div) div.innerHTML=renderNotesListPane(S[storeKey],storeKey,storeKey); };
window.editNotesItem=function(storeKey,i,text){ if(S[storeKey][i]&&text.trim()){ S[storeKey][i].text=text.trim(); localStorage.setItem(storeKey,JSON.stringify(S[storeKey])); } };

// To-Do with phases
function renderTodoPaneNew(){
  var en=S.lang==='en';
  var phases=['pre','during','post'];
  var phaseLabels={pre:t('listPre'),during:t('listDuring'),post:t('listPost')};
  var html='<div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">'+
    '<input class="inp" id="todo-inp" placeholder="'+(en?'Add task…':'添加任务…')+'" style="flex:1;border-radius:100px" onkeydown="if(event.key===\'Enter\') addTodoNew()">'+
    '<select class="inp" id="todo-phase" style="width:90px;border-radius:100px;font-size:13px">'+
      phases.map(function(p){ return '<option value="'+p+'">'+phaseLabels[p]+'</option>'; }).join('')+
    '</select>'+
    '<button class="btn btn-p" style="width:40px;height:40px;padding:0;border-radius:50%;flex-shrink:0" onclick="addTodoNew()">'+ic('plus',18)+'</button>'+
  '</div>';
  var anyItems=false;
  phases.forEach(function(phase){
    var items=(S.todoList[phase]||[]);
    if(!items.length) return;
    anyItems=true;
    html+='<div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;padding:8px 2px 4px">'+phaseLabels[phase]+'</div>'+
      '<div class="notes-list" style="margin-bottom:8px">';
    items.forEach(function(item,i){
      html+='<div class="notes-item">'+
        '<div class="notes-check'+(item.done?' done':'')+'" onclick="toggleTodoNew(\''+phase+'\',\''+item.id+'\')">'+
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'+
        '</div>'+
        '<span class="notes-text'+(item.done?' done':'')+'" contenteditable="true" onblur="editTodoNew(\''+phase+'\',\''+item.id+'\',this.textContent)">'+escHtml(item.text)+'</span>'+
        '<div class="notes-del" onclick="removeTodoNew(\''+phase+'\',\''+item.id+'\')">'+ic('trash',14)+'</div>'+
      '</div>';
    });
    html+='</div>';
  });
  if(!anyItems) html+='<div style="text-align:center;padding:24px;color:var(--t4);font-size:14px">'+(en?'No tasks yet':'暂无待办')+'</div>';
  return html;
}
window.addTodoNew=function(){
  var inp=$('#todo-inp'),ph=$('#todo-phase'); if(!inp||!ph) return;
  var text=inp.value.trim(); if(!text) return;
  var phase=ph.value; if(!S.todoList[phase]) S.todoList[phase]=[];
  S.todoList[phase].push({id:'t_'+Date.now(),text:text,done:false});
  localStorage.setItem('todoList',JSON.stringify(S.todoList));
  inp.value=''; var div=$('#list-modal-content'); if(div) div.innerHTML=renderTodoPaneNew();
};
window.toggleTodoNew=function(phase,id){ var items=S.todoList[phase]||[]; var item=items.find(function(i){ return i.id===id; }); if(item) item.done=!item.done; localStorage.setItem('todoList',JSON.stringify(S.todoList)); var div=$('#list-modal-content'); if(div) div.innerHTML=renderTodoPaneNew(); };
window.removeTodoNew=function(phase,id){ S.todoList[phase]=(S.todoList[phase]||[]).filter(function(i){ return i.id!==id; }); localStorage.setItem('todoList',JSON.stringify(S.todoList)); var div=$('#list-modal-content'); if(div) div.innerHTML=renderTodoPaneNew(); };
window.editTodoNew=function(phase,id,text){ var item=(S.todoList[phase]||[]).find(function(i){ return i.id===id; }); if(item&&text.trim()) item.text=text.trim(); localStorage.setItem('todoList',JSON.stringify(S.todoList)); };

// Packing - Notes style with smart suggestions
function renderPackingPaneNew(){
  var en=S.lang==='en';
  // Merge suggestions with user additions
  var suggestions=getPackingSuggestions();
  // S.packingItems are user additions
  var allItems=suggestions.concat(S.packingItems.filter(function(ui){ return !suggestions.find(function(s){ return s.id===ui.id; }); }));
  // Apply saved done states
  var packingDone=JSON.parse(localStorage.getItem('packingDone')||'{}');
  allItems=allItems.map(function(item){ return Object.assign({},item,{done:packingDone[item.id]||item.done||false}); });
  var html='<div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">'+
    '<input class="inp" id="pack-inp" placeholder="'+(en?'Add item…':'添加物品…')+'" style="flex:1;border-radius:100px" onkeydown="if(event.key===\'Enter\') addPackingItemNew()">'+
    '<button class="btn btn-p" style="width:40px;height:40px;padding:0;border-radius:50%;flex-shrink:0" onclick="addPackingItemNew()">'+ic('plus',18)+'</button>'+
  '</div>';
  if(periodConflict()){
    html+='<div class="period-warning" style="margin-bottom:10px">'+
      ic('bell',14)+' <span>'+t('periodConflict')+'</span>'+
    '</div>';
  }
  var total=allItems.length, done=allItems.filter(function(i){ return i.done; }).length;
  if(total>0) html+='<div style="font-size:11px;color:var(--t3);margin-bottom:8px;padding:0 2px">'+done+'/'+total+' '+(en?'packed':'已打包')+'</div>';
  html+='<div class="notes-list">';
  allItems.forEach(function(item){
    html+='<div class="notes-item">'+
      '<div class="notes-check'+(item.done?' done':'')+'" onclick="togglePackingNew(\''+item.id+'\')">'+
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'+
      '</div>'+
      '<span class="notes-text'+(item.done?' done':'')+'">'+escHtml(item.text)+'</span>'+
      (item.auto?'<span style="font-size:10px;color:var(--t4);flex-shrink:0;margin-left:4px">AI</span>':
        '<div class="notes-del" onclick="removePackingItemNew(\''+item.id+'\')">'+ic('trash',14)+'</div>')+
    '</div>';
  });
  html+='</div></div>';
  return html;
}
window.addPackingItemNew=function(){
  var inp=$('#pack-inp'); if(!inp) return; var text=inp.value.trim(); if(!text) return;
  var id='pack_'+Date.now();
  S.packingItems.push({id:id,text:text,done:false,auto:false});
  localStorage.setItem('packingItems',JSON.stringify(S.packingItems));
  inp.value=''; var div=$('#list-modal-content'); if(div) div.innerHTML=renderPackingPaneNew();
};
window.togglePackingNew=function(id){
  var packingDone=JSON.parse(localStorage.getItem('packingDone')||'{}');
  packingDone[id]=!packingDone[id];
  localStorage.setItem('packingDone',JSON.stringify(packingDone));
  // Also update in packingItems if user-added
  var ui=S.packingItems.find(function(i){ return i.id===id; }); if(ui) ui.done=packingDone[id];
  localStorage.setItem('packingItems',JSON.stringify(S.packingItems));
  var div=$('#list-modal-content'); if(div) div.innerHTML=renderPackingPaneNew();
};
window.removePackingItemNew=function(id){
  S.packingItems=S.packingItems.filter(function(i){ return i.id!==id; });
  localStorage.setItem('packingItems',JSON.stringify(S.packingItems));
  var div=$('#list-modal-content'); if(div) div.innerHTML=renderPackingPaneNew();
};

// ── TRAVEL JOURNAL ────────────────────────────────────────────
window.showJournalForDay=function(dateStr){
  var entry=S.journalData[dateStr]||{text:'',photos:[]};
  var en=S.lang==='en';
  var photosHtml='';
  entry.photos.forEach(function(p,i){
    photosHtml+='<div class="journal-photo" onclick="removeJournalPhoto(\''+dateStr+'\','+i+')" style="cursor:pointer">'+
      '<img src="'+p+'" alt="">'+
      '<div style="position:absolute;inset:0;background:rgba(0,0,0,.0);display:flex;align-items:center;justify-content:center;opacity:0;transition:all .2s" onmouseover="this.style.opacity=1;this.style.background=\'rgba(0,0,0,.4)\'" onmouseout="this.style.opacity=0;this.style.background=\'rgba(0,0,0,0)\'">'+ic('trash',16)+'</div>'+
    '</div>';
  });
  photosHtml+='<div class="journal-photo journal-photo-add" onclick="addJournalPhoto(\''+dateStr+'\')">'+ic('plus',22)+'</div>';
  showModal(
    '<div class="sh"></div>'+
    '<div style="font-size:18px;font-weight:700;margin-bottom:4px;color:var(--t1)">'+t('journal')+'</div>'+
    '<div style="font-size:13px;color:var(--t2);margin-bottom:14px">'+escHtml(dateStr)+'</div>'+
    '<div class="journal-photos" style="margin-bottom:12px">'+photosHtml+'</div>'+
    '<div class="journal-text" id="journal-text-'+dateStr+'" contenteditable="true" '+
      'data-placeholder="'+t('journalPh')+'" '+
      'style="min-height:100px;outline:none;padding:4px 2px;font-size:15px;line-height:1.7;color:var(--t1);border-radius:8px">'+
      (entry.text?escHtml(entry.text):'')+
    '</div>'+
    '<div style="margin-top:14px;display:flex;gap:8px">'+
      '<button class="btn btn-p" style="flex:1" onclick="saveJournalEntry(\''+dateStr+'\')">'+t('save')+'</button>'+
      '<button class="btn btn-g" style="flex:1" onclick="closeModal()">'+t('cancel')+'</button>'+
    '</div>'
  );
  // Focus on text area
  setTimeout(function(){ var el=$('#journal-text-'+dateStr); if(el){ el.focus(); // Place cursor at end
    var range=document.createRange(); range.selectNodeContents(el); range.collapse(false); var sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range); } },200);
};
window.saveJournalEntry=function(dateStr){
  var el=$('#journal-text-'+dateStr); if(!el) return;
  var text=el.textContent.trim();
  if(!S.journalData[dateStr]) S.journalData[dateStr]={text:'',photos:[]};
  S.journalData[dateStr].text=text;
  localStorage.setItem('journalData',JSON.stringify(S.journalData));
  closeModal(); toast(t('save'));
};
window.addJournalPhoto=function(dateStr){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=function(){
    var f=inp.files[0]; if(!f) return;
    var rd=new FileReader();
    rd.onload=function(e){
      try{
        var img=new Image(); img.onload=function(){
          var canvas=document.createElement('canvas');
          var maxW=800,maxH=600;
          var w=img.width,h=img.height;
          if(w>maxW){ h=Math.round(h*maxW/w); w=maxW; }
          if(h>maxH){ w=Math.round(w*maxH/h); h=maxH; }
          canvas.width=w; canvas.height=h;
          var ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
          var b64=canvas.toDataURL('image/jpeg',0.75);
          if(!S.journalData[dateStr]) S.journalData[dateStr]={text:'',photos:[]};
          S.journalData[dateStr].photos.push(b64);
          localStorage.setItem('journalData',JSON.stringify(S.journalData));
          // Refresh the text content
          var textEl=$('#journal-text-'+dateStr);
          var savedText=textEl?textEl.textContent.trim():'';
          if(savedText) S.journalData[dateStr].text=savedText;
          showJournalForDay(dateStr);
        };
        img.src=e.target.result;
      }catch(err){ toast(t('imgTooLarge')); }
    };
    rd.readAsDataURL(f);
  };
  inp.click();
};
window.removeJournalPhoto=function(dateStr,i){
  if(S.journalData[dateStr]&&S.journalData[dateStr].photos){
    S.journalData[dateStr].photos.splice(i,1);
    localStorage.setItem('journalData',JSON.stringify(S.journalData));
    showJournalForDay(dateStr);
  }
};

// ── ITINERARY ─────────────────────────────────────────────────
var _itinDay=0;
function renderItin(){
  var v=$('#v-itin'); if(!v) return;
  var days=getDays(),todayIdx=days.findIndex(function(d){ return d.date===today(); }); _itinDay=todayIdx>=0?todayIdx:0;
  var tabsHtml='';
  days.forEach(function(d,i){
    var cls='dtab'+(i===_itinDay?' on':'')+(d.date===today()?' today':'');
    tabsHtml+='<div class="'+cls+'" id="dtab-'+i+'" onclick="jumpToDay('+i+')"><div class="dtab-wd">'+getWdLabel(d.wd)+'</div><div class="dtab-d">'+d.day+'</div></div>';
  });
  var pagesHtml='';
  days.forEach(function(day,di){
    var itemsHtml=''; day.items.forEach(function(item){ itemsHtml+=renderActCard(item); });
    // Journal indicator
    var hasJournal=S.journalData[day.date]&&(S.journalData[day.date].text||S.journalData[day.date].photos&&S.journalData[day.date].photos.length);
    var journalBtn='<div style="margin:0 16px 10px;display:flex;gap:8px">'+
      '<button class="btn btn-g" style="flex:1;padding:10px;font-size:13px;gap:6px" onclick="showJournalForDay(\''+day.date+'\')">'+
        ic('book',14)+' '+t('journal')+(hasJournal?' ✓':'')+
      '</button>'+
      '<button class="btn btn-g" style="flex:1;padding:10px;font-size:13px" onclick="showAddItemModal('+di+')">'+ic('plus',14)+' '+t('addItem')+'</button>'+
    '</div>';
    var canUp=di>0,canDown=di<days.length-1;
    pagesHtml+='<div class="itin-page" id="ipg-'+di+'">'+
      '<div class="day-hdr">'+
        '<div class="day-hdr-title" onclick="editDayTitle('+di+')">'+escHtml(day.title)+'</div>'+
        '<div class="day-hdr-sub">'+day.month+'/'+day.day+' '+getWdLabel(day.wd)+'</div>'+
        '<div class="day-reorder">'+
          (canUp?'<div class="day-reorder-btn" onclick="reorderDay('+di+',-1)">'+ic('arrowup',12)+'</div>':'<div style="width:26px"></div>')+
          (canDown?'<div class="day-reorder-btn" onclick="reorderDay('+di+',1)">'+ic('arrowdn',12)+'</div>':'<div style="width:26px"></div>')+
        '</div>'+
      '</div>'+
      '<div class="li-anim">'+itemsHtml+'</div>'+
      journalBtn+
    '</div>';
  });

  // FIX #6: Clean empty state, no big button
  var emptyItin=days.length===0?
    '<div class="empty" style="min-height:60vh;cursor:pointer" onclick="showTripEditModal()">'+
      ic('cal',52)+
      '<div class="empty-ttl">'+t('notPlanned')+'</div>'+
      '<div class="empty-sub">'+t('importNote')+'</div>'+
    '</div>':'';

  v.innerHTML=
    '<div class="nav"><div class="nbtn" onclick="showTripEditModal()">'+ic('edit',16)+'</div>'+
    '<div class="nav-title">'+escHtml((S.trip&&S.trip.name)||t('itin'))+'</div>'+
    '<div class="nbtn" onclick="showAddDayModal()">'+ic('plus',16)+'</div></div>'+
    (days.length>0?'<div class="day-tabs" id="dtabs">'+tabsHtml+'</div><div class="itin-scroll" id="itin-sl">'+pagesHtml+'</div>':emptyItin);

  var sl=$('#itin-sl');
  if(sl&&_itinDay>0) setTimeout(function(){ sl.scrollTo({left:_itinDay*sl.offsetWidth,behavior:'instant'}); },50);
  if(sl){ sl.addEventListener('scroll',function(){ var idx=Math.round(sl.scrollLeft/sl.offsetWidth); if(idx!==_itinDay){ _itinDay=idx; $$('.dtab').forEach(function(d,i){ d.classList.toggle('on',i===idx); }); var tab=$('#dtab-'+idx); if(tab) tab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}); } },{passive:true}); }
}
window.reorderDay=async function(di,dir){
  var days=JSON.parse(JSON.stringify(getDays())); var newIdx=di+dir;
  if(newIdx<0||newIdx>=days.length) return;
  var tmp=days[di]; days[di]=days[newIdx]; days[newIdx]=tmp;
  showLoad(); await fbSaveDays(days); hideLoad(); renderItin();
};
window.editDayTitle=function(di){ var days=getDays(); if(!days[di]) return; showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t('editDayTitle')+'</div><input class="inp" id="edt-title" value="'+escHtml(days[di].title)+'" style="margin-bottom:14px"><button class="btn btn-p btn-full" onclick="submitEditDayTitle('+di+')">'+t('save')+'</button>'); };
window.submitEditDayTitle=async function(di){ var title=$('#edt-title')&&$('#edt-title').value.trim(); if(!title) return; var days=JSON.parse(JSON.stringify(getDays())); days[di].title=title; closeModal(); showLoad(); await fbSaveDays(days); hideLoad(); renderItin(); };

function renderActCard(item){
  var spend=spendStr(item),isHi=item.hi&&item.transport;
  var chipsHtml=''; if(item.transport&&!isHi) chipsHtml+='<span class="act-chip">'+ic('car',10)+' '+escHtml(item.transport)+'</span>'; if(item.lodge) chipsHtml+='<span class="act-chip">'+ic('map',10)+' '+escHtml(item.lodge)+'</span>';
  var appBtns=''; if(item.apps&&item.apps.length) item.apps.forEach(function(a){ if(!ALL_APPS[a]) return; var icoN=ALL_APPS[a].icon||'globe'; appBtns+='<div class="act-app" onclick="event.stopPropagation();openApp(\''+a+'\')">'+ic(icoN,12)+' '+escHtml(getAppLabel(a))+'</div>'; });
  return '<div class="act'+(item.urgent?' urgent':'')+'" onclick="showActDetail(\''+item.id+'\')">'+
    '<div class="act-row"><div class="act-tc"><div class="act-time">'+escHtml(item.time)+'</div></div>'+
    '<div class="act-body"><div class="act-title">'+renderMentions(item.title)+'</div>'+
      (chipsHtml?'<div class="act-meta">'+chipsHtml+'</div>':'')+
      (isHi?'<div class="act-ttag">'+ic('train',11)+' '+escHtml(item.transport)+'</div>':'')+
      (spend?'<div class="act-spend">'+escHtml(spend)+'</div>':'')+
      (item.notes?'<div class="act-note">'+escHtml(item.notes)+'</div>':'')+
      (item.urgent?'<div class="act-note urg">'+ic('bell',11)+' 必须准时</div>':'')+
      (appBtns?'<div class="act-apps">'+appBtns+'</div>':'')+
    '</div></div>'+
    '<div class="act-edit" onclick="event.stopPropagation();showEditItemModal(\''+item.id+'\')">'+ic('edit',12)+' '+t('editItem')+'</div></div>';
}
window.jumpToDay=function(idx){ _itinDay=idx; var sl=$('#itin-sl'); if(sl) sl.scrollTo({left:idx*sl.offsetWidth,behavior:'smooth'}); $$('.dtab').forEach(function(d,i){ d.classList.toggle('on',i===idx); }); };

window.showActDetail=function(id){
  var item=findItem(id); if(!item) return; var spend=spendStr(item);
  var rows='';
  if(item.transport) rows+='<div class="lr" style="cursor:default;border-radius:var(--r2);background:rgba(var(--sf),.07);margin-bottom:6px"><span class="lr-lbl">'+t('transLabel').replace('（可留空）','').replace(' (optional)','')+'</span><span class="lr-val">'+escHtml(item.transport)+'</span></div>';
  if(spend) rows+='<div class="lr" style="cursor:default;border-radius:var(--r2);background:rgba(var(--sf),.07);margin-bottom:6px"><span class="lr-lbl">预计花费</span><span class="lr-val" style="color:var(--orange);font-weight:700">'+escHtml(spend)+'</span></div>';
  if(item.lodge) rows+='<div class="lr" style="cursor:default;border-radius:var(--r2);background:rgba(var(--sf),.07);margin-bottom:6px"><span class="lr-lbl">住宿</span><span class="lr-val">'+escHtml(item.lodge)+'</span></div>';
  if(item.notes) rows+='<div style="padding:10px 12px;background:rgba(255,159,10,.07);border-left:2px solid rgba(255,159,10,.35);border-radius:0 10px 10px 0;margin-bottom:8px;font-size:14px;line-height:1.55;color:var(--t1)">'+escHtml(item.notes)+'</div>';
  if(item.urgent) rows+='<div style="padding:10px 12px;background:rgba(255,69,58,.08);border-left:2px solid rgba(255,69,58,.4);border-radius:0 10px 10px 0;margin-bottom:8px;font-size:14px;color:rgba(255,120,110,.9);font-weight:600">必须准时离开</div>';
  var appBtnsHtml=''; if(item.apps&&item.apps.length){ var btns=''; item.apps.forEach(function(a){ if(!ALL_APPS[a]) return; btns+='<button class="btn btn-g" style="flex:1;min-width:80px;padding:10px;font-size:13px" onclick="openApp(\''+a+'\');closeModal()">'+escHtml(getAppLabel(a))+'</button>'; }); if(btns) appBtnsHtml='<div style="margin-bottom:12px"><div class="sec-ttl" style="margin-bottom:8px">'+t('relatedApps')+'</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+btns+'</div></div>'; }
  var safeTitle=item.title.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  showModal('<div class="sh"></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t3);margin-bottom:6px">'+item.type+'</div><div style="font-size:22px;font-weight:700;line-height:1.35;margin-bottom:14px;color:var(--t1)">'+renderMentions(item.title)+'</div>'+rows+appBtnsHtml+'<button class="btn btn-g btn-full" onclick="askAIAbout(\''+safeTitle+'\');closeModal()">'+t('askAIBtn')+'</button><button class="btn btn-g btn-full" style="margin-top:8px" onclick="closeModal();showEditItemModal(\''+item.id+'\')">'+ic('edit',15)+' '+t('editItem')+'</button>');
};
window.showEditItemModal=function(id){
  var item=findItem(id); if(!item) return;
  var sMinVal=(item.sMin!=null)?item.sMin:'',sMaxVal=(item.sMax!=null)?item.sMax:'';
  showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t('editItem')+'</div>'+
    '<div class="inp-lbl">'+t('timeLabel')+'</div><input class="inp" id="ei-time" value="'+escHtml(item.time||'')+'" placeholder="HH:MM" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('actNameLabel')+'</div><input class="inp" id="ei-title" value="'+escHtml(item.title||'')+'" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('transLabel')+'</div><input class="inp" id="ei-trans" value="'+escHtml(item.transport||'')+'" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('spendMinLabel')+'</div><input class="inp" id="ei-smin" type="number" value="'+sMinVal+'" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('spendMaxLabel')+'</div><input class="inp" id="ei-smax" type="number" value="'+sMaxVal+'" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('noteLabel')+'</div><textarea class="inp" id="ei-notes" style="margin-bottom:10px">'+escHtml(item.notes||'')+'</textarea>'+
    '<div style="display:flex;gap:8px;margin-bottom:14px">'+
      '<label class="lr" style="flex:1;cursor:pointer;border-radius:var(--r2);background:rgba(var(--sf),.07)"><span class="lr-lbl" style="font-size:14px">'+t('importantLabel')+'</span><input type="checkbox" id="ei-hi" '+(item.hi?'checked':'')+' style="width:18px;height:18px"></label>'+
      '<label class="lr" style="flex:1;cursor:pointer;border-radius:var(--r2);background:rgba(255,69,58,.07)"><span class="lr-lbl" style="font-size:14px;color:var(--red)">'+t('mustOnTime')+'</span><input type="checkbox" id="ei-urg" '+(item.urgent?'checked':'')+' style="width:18px;height:18px"></label>'+
    '</div>'+
    '<button class="btn btn-p btn-full" onclick="submitEditItem(\''+id+'\')" style="margin-bottom:8px">'+t('save')+'</button>'+
    '<button class="btn btn-d btn-full" onclick="deleteItem(\''+id+'\')">'+ic('trash',15)+' '+t('del')+'</button>');
};
window.submitEditItem=async function(id){
  var days=JSON.parse(JSON.stringify(getDays()));
  for(var di=0;di<days.length;di++){ var idx=days[di].items.findIndex(function(i){ return i.id===id; }); if(idx<0) continue; var item=days[di].items[idx]; item.time=($('#ei-time')&&$('#ei-time').value.trim())||item.time; item.title=($('#ei-title')&&$('#ei-title').value.trim())||item.title; item.transport=($('#ei-trans')&&$('#ei-trans').value.trim())||''; item.sMin=($('#ei-smin')&&$('#ei-smin').value!=='')?parseFloat($('#ei-smin').value):null; item.sMax=($('#ei-smax')&&$('#ei-smax').value!=='')?parseFloat($('#ei-smax').value):null; item.notes=($('#ei-notes')&&$('#ei-notes').value.trim())||''; item.hi=!!($('#ei-hi')&&$('#ei-hi').checked); item.urgent=!!($('#ei-urg')&&$('#ei-urg').checked); days[di].items[idx]=item; break; }
  closeModal(); showLoad(); await fbSaveDays(days); hideLoad(); toast(t('save')); renderItin();
};
window.deleteItem=async function(id){ if(!confirm(t('confirmDelItem'))) return; var days=JSON.parse(JSON.stringify(getDays())); for(var di=0;di<days.length;di++){ var idx=days[di].items.findIndex(function(i){ return i.id===id; }); if(idx>=0){ days[di].items.splice(idx,1); break; } } closeModal(); showLoad(); await fbSaveDays(days); hideLoad(); renderItin(); };
window.showAddItemModal=function(dayIdx){
  showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t('addItem')+'</div>'+
    '<div class="inp-lbl">'+t('timeLabel')+'</div><input class="inp" id="ai-time" placeholder="HH:MM" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('actNameLabel')+'</div><input class="inp" id="ai-title" placeholder="Dinner / 晚餐" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('transLabel')+'</div><input class="inp" id="ai-trans" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('spendMinLabel')+'</div><input class="inp" id="ai-spend" type="number" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('noteLabel')+'</div><textarea class="inp" id="ai-notes" style="margin-bottom:14px"></textarea>'+
    '<button class="btn btn-p btn-full" onclick="submitAddItem('+dayIdx+')">'+t('save')+'</button>');
};
window.submitAddItem=async function(dayIdx){
  var title=$('#ai-title')&&$('#ai-title').value.trim(); if(!title){ toast('请输入活动名称'); return; }
  var days=JSON.parse(JSON.stringify(getDays())); var spend=($('#ai-spend')&&$('#ai-spend').value!=='')?parseFloat($('#ai-spend').value):null;
  days[dayIdx].items.push({id:'u_'+Date.now(),time:($('#ai-time')&&$('#ai-time').value.trim())||'',title:title,transport:($('#ai-trans')&&$('#ai-trans').value.trim())||'',sMin:spend,sMax:spend,notes:($('#ai-notes')&&$('#ai-notes').value.trim())||'',apps:[],type:guessType(title),hi:false,urgent:false,lodge:'',bag:''});
  closeModal(); showLoad(); await fbSaveDays(days); hideLoad(); renderItin(); toast(t('save'));
};
window.showAddDayModal=function(){
  showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t('addNewDay')+'</div>'+
    '<div class="inp-lbl">'+t('date')+'</div><input class="inp" id="ad-date" type="date" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('desc')+'</div><input class="inp" id="ad-title" placeholder="Seoul Day 1" style="margin-bottom:14px">'+
    '<button class="btn btn-p btn-full" onclick="submitAddDay()">'+t('save')+'</button>');
};
window.submitAddDay=async function(){
  var date=$('#ad-date')&&$('#ad-date').value; var title=($('#ad-title')&&$('#ad-title').value.trim())||'新的一天';
  if(!date){ toast('请选择日期'); return; }
  var days=JSON.parse(JSON.stringify(getDays())); var d=new Date(date+'T12:00:00'); var wds=['日','一','二','三','四','五','六'];
  days.push({date:date,month:String(d.getMonth()+1),day:String(d.getDate()),wd:wds[d.getDay()],title:title,items:[]});
  days.sort(function(a,b){ return a.date.localeCompare(b.date); });
  closeModal(); showLoad(); await fbSaveDays(days); hideLoad(); renderItin(); toast(t('addedDay'));
};
window.showTripEditModal=function(){
  var trip=S.trip||{},hasCfg=!!(S.aiConfig.apiKey&&S.aiConfig.endpoint);
  showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t('tripInfoTitle')+'</div>'+
    '<div class="inp-lbl">'+t('tripNameLabel')+'</div><input class="inp" id="te-name" value="'+escHtml(trip.name||'')+'" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('dateRangeLabel')+'</div><input class="inp" id="te-dates" value="'+escHtml(trip.dates||'')+'" style="margin-bottom:14px">'+
    '<div class="sec-ttl" style="margin-bottom:8px">'+t('importDataLabel')+'</div>'+
    '<div style="padding:14px;background:rgba(var(--sf),.07);border-radius:var(--r2);margin-bottom:14px">'+
      '<div style="font-size:12px;color:var(--t3);margin-bottom:10px;line-height:1.6">'+t('importHint')+'<br><span style="color:var(--orange)">'+t('importHint2')+'</span></div>'+
      '<button class="btn btn-g btn-full" style="padding:11px;margin-bottom:8px" onclick="importFromXlsx()">'+ic('xlsx',16)+' '+t('importXlsx')+'</button>'+
      '<button class="btn btn-g btn-full" style="padding:11px;margin-bottom:'+(hasCfg?'8':'0')+'px" onclick="showPasteImport()">'+ic('edit',16)+' '+t('pasteImport')+'</button>'+
      (hasCfg?'<button class="btn btn-g btn-full" style="padding:11px" onclick="importFromImage()">'+ic('camera',16)+' '+t('aiImgImport')+'</button>':'<div style="font-size:12px;color:var(--t4);text-align:center;margin-top:8px">'+t('aiImgHint')+'</div>')+
    '</div>'+
    '<button class="btn btn-p btn-full" onclick="saveTripInfo()">'+t('save')+'</button>');
};
window.showPasteImport=function(){
  closeModal(); setTimeout(function(){
    showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:6px;color:var(--t1)">'+t('pasteImportTitle')+'</div>'+
      '<div style="font-size:13px;color:var(--t2);margin-bottom:12px;line-height:1.6;white-space:pre-line">'+t('pasteHint')+'</div>'+
      '<textarea class="inp" id="paste-txt" style="min-height:180px;font-size:13px;margin-bottom:14px" placeholder="2000/1/1（一）&#10;08:00  ICN 仁川机场抵达&#10;12:00  Dinner 弘大晚餐"></textarea>'+
      '<button class="btn btn-p btn-full" onclick="submitPasteImport()" style="margin-bottom:8px">解析导入</button>'+
      '<button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>');
  },280);
};
window.submitPasteImport=async function(){
  var el=$('#paste-txt'); var txt=el?el.value.trim():''; if(!txt||txt.length<5){ toast('请先粘贴行程内容'); return; }
  closeModal(); showLoad();
  try{
    var days=parseItineraryLocal(txt);
    if((!days||days.length===0)&&S.aiConfig.apiKey&&S.aiConfig.endpoint&&S.aiToggles.import){ try{ days=await importItineraryFromText(txt); }catch(e){ console.warn(e); } }
    if(!days||!days.length) throw new Error('未识别到行程数据');
    await fbSaveDays(days); _updateTripDates(days); hideLoad(); renderItin();
    toast(t('importOk')+'：'+days.length+'天，'+days.reduce(function(a,d){ return a+d.items.length; },0)+'项');
  }catch(e){ hideLoad(); toast(t('importFail')+'：'+e.message); }
};
window.saveTripInfo=async function(){
  var name=($('#te-name')&&$('#te-name').value.trim())||''; var dates=($('#te-dates')&&$('#te-dates').value.trim())||'';
  if(!S.trip) return; S.trip.name=name; S.trip.dates=dates;
  if(db&&S.tripCode) await updateDoc(doc(db,'trips',S.tripCode),{name:name,dates:dates});
  _addLocalTrip(S.tripCode,name,dates); closeModal(); toast(t('save')); renderHome();
};
window.importFromImage=function(){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*,application/pdf';
  inp.onchange=async function(){ var file=inp.files[0]; if(!file) return; closeModal(); showLoad(); var reader=new FileReader(); reader.onload=async function(e){ try{ var b64=e.target.result; var days=await importItineraryFromImage(b64); if(!days||!days.length) throw new Error('无法识别'); await fbSaveDays(days); _updateTripDates(days); hideLoad(); renderItin(); toast(t('importOk')+'，共'+days.length+'天'); }catch(err){ hideLoad(); toast(t('importFail')+'：'+err.message); } }; reader.readAsDataURL(file); };
  inp.click();
};
window.showTripCodeModal=function(){
  showModal('<div class="sh"></div><div style="font-size:20px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t('code')+'</div><div class="code-disp" style="margin-bottom:14px">'+(S.tripCode||'------')+'</div><div style="font-size:13px;color:var(--t2);text-align:center;margin-bottom:14px;line-height:1.6">'+t('codeShare')+'</div><div style="display:flex;gap:8px"><button class="btn btn-g" style="flex:1" onclick="copyCode()">'+ic('copy',15)+' '+t('copy')+'</button><button class="btn btn-p" style="flex:1" onclick="shareCode()">'+ic('share',15)+' '+t('share')+'</button></div>');
};
window.copyCode=function(){ if(navigator.clipboard) navigator.clipboard.writeText(S.tripCode||'').then(function(){ toast(t('codeCopied')); }); };
window.shareCode=function(){ if(navigator.share){ navigator.share({title:'Travoo',text:'用行程码 '+S.tripCode+' 加入我的旅行',url:location.href}); }else copyCode(); };

// ── EXPENSES ──────────────────────────────────────────────────
function renderExp(){
  var v=$('#v-exp'); if(!v) return;
  v.innerHTML='<div class="nav"><div class="nav-title">'+t('exp')+'</div></div>'+
    '<div class="scroller"><div style="height:14px"></div><div class="sec">'+
      '<div id="exp-summary"></div>'+
      '<div class="ptabs" style="margin-bottom:14px"><div class="ptab on" onclick="switchExpTab(\'list\',this)">'+t('detail')+'</div><div class="ptab" onclick="switchExpTab(\'settle\',this)">'+t('settle')+'</div></div>'+
      '<div id="exp-list-pane"><div id="exp-list" class="list"></div></div>'+
      '<div id="exp-settle-pane" style="display:none"><div id="exp-settle" class="list"></div></div>'+
    '</div></div>';
  refreshExpList();
}
window.switchExpTab=function(tab,el){ $$('.ptab').forEach(function(tb){ tb.classList.remove('on'); }); el.classList.add('on'); var lp=$('#exp-list-pane'),sp=$('#exp-settle-pane'); if(lp) lp.style.display=tab==='list'?'block':'none'; if(sp) sp.style.display=tab==='settle'?'block':'none'; if(tab==='settle') renderSettle(); };
function catLabel(c){ return {food:t('food'),transport:t('transport'),attr:t('attr'),act:t('act')}[c]||t('other'); }
function catIcon(c){ return {food:'food',transport:'car',attr:'map',act:'wallet'}[c]||'wallet2'; }
function refreshExpList(){
  var sum=$('#exp-summary'),list=$('#exp-list'); if(!sum||!list) return;
  var tot=S.expenses.reduce(function(a,e){ return a+(Number(e.baseAmount||e.amount)||0); },0);
  var myP=S.expenses.filter(function(e){ return e.memberId===S.memberId; }).reduce(function(a,e){ return a+(Number(e.baseAmount||e.amount)||0); },0);
  var bc=CURRENCY_LIST[S.baseCurrency]||{symbol:'¥'};
  sum.innerHTML='<div class="exp-sum"><div class="estat"><div class="estat-lbl">'+t('total')+'</div><div class="estat-val" style="color:var(--red)">'+bc.symbol+tot.toFixed(0)+'</div></div><div class="estat"><div class="estat-lbl">'+t('myPaid')+'</div><div class="estat-val" style="color:var(--orange)">'+bc.symbol+myP.toFixed(0)+'</div></div><div class="estat"><div class="estat-lbl">'+t('cnt')+'</div><div class="estat-val">'+S.expenses.length+'</div></div></div>';
  if(!S.expenses.length){ list.innerHTML='<div class="empty" onclick="showAddExpenseModal()" style="cursor:pointer">'+ic('wallet',52)+'<div class="empty-ttl">'+t('noExp')+'</div><div class="empty-sub">'+t('noExpSub')+'</div></div>'; return; }
  var html='';
  S.expenses.forEach(function(e){ var cc=CAT_COLORS[e.category]||CAT_COLORS.other,expCur=e.currency||S.localCurrency; var displayAmt=fmtCurrency(Number(e.amount)||0,expCur); var convHtml=expCur!==S.baseCurrency&&e.baseAmount?'<div style="font-size:10px;color:var(--t3)">≈ '+fmtCurrency(e.baseAmount,S.baseCurrency)+'</div>':''; html+='<div class="ei" onclick="showExpDetail(\''+e.id+'\')"><div class="ei-ic" style="background:'+cc+'">'+ic(catIcon(e.category),20)+'</div><div class="ei-d"><div class="ei-name">'+escHtml(e.description||t('other'))+'</div><div class="ei-sub">'+escHtml(memberName(e.paidBy))+' · '+catLabel(e.category)+' · '+escHtml(e.date||'')+'</div></div><div style="text-align:right"><div class="ei-amt" style="color:'+cc+'">'+displayAmt+'</div>'+convHtml+'</div></div>'; });
  list.innerHTML=html;
}
function renderSettle(){
  var el=$('#exp-settle'); if(!el) return; var txns=calcSettle();
  if(!txns.length){ el.innerHTML='<div class="empty">'+ic('check',52)+'<div class="empty-ttl">'+t('settled')+'</div><div class="empty-sub">'+t('settledSub')+'</div></div>'; return; }
  var html='';
  txns.forEach(function(tx){
    var key=tx.from+'_'+tx.to; var isPaid=!!S.settledRows[key];
    var payBtns=PAYMENT_APPS.slice(0,4).map(function(appKey){ var app=ALL_APPS[appKey]; if(!app) return ''; return '<div class="pay-btn" onclick="payVia(\''+appKey+'\',\''+tx.from+'\',\''+tx.to+'\','+tx.amount+')">'+ic('phone',12)+' '+escHtml(getAppLabel(appKey))+'</div>'; }).join('');
    html+='<div class="srow'+(isPaid?' style="opacity:.5"':'')+'">'+
      '<div class="srow-from"><div class="srow-name" style="'+(isPaid?'text-decoration:line-through':'')+'">'+escHtml(memberName(tx.from))+'</div><div class="srow-to">→ '+escHtml(memberName(tx.to))+'</div></div>'+
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">'+
        '<div class="srow-amt" style="'+(isPaid?'text-decoration:line-through':'')+'">'+fmtCurrency(tx.amount,S.baseCurrency)+'</div>'+
        '<div class="srow-done'+(isPaid?' paid':'')+'" onclick="markSettled(\''+key+'\')">'+ic('check',12)+' '+(isPaid?t('markPaid'):t('markPaid'))+'</div>'+
      '</div>'+
    '</div>'+
    (!isPaid&&payBtns?'<div class="pay-btns">'+payBtns+'</div>':'');
  });
  el.innerHTML=html;
}
window.payVia=function(appKey,fromId,toId,amount){ var fromN=memberName(fromId),toN=memberName(toId); var msg='[Travoo] '+fromN+' → '+toN+': '+fmtCurrency(amount,S.baseCurrency); openApp(appKey,encodeURIComponent(msg)); };
window.markSettled=function(key){ S.settledRows[key]=!S.settledRows[key]; localStorage.setItem('settledRows',JSON.stringify(S.settledRows)); renderSettle(); };

window.showExpDetail=function(id){
  var e=S.expenses.find(function(x){ return x.id===id; }); if(!e) return;
  var ids=e.splitAmong||Object.keys(S.members),splitNames=ids.map(function(mid){ return memberName(mid); }).join('、');
  var expCur=e.currency||S.localCurrency,amtDisplay=fmtCurrency(Number(e.amount)||0,expCur);
  var convRow=expCur!==S.baseCurrency&&e.baseAmount?'<div class="lr" style="cursor:default"><span class="lr-lbl">'+t('rateInfo')+'</span><span class="lr-val">≈ '+fmtCurrency(e.baseAmount,S.baseCurrency)+'</span></div>':'';
  showModal('<div class="sh"></div><div style="font-size:20px;font-weight:700;margin-bottom:4px;color:var(--t1)">'+escHtml(e.description||t('other'))+'</div><div style="font-size:36px;font-weight:800;color:var(--red);margin:10px 0">'+amtDisplay+'</div><div class="list" style="margin-bottom:14px"><div class="lr" style="cursor:default"><span class="lr-lbl">'+t('paidBy')+'</span><span class="lr-val">'+escHtml(memberName(e.paidBy))+'</span></div><div class="lr" style="cursor:default"><span class="lr-lbl">'+t('splitW')+'</span><span class="lr-val">'+escHtml(splitNames)+'</span></div><div class="lr" style="cursor:default"><span class="lr-lbl">'+t('date')+'</span><span class="lr-val">'+escHtml(e.date||'')+'</span></div>'+convRow+'</div><button class="btn btn-d btn-full" onclick="fbDelExpense(\''+e.id+'\');closeModal();toast(t(\'deleted\'))">'+ic('trash',16)+' '+t('del')+'</button>');
};
window.showAddExpenseModal=function(prefill){
  prefill=prefill||{};
  var memOpts=''; Object.entries(S.members).forEach(function(entry){ var mid=entry[0],m=entry[1]; memOpts+='<option value="'+mid+'"'+(mid===S.memberId?' selected':'')+'>'+escHtml(m.name+(mid===S.memberId?' ('+t('you')+')':''))+'</option>'; });
  var memCBs=''; Object.entries(S.members).forEach(function(entry){ var mid=entry[0],m=entry[1]; memCBs+='<label style="display:flex;align-items:center;gap:8px;padding:7px 0;cursor:pointer"><input type="checkbox" id="sp-'+mid+'" checked style="width:18px;height:18px;border-radius:4px;flex-shrink:0">'+renderAv(mid,28)+escHtml(m.name+(mid===S.memberId?' ('+t('you')+')':''))+'</label>'; });
  var catChips=''; ['food','transport','attr','act','other'].forEach(function(c,i){ catChips+='<div class="chip'+(i===0?' on':'')+'" data-c="'+c+'" onclick="pickCat(this)">'+catLabel(c)+'</div>'; });
  var curOpts=''; Object.keys(CURRENCY_LIST).forEach(function(k){ curOpts+='<option value="'+k+'"'+(k===S.localCurrency?' selected':'')+'>'+CURRENCY_LIST[k].flag+' '+CURRENCY_LIST[k].name+'</option>'; });
  var rateHint=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCurrency(getRate(S.localCurrency,S.baseCurrency),S.baseCurrency):'';
  showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t('addExpense')+'</div>'+
    '<div id="receipt-prev"></div>'+
    '<button class="btn btn-g btn-full" style="margin-bottom:12px;padding:11px" onclick="captureReceipt()">'+ic('camera',16)+' 拍照识别账单 (AI)</button>'+
    '<div style="display:flex;gap:8px;margin-bottom:6px">'+
      '<div style="flex:1"><div class="inp-lbl">'+t('amount')+'</div><input class="inp" id="ex-amt" type="number" placeholder="0" value="'+(prefill.amount!=null?String(prefill.amount):'')+'" style="font-size:22px;font-weight:700" oninput="updateExpConv()"></div>'+
      '<div style="min-width:118px"><div class="inp-lbl">'+t('expCurrency')+'</div><select class="inp" id="ex-cur" onchange="updateExpConv()">'+curOpts+'</select></div>'+
    '</div>'+
    '<div id="exp-conv-hint" style="font-size:12px;color:var(--t3);margin-bottom:10px;min-height:16px;padding:0 2px">'+escHtml(rateHint)+'</div>'+
    '<div class="inp-lbl">'+t('desc')+'</div><input class="inp" id="ex-desc" placeholder="Dinner / 晚餐" value="'+(prefill.description?escHtml(prefill.description):'')+'" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('cat')+'</div><div class="chips" id="cat-chips" style="margin-bottom:10px">'+catChips+'</div>'+
    '<div class="inp-lbl">'+t('paidBy')+'</div><select class="inp" id="ex-payer" style="margin-bottom:10px">'+memOpts+'</select>'+
    '<div class="inp-lbl">'+t('splitW')+'</div><div style="margin-bottom:14px">'+memCBs+'</div>'+
    '<button class="btn btn-p btn-full" onclick="submitExpense()">'+t('save')+'</button>');
};
window.updateExpConv=function(){ var ae=$('#ex-amt'),ce=$('#ex-cur'),hint=$('#exp-conv-hint'); if(!ae||!ce||!hint) return; var amt=parseFloat(ae.value)||0,cur=ce.value; if(cur!==S.baseCurrency&&amt>0&&Object.keys(S.rates).length>0){ hint.textContent='≈ '+fmtCurrency(toBase(amt,cur),S.baseCurrency); }else{ hint.textContent=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCurrency(getRate(S.localCurrency,S.baseCurrency),S.baseCurrency):''; } };
window.pickCat=function(el){ $$('#cat-chips .chip').forEach(function(c){ c.classList.remove('on'); }); el.classList.add('on'); };
window.captureReceipt=function(){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.capture='environment';
  inp.onchange=async function(){ var f=inp.files[0]; if(!f) return; toast(t('recognizing'),0); var rd=new FileReader(); rd.onload=async function(e){ var b64=e.target.result; var prev=$('#receipt-prev'); if(prev) prev.innerHTML='<img src="'+b64+'" style="width:100%;border-radius:var(--r2);margin-bottom:10px;max-height:180px;object-fit:cover">'; var r=await ocrReceipt(b64); toast(''); if(r){ var ae=$('#ex-amt'); if(ae&&r.amount) ae.value=r.amount; var de=$('#ex-desc'); if(de&&r.description) de.value=r.description; if(r.category) $$('#cat-chips .chip').forEach(function(c){ c.classList.toggle('on',c.dataset.c===r.category); }); toast(t('recognizeOk')); updateExpConv(); }else toast(t('recognizeFail')); }; rd.readAsDataURL(f); };
  inp.click();
};
window.submitExpense=function(){
  var amtEl=$('#ex-amt'),dscEl=$('#ex-desc'),payEl=$('#ex-payer'),curEl=$('#ex-cur');
  var amt=amtEl?parseFloat(amtEl.value):0,desc=dscEl?dscEl.value.trim():'';
  var cat=($('#cat-chips .chip.on')&&$('#cat-chips .chip.on').dataset.c)||'other';
  var paidBy=payEl?payEl.value:S.memberId,currency=curEl?curEl.value:S.localCurrency;
  var split=Object.keys(S.members).filter(function(id){ var cb=$('#sp-'+id); return cb&&cb.checked; });
  if(!amt||amt<=0){ toast('请输入正确金额'); return; }
  fbAddExpense({amount:amt,currency:currency,baseAmount:toBase(amt,currency),baseCurrency:S.baseCurrency,description:desc||t('other'),category:cat,paidBy:paidBy,splitAmong:split,date:today()});
  closeModal(); toast(t('logged'));
};

// ── CHAT ──────────────────────────────────────────────────────
function renderChat(){
  var v=$('#v-chat'); if(!v) return;
  var hasCfg=!!(S.aiConfig.apiKey&&S.aiConfig.endpoint);
  var sugs=[t('chatSug1'),t('chatSug2'),t('chatSug3'),t('chatSug4'),t('chatSug5')];
  var noCfgBanner=''; if(!hasCfg){ noCfgBanner='<div style="margin:0 16px 12px;padding:14px;background:rgba(255,159,10,.08);border:0.5px solid rgba(255,159,10,.2);border-radius:var(--r2)"><div style="font-size:14px;font-weight:700;color:var(--orange);margin-bottom:4px">'+t('noCfg')+'</div><div style="font-size:13px;color:var(--t2);margin-bottom:10px">'+t('noCfgSub')+'</div><button class="btn btn-g" style="padding:8px 16px;font-size:13px;border-radius:100px" onclick="showAIConfig()">'+t('cfgAI')+'</button></div>'; }
  var welcomeHtml=S.chatHistory.length===0?
    '<div style="text-align:center;padding:30px 0">'+
      '<div style="width:60px;height:60px;background:rgba(var(--sf),.08);border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:var(--t2)">'+ic('chat',28)+'</div>'+
      '<div style="font-size:16px;font-weight:600;margin-bottom:6px;color:var(--t1)">'+t('aiWelcome')+'</div>'+
      '<div style="font-size:13px;color:var(--t2);line-height:1.6;white-space:pre-line">'+t('aiWelcomeSub')+'</div></div>'
    :S.chatHistory.map(renderMsg).join('');
  var sugHtml=sugs.map(function(s){ return '<div class="csug" onclick="sendSug(\''+s.replace(/'/g,"\\'")+'\')">'+escHtml(s)+'</div>'; }).join('');
  // FIX #17: Centered title with spacer and cog on right
  v.innerHTML=
    '<div class="nav" style="position:relative">'+
      '<div style="width:34px;flex-shrink:0"></div>'+
      '<div style="flex:1;text-align:center;font-size:17px;font-weight:600;color:var(--t1)">'+t('butlerName')+'</div>'+
      '<div class="nbtn" onclick="showAIConfig()">'+ic('cog',16)+'</div>'+
    '</div>'+
    noCfgBanner+
    '<div class="chat-body" id="chat-body">'+welcomeHtml+'</div>'+
    '<div class="csug-wrap" id="csug-wrap">'+sugHtml+'</div>'+
    '<div class="chat-bar">'+
      '<button class="cvbtn" onmousedown="startVoice(handleVoiceIntent)" ontouchstart="event.preventDefault();startVoice(handleVoiceIntent)">'+ic('mic',18)+'</button>'+
      '<textarea class="chat-inp-el" id="chat-inp" rows="1" placeholder="'+t('aiPh')+'" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();sendChatMsg()}" oninput="this.style.height=\'auto\';this.style.height=Math.min(this.scrollHeight,120)+\'px\'"></textarea>'+
      '<button class="csend" id="csend" onclick="sendChatMsg()">'+ic('send',18)+'</button>'+
    '</div>';
  scrollChat();
}
function renderMsg(m){ var isU=m.role==='user'; var time=''; if(m.ts&&m.ts.toDate) time=m.ts.toDate().toLocaleTimeString(S.lang==='en'?'en':Zh,{hour:'2-digit',minute:'2-digit'}); var meta=time?'<div class="mmeta">'+time+'</div>':''; return '<div class="msg '+(isU?'msg-u':'msg-a')+'"><div class="mbubble">'+(m.content||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')+'</div>'+meta+'</div>'; }
function refreshChatMsgs(){ var body=$('#chat-body'); if(!body) return; if(S.chatHistory.length) body.innerHTML=S.chatHistory.map(renderMsg).join(''); scrollChat(); }
function scrollChat(){ var b=$('#chat-body'); if(b) setTimeout(function(){ b.scrollTop=b.scrollHeight; },60); }
window.sendSug=function(txt){ var inp=$('#chat-inp'); if(inp){ inp.value=txt; sendChatMsg(); } };
window.askAIAbout=function(title){ switchTab('chat'); setTimeout(function(){ sendChatMsg('关于"'+title+'"，给我一些建议和注意事项'); },300); };
window.sendChatMsg=async function(forceTxt){
  var inp=$('#chat-inp'),btn=$('#csend'),body=$('#chat-body');
  var txt=forceTxt||(inp?inp.value.trim():''); if(!txt) return;
  if(inp){ inp.value=''; inp.style.height='auto'; } if(btn) btn.disabled=true;
  var uEl=document.createElement('div'); uEl.className='msg msg-u'; uEl.innerHTML='<div class="mbubble">'+txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>'; if(body) body.appendChild(uEl); scrollChat();
  await fbSaveMsg('user',txt);
  var typEl=document.createElement('div'); typEl.className='typing-wrap'; typEl.innerHTML='<div class="typing-bub"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>'; if(body) body.appendChild(typEl); scrollChat();
  var sw=$('#csug-wrap'); if(sw) sw.style.display='none';
  try{ var reply=await callAI(txt); typEl.remove(); var aEl=document.createElement('div'); aEl.className='msg msg-a'; aEl.innerHTML='<div class="mbubble">'+reply.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>'; if(body) body.appendChild(aEl); await fbSaveMsg('assistant',reply); scrollChat(); }
  catch(e){ typEl.remove(); var errEl=document.createElement('div'); errEl.className='msg msg-a'; errEl.innerHTML='<div class="mbubble" style="color:var(--red)">'+escHtml(e.message)+'</div>'; if(body) body.appendChild(errEl); scrollChat(); if(e.message===t('noCfg')) setTimeout(showAIConfig,600); }
  if(btn) btn.disabled=false;
};
window.showAIConfig=function(){
  var cfg=S.aiConfig,pct=Math.min(100,(S.tokenUsed/Math.max(S.tokenBudget*100,1))*100),fc=pct>80?'var(--red)':'var(--green)';
  showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t('aiCfg')+'</div>'+
    '<div style="display:flex;gap:6px;margin-bottom:14px" id="preset-chips"><div class="chip" onclick="presetAI(\'openai\',this)">OpenAI</div><div class="chip" onclick="presetAI(\'poe\',this)">Poe</div><div class="chip" onclick="presetAI(\'custom\',this)">Custom</div></div>'+
    '<div class="inp-lbl">'+t('apiEp')+'</div><input class="inp" id="cfg-ep" value="'+escHtml(cfg.endpoint||'')+'" placeholder="https://api.openai.com/v1/chat/completions" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('apiKey')+'</div><input class="inp" id="cfg-key" type="password" value="'+escHtml(cfg.apiKey||'')+'" placeholder="sk-..." style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('model')+'</div><input class="inp" id="cfg-model" value="'+escHtml(cfg.model||'gpt-4o-mini')+'" style="margin-bottom:14px">'+
    '<div class="inp-lbl">'+t('tokBudget')+'</div><input class="inp" id="cfg-tok" type="number" value="'+S.tokenBudget+'" style="margin-bottom:6px">'+
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><span style="font-size:12px;color:var(--t3)">'+t('tokUsed')+':</span><div style="flex:1;height:3px;background:rgba(var(--sf),.1);border-radius:3px;overflow:hidden"><div style="height:100%;border-radius:3px;width:'+pct+'%;background:'+fc+'"></div></div><span style="font-size:12px;color:var(--t2)">'+S.tokenUsed.toLocaleString()+'</span><div class="chip" style="padding:4px 10px;font-size:12px" onclick="S.tokenUsed=0;localStorage.removeItem(\'tokenUsed\');toast(\'已重置\');closeModal()">重置</div></div>'+
    '<div class="sec-ttl" style="margin-bottom:8px">'+t('aiFeatures')+'</div>'+
    '<div class="list" style="margin-bottom:14px">'+
      ['packing','recs','import'].map(function(k){ return '<div class="lr" style="cursor:default"><span class="lr-lbl" style="font-size:14px">'+t('aiFor'+k.charAt(0).toUpperCase()+k.slice(1))+'</span><label class="toggle"><input type="checkbox" '+(S.aiToggles[k]?'checked':'')+' onchange="toggleAIFeature(\''+k+'\',this.checked)"><span class="tsl"></span></label></div>'; }).join('')+
    '</div>'+
    '<button class="btn btn-p btn-full" onclick="saveAICfg()" style="margin-bottom:8px">'+t('saveCfg')+'</button>'+
    (cfg.apiKey?'<button class="btn btn-g btn-full" onclick="clearAICfg()">清除配置</button>':'')+
    '<div style="margin-top:12px;font-size:11px;color:var(--t4);text-align:center">配置仅存在本设备，不上传云端</div>');
};
window.toggleAIFeature=function(k,v){ S.aiToggles[k]=v; localStorage.setItem('aiToggles',JSON.stringify(S.aiToggles)); };
window.presetAI=function(p,el){ $$('#preset-chips .chip').forEach(function(c){ c.classList.remove('on'); }); el.classList.add('on'); var ep=$('#cfg-ep'),md=$('#cfg-model'); if(p==='openai'&&ep&&md){ ep.value='https://api.openai.com/v1/chat/completions'; md.value='gpt-4o-mini'; } if(p==='poe'&&ep&&md){ ep.value='https://api.poe.com/v1/chat/completions'; md.value='GPT-4o-mini'; } };
window.saveAICfg=function(){ var ep=($('#cfg-ep')&&$('#cfg-ep').value.trim())||'',key=($('#cfg-key')&&$('#cfg-key').value.trim())||'',model=($('#cfg-model')&&$('#cfg-model').value.trim())||'gpt-4o-mini',tok=parseInt(($('#cfg-tok')&&$('#cfg-tok').value)||'4000')||4000; if(!ep||!key){ toast('请填写端点和 Key'); return; } S.aiConfig={endpoint:ep,apiKey:key,model:model}; S.tokenBudget=tok; localStorage.setItem('aiConfig',JSON.stringify(S.aiConfig)); localStorage.setItem('tokenBudget',tok); closeModal(); toast(t('aiConfigSaved')); renderChat(); };
window.clearAICfg=function(){ S.aiConfig={}; localStorage.removeItem('aiConfig'); closeModal(); renderChat(); };
window.confirmClearChat=function(){
  showModal('<div class="sh"></div>'+
    '<div style="display:flex;justify-content:center;margin-bottom:8px;color:var(--red)">'+ic('trash',32)+'</div>'+
    '<div style="font-size:18px;font-weight:700;text-align:center;margin-bottom:6px;color:var(--t1)">'+t('confirmClearChat')+'</div>'+
    '<div style="font-size:14px;color:var(--t2);text-align:center;margin-bottom:22px">'+t('confirmClearChatSub')+'</div>'+
    '<button class="btn btn-d btn-full" onclick="S.chatHistory=[];toast(t(\'chatCleared\'));closeModal()" style="margin-bottom:10px">'+t('clearChatConfirmBtn')+'</button>'+
    '<button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>');
};

// ── SETTINGS ──────────────────────────────────────────────────
window.showAppearanceModal=function(){
  var LL={'zh-CN':'简','zh-TW':'繁','en':'EN'};
  var langChips=['zh-CN','zh-TW','en'].map(function(l){ return '<div class="chip '+(S.lang===l?'on':'')+'" style="font-weight:600;padding:6px 18px" onclick="setLang(\''+l+'\');$$(\'.ap-lang .chip\').forEach(function(c){c.classList.remove(\'on\')});this.classList.add(\'on\')">'+LL[l]+'</div>'; }).join('');
  // FIX #2: Clean theme groups with labels instead of confusing "上下右"
  var darkThemes=['dark','purple','ocean','forest','sunset','rose','indigo','warm'];
  var lightThemes=['lsilver','livory','lsky','lmint'];
  var autoTheme=['auto'];
  function themeSwatches(keys){
    return keys.map(function(k){ var th=THEMES[k]; var bg=th.mode==='auto'?'linear-gradient(135deg,#222 50%,#f2f2f0 50%)':th.mode==='light'?th.bg:th.swatch; return '<div class="theme-swatch'+(S.theme===k?' on':'')+'" style="background:'+bg+'" title="'+th.name+'" onclick="window.applyTheme(\''+k+'\');$$(\'.theme-swatch\').forEach(function(s){s.classList.remove(\'on\')});this.classList.add(\'on\')"></div>'; }).join('');
  }
  showModal(
    '<div class="sh"></div>'+
    '<div style="font-size:18px;font-weight:700;margin-bottom:18px;color:var(--t1)">'+t('appearance')+'</div>'+
    '<div class="sec-ttl">'+t('lang')+'</div>'+
    '<div class="chips ap-lang" style="margin-bottom:18px">'+langChips+'</div>'+
    '<div class="sec-ttl">'+t('themes')+'</div>'+
    '<div class="theme-label">'+t('darkThemes')+'</div>'+
    '<div class="theme-grid theme-swatch-row">'+themeSwatches(darkThemes)+'</div>'+
    '<div class="theme-label" style="margin-top:8px">'+t('lightThemes')+'</div>'+
    '<div class="theme-grid theme-swatch-row">'+themeSwatches(lightThemes)+'</div>'+
    '<div class="theme-label" style="margin-top:8px">'+t('autoTheme')+'</div>'+
    '<div class="theme-grid">'+themeSwatches(autoTheme)+'</div>'+
    '<div style="margin-top:18px"><div class="sec-ttl">'+t('wp')+'</div>'+
    '<div style="display:flex;gap:8px;margin-top:4px">'+
      '<button class="btn btn-g" style="flex:1;padding:11px" onclick="pickWallpaper()">'+ic('img',15)+' '+t('pickFromAlbum')+'</button>'+
      '<button class="btn btn-g" style="flex:1;padding:11px" onclick="clearWallpaper()">'+t('resetDefault')+'</button>'+
    '</div></div>'
  );
};

function renderSet(){
  var v=$('#v-set'); if(!v) return;
  var memHtml='';
  Object.entries(S.members).forEach(function(entry){
    var id=entry[0],m=entry[1],youTag=id===S.memberId?'<span class="you-tag">'+t('you')+'</span>':'';
    var img=memberAvatar(id);
    var avHtml='<div class="av-wrap" onclick="showMemberEdit(\''+id+'\')">'+
      (img?'<div class="av" style="width:34px;height:34px"><img src="'+img+'" alt=""></div>':'<div class="av" style="width:34px;height:34px;background:'+m.color+'">'+((m.name||'?')[0])+'</div>')+
      '<div class="av-cam">'+ic('camera',6)+'</div></div>';
    memHtml+='<div class="lr">'+avHtml+'<span class="lr-lbl">'+escHtml(m.name)+'</span>'+youTag+'<div class="nbtn" style="width:28px;height:28px" onclick="showMemberEdit(\''+id+'\')">'+ic('edit',12)+'</div></div>';
  });
  var msgChips=MSG_APPS.map(function(a){ var app=ALL_APPS[a]; if(!app) return ''; return '<div class="chip'+(S.msgApp===a?' on':'')+'" onclick="setMsgApp(\''+a+'\')">'+escHtml(getAppLabel(a))+'</div>'; }).join('');
  var notifsChk=localStorage.getItem('notifsEnabled')!=='false'?'checked':'';
  var geoStatus=S.geo?t('geoObtained'):t('geoNotObtained');
  var curOpts=''; Object.keys(CURRENCY_LIST).forEach(function(k){ curOpts+='<option value="'+k+'">'+CURRENCY_LIST[k].flag+' '+CURRENCY_LIST[k].name+'</option>'; });
  var lc=CURRENCY_LIST[S.localCurrency]||{flag:'',name:S.localCurrency},bc=CURRENCY_LIST[S.baseCurrency]||{flag:'',name:S.baseCurrency};
  var rateVal=getRate(S.localCurrency,S.baseCurrency);
  var rateStr=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCurrency(rateVal,S.baseCurrency):t('rateUnavailable');
  var histSection='';
  if(S.localTrips.length>0){
    var histItems=S.localTrips.map(function(tr){ return '<div class="lr" onclick="enterTrip(\''+tr.code+'\')"><div style="flex:1"><div style="font-size:15px;font-weight:600;color:var(--t1)">'+escHtml(tr.name||'—')+'</div><div style="font-size:12px;color:var(--t3)">'+escHtml(tr.dates||'—')+'</div></div><span class="lr-chev">'+ic('chev',16)+'</span></div>'; }).join('');
    histSection='<div class="sec"><div class="sec-ttl">'+t('history')+'</div><div class="list">'+histItems+'</div></div>';
  }
  var periodSection='<div class="sec"><div class="list"><div class="lr" onclick="showPeriodModal()">'+
    ic('heart',18)+'<div style="flex:1"><div class="lr-lbl">'+t('period')+'</div>'+
    (periodConflict()?'<div style="font-size:12px;color:var(--red);margin-top:1px">'+t('periodConflict').substring(0,16)+'…</div>':'')+'</div>'+
    '<span class="lr-chev">'+ic('chev',16)+'</span></div></div></div>';

  v.innerHTML=
    '<div class="nav"><div class="nav-large">'+t('set')+'</div></div>'+
    '<div class="scroller"><div style="height:12px"></div>'+
      '<div class="sec"><div class="sec-ttl">'+t('code')+'</div>'+
        '<div class="code-disp">'+(S.tripCode||'------')+'</div>'+
        '<div style="display:flex;gap:8px;margin-top:10px">'+
          '<button class="btn btn-g" style="flex:1;padding:12px" onclick="copyCode()">'+ic('copy',15)+' '+t('copy')+'</button>'+
          '<button class="btn btn-g" style="flex:1;padding:12px" onclick="shareCode()">'+ic('share',15)+' '+t('share')+'</button>'+
        '</div></div>'+
      '<div class="sec"><div class="sec-ttl">'+t('members')+'</div><div class="list">'+memHtml+'</div>'+
        '<button class="btn btn-g btn-full" style="margin-top:8px;padding:12px" onclick="showAddMember()">'+ic('plus',15)+' '+t('addMember')+'</button></div>'+
      // Appearance row (no longer shows theme/language inline)
      '<div class="sec"><div class="list"><div class="lr" onclick="showAppearanceModal()">'+
        ic('palette',20)+'<div style="flex:1"><div class="lr-lbl">'+t('appearance')+'</div><div style="font-size:12px;color:var(--t3)">'+t('appearanceDesc')+'</div></div><span class="lr-chev">'+ic('chev',16)+'</span></div></div></div>'+
      // Currency
      '<div class="sec"><div class="sec-ttl">'+t('currency')+'</div>'+
        '<div style="display:flex;gap:8px;margin-bottom:10px">'+
          '<div style="flex:1"><div class="inp-lbl">'+t('baseCurrency')+'</div><select class="inp" id="set-base" onchange="onCurrencyChange()">'+curOpts+'</select></div>'+
          '<div style="flex:1"><div class="inp-lbl">'+t('localCurrency')+'</div><select class="inp" id="set-local" onchange="onCurrencyChange()">'+curOpts+'</select></div>'+
        '</div>'+
        '<div style="padding:10px 14px;background:rgba(var(--sf),.07);border-radius:var(--r2);display:flex;align-items:center;gap:10px">'+
          '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--t1)">'+escHtml(rateStr)+'</div><div style="font-size:10px;color:var(--t3);margin-top:2px">'+t('rateDate')+': '+escHtml(S.fxDate?S.fxDate.substring(0,16):'—')+'</div></div>'+
          '<button class="btn btn-g" style="padding:7px 14px;font-size:13px;border-radius:100px" onclick="doFetchRatesSet()">'+ic('refresh',13)+' '+t('refreshRate')+'</button>'+
        '</div></div>'+
      '<div class="sec"><div class="sec-ttl">'+t('msgApp')+'</div><div class="chips">'+msgChips+'</div></div>'+
      '<div class="sec"><div class="list">'+
        '<div class="lr" onclick="showAIConfig()">'+ic('sliders',18)+'<span class="lr-lbl">'+t('aiCfg')+'</span><span class="lr-val">'+escHtml(S.aiConfig.model||t('notConfigured'))+'</span><span class="lr-chev">'+ic('chev',16)+'</span></div>'+
        '<div class="lr" onclick="confirmClearChat()"><span class="lr-lbl">'+t('clearChat')+'</span><span class="lr-chev">'+ic('chev',16)+'</span></div>'+
      '</div></div>'+
      '<div class="sec"><div class="sec-ttl">'+t('notif')+'</div><div class="list">'+
        '<div class="lr" style="cursor:default"><span class="lr-lbl">'+(S.lang==='en'?'Trip reminders':'行程提醒')+'</span><label class="toggle"><input type="checkbox" '+notifsChk+' onchange="localStorage.setItem(\'notifsEnabled\',this.checked)"><span class="tsl"></span></label></div>'+
        '<div class="lr" onclick="requestGeo();toast(t(\'locationReqOk\'))"><span class="lr-lbl">'+t('locationAllow')+'</span><span class="lr-val">'+geoStatus+'</span><span class="lr-chev">'+ic('chev',16)+'</span></div>'+
      '</div></div>'+
      periodSection+
      '<div class="sec"><div class="list">'+
        '<div class="lr" onclick="exportTripData()">'+ic('download',18)+'<div style="flex:1"><div class="lr-lbl">'+t('exportData')+'</div><div style="font-size:12px;color:var(--t3)">'+t('exportDesc')+'</div></div><span class="lr-chev">'+ic('chev',16)+'</span></div>'+
        '<div class="lr" onclick="importTripData()">'+ic('upload',18)+'<div style="flex:1"><div class="lr-lbl">'+t('importData')+'</div><div style="font-size:12px;color:var(--t3)">'+t('importDesc')+'</div></div><span class="lr-chev">'+ic('chev',16)+'</span></div>'+
        '<div class="lr" style="cursor:default"><span class="lr-lbl" style="font-size:13px">'+t('deviceId')+'</span><span class="lr-val" style="font-size:11px;font-family:monospace;word-break:break-all">'+DEVICE_ID.substring(0,16)+'…</span></div>'+
      '</div></div>'+
      histSection+
      '<div class="sec"><div class="list">'+
        '<div class="lr" style="cursor:default"><span class="lr-lbl">'+t('version')+'</span><span class="lr-val">5.0.0</span></div>'+
        '<div class="lr" style="cursor:default"><span class="lr-lbl">Firebase</span><span class="lr-val">'+(fbReady()?t('connected'):t('localMode'))+'</span></div>'+
      '</div></div>'+
      '<div class="sec" style="padding-bottom:20px"><button class="btn btn-d btn-full" onclick="confirmLeave()">'+t('leave')+'</button></div>'+
    '</div>';

  var sb=$('#set-base'),sl=$('#set-local'); if(sb) sb.value=S.baseCurrency; if(sl) sl.value=S.localCurrency;
}

window.doFetchRatesSet=async function(){ toast('获取汇率中...',0); var ok=await fetchRates(); toast(ok?'汇率已更新':'获取失败'); renderSet(); };
window.onCurrencyChange=function(){ var sb=$('#set-base'),sl=$('#set-local'); if(!sb||!sl) return; S.baseCurrency=sb.value; S.localCurrency=sl.value; localStorage.setItem('baseCurrency',S.baseCurrency); localStorage.setItem('localCurrency',S.localCurrency); if(S.fxBase!==S.baseCurrency){ S.rates={}; S.fxDate=''; } renderSet(); };

// Period modal
window.showPeriodModal=function(){
  var pd=S.periodData,en=S.lang==='en';
  var predictions=getPeriodPredictions();
  var days=getDays();
  var tripStart=days.length?days[0].date:'';
  var tripEnd=days.length?days[days.length-1].date:'';
  var conflictWarning=periodConflict()?'<div class="period-warning" style="margin-bottom:14px">'+ic('bell',14)+' <span>'+t('periodConflict')+'</span></div>':'';
  var predHtml='';
  if(predictions.length){
    predHtml='<div class="sec-ttl" style="margin-bottom:8px">'+(en?'Predicted periods':'预测生理期')+'</div>';
    predictions.forEach(function(p,i){
      var start=new Date(p.start),end=new Date(start.getTime()+p.days*86400000);
      var endStr=end.toISOString().split('T')[0];
      var overlap=tripStart&&tripEnd&&new Date(p.start)<=new Date(tripEnd+'T23:59:59')&&end>=new Date(tripStart+'T00:00:00');
      predHtml+='<div class="lr" style="cursor:default;border-radius:var(--r2);background:rgba(var(--sf),.07);margin-bottom:6px;'+(overlap?'border-left:2px solid var(--red)':'')+'">'+
        '<span class="lr-lbl" style="font-size:14px">'+(en?'Cycle '+(i+1):'第'+(i+1)+'次')+'</span>'+
        '<span class="lr-val" style="'+(overlap?'color:var(--red)':'')+'">'+p.start+' – '+endStr+'</span>'+
      '</div>';
    });
  }
  var recordList=(pd.records||[]).slice(-3).map(function(r,i){ return '<div class="lr" style="cursor:default"><span class="lr-lbl" style="font-size:14px">'+r+'</span><div class="nbtn" style="width:26px;height:26px" onclick="removePeriodRecord('+i+')">'+ic('trash',11)+'</div></div>'; }).join('');
  showModal(
    '<div class="sh"></div>'+
    '<div style="font-size:18px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t('period')+'</div>'+
    conflictWarning+predHtml+
    '<div class="sec-ttl" style="margin-bottom:6px">'+(en?'Last period start':'上次生理期日期')+'</div>'+
    '<input class="inp" id="period-date" type="date" style="margin-bottom:10px">'+
    '<div style="display:flex;gap:8px;margin-bottom:14px">'+
      '<div style="flex:1"><div class="inp-lbl">'+(en?'Cycle (days)':'周期天数')+'</div><input class="inp" id="period-cycle" type="number" value="'+(pd.cycleLen||28)+'" min="21" max="45"></div>'+
      '<div style="flex:1"><div class="inp-lbl">'+(en?'Duration (days)':'持续天数')+'</div><input class="inp" id="period-dur" type="number" value="'+(pd.duration||5)+'" min="2" max="10"></div>'+
    '</div>'+
    (recordList?'<div class="list" style="margin-bottom:14px">'+recordList+'</div>':'')+
    '<button class="btn btn-p btn-full" onclick="addPeriodRecord()" style="margin-bottom:8px">'+ic('plus',15)+' '+t('periodAdd')+'</button>'+
    '<button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>'
  );
};
window.addPeriodRecord=function(){
  var d=$('#period-date')&&$('#period-date').value;
  var cy=parseInt($('#period-cycle')&&$('#period-cycle').value)||28;
  var du=parseInt($('#period-dur')&&$('#period-dur').value)||5;
  if(!d){ toast('请选择日期'); return; }
  if(!S.periodData.records) S.periodData.records=[];
  S.periodData.records.push(d); S.periodData.records.sort();
  S.periodData.cycleLen=cy; S.periodData.duration=du;
  localStorage.setItem('periodData',JSON.stringify(S.periodData));
  closeModal(); setTimeout(showPeriodModal,200);
};
window.removePeriodRecord=function(i){ S.periodData.records.splice(i,1); localStorage.setItem('periodData',JSON.stringify(S.periodData)); closeModal(); setTimeout(showPeriodModal,200); };

window.showMemberEdit=function(id){
  var m=S.members[id]; if(!m) return; var img=memberAvatar(id),isYou=id===S.memberId;
  showModal('<div class="sh"></div>'+
    '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:20px">'+
      '<div onclick="changeMemberAvatar(\''+id+'\')" style="cursor:pointer;position:relative">'+
        (img?'<div class="av" style="width:72px;height:72px"><img src="'+img+'" alt=""></div>':'<div class="av" style="width:72px;height:72px;background:'+m.color+';font-size:28px">'+((m.name||'?')[0])+'</div>')+
        '<div style="position:absolute;bottom:0;right:0;width:22px;height:22px;background:var(--blue);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg)">'+ic('camera',10)+'</div>'+
      '</div>'+
      '<div style="font-size:16px;font-weight:600;color:var(--t1)">'+escHtml(m.name)+(isYou?' ('+t('you')+')':'')+'</div>'+
    '</div>'+
    '<div class="inp-lbl">'+t('editNickname')+'</div><input class="inp" id="mem-name" value="'+escHtml(m.name)+'" style="margin-bottom:14px">'+
    '<button class="btn btn-p btn-full" style="margin-bottom:8px" onclick="submitMemberEdit(\''+id+'\')">'+t('save')+'</button>'+
    '<button class="btn btn-g btn-full" onclick="changeMemberAvatar(\''+id+'\')">'+ic('camera',15)+' '+t('editAvatar')+'</button>');
};
window.changeMemberAvatar=function(id){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=function(){ var f=inp.files[0]; if(!f) return; var rd=new FileReader(); rd.onload=function(e){ try{ var img=new Image(); img.onload=function(){ var canvas=document.createElement('canvas'),sz=Math.min(img.width,img.height,120); canvas.width=sz; canvas.height=sz; var ctx=canvas.getContext('2d'); ctx.drawImage(img,(img.width-sz)/2,(img.height-sz)/2,sz,sz,0,0,sz,sz); var b64=canvas.toDataURL('image/jpeg',0.7); S.avatars[id]=b64; localStorage.setItem('memberAvatars',JSON.stringify(S.avatars)); closeModal(); renderSet(); toast(t('wallUpdated')); }; img.src=e.target.result; }catch(err){ toast(t('imgTooLarge')); } }; rd.readAsDataURL(f); };
  inp.click();
};
window.submitMemberEdit=async function(id){
  var name=$('#mem-name')&&$('#mem-name').value.trim(); if(!name) return;
  S.members[id].name=name; if(id===S.memberId){ S.memberName=name; localStorage.setItem('memberName',name); }
  if(db&&S.tripCode){ var upd={}; upd['members.'+id+'.name']=name; await updateDoc(doc(db,'trips',S.tripCode),upd); }
  else if(S.trip){ S.trip.members=S.members; try{ localStorage.setItem('lt_'+S.tripCode,JSON.stringify(S.trip)); }catch(e){} }
  closeModal(); renderSet(); toast(t('save'));
};
window.setMsgApp=function(a){ S.msgApp=a; localStorage.setItem('msgApp',a); renderSet(); };
window.pickWallpaper=function(){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=function(){ var f=inp.files[0]; if(!f) return; var rd=new FileReader(); rd.onload=function(e){ try{ localStorage.setItem('wallpaper',e.target.result); }catch(err){ toast(t('imgTooLarge')); return; } applyWallpaper(); toast(t('wallUpdated')); }; rd.readAsDataURL(f); };
  inp.click();
};
window.clearWallpaper=function(){ localStorage.removeItem('wallpaper'); applyWallpaper(); toast(t('wallReset')); };
window.showAddMember=function(){
  showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t('addMember')+'</div><div class="inp-lbl">名字</div><input class="inp" id="nm-name" placeholder="'+t('addMemberPh')+'" style="margin-bottom:14px"><button class="btn btn-p btn-full" onclick="submitAddMember()">'+t('addMember')+'</button>');
};
window.submitAddMember=async function(){
  var name=$('#nm-name')&&$('#nm-name').value.trim(); if(!name){ toast('请输入名字'); return; }
  var id='u_'+Date.now(),used=Object.values(S.members).map(function(m){ return m.color; }),color=COLORS.find(function(c){ return used.indexOf(c)<0; })||COLORS[0];
  if(db&&S.tripCode){ var upd={}; upd['members.'+id]={name:name,color:color,joinedAt:serverTimestamp()}; await updateDoc(doc(db,'trips',S.tripCode),upd); }
  S.members[id]={name:name,color:color}; closeModal(); renderSet(); toast('已添加：'+name);
};
window.confirmLeave=function(){
  showModal('<div class="sh"></div><div style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--t1)">'+t('leave')+'</div><div style="font-size:14px;color:var(--t2);margin-bottom:18px">'+t('confirmLeaveMsg')+'</div><button class="btn btn-d btn-full" onclick="leaveTrip()" style="margin-bottom:8px">'+t('confirmLeaveBtn')+'</button><button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>');
};
window.leaveTrip=function(){
  S.unsubs.forEach(function(u){ u(); }); S.unsubs=[];
  ['tripCode','memberId','memberName'].forEach(function(k){ localStorage.removeItem(k); });
  S.tripCode=null; S.memberId=null; S.memberName=null; S.trip=null; S.members={}; S.expenses=[]; S.chatHistory=[];
  closeModal(); renderApp();
};

// ── INIT ──────────────────────────────────────────────────────
async function init(){
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(e){ console.warn('[SW]',e); });
  window.applyTheme(S.theme);
  applyWallpaper();
  if(S.tripCode&&S.memberId){ showLoad(); await fbLoadTrip(S.tripCode); hideLoad(); }
  renderApp();
  if(S.geo){ fetchWeather(); }
  if(S.baseCurrency){ var fxTs=S.fxDate?new Date(S.fxDate).getTime():0; if(Date.now()-fxTs>4*3600*1000) fetchRates().then(function(){ if(S.tab==='home') renderHome(); }); }
  if('Notification' in window&&localStorage.getItem('notifsEnabled')!=='false'){ if(Notification.permission==='default') Notification.requestPermission(); }
}
init();