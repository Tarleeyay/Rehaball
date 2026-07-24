/* ==========================================================================
   RehaVerse — helpers และสถานะกลางที่ไฟล์อื่นใช้ร่วมกัน
   โหลดเป็นไฟล์แรกเสมอ
   ========================================================================== */
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const r1=v=>Math.round(v*10)/10;
const $=id=>document.getElementById(id);

/* ทะเบียนหน้าจอ : ไฟล์ screens/game/dashboard เติมเข้ามาทีหลัง */
const SC={};
