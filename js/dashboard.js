/* ==========================================================================
   RehaVerse — หน้านักกายภาพ : ตัวแก้ไขแฟ้ม กราฟ และวิธีคำนวณค่า
   ========================================================================== */
/* ==========================================================================
   ตัวแก้ไขแฟ้ม / ลงทะเบียน
   ========================================================================== */
function edPreview(p){
  const r=simulate(p),tr=r.trials,ok=tr.filter(t=>t.ok).length;
  const rl=tr.map((_,i)=>mean(tr.slice(Math.max(0,i-4),i+1).map(t=>t.ok?1:0)));
  const W=280,Hh=64;
  const pts=rl.map((v,i)=>`${i*(W/Math.max(1,rl.length-1))},${Hh-v*Hh}`).join(' ');
  const rec=recommendMode(p);
  return `<div class="preview">
    <h4>${p.avatar} ตัวอย่างเคสนี้</h4>
    <p class="cap">ระบบจำลองการเล่น ${p.nTrials} ครั้งจากค่าที่ตั้งไว้ แล้วรันผ่าน adaptive engine ตัวจริง กราฟนี้คืออัตราสำเร็จที่ได้</p>
    <svg viewBox="0 0 ${W} ${Hh}" width="100%" style="background:#fff;border-radius:8px">
      <rect x="0" y="${Hh*.2}" width="${W}" height="${Hh*.1}" fill="rgba(23,107,119,.15)"/>
      <polyline points="${pts}" fill="none" stroke="#176B77" stroke-width="2"/></svg>
    <div style="margin-top:var(--s2)">
      <div class="kv"><span>รหัสแฟ้ม</span><b>${p.code}</b></div>
      <div class="kv"><span>F_work (PRF − F_rest)</span><b>${r1(p.cal.prf-p.cal.rest)} N</b></div>
      <div class="kv"><span>อัตราสำเร็จรวม</span><b>${Math.round(ok/tr.length*100)}%</b></div>
      <div class="kv"><span>ความยากปลายทาง</span><b>${r1(r.engine.diff.hold_time)}s · ±${r.engine.diff.tolerance_band} · ${r.engine.diff.target_force}%</b></div>
      <div class="kv"><span>engine ปรับทั้งหมด</span><b>${r.engine.log.filter(l=>l.action!=='hold').length} ครั้ง</b></div>
      <div class="kv"><span>AI แนะนำโหมด</span><b>${MODE_META[rec.mode].label}</b></div>
    </div></div>`;
}
SC.editor=()=>{
  const p=S.draft;
  const sl=(k,path,min,max,step,fmt)=>`<div class="sl">
    <label>${k}<b id="lbl-${path}">${fmt(getPath(p,path))}</b></label>
    <input type="range" data-path="${path}" min="${min}" max="${max}" step="${step}" value="${getPath(p,path)}"></div>`;
  return `<div class="screen">
  <div class="prohead"><div>
    <span class="eyebrow">${S.editingNew?'ลงทะเบียนเด็กใหม่':'แก้ไขแฟ้ม'}</span>
    <h1>${S.editingNew?'สร้างแฟ้มข้อมูลเด็ก':'แฟ้ม '+p.code}</h1>
    <div class="meta">ค่าที่ตั้งในหน้านี้ใช้สร้างเคสสำหรับสาธิต — ในระบบจริงค่าคาลิเบรตมาจากการวัด และประวัติมาจากการเล่นจริง</div></div>
    <div class="proact">
      ${S.editingNew?'':'<button class="btn warn" id="edDel">ลบแฟ้ม</button>'}
      <button class="btn" data-go="login">ยกเลิก</button>
      <button class="btn solid" id="edSave">บันทึกแฟ้ม</button></div></div>

  <div class="edgrid">
    <div>
      <div class="procard" style="margin-bottom:var(--s2)">
        <h3>ข้อมูลเด็ก</h3>
        <div style="margin-top:var(--s3)">
          <div class="frow">
            <label class="field"><span>ชื่อ–นามสกุล</span><input data-f="name" value="${p.name}" placeholder="เช่น พลอย ว."></label>
            <label class="field"><span>ชื่อเล่น (ที่เด็กเห็น)</span><input data-f="nick" value="${p.nick}" placeholder="เช่น พลอย"></label>
          </div>
          <div class="field"><span>รูปประจำตัว</span><div class="emojipick">
            ${AVATARS.map(a=>`<button data-av="${a}" class="${a===p.avatar?'on':''}">${a}</button>`).join('')}</div></div>
          <div class="frow3">
            <label class="field"><span>อายุ (ปี)</span><input type="number" data-f="age" value="${p.age}" min="1" max="18"></label>
            <label class="field"><span>มือที่ฝึก</span><select data-f="hand">
              ${['ขวา','ซ้าย','สองข้าง'].map(h=>`<option ${h===p.hand?'selected':''}>${h}</option>`).join('')}</select></label>
            <label class="field"><span>มีลูกบอลไหม</span><select data-f="hasToy">
              <option value="1" ${p.hasToy?'selected':''}>มี</option><option value="0" ${!p.hasToy?'selected':''}>ไม่มี</option></select></label>
          </div>
          <div class="frow3">
            <label class="field"><span>การวินิจฉัย</span><input data-f="dx" value="${p.dx}"></label>
            <label class="field"><span>MACS</span><select data-f="macs">
              ${[1,2,3,4,5].map(v=>`<option ${v===p.macs?'selected':''}>${v}</option>`).join('')}</select></label>
            <label class="field"><span>GMFCS</span><select data-f="gmfcs">
              ${[1,2,3,4,5].map(v=>`<option ${v===p.gmfcs?'selected':''}>${v}</option>`).join('')}</select></label>
          </div>
        </div>
      </div>

      <div class="procard" style="margin-bottom:var(--s2)">
        <h3>ค่าคาลิเบรต</h3>
        <p class="note">ทุกค่าในเกมอ้างอิงจาก F_work = PRF − F_rest ไม่ใช่นิวตันดิบ การเปลี่ยนค่านี้จึงเปลี่ยนความหมายของทุกเป้าหมายในระบบ</p>
        <div style="margin-top:var(--s3)">
          ${sl('F_rest — แรงขณะถือแต่ไม่บีบ','cal.rest',0,2,.01,v=>r1(v)+' N')}
          ${sl('F_comf — แรงบีบสบาย','cal.comf',.5,6,.1,v=>r1(v)+' N')}
          ${sl('PRF — แรงสูงสุดที่ทำซ้ำได้','cal.prf',1,12,.1,v=>r1(v)+' N')}
        </div>
      </div>

      <div class="procard">
        <h3>สร้างเคสสำหรับสาธิต</h3>
        <p class="note">ค่าเหล่านี้ป้อนให้ simulated learner ไม่ได้อยู่ในระบบจริง ใช้สร้างประวัติการเล่นที่สมจริงเพื่อทดสอบว่า adaptive engine ตอบสนองอย่างไรกับเด็กที่ความสามารถต่างกัน</p>
        <div style="margin-top:var(--s3)">
          ${sl('ความสามารถเริ่มต้น','ability',.05,.85,.01,v=>Math.round(v*100)+'/100')}
          ${sl('อัตราการเรียนรู้ต่อครั้ง','learn',.002,.03,.001,v=>(v*100).toFixed(1)+'%')}
          ${sl('จำนวนครั้งที่จำลอง','nTrials',10,60,1,v=>v+' trials')}
        </div>
        <h3 style="margin-top:var(--s4)">ป้อนให้ AI Recommendation Engine</h3>
        <p class="note">สองค่านี้ใช้เลือกว่าควรแนะนำ Toy Only / Game Only / Toy+Game — ในระบบจริงควรมาจาก assessment สั้น ๆ ตอนลงทะเบียน แต่ที่นี่ปรับตามใจได้เพื่อทดสอบว่าคำแนะนำเปลี่ยนไปอย่างไร</p>
        <div style="margin-top:var(--s3)">
          ${sl('ความสนใจต่อหน้าจอ','screenEngagement',0,1,.05,v=>Math.round(v*100)+'%')}
          ${sl('ช่วงสมาธิ','attentionSpan',0,1,.05,v=>Math.round(v*100)+'%')}
        </div>
        <h3 style="margin-top:var(--s4)">ค่าเริ่มต้นของ adaptive engine</h3>
        <div style="margin-top:var(--s3)">
          ${sl('แรงเป้าหมายเริ่มต้น','start.target_force',20,70,5,v=>v+' %F_work')}
          ${sl('ความกว้างช่วงเป้าเริ่มต้น','start.tolerance_band',4,20,2,v=>'± '+v+'%')}
          ${sl('เวลาค้างแรงเริ่มต้น','start.hold_time',.5,4,.5,v=>r1(v)+' วินาที')}
          ${sl('ด่านที่เริ่ม','level',1,8,1,v=>'ด่าน '+v+' · '+LEVELS[v-1].th)}
        </div>
      </div>
    </div>
    <div id="edPrev">${edPreview(p)}</div>
  </div></div>`;
};
const getPath=(o,p)=>p.split('.').reduce((a,k)=>a[k],o);
const setPath=(o,p,v)=>{const k=p.split('.');k.slice(0,-1).reduce((a,x)=>a[x],o)[k.at(-1)]=v};

/* ==========================================================================
   Dashboard
   ========================================================================== */
const roll5=a=>a.map((_,i)=>mean(a.slice(Math.max(0,i-4),i+1)));
function chartConvergence(){
  const T=H.trials,W=760,Hh=200,P={l:36,r:14,t:12,b:34};
  const rl=roll5(T.map(t=>t.ok?1:0)),n=rl.length;
  const x=i=>P.l+i*(W-P.l-P.r)/Math.max(1,n-1),y=v=>P.t+(1-v)*(Hh-P.t-P.b);
  const li=T.findIndex(t=>t.live);
  const seed=rl.map((v,i)=>T[i].live?null:`${x(i)},${y(v)}`).filter(Boolean).join(' ');
  const live=li>0?rl.map((v,i)=>i>=li-1?`${x(i)},${y(v)}`:null).filter(Boolean).join(' '):'';
  return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="อัตราสำเร็จลู่เข้าแถบเป้าหมาย">
    <rect x="${P.l}" y="${y(.8)}" width="${W-P.l-P.r}" height="${y(.7)-y(.8)}" fill="rgba(23,107,119,.13)"/>
    <line x1="${P.l}" x2="${W-P.r}" y1="${y(.8)}" y2="${y(.8)}" stroke="#176B77" stroke-dasharray="4 4"/>
    <line x1="${P.l}" x2="${W-P.r}" y1="${y(.7)}" y2="${y(.7)}" stroke="#176B77" stroke-dasharray="4 4"/>
    ${[0,.25,.5,.75,1].map(v=>`<line x1="${P.l}" x2="${W-P.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--pro-grid)"/>
      <text x="${P.l-7}" y="${y(v)+4}" text-anchor="end" font-family="var(--fm)" font-size="10" fill="var(--pro-mute)">${v*100}</text>`).join('')}
    ${T.map((t,i)=>`<circle cx="${x(i)}" cy="${t.ok?Hh-P.b+9:Hh-P.b+16}" r="2.2" fill="${t.ok?'var(--pro-good)':'var(--pro-warn)'}" opacity="${t.live?1:.4}"/>`).join('')}
    <polyline points="${seed}" fill="none" stroke="var(--pro-ink)" stroke-width="2" stroke-linejoin="round"/>
    ${live?`<polyline points="${live}" fill="none" stroke="#F2913D" stroke-width="2.5" stroke-linejoin="round"/>`:''}
    <text x="${W-P.r}" y="${y(.75)+4}" text-anchor="end" font-family="var(--fm)" font-size="10" fill="#176B77">TARGET 70–80%</text></svg>`;
}
function chartDifficulty(){
  const T=H.trials,W=760,Hh=170,P={l:36,r:14,t:12,b:22},n=T.length;
  const x=i=>P.l+i*(W-P.l-P.r)/Math.max(1,n-1);
  const nrm=(v,k)=>{const d=DIMS[k];return d.harder>0?(v-d.min)/(d.max-d.min):1-(v-d.min)/(d.max-d.min)};
  const y=v=>P.t+(1-v)*(Hh-P.t-P.b);
  const line=(k,c,dash)=>`<path d="${T.map((t,i)=>(i?'L':'M')+` ${x(i)},${y(nrm(t.diff[k],k))}`).join(' ')}" fill="none" stroke="${c}" stroke-width="2" ${dash?'stroke-dasharray="5 4"':''}/>`;
  return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="เส้นทางการปรับความยาก">
    ${H.engine.log.filter(l=>l.action!=='hold').map(l=>`<line x1="${x(Math.min(n-1,l.i))}" x2="${x(Math.min(n-1,l.i))}" y1="${P.t}" y2="${Hh-P.b}" stroke="${l.action==='up'?'rgba(62,143,92,.32)':'rgba(196,85,58,.32)'}" stroke-width="1.5"/>`).join('')}
    <line x1="${P.l}" x2="${W-P.r}" y1="${Hh-P.b}" y2="${Hh-P.b}" stroke="var(--pro-line)"/>
    ${line('hold_time','#132430',false)}${line('tolerance_band','#C4553A',true)}${line('target_force','#176B77',true)}
    <text x="${P.l-7}" y="${y(1)+4}" text-anchor="end" font-family="var(--fm)" font-size="10" fill="var(--pro-mute)">ยาก</text>
    <text x="${P.l-7}" y="${y(0)+4}" text-anchor="end" font-family="var(--fm)" font-size="10" fill="var(--pro-mute)">ง่าย</text></svg>`;
}
function skillPairs(){
  const T=H.trials,l6=T.slice(-6),f6=T.slice(0,6);
  const pair=(fk,lk)=>({first:Math.round(mean(f6.map(fk))),last:Math.round(mean(l6.map(lk)))});
  return {
    GC:{first:Math.round(clamp(S.p.ability*100,0,100)),last:Math.round(clamp((S.p.ability+S.p.learn*T.length)*100,0,100))},
    FA:pair(t=>t.GAS,t=>t.GAS),
    FS:pair(t=>t.GSI,t=>t.GSI),
    EN:pair(t=>t.GES,t=>t.GES),
    TM:pair(t=>100-t.RT/25,t=>100-t.RT/25),
    CD:pair(t=>t.GDI,t=>t.GDI),
  };
}
function radar(){
  const sp=skillPairs();
  const ax=Object.entries(sp).map(([k,v])=>[k,v.first,v.last]);
  const cx=138,cy=132,R=90;
  const pt=(i,v)=>{const a=-Math.PI/2+i*Math.PI/3,r=R*clamp(v,0,100)/100;return[cx+r*Math.cos(a),cy+r*Math.sin(a)]};
  const poly=v=>v.map((x,i)=>pt(i,x).join(',')).join(' ');
  return `<svg viewBox="0 0 276 268" width="100%" role="img" aria-label="เรดาร์ 6 แกน">
    ${[25,50,75,100].map(r=>`<polygon points="${poly(Array(6).fill(r))}" fill="none" stroke="var(--pro-grid)"/>`).join('')}
    ${ax.map((_,i)=>{const[a,b]=pt(i,100);return `<line x1="${cx}" y1="${cy}" x2="${a}" y2="${b}" stroke="var(--pro-grid)"/>`}).join('')}
    <polygon points="${poly(ax.map(a=>a[1]))}" fill="rgba(19,36,48,.06)" stroke="var(--pro-mute)" stroke-dasharray="4 4"/>
    <polygon points="${poly(ax.map(a=>a[2]))}" fill="rgba(23,107,119,.2)" stroke="#176B77" stroke-width="2"/>
    ${ax.map((a,i)=>{const[x,y]=pt(i,124);return `<text x="${x}" y="${y+4}" text-anchor="middle" font-family="var(--fm)" font-size="10.5" fill="var(--pro-mute)">${a[0]}</text>`}).join('')}
    <g font-family="var(--fm)" font-size="9.5" fill="var(--pro-mute)">
      <rect x="12" y="243" width="16" height="3" fill="#176B77"/><text x="34" y="248">ล่าสุด</text>
      <rect x="120" y="243" width="16" height="3" fill="var(--pro-mute)"/><text x="142" y="248">ช่วงแรก</text></g></svg>`;
}
function spark(v,c){const W=120,Hh=28,mn=Math.min(...v),mx=Math.max(...v);
  return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" height="28"><polyline fill="none" stroke="${c}" stroke-width="1.6"
    points="${v.map((x,i)=>`${i*(W/Math.max(1,v.length-1))},${Hh-((x-mn)/Math.max(1,mx-mn))*Hh}`).join(' ')}"/></svg>`}
function heat(week){
  const rng=mulberry32(hash(S.p.code)+week);
  const base=week===1?[.95,.9,.75,.35,.2,.15,.12,.15,.25,.5,.75,.9]:[.72,.7,.66,.55,.48,.42,.4,.45,.5,.6,.68,.7];
  return `<svg viewBox="0 0 124 124" width="100%" style="max-width:118px" role="img" aria-label="แผนที่ความร้อนการสัมผัส">
  ${base.map((b,i)=>{const a=clamp(b+(rng()*.08-.04),0,1),a0=-Math.PI/2+i*Math.PI/6,a1=a0+Math.PI/6,R=52,r=22,cx=62,cy=62;
    const p=(rad,an)=>`${cx+rad*Math.cos(an)},${cy+rad*Math.sin(an)}`;
    return `<path d="M ${p(r,a0)} L ${p(R,a0)} A ${R} ${R} 0 0 1 ${p(R,a1)} L ${p(r,a1)} A ${r} ${r} 0 0 0 ${p(r,a0)} Z"
      fill="rgb(${Math.round(23+220*a)},${Math.round(107-40*a)},${Math.round(119-60*a)})" stroke="#fff" stroke-width="1.5"/>`}).join('')}</svg>`}

/* regression จริง เพื่อรายงาน slope + CI */
function slopeCI(v){
  const n=v.length;if(n<3)return null;
  const xs=v.map((_,i)=>i),mx=mean(xs),my=mean(v);
  const sxx=xs.reduce((s,x)=>s+(x-mx)**2,0);
  const b=xs.reduce((s,x,i)=>s+(x-mx)*(v[i]-my),0)/sxx;
  const a=my-b*mx;
  const se=Math.sqrt(v.reduce((s,y,i)=>s+(y-(a+b*xs[i]))**2,0)/(n-2)/sxx);
  const t=2.06, per=6;   // ~t(0.975) และ 6 trials ต่อสัปดาห์
  return {b:b*per,lo:(b-t*se)*per,hi:(b+t*se)*per};
}
const METHODS=[
 {k:'GSI',name:'Grip Stability Index — ความนิ่งของแรง',
  src:'แรงบีบรวมจาก FSR 12 จุด สุ่มตัวอย่าง 50 Hz เฉพาะช่วงที่แรงอยู่ในช่วงเป้าหมาย',
  f:`μ  = ค่าเฉลี่ยของแรงในช่วง in-band
σ  = ส่วนเบี่ยงเบนมาตรฐานของแรงช่วงเดียวกัน
CV = σ / μ

GSI = 100 × (1 − CV)      clamp 0–100`,
  why:'ใช้ CV แทน σ เปล่า ๆ เพราะเด็กที่บีบแรงกว่าย่อมมี σ สูงกว่าโดยธรรมชาติ การหารด้วยค่าเฉลี่ยทำให้เทียบข้ามระดับแรงและข้ามคนได้',
  range:'0–100 · ยิ่งสูงยิ่งนิ่ง',
  not:'ไม่ได้บอกว่าแรงถูกต้องหรือไม่ เด็กที่บีบนิ่งมากแต่ผิดเป้าจะได้ GSI สูงและ GAS ต่ำ ต้องอ่านคู่กันเสมอ'},
 {k:'GAS',name:'Grip Accuracy Score — ความแม่นของแรง',
  src:'แรงบีบตลอด trial เทียบกับ target_force ที่ engine กำหนดในขณะนั้น',
  f:`E = mean( |F(t) − F_target| )

GAS = 100 × (1 − E / F_target)   clamp 0–100`,
  why:'หารด้วย F_target เพื่อให้เป็นความคลาดเคลื่อนสัมพัทธ์ ผิดไป 5 หน่วยจากเป้า 20 หนักกว่าผิด 5 จากเป้า 60',
  range:'0–100 · ยิ่งสูงยิ่งเข้าเป้า',
  not:'ขึ้นกับ target_force ณ วันนั้น อ่านย้อนหลังต้องดู target ควบคู่ ไม่งั้นตีความผิดเมื่อ engine เปลี่ยนเป้า'},
 {k:'GES',name:'Grip Endurance Score — ความทนของการคงแรง',
  src:'สัดส่วนเวลาที่แรงอยู่ในแถบเป้าหมาย เทียบกับเวลาค้างที่ระบบเรียกร้องใน trial นั้น',
  f:`t_in  = เวลารวมที่ |F(t) − F_target| ≤ tolerance_band
t_req = hold_time ของ trial นั้น

GES = 100 × ( t_in / t_req )     clamp 0–100`,
  why:'ผูกกับ hold_time ที่ระบบตั้งไว้ ไม่ใช่เวลาสัมบูรณ์ เด็กที่ค้างได้ครบตามที่ขอควรได้คะแนนเท่ากันไม่ว่าเกณฑ์จะสั้นหรือยาว',
  range:'0–100 · 100 = คงแรงได้ครบตามที่ขอ',
  not:'ไม่ได้แยกว่าที่หลุดออกจากแถบเป็นเพราะแรงตกหรือแรงเกิน ต้องดูกราฟแรงดิบประกอบ'},
 {k:'RT',name:'Reaction Time — เวลาตอบสนอง',
  src:'เวลาจากสัญญาณเริ่มบนหน้าจอ จนแรงบีบข้ามเกณฑ์เริ่มต้น',
  f:`t_stim  = เวลาที่เกมแสดงสัญญาณ
t_onset = เวลาแรกที่ F(t) > 10% F_work

RT = t_onset − t_stim            (ms)`,
  why:'เกณฑ์ 10% F_work เลือกให้สูงกว่า F_rest และสัญญาณรบกวน แต่ต่ำพอจะจับ "จุดที่เด็กตั้งใจเริ่มบีบ" ไม่ใช่จุดที่บีบสำเร็จ',
  range:'มิลลิวินาที · ตัวเดียวในชุดนี้ที่ค่าต่ำ = ดี',
  not:'เกณฑ์ 10% เป็นค่าที่ทีมเลือกเอง ยังไม่ได้หาจากข้อมูลจริง ควรหา cut-off ที่แยกการตั้งใจบีบออกจากสัญญาณรบกวนได้ดีที่สุดแล้วรายงานวิธีเลือก · RT ที่ยาวขึ้นอาจมาจากความล้า ความไม่เข้าใจโจทย์ หรือ spasticity'},
 {k:'GDI',name:'Grip Distribution Index — การกระจายแรง',
  src:'แรงจาก FSR ทั้ง 12 จุดที่จุดสูงสุดของการบีบในแต่ละ trial',
  f:`pᵢ    = Fᵢ / Σ F
H     = − Σ pᵢ · log pᵢ        (Shannon entropy)
H_max = log(12)

GDI = 100 × H / H_max`,
  why:'ใช้ entropy เพราะต้องการวัด "ความกระจาย" โดยไม่สนใจว่ากระจายไปทางไหน ซึ่งเหมาะกับระบบที่ไม่บังคับวิธีจับ',
  range:'0–100 · 100 = แรงเท่ากันทุกจุด · 0 = ลงจุดเดียว',
  not:'GDI สูงไม่ได้ดีกว่าเสมอไป การหยิบแบบปลายนิ้วต้องการค่าต่ำโดยธรรมชาติ อ่านเป็นแนวโน้มของเด็กคนเดียวกัน ห้ามเทียบข้ามคน และห้ามระบุว่าเซนเซอร์ตัวใดคือนิ้วใด'},
 {k:'SLOPE',name:'อัตราการเปลี่ยนแปลงรายสัปดาห์',
  src:'ค่าตัวชี้วัดรายครั้ง อย่างน้อย 3 จุดขึ้นไป (ในหน้านี้คำนวณสดจากข้อมูลในแฟ้ม)',
  f:`b  = Σ(xᵢ−x̄)(yᵢ−ȳ) / Σ(xᵢ−x̄)²
SE = √( Σ(yᵢ−ŷᵢ)² / (n−2) ) / √( Σ(xᵢ−x̄)² )

95% CI = b ± t(0.975, n−2) × SE
แล้วคูณด้วยจำนวน trial ต่อสัปดาห์`,
  why:'รายงาน slope พร้อมช่วงความเชื่อมั่น แทน "ดีขึ้น 18%" เพราะการเทียบสองจุดไวต่อวันที่เด็กเหนื่อยหรือมีสมาธิดีเป็นพิเศษ',
  range:'จุดต่อสัปดาห์ · ถ้าช่วงความเชื่อมั่นคร่อมศูนย์ แปลว่ายังสรุปไม่ได้',
  not:'ไม่ใช่หลักฐานว่าเกิดการฟื้นฟู อาจเป็นการเรียนรู้เกม ต้องยืนยันด้วยงานที่เด็กไม่เคยเล่นหรือแบบประเมินมาตรฐาน'},
 {k:'RATE',name:'Success rate ที่ adaptive engine ใช้ตัดสิน',
  src:'ผลสำเร็จ/ล้มเหลวของ 5 trials ล่าสุด (rolling window)',
  f:`rate = Σ ผลสำเร็จ 5 ครั้งล่าสุด / 5

rate ≥ 0.80 ติดกัน 2 window → เพิ่มความยาก 1 ขั้น
0.55 ≤ rate < 0.80          → คงเดิม
0.30 ≤ rate < 0.55          → ลดความยาก 1 ขั้น ทันที
rate < 0.30 ติดกัน 2 window → ลด 2 ขั้น + เปลี่ยนเกม`,
  why:'ตั้งเป้า 70–80% ตามแนวคิด Challenge Point Framework (Guadagnoli & Lee, 2004) · ขึ้นต้องยืนยัน 2 window แต่ลงทำทันที เพราะต้นทุนของการทำให้เด็กท้อสูงกว่า',
  range:'0–1',
  not:'window 5 ครั้งเลือกให้ตอบสนองเร็วพอในเซสชันสั้น ยังไม่ได้ทดสอบว่าเป็นค่าที่เหมาะที่สุด'},
];

SC.dash=()=>{
  const p=S.p,T=H.trials,l8=T.slice(-8);
  const mk=(k,label,inv)=>{const v=T.map(t=>t[k]),s=slopeCI(v);
    const cross=s&&s.lo<0&&s.hi>0;
    const good=s&&(inv?s.b<0:s.b>0);
    return{k,label,val:Math.round(mean(l8.map(t=>t[k]))),unit:k==='RT'?' ms':'/100',
      spark:inv?v.map(x=>2500-x):v,good,
      txt:s?`${s.b>0?'+':''}${r1(s.b)}${k==='RT'?' ms':' จุด'}/สัปดาห์<br>95% CI ${r1(s.lo)} – ${r1(s.hi)}`:'ข้อมูลไม่พอ',cross}};
  const M=[mk('GSI','ความนิ่งของแรง'),mk('GAS','ความแม่นของแรง'),mk('GES','ความทนของการกำ'),
           mk('RT','เวลาตอบสนอง',true),mk('GDI','การกระจายแรง')];
  const rows=H.engine.log.slice(-9).reverse().map(l=>{
    const cls=l.action==='up'?'up':(l.action==='hold'?'hold':'down'),live=l.i>p.nTrials;
    const nm={up:'เพิ่มความยาก',down:'ลดความยาก',down2:'ลด 2 ขั้น + เปลี่ยนเกม',hold:'คงเดิม'}[l.action]||l.action;
    return `<tr><td>${l.i}</td><td>${Math.round(l.rate*100)}%</td>
      <td><span class="act ${live?'live':cls}">${nm}</span></td><td>${DIMS[l.dim].label}</td>
      <td>${l.from} → ${l.to} ${DIMS[l.dim].unit}</td></tr>`}).join('');
  const weak=M.filter(m=>m.k!=='RT').sort((a,b)=>a.val-b.val)[0];
  const sp=skillPairs();
  const recTop=recommendMode(p);

  return `<div class="screen">
  <div class="prohead"><div>
    <span class="eyebrow">แฟ้มผู้รับบริการ</span>
    <h1>${p.avatar} ${p.name||p.nick} · อายุ ${p.age} ปี · ${p.dx}</h1>
    <div class="meta">${p.code} · MACS ${p.macs} · GMFCS ${p.gmfcs} · มือที่ฝึก: ${p.hand} · ${T.length} trials สะสม<br>
    คาลิเบรต — F_rest ${r1(p.cal.rest)} N · F_comf ${r1(p.cal.comf)} N · PRF ${r1(p.cal.prf)} N · F_work ${r1(p.cal.prf-p.cal.rest)} N</div></div>
    <div class="proact"><button class="btn">ส่งออก CSV</button>
      <button class="btn" data-editprofile="1">แก้ไขแฟ้ม</button>
      <button class="btn solid">ล็อกพารามิเตอร์เอง</button></div></div>

  <nav class="subnav"><a href="#s-ov">ภาพรวม</a><a href="#s-ai">AI แนะนำโหมด</a><a href="#s-en">Adaptive engine</a>
    <a href="#s-pt">รูปแบบการจับ</a><a href="#s-me">วิธีคำนวณค่า</a><a href="#s-rc">คำแนะนำ</a></nav>

  <div id="s-ov" class="pgrid">
    <div class="procard"><h3>โปรไฟล์ความสามารถ 6 แกน</h3>
      <p class="note">GC ความสามารถกำมือ · FA ความแม่น · FS ความนิ่ง · EN ความทน · TM เวลาตอบสนอง · CD การกระจายแรง — อิงกับ calibration ของเด็กคนนี้ ไม่ใช่ค่ามาตรฐานประชากร</p>
      ${radar()}
      <div class="starlegend">${SKILLS.map(sk=>{const lvl=skillLevel(sp[sk.key].last),now=sp[sk.key].last;
        return `<div class="slcell"><span>${sk.icon} ${sk.key}</span>
          <span class="stars sm">${Array.from({length:5},(_,i)=>`<span class="${i<lvl?'on':''}">★</span>`).join('')}</span>
          <span class="num">${now}/100</span></div>`}).join('')}</div>
      <p class="note" style="margin-top:8px">แถวดาวคือสิ่งที่เด็กเห็นในต้นไม้ทักษะ ตัวเลขข้างหลังคือค่าเดียวกันที่แดชบอร์ดนี้ใช้ — สองมุมมองอ่านจากข้อมูลชุดเดียวกัน</p></div>
    <div>
      <div class="mcards">${M.map(m=>`<div class="mc"><div class="k">${m.k}</div>
        <div class="v">${m.val}<span style="font-size:13px;color:var(--pro-mute)">${m.unit}</span></div>
        <div class="n">${m.label}</div>${spark(m.spark.slice(-14),m.k==='RT'?'#3E8F5C':'#176B77')}
        <div class="slope ${m.cross?'flat':''}">${m.txt}</div></div>`).join('')}</div>
      <div class="procard" style="margin-top:var(--s2)">
        <span class="eyebrow">หลักฐานว่า adaptive engine ทำงาน</span>
        <h3>อัตราสำเร็จลู่เข้าแถบเป้าหมาย 70–80%</h3>
        <p class="note">เส้นดำ = ประวัติในแฟ้ม · เส้นส้ม = trials ที่เพิ่งเล่นในมุมมองเด็ก · จุดล่างคือผลรายครั้ง — ระบบไม่ได้เลือกระดับความยาก แต่เลือกอัตราสำเร็จเป้าหมาย แล้วปล่อยให้ความยากเลื่อนตามเอง</p>
        ${chartConvergence()}</div>
    </div></div>

  <div class="procard" id="s-ai" style="margin-top:var(--s3)">
    <span class="eyebrow">AI Recommendation Engine · ระบบเสนอ ไม่ได้ตัดสินใจแทน</span>
    <h3>วันนี้ระบบแนะนำ ${MODE_META[recTop.mode].label} สำหรับ${p.nick}</h3>
    <p class="note">คำนวณจากความสามารถกำมือ (${Math.round(p.ability*100)}/100) เทียบกับความสนใจต่อหน้าจอ (${Math.round(p.screenEngagement*100)}%)
      และช่วงสมาธิ (${Math.round(p.attentionSpan*100)}%) — สองค่าหลังตั้งไว้ตอนลงทะเบียน ปรับได้ที่ปุ่ม "แก้ไขแฟ้ม"</p>
    <div class="recrows">${Object.entries(recTop.scores).map(([k,v])=>{
      const lbl=k==='toy'?'Toy Only':k==='game'?'Game Only':'Toy + Game';
      const avail=p.hasToy||k==='game', top=k===recTop.top;
      return `<div class="recrow ${top?'top':''} ${avail?'':'off'}">
        <span class="rl">${lbl}</span><div class="rbar"><i style="width:${Math.round(v*100)}%"></i></div>
        <span class="rv">${Math.round(v*100)}%</span>${!avail?'<span class="rna">ไม่มีลูกบอลวันนี้</span>':''}</div>`}).join('')}</div>
    <ul class="reclist">${recTop.reasons.map(r=>`<li>${r}</li>`).join('')}</ul>
    <span class="eyebrow" style="margin:var(--s3) 0 7px;display:block">ถ้าประเมินใหม่ทุกสัปดาห์ (จำลองจากอัตราการเรียนรู้ในแฟ้ม)</span>
    <div class="trailrow">${weeklyRecommendationTrail(p).map((w,i,arr)=>
      `<span class="trailstep ${i===arr.length-1?'now':''}" title="สัปดาห์ ${w.week} · ${MODE_META[w.mode].label}">${MODE_META[w.mode].em}</span>${i<arr.length-1?'<span class="arrow">→</span>':''}`).join('')}</div>
  </div>

  <div class="stack">
    <div class="procard" id="s-en"><span class="eyebrow">เส้นทางการปรับความยาก</span>
      <h3>ปรับได้ครั้งละ 1 มิติเท่านั้น</h3>
      <p class="note"><b style="color:#132430">━ เวลาค้างแรง</b> · <b style="color:#C4553A">┈ ความกว้างช่วงเป้า</b> · <b style="color:#176B77">┈ แรงเป้าหมาย</b> — แถบแนวตั้งคือจุดที่ engine ตัดสินใจ การล็อกให้ปรับทีละมิติทำให้ตีความได้ว่าเด็กเปลี่ยนแปลงเพราะอะไร</p>
      ${chartDifficulty()}
      <div class="tablescroll"><table class="log"><thead><tr><th>TRIAL</th><th>SUCCESS (5)</th><th>ACTION</th><th>DIMENSION</th><th>FROM → TO</th></tr></thead><tbody>${rows}</tbody></table></div></div>

    <div class="row2">
      <div class="procard" id="s-pt"><span class="eyebrow">รูปแบบการสัมผัส</span>
        <h3>การกระจายแรงรอบลูกบอล</h3>
        <p class="note">เซนเซอร์ 12 จุดรอบลูกบอล ระบบไม่ระบุว่าจุดใดคือนิ้วใด เพราะไม่ได้บังคับวิธีจับ</p>
        <div style="display:flex;gap:20px;align-items:center;margin-top:var(--s3);flex-wrap:wrap">
          <div style="text-align:center">${heat(1)}<div style="font-family:var(--fm);font-size:10px;color:var(--pro-mute);margin-top:7px">ช่วงแรก</div></div>
          <div style="text-align:center">${heat(5)}<div style="font-family:var(--fm);font-size:10px;color:var(--pro-mute);margin-top:7px">ล่าสุด</div></div>
          <p class="note" style="flex:1;min-width:160px">แรงเคยกระจุกที่ฐานนิ้วโป้งกับฝ่ามือ ตอนนี้กระจายมากขึ้น อ่านเป็นแนวโน้มของเด็กคนเดียวกันเท่านั้น</p></div></div>

      <div class="procard" id="s-rc"><span class="eyebrow">ข้อเสนอจากระบบ · ต้องให้นักบำบัดอนุมัติ</span>
        <h3>คำแนะนำสัปดาห์หน้า</h3>
        <div style="margin-top:var(--s2)">
          <div class="rec"><span class="n">01</span><div><b>เพิ่มเกมที่ฝึก ${weak.label} เป็น 3 ครั้ง/สัปดาห์</b>
            <p>${weak.k} เป็นค่าที่ต่ำที่สุดในชุดตัวชี้วัดตอนนี้ (${weak.val}/100) ${weak.cross?'และช่วงความเชื่อมั่นของอัตราการเปลี่ยนแปลงยังคร่อมศูนย์ จึงยังสรุปไม่ได้ว่าดีขึ้นจริง':''}</p></div></div>
          <div class="rec"><span class="n">02</span><div><b>คงแรงเป้าหมายไว้ที่ ${H.engine.diff.target_force}% อีก 1 สัปดาห์</b>
            <p>engine กำลังไล่ปรับ ${DIMS[PRIORITY[Math.min(H.engine.pi,2)]].label} อยู่ การเปลี่ยนหลายมิติพร้อมกันจะทำให้แยกไม่ออกว่าผลมาจากอะไร</p></div></div>
          <div class="rec"><span class="n">03</span><div><b>ตรวจสอบสัญญาณล้า</b>
            <p class="flag" style="margin-top:4px">⚑ ระบบตัดจบเซสชันเอง 1 ครั้ง — แรงสูงสุดใน block สุดท้ายตกจาก block แรกเกินร้อยละ 20</p></div></div>
        </div></div>
    </div>

    <div id="s-me">
      <div class="procard" style="margin-bottom:var(--s2)">
        <span class="eyebrow">ที่มาของข้อมูล</span><h3>จากเซนเซอร์ถึงตัวเลขบนหน้าจอนี้</h3>
        <p class="note">ทุกค่าในแฟ้มนี้คำนวณจากสัญญาณดิบ ไม่มีค่าใดที่กรอกด้วยมือ ขั้นตอนก่อนคำนวณมีดังนี้</p>
        <div class="pipe">
          <div class="st"><i>01 · SENSING</i><b>สัญญาณดิบ</b><span>FSR 12 จุด @50 Hz · IMU 6 แกน @50 Hz · กล้อง 30 fps เฉพาะโหมดที่ใช้</span></div>
          <div class="st"><i>02 · CONDITIONING</i><b>กรองสัญญาณ</b><span>Low-pass 12 Hz ตัดการสั่นของเซนเซอร์ โดยยังเก็บย่านความถี่ของ tremor ไว้วิเคราะห์ได้</span></div>
          <div class="st"><i>03 · BASELINE</i><b>หัก F_rest</b><span>ลบแรงขณะถือแต่ไม่บีบออก เพื่อไม่ให้ tone ที่ค้างอยู่ถูกนับเป็นการบีบตั้งใจ</span></div>
          <div class="st"><i>04 · NORMALISE</i><b>แปลงเป็น %F_work</b><span>F_work = PRF − F_rest = ${r1(p.cal.prf-p.cal.rest)} N สำหรับเด็กคนนี้</span></div>
          <div class="st"><i>05 · SEGMENT</i><b>ตัดเป็น trial</b><span>แบ่งตามสัญญาณเริ่ม–จบของเกม แล้วจึงคำนวณตัวชี้วัดรายครั้ง</span></div>
        </div>
        <div class="warnbox"><b>ข้อจำกัดที่ต้องอ่านคู่กับทุกค่าเสมอ</b><br>
          ค่าทั้งหมดวัด "สิ่งที่เด็กทำในเกม" ไม่ใช่ "ความสามารถของมือในชีวิตประจำวัน" การเชื่อมสองอย่างนี้ต้องอาศัยแบบประเมินมาตรฐาน เช่น Box and Block Test หรือ ABILHAND-Kids ควบคู่กัน และค่าแรงที่วัดได้อาจไม่ตรงกับความตั้งใจของเด็กเมื่อมี spasticity ให้ดู F_rest ประกอบทุกครั้ง</div>
      </div>
      ${METHODS.map(m=>`<details class="meth"><summary><span class="tagk">${m.k}</span> ${m.name}</summary>
        <div class="body"><div class="formula">${m.f}</div>
        <table class="deft">
          <tr><th>สัญญาณต้นทาง</th><td>${m.src}</td></tr>
          <tr><th>ทำไมใช้สูตรนี้</th><td>${m.why}</td></tr>
          <tr><th>ช่วงค่าและการอ่าน</th><td>${m.range}</td></tr>
          <tr><th>สิ่งที่ค่านี้ไม่ได้บอก</th><td>${m.not}</td></tr>
        </table></div></details>`).join('')}
    </div>
  </div></div>`;
};
