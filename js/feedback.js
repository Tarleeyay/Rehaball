/* ==========================================================================
   RehaVerse — เสียง คำพูด การฉลอง มาสคอต และแถบช่วยเหลือ
   ========================================================================== */
/* ==========================================================================
   แถบช่วยเหลือถาวร + หน้าต่างช่วยเหลือ
   ปุ่มสองปุ่มนี้อยู่ตำแหน่งเดิมทุกหน้าจอ เด็กจึงจำได้ว่ากดตรงไหนเมื่อหลงทาง
   ========================================================================== */
/* ==========================================================================
   เสียงและการตอบสนอง
   เด็ก GDD หลายคนอ่านยังไม่คล่อง ทุกปุ่มจึงต้องอ่านออกเสียงเมื่อโฟกัสหรือชี้
   ========================================================================== */
/* สวิตช์ปิดเสียง : จำค่าไว้ข้ามการรีเฟรช
   เด็กบางคนไวต่อเสียงมาก การมีปุ่มปิดจึงจำเป็น ไม่ใช่ของเสริม */
const SOUND_KEY='rehaverse.sound.v1';
const SOUND={on:true};
try{ if(localStorage.getItem(SOUND_KEY)==='off')SOUND.on=false }catch(e){}

/* สวิตช์ปิดการเคลื่อนไหว : ค่าเริ่มต้นตามการตั้งค่าของเครื่อง
   แล้วผู้ดูแลปรับเองได้จากหน้าช่วยเหลือ */
const MOTION_KEY='rehaverse.motion.v1';
const MOTION={on:!window.matchMedia('(prefers-reduced-motion:reduce)').matches};
try{
  const saved=localStorage.getItem(MOTION_KEY);
  if(saved==='off')MOTION.on=false; else if(saved==='on')MOTION.on=true;
}catch(e){}
function applyMotion(){document.body.classList.toggle('motion-off',!MOTION.on)}
function setMotion(on){
  MOTION.on=on;
  try{ localStorage.setItem(MOTION_KEY,on?'on':'off') }catch(e){}
  applyMotion();
}
function setSound(on){
  SOUND.on=on;
  try{ localStorage.setItem(SOUND_KEY,on?'on':'off') }catch(e){}
  if(!on&&'speechSynthesis'in window)try{speechSynthesis.cancel()}catch(e){}
}

const TTS={on:('speechSynthesis'in window),last:'',t:0};
function speak(raw){
  const text=cleanText(raw);                       // กันอีโมจิหลุดไปถึงเสียงพูดทุกทาง
  if(!SOUND.on||!TTS.on||!text)return;
  const now=Date.now();
  if(text===TTS.last&&now-TTS.t<1200)return;      // กันอ่านซ้ำรัว ๆ
  TTS.last=text;TTS.t=now;
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='th-TH';u.rate=.9;u.pitch=1.05;
    speechSynthesis.speak(u);
  }catch(e){}
}
/* ตัดอีโมจิ ลูกศร และสัญลักษณ์ออกก่อนอ่านออกเสียง
   ไม่งั้นโปรแกรมอ่านหน้าจอจะพูดชื่อรูปภาพ เช่น "หมีเท็ดดี้" หรือ "สามเหลี่ยมชี้ขึ้น"
   ออกมาก่อนข้อความจริง ซึ่งทำให้เด็กสับสนมากกว่าช่วย */
const EMOJI=/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{FF00}-\u{FFEF}\u{200D}\u{20E3}]/gu;
const cleanText=s=>(s||'').replace(EMOJI,' ').replace(/\s+/g,' ').trim();
function labelOf(el){
  const aria=el.getAttribute('aria-label');
  if(aria)return cleanText(aria);
  /* ตัดโหนดที่ซ่อนจากโปรแกรมอ่านหน้าจอออกด้วย เพราะไอคอนทั้งหมดอยู่ใน span aria-hidden */
  const c=el.cloneNode(true);
  c.querySelectorAll('[aria-hidden="true"]').forEach(n=>n.remove());
  return cleanText(c.textContent);
}

/* เสียงประกอบสั้น ๆ สร้างสดด้วย WebAudio ไม่ต้องโหลดไฟล์ */
let AC=null;
function tone(freq,dur,type,vol){
  if(!SOUND.on)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=type||'sine';o.frequency.value=freq;
    g.gain.setValueAtTime(vol||.12,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+dur);
    o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+dur);
  }catch(e){}
}
const sfxTap    =()=>tone(520,.09,'triangle',.09);
const sfxSuccess=()=>{tone(660,.14,'sine',.14);setTimeout(()=>tone(880,.16,'sine',.14),120);
                      setTimeout(()=>tone(1180,.28,'sine',.13),250)};
const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ฉลองแบบหลายประสาทสัมผัส : ภาพ + เสียง + การสั่น พร้อมกัน */
function celebrate(msg){
  const c=$('cheer');
  const COLORS=['#FFD166','#98DFEA','#8CE99A','#FF9B9B','#FFFFFF'];
  const bits=MOTION.on
    ? '<div class="confetti">'+Array.from({length:16},(_,i)=>
        `<i style="left:${4+i*6}%;background:${COLORS[i%COLORS.length]};
          animation-delay:${(i%6)*.07}s;animation-duration:${1.2+(i%5)*.16}s"></i>`).join('')+'</div>'
    : '';
  c.hidden=false;c.innerHTML=bits+'<div class="tick">✓</div>';
  sfxSuccess();
  if(navigator.vibrate)try{navigator.vibrate([40,60,90])}catch(e){}
  if(!reduceMotion()){document.body.classList.add('shake');
    setTimeout(()=>document.body.classList.remove('shake'),430)}
  $('live').textContent=msg||'ทำได้แล้ว';
  speak(msg||'เก่งมาก');
  setTimeout(()=>{c.hidden=true;c.innerHTML=''},1400);
}

function drawAssist(){
  const a=$('assist');
  /* หน้าของผู้ใหญ่ (login / ใส่รหัส / แดชบอร์ด) ไม่ต้องมีแถบนี้
     มันมีไว้ให้เด็กกดกลับบ้านหรือขอความช่วยเหลือระหว่างเล่นเท่านั้น */
  if(['dash','editor','login','code'].includes(S.screen)){a.hidden=true;a.innerHTML='';return}
  a.hidden=false;
  a.innerHTML=`<button class="abtn" data-home="1"><span class="ic" aria-hidden="true">🏠</span>หน้าแรก</button>
    <button class="abtn helpb" data-help="1"><span class="ic" aria-hidden="true">?</span>ช่วยเหลือ</button>`;
}
const HELP={
  pick  :{em:'👋',t:'เลือกรูปของหนู',p:'แตะปุ่มที่มีรูปของหนู ถ้าไม่แน่ใจ ให้ถามคุณครูหรือคุณแม่ได้'},
  code  :{em:'🩺',t:'สำหรับผู้ใหญ่',p:'ใส่รหัสแฟ้มของเด็ก แล้วแตะปุ่มสีเหลืองเพื่อเปิดข้อมูล'},
  toy   :{em:'🧸',t:'มีลูกบอลไหม',p:'ถ้าวันนี้มีลูกบอลอยู่ในมือ ให้แตะปุ่ม “มี” ถ้าไม่มี แตะปุ่ม “ไม่มี” ก็เล่นได้เหมือนกัน'},
  mode  :{em:'🎮',t:'อยากเล่นแบบไหน',p:'แตะปุ่มที่หนูอยากเล่นวันนี้ ปุ่มสีเหลืองที่มีดาวคือปุ่มที่ระบบแนะนำ'},
  home  :{em:'▶',t:'กดปุ่มสีเหลือง',p:'แตะปุ่มใหญ่สีเหลืองที่เขียนว่า “เล่น” แล้วเกมจะเริ่มทันที'},
  game  :{em:'✋',t:'วิธีเล่น',p:'แตะปุ่ม “บีบแรงขึ้น” ทีละครั้ง ให้หน้ายิ้มขึ้นไปอยู่ในแถบสีเหลือง แล้วรอสักครู่จนฟองแตก ไม่ต้องรีบ'},
  reward:{em:'🌟',t:'เล่นจบแล้ว',p:'เก่งมาก แตะปุ่มสีเหลืองเพื่อกลับไปหน้าแรก'},
  skills:{em:'⭐',t:'ดาวของหนู',p:'ดาวจะเพิ่มขึ้นทุกครั้งที่หนูเล่น ยิ่งเล่นบ่อย ดาวยิ่งเยอะ'},
};
function openHelp(){
  const h=HELP[S.screen]||{em:'❓',t:'ช่วยเหลือ',p:'แตะปุ่มใหญ่บนหน้าจอเพื่อไปต่อ'},w=$('helpwrap');
  /* ปลายทางรองอย่างหน้าดาวถูกเก็บไว้หลังปุ่มช่วยเหลือ
     เพื่อให้หน้าจอหลักเหลือทางเลือกน้อยที่สุด */
  const extra=(S.p&&S.screen!=='skills')
    ? `<button class="kbtn" data-go="skills"><span class="ic" aria-hidden="true">⭐</span>ดาวของฉัน</button>` : '';
  /* ปุ่มเสียงบอกสถานะด้วยทั้งไอคอนและข้อความ ไม่ได้ใช้สีสื่อความหมายอย่างเดียว */
  const snd=SOUND.on
    ? `<button class="kbtn green" data-sound="off"><span class="ic" aria-hidden="true">🔊</span>เสียง เปิดอยู่</button>`
    : `<button class="kbtn plainbtn" data-sound="on"><span class="ic" aria-hidden="true">🔇</span>เสียง ปิดอยู่</button>`;
  const mot=MOTION.on
    ? `<button class="kbtn green" data-motion="off"><span class="ic" aria-hidden="true">✨</span>ภาพเคลื่อนไหว เปิดอยู่</button>`
    : `<button class="kbtn plainbtn" data-motion="on"><span class="ic" aria-hidden="true">⏸</span>ภาพเคลื่อนไหว ปิดอยู่</button>`;
  w.hidden=false;
  w.innerHTML=`<div class="helpbox">
    ${MASCOT('idle')}
    <h2 id="helptitle">${h.t}</h2><p>${h.p}</p>
    ${snd}
    ${mot}
    ${extra}
    <button class="kbtn cyan" id="helpclose"><span class="ic" aria-hidden="true">✕</span>ปิด</button></div>`;
  $('helpclose').focus();
  speak(h.t+' '+h.p);
}
function closeHelp(){const w=$('helpwrap');w.hidden=true;w.innerHTML=''}

/* มาสคอตประจำเครื่อง : ตัวละครใหญ่ที่ทำหน้าที่เป็นเพื่อนนำทางและเติมพื้นที่ว่าง */
const MASCOT=(mood='idle')=>`
<svg class="mascot" viewBox="0 0 200 210" role="img" aria-label="เจ้าหุ่นเพื่อนเล่น">
  <ellipse cx="100" cy="196" rx="58" ry="9" fill="#000" opacity=".35"/>
  <path d="M100 34V18" stroke="#12121A" stroke-width="7" stroke-linecap="round"/>
  <circle cx="100" cy="13" r="11" fill="#FFD166" stroke="#12121A" stroke-width="6"/>
  <path d="M38 100c0-34 28-62 62-62s62 28 62 62v36c0 21-28 36-62 36s-62-15-62-36z"
        fill="#98DFEA" stroke="#12121A" stroke-width="7" stroke-linejoin="round"/>
  <rect x="62" y="76" width="76" height="46" rx="23" fill="#F4F4F8" stroke="#12121A" stroke-width="6"/>
  ${mood==='happy'
    ? `<path d="M74 100q9-11 18 0M108 100q9-11 18 0" stroke="#12121A" stroke-width="7" fill="none" stroke-linecap="round"/>`
    : `<circle class="eye" cx="83" cy="99" r="9" fill="#12121A"/><circle class="eye" cx="117" cy="99" r="9" fill="#12121A"/>
       <circle cx="86" cy="95" r="3" fill="#FFFFFF"/><circle cx="120" cy="95" r="3" fill="#FFFFFF"/>`}
  <path d="${mood==='happy'?'M82 140q18 20 36 0':'M84 140q16 12 32 0'}"
        fill="none" stroke="#12121A" stroke-width="7" stroke-linecap="round"/>
  <circle cx="52" cy="112" r="9" fill="#FFD166" stroke="#12121A" stroke-width="5"/>
  <circle cx="148" cy="112" r="9" fill="#FFD166" stroke="#12121A" stroke-width="5"/>
</svg>`;

/* ปุ่มย้อนกลับ : อยู่มุมซ้ายบนของทุกหน้าที่มีขั้นก่อนหน้า ตำแหน่งเดิมเสมอ
   เด็กที่กดผิดต้องแก้ไขได้เอง ไม่ใช่ติดอยู่จนต้องเริ่มใหม่ทั้งหมด */
const backBtn=to=>`<button class="backbtn" data-go="${to}" aria-label="ย้อนกลับ">
  <span class="ic" aria-hidden="true">←</span>ย้อนกลับ</button>`;

/* แถบโหนดบอกความคืบหน้า : แสดงผลอย่างเดียว แตะไม่ได้ ไม่ใช่เมนูเลือกด่าน */
function nodeBar(cur,total){
  let h='';
  for(let n=1;n<=total;n++){
    const st=n<cur?'done':n===cur?'here':'';
    h+=`<span class="nd ${st}">${n<cur?'✓':n}</span>`;
    if(n<total)h+=`<span class="nlink ${n<cur?'done':''}"></span>`;
  }
  return `<div class="prog">
    <div class="nodes" aria-hidden="true">${h}</div>
    <p class="nodetxt">ด่าน ${cur} จาก ${total}</p></div>`;
}

/* ทางออกของเกมอยู่มุมซ้ายบน ตำแหน่งเดียวกับปุ่มย้อนกลับของหน้าอื่น
   วางไว้บนสุดเพราะเป็นจุดที่มองเห็นได้ทันทีเสมอ ไม่ว่าหน้าต่างจะเตี้ยแค่ไหน
   กดแล้วไปหน้าสรุป เพื่อให้ทุกครั้งที่เล่นจบมีการชมเชยปิดท้าย */
/* ==========================================================================
   พื้นที่กดแบบให้อภัย
   ถ้าแตะพลาดออกนอกปุ่มไม่เกิน 15px ให้นับเป็นการกดปุ่มนั้น
   มือเด็กมักไถลออกพอดีจังหวะที่กด การไม่ให้อภัยตรงนี้ทำให้ล้มเหลวทั้งที่ตั้งใจถูก
   ========================================================================== */
const SLOP=15;
function nearestControl(x,y){
  let best=null,bd=SLOP+1;
  document.querySelectorAll('#root button,#assist button,.helpbox button').forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.width<1||el.disabled)return;
    const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom);
    const d=Math.hypot(dx,dy);
    if(d<bd){bd=d;best=el}
  });
  return best;
}
document.addEventListener('pointerdown',e=>{
  if(e.target.closest('button,a,input,select,label'))return;
  const el=nearestControl(e.clientX,e.clientY);
  if(el){e.preventDefault();el.click()}
},true);

/* อ่านออกเสียงเมื่อโฟกัสหรือชี้ที่ปุ่ม */
document.addEventListener('focusin',e=>{
  const b=e.target.closest('button,a[href],input,select');if(b)speak(labelOf(b));});
document.addEventListener('pointerover',e=>{
  const b=e.target.closest('button,a[href]');if(b)speak(labelOf(b));});
