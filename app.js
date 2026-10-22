/* 災害調査支援 共通ライブラリ：種別定義 / 保存(IndexedDB) / PDF生成 / 共有 */
'use strict';
const APP_VERSION = '2.0.0';

/* ---------- 調査種別の定義（9枚のHTMLを1つに統合） ---------- */
const TYPES = {
  road: { name: '道路', icon: '🛣️', color: '#b91c1c',
    facility: { opts: ['路面', '路肩', '構造物', 'その他'], otherPh: '内容を入力' },
    pos: { k: 'position', label: '位置', opts: ['左側', '右側', '全体'] },
    method: { ph: 'ブロック積、大型土のう等' }, turbidity: false },
  river: { name: '河川', icon: '🌊', color: '#0369a1',
    facility: { opts: ['堤体', '護岸', '床固め', '根固め', 'その他'], otherPh: '施設名を入力' },
    pos: { k: 'position', label: '位置', opts: ['左岸', '右岸', '両岸'] },
    method: { opts: ['間知ブロック積', '環境保全型ブロック', 'その他'], otherPh: '工法名を入力' }, turbidity: true },
  sabo: { name: '砂防', icon: '⛰️', color: '#57534e',
    facility: { opts: ['堰堤', '前庭保護工', '渓流保全工', '床固め', '除石', 'その他'], otherPh: '施設名を入力' },
    pos: { k: 'position', label: '位置', opts: ['左岸', '右岸', '両岸'] },
    method: { ph: '対策工法を入力' }, turbidity: true },
  steep_slope: { name: '急傾斜', icon: '🧗', color: '#065f46',
    facility: { opts: ['待受け擁壁', '落石防護柵', '法枠', '自然斜面', 'その他'], otherPh: '施設名を入力' },
    pos: null, method: { ph: '対策工法を入力' }, turbidity: false },
  other: { name: 'その他(汎用)', icon: '🛠️', color: '#4338ca',
    facility: { ph: '施設名を入力' },
    pos: { k: 'position', label: '位置', opts: ['左', '右', '全体', 'その他'] },
    method: { ph: '対策工法を入力' }, turbidity: true },
  farmland: { name: '農地', icon: '🌾', color: '#d97706',
    facility: { opts: ['田', '畑', 'その他'], otherPh: '施設名を入力' },
    pos: { k: 'inflowType', label: '流入', opts: ['別工区排土', '同工区'] },
    method: { opts: ['ブロック積', 'フトンカゴ', '盛土', '一本胴木', 'その他'], otherPh: '工法名を入力' }, turbidity: false },
  agricultural_facilities: { name: '農業用施設', icon: '🚜', color: '#c2410c',
    facility: { opts: ['農道', '排水路', '用水路', '兼用水路', 'ため池', '頭首工', 'その他'], otherPh: '施設名を入力' },
    pos: { k: 'position', label: '位置', opts: ['左側', '右側', '全体', '－'] },
    method: { ph: '対策工法を入力' }, turbidity: false },
  forest_road: { name: '林道', icon: '🌲', color: '#15803d',
    facility: { ph: '林道名や施設名を入力' },
    pos: { k: 'position', label: '位置', opts: ['左側', '右側', '全体'] },
    method: { ph: '対策工法を入力' }, turbidity: false },
  forest_collapse: { name: '林地崩壊', icon: '🏔️', color: '#4a3728',
    facility: { ph: '崩壊地名などを入力' },
    pos: null, method: { ph: '法枠、待受け擁壁など' }, turbidity: false }
};

const MENU = [
  { title: '公共土木施設災害', icon: '🛣️', color: '#1d4ed8',
    items: [['road', '道路'], ['river', '河川'], ['sabo', '砂防施設'], ['steep_slope', '急傾斜'], ['other', 'その他']] },
  { title: '農業災害', icon: '🌾', color: '#d97706',
    items: [['farmland', '農地'], ['agricultural_facilities', '農業用施設'], ['other', 'その他']] },
  { title: '林道等', icon: '🌲', color: '#15803d',
    items: [['forest_road', '林道'], ['forest_collapse', '林地崩壊'], ['other', 'その他']] }
];

/* ---------- 小物 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = (c) => {
    if (Array.isArray(c)) c.forEach(add);
    else if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  };
  kids.forEach(add);
  return el;
}
const pad2 = (n) => String(n).padStart(2, '0');
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function fmtDate(s) { return s ? String(s).replace(/-/g, '/') : '－'; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
function darken(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.round(v * (1 - f)).toString(16).padStart(2, '0');
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
}
function loadImg(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}
function safeName(s) { return String(s).replace(/[\\/:*?"<>|\r\n]+/g, '_').replace(/^\.+/, '').slice(0, 80) || 'file'; }
let toastTimer = 0;
function toast(msg, ms = 2400) {
  let t = $('.toast');
  if (!t) { t = h('div', { class: 'toast' }); document.body.append(t); }
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}
function lsGet(k, d = '') { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

/* ---------- 共有 / ダウンロード ---------- */
function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
/* 共有シート（メール・ファイルに保存・AirDrop等）を開く。未対応端末はダウンロード */
async function shareBlob(blob, name) {
  const file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
  }
  downloadBlob(blob, name);
  return 'download';
}

/* ---------- 保存（IndexedDB：写真ごと端末内に自動保存） ---------- */
const DB = {
  _p: null,
  open() {
    if (!this._p) {
      this._p = new Promise((res, rej) => {
        if (!window.indexedDB) return rej(new Error('IndexedDB未対応'));
        const r = indexedDB.open('saigai-pro', 1);
        r.onupgradeneeded = () => {
          const db = r.result;
          db.createObjectStore('records', { keyPath: 'id' });
          db.createObjectStore('meta', { keyPath: 'id' }).createIndex('type', 'type');
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
        r.onblocked = () => rej(new Error('blocked'));
      });
    }
    return this._p;
  },
  _r(q) { return new Promise((res, rej) => { q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  async put(rec, meta) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction(['records', 'meta'], 'readwrite');
      t.objectStore('records').put(rec); t.objectStore('meta').put(meta);
      t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error);
    });
  },
  async get(id) { const db = await this.open(); return this._r(db.transaction('records').objectStore('records').get(id)); },
  async list(type) { const db = await this.open(); return this._r(db.transaction('meta').objectStore('meta').index('type').getAll(type)); },
  async count(type) { const db = await this.open(); return this._r(db.transaction('meta').objectStore('meta').index('type').count(type)); },
  async del(id) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction(['records', 'meta'], 'readwrite');
      t.objectStore('records').delete(id); t.objectStore('meta').delete(id);
      t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error);
    });
  }
};

/* ---------- PDF生成（JPEGページを並べるだけの軽量PDFライター） ---------- */
function buildPdfBlob(pages, title) {
  const enc = new TextEncoder();
  const parts = []; const offsets = []; let pos = 0;
  const push = (d) => { const u = typeof d === 'string' ? enc.encode(d) : d; parts.push(u); pos += u.length; };
  const PW = 595.28, PH = 841.89;
  const n = pages.length, infoNum = 3 + n * 3;
  const obj = (num, body) => { offsets[num] = pos; push(`${num} 0 obj\n${body}\nendobj\n`); };
  push('%PDF-1.4\n'); push(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] /Count ${n} >>`);
  pages.forEach((pg, i) => {
    const pn = 3 + i * 3, cn = pn + 1, im = pn + 2;
    obj(pn, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${im} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${cn} 0 R >>`);
    const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
    obj(cn, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    offsets[im] = pos;
    push(`${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.bytes.length} >>\nstream\n`);
    push(pg.bytes); push('\nendstream\nendobj\n');
  });
  let hex = '';
  for (let i = 0; i < title.length; i++) hex += title.charCodeAt(i).toString(16).padStart(4, '0');
  const d = new Date();
  const cd = `D:${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  obj(infoNum, `<< /Title <FEFF${hex}> /Producer (Saigai Survey Tool ${APP_VERSION}) /CreationDate (${cd}) >>`);
  const xrefPos = pos;
  let x = `xref\n0 ${infoNum + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= infoNum; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  push(x);
  push(`trailer\n<< /Size ${infoNum + 1} /Root 1 0 R /Info ${infoNum} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ }
