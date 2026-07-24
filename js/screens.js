/* ==========================================================================
   RehaVerse — หน้าจอฝั่งเด็ก
   ========================================================================== */
SC.login=()=>`
<div class="screen">
  <h1 class="ask">วันนี้ใครใช้งาน</h1>
  <div class="stack">
    <button class="kbtn" data-go="pick"><span class="ic" aria-hidden="true">🧒</span>ฉันคือเด็ก</button>
    <button class="kbtn cyan" data-go="code"><span class="ic" aria-hidden="true">🩺</span>ผู้ปกครอง / นักกายภาพ</button>
    <button class="kbtn cyan" data-newprofile="1"><span class="ic" aria-hidden="true">＋</span>สร้างแฟ้มใหม่</button>
  </div>
</div>`;

SC.pick=()=>`
<div class="screen">
  ${backBtn('login')}
  <h1 class="ask">หนูคือใคร</h1>
  <div class="stack">
    ${PROFILES.map(p=>`<button class="kbtn cyan" data-kid="${p.code}">
      <span class="ic" aria-hidden="true">${p.avatar}</span>${p.nick}</button>`).join('')}
  </div>
</div>`;

SC.code=()=>`
<div class="screen">
  ${backBtn('login')}
  <h1 class="ask">ใส่รหัสแฟ้ม</h1>
  <label class="field codebox"><span>รหัสแฟ้มของเด็ก</span>
    <input id="codein" placeholder="CP-0000" autocomplete="off" inputmode="text"></label>
  <p class="err" id="codeerr"><span aria-hidden="true">✕</span> ไม่พบรหัสนี้ ลองใหม่อีกครั้ง</p>
  <button class="kbtn" id="codego"><span class="ic" aria-hidden="true">🔓</span>เปิดแฟ้ม</button>
  <div class="hintcodes">${PROFILES.map(p=>`<button data-fill="${p.code}">${p.code} · ${p.nick}</button>`).join('')}</div>
</div>`;

/* หนึ่งคำถามต่อหนึ่งหน้าจอ ตัวเลือกไม่เกินสาม */
SC.toy=()=>`
<div class="screen">
  ${backBtn('pick')}
  <h1 class="ask">วันนี้มีลูกบอลไหม</h1>
  <div class="pair">
    <button class="choice" data-toy="1"><span class="cem" aria-hidden="true">🧸</span><b>มี</b></button>
    <button class="choice" data-toy="0"><span class="cem" aria-hidden="true">📷</span><b>ไม่มี</b></button>
  </div>
  <p class="sub">ไม่มีก็เล่นได้ ใช้กล้องแทน</p>
  ${MASCOT('idle')}
</div>`;

SC.mode=()=>{
  const opts=S.p.hasToy?['toy','both']:['game'];
  const rec=recommendMode(S.p);
  return `<div class="screen">
  ${backBtn('toy')}
  <h1 class="ask">อยากเล่นแบบไหน</h1>
  <div class="${opts.length>1?'pair':'stack'}">
    ${opts.map(k=>{const m=MODE_META[k],isRec=k===rec.mode&&opts.length>1;
      return `<button class="choice${isRec?' rec':''}" data-mode="${k}">
        ${isRec?'<span class="tip"><span aria-hidden="true">★</span> แนะนำ</span>':''}
        <span class="cem" aria-hidden="true">${m.em}</span><b>${m.kid}</b></button>`}).join('')}
  </div>
  ${MASCOT('happy')}
</div>`;
};

/* ป้ายบอกว่าวันนี้ระบบปรับอะไรให้ — เอาแค่อันเดียว เด็กไม่ต้องอ่านหลายอย่างพร้อมกัน */
function kidAdaptChips(){
  const a=H.engine.log.filter(l=>['up','down','down2'].includes(l.action)).slice(-1);
  if(!a.length)return '<span class="kidchip">เริ่มเหมือนเมื่อวาน</span>';
  return a.map(l=>{const d=DIMS[l.dim];
    return `<span class="kidchip ${l.action==='up'?'up':''}">${d.ico} ${l.action==='up'?d.kidUp:d.kidDn}</span>`}).join('');
}

/* ==========================================================================
   หน้าเกาะ : เส้นทางเดินทาง ไม่ใช่กล่องข้อความ
   เด็กเห็นสามอย่างเท่านั้น — เดินมาถึงไหนแล้ว วันนี้เล่นอะไร แล้วปุ่มเล่น
   รายละเอียดเชิงคลินิกทั้งหมด (เป้าหมายด่าน มิติที่ปรับได้ ค่าพารามิเตอร์)
   ย้ายไปอยู่แดชบอร์ดนักกายภาพ ซึ่งเป็นที่ของมันอยู่แล้ว
   ========================================================================== */
SC.home=()=>{
  const p=S.p,lv=LEVELS[p.level-1],g=lv.modes[p.mode];
  const act = p.mode==='toy'
    ? `<button class="kbtn green" data-go="reward"><span class="ic" aria-hidden="true">✓</span>เล่นเสร็จแล้ว</button>`
    : g.playable
      ? `<button class="kbtn pulse" data-go="game"><span class="ic" aria-hidden="true">▶</span>เล่น</button>`
      : `<button class="kbtn" disabled>เร็ว ๆ นี้</button>`;
  return `<div class="screen">
  ${backBtn('mode')}
  ${nodeBar(p.level,LEVELS.length)}
  <h1 class="ask">${KID_LINE[lv.n]||lv.th}</h1>
  <div class="mascotrow">
    ${MASCOT('idle')}
    <div class="speech">วันนี้เล่นด่าน ${p.level} นะ</div>
  </div>
  ${act}
</div>`;
};

/* รายการแนวตั้งอ่านง่ายกว่าผังวงกลม สำหรับเด็กที่มีพัฒนาการช้า
   หนึ่งบรรทัดหนึ่งทักษะ ดาวนับได้ด้วยตา ไม่ต้องตีความ */
SC.skills=()=>{
  const p=S.p,sp=skillPairs();
  return `<div class="screen">
  <h1 class="ask">ดาวของ${p.nick}</h1>
  <div class="list">
    ${SKILLS.map(sk=>{const lv=skillLevel(sp[sk.key].last);
      return `<div class="skillrow">
        <span class="se" aria-hidden="true">${sk.icon}</span>
        <div><div class="sn">${sk.name}</div>
        <div class="stars" role="img" aria-label="${lv} ดาว จาก 5 ดาว">${
          Array.from({length:5},(_,i)=>`<span class="${i<lv?'on':''}" aria-hidden="true">★</span>`).join('')}</div></div>
      </div>`}).join('')}
  </div>
</div>`;
};
/* ไม่มีปุ่มกลับหน้าแรกในหน้านี้ เพราะแถบช่วยเหลือด้านล่างมีปุ่มหน้าแรกอยู่แล้ว
   การใส่ซ้ำทำให้มีตัวเลือกเกินจำเป็นและเบียดพื้นที่จนต้องเลื่อนจอ */

SC.reward=()=>{
  const ok=G.results.filter(Boolean).length,n=G.results.length;
  return `<div class="screen">
  <h1 class="ask">เก่งมาก</h1>
  <div class="mascotrow">
    ${MASCOT('happy')}
    <div class="speech">${n?`ช่วยได้ ${ok} จาก ${n} ครั้ง`:'พรุ่งนี้มาเล่นกันใหม่'}</div>
  </div>
  <div class="card">
    <p>ได้เมล็ดพันธุ์ใหม่</p>
    <div class="seedrow">
      ${Array.from({length:9},(_,i)=>i<S.p.seeds
        ?`<div class="seed on">${['🌻','🌵','🌷','🍄','🌴','🪴','🌺','🍀','🌸'][i]}</div>`
        :`<div class="seed"></div>`).join('')}</div>
  </div>
  <button class="kbtn" data-go="home"><span class="ic" aria-hidden="true">🏠</span>กลับหน้าแรก</button>
</div>`;
};
