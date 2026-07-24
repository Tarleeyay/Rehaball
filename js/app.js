/* ==========================================================================
   RehaVerse — สถานะ · แถบบน · router และการผูกเหตุการณ์
   โหลดเป็นไฟล์สุดท้าย เพราะบรรทัดสุดท้ายคือการเริ่มทำงาน
   ========================================================================== */
/* ==========================================================================
   สถานะ
   ========================================================================== */
const S={screen:'login',p:null,sel:1,live:0,draft:null,editingNew:false};
let H={trials:[],engine:newEngine({target_force:30,tolerance_band:14,hold_time:1})};
function loadProfile(p){S.p=p;S.sel=p.level;S.live=0;G.results=[];const r=simulate(p);H={trials:r.trials,engine:r.engine};H.rng=r.rng}

/* ==========================================================================
   Topbar
   ========================================================================== */
function topbar(){
  const pro=['dash','editor'].includes(S.screen);
  document.body.dataset.face=pro?'pro':'child';
  if(pro){
    $('topbar').innerHTML=`<div class="mark"><b>RehaVerse</b><span>adaptive rehab platform</span></div>
      <span class="pill mono">${S.p?S.p.code:'—'}</span>
      <span class="pill">โหมดผู้ดูแล <button data-go="login">ออก</button></span>`;
    $('foot').innerHTML='ต้นแบบส่วนติดต่อผู้ใช้ · ประวัติการเล่นในแฟ้มสร้างจาก simulated learner ที่รันผ่าน adaptive engine ตัวเดียวกับที่ใช้ตอนเล่นจริง ไม่ใช่ข้อมูลผู้ป่วยจริง · ค่า GDI ในต้นแบบเป็นค่าจำลอง';
  }else{
    /* ฝั่งเด็กไม่มีแถบบนและไม่มีข้อความท้ายหน้า
       เหลือเฉพาะงานตรงหน้ากับแถบช่วยเหลือ — progressive exposure */
    $('topbar').innerHTML='';
    $('foot').innerHTML='';
  }
  drawAssist();
}

/* ==========================================================================
   Router
   ========================================================================== */
function render(){
  cancelAnimationFrame(G.raf);
  closeHelp();
  applyMotion();
  $('root').innerHTML=SC[S.screen]();
  topbar();
  if(S.screen==='game')mountGame();
  window.scrollTo({top:0,behavior:'instant'});
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeHelp()});
function openEditor(p,isNew){S.draft=p;S.editingNew=isNew;S.screen='editor';render()}

document.addEventListener('click',e=>{
  if(e.target.closest('button'))sfxTap();
  /* ปุ่มช่วยเหลือถาวรมาก่อนเสมอ เพื่อให้กดได้จากทุกหน้าจอ */
  const snd=e.target.closest('[data-sound]');
  if(snd){setSound(snd.dataset.sound==='on');openHelp();return}
  const mot=e.target.closest('[data-motion]');
  if(mot){setMotion(mot.dataset.motion==='on');openHelp();return}
  if(e.target.closest('[data-help]')){openHelp();return}
  if(e.target.closest('#helpclose')||e.target.id==='helpwrap'){closeHelp();return}
  if(e.target.closest('[data-home]')){closeHelp();S.screen=S.p?'home':'login';render();return}
  const go=e.target.closest('[data-go]');
  if(go){const t=go.dataset.go;
    if(t==='login'){S.screen='login';S.p=null}else S.screen=t;
    render();return;}
  if(e.target.closest('[data-newprofile]')){openEditor(blankProfile(),true);return}
  if(e.target.closest('[data-editprofile]')){openEditor(S.p,false);return}
  const kid=e.target.closest('[data-kid]');
  if(kid){loadProfile(PROFILES.find(x=>x.code===kid.dataset.kid));S.screen='toy';render();return}
  const fill=e.target.closest('[data-fill]');
  if(fill){$('codein').value=fill.dataset.fill;return}
  if(e.target.closest('#codego')){
    const c=($('codein').value||'').trim().toUpperCase();
    const p=PROFILES.find(x=>x.code.toUpperCase()===c);
    if(!p){$('codeerr').classList.add('on');return}
    loadProfile(p);S.screen='dash';render();return;}
  const toy=e.target.closest('[data-toy]');
  if(toy){S.p.hasToy=toy.dataset.toy==='1';if(!S.p.hasToy)S.p.mode='game';S.screen='mode';render();return}
  const md=e.target.closest('[data-mode]');
  if(md){S.p.mode=md.dataset.mode;S.screen='home';render();return}
  const av=e.target.closest('[data-av]');
  if(av){S.draft.avatar=av.dataset.av;render();return}
  if(e.target.closest('#edSave')){
    const d=S.draft;
    if(!d.nick)d.nick=d.name||'เด็กใหม่';
    if(S.editingNew)PROFILES.push(d);
    saveStore();
    loadProfile(d);S.screen='dash';render();return;}
  if(e.target.closest('#edDel')){
    const i=PROFILES.indexOf(S.draft);if(i>=0)PROFILES.splice(i,1);
    saveStore();
    S.p=null;S.screen='login';render();return;}
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.path){
    const v=+t.value;setPath(S.draft,t.dataset.path,v);
    const lb=$('lbl-'+t.dataset.path);
    if(lb){const fmts={'cal.rest':v=>r1(v)+' N','cal.comf':v=>r1(v)+' N','cal.prf':v=>r1(v)+' N',
      'ability':v=>Math.round(v*100)+'/100','learn':v=>(v*100).toFixed(1)+'%','nTrials':v=>v+' trials',
      'screenEngagement':v=>Math.round(v*100)+'%','attentionSpan':v=>Math.round(v*100)+'%',
      'start.target_force':v=>v+' %F_work','start.tolerance_band':v=>'± '+v+'%','start.hold_time':v=>r1(v)+' วินาที',
      'level':v=>'ด่าน '+v+' · '+LEVELS[v-1].th};
      lb.textContent=(fmts[t.dataset.path]||(x=>x))(v);}
    $('edPrev').innerHTML=edPreview(S.draft);return;
  }
  if(t.dataset.f){
    const k=t.dataset.f;
    S.draft[k]=(k==='age'||k==='macs'||k==='gmfcs')?+t.value:(k==='hasToy'?t.value==='1':t.value);
  }
});
render();

/* --------------------------------------------------------------------------
   ที่เก็บถาวร
   แฟ้มเด็กทั้งหมดถูกบันทึกลง localStorage ของเบราว์เซอร์ (คีย์ 'rehaverse.profiles.v1')
   ทุกครั้งที่: สร้างแฟ้มใหม่, แก้ไขแฟ้ม, หรือลบแฟ้ม ผ่านฟังก์ชัน saveStore()
   ข้อมูลนี้อยู่เฉพาะเบราว์เซอร์/เครื่องนี้เท่านั้น ไม่ได้ซิงก์ไปที่ไหน
   ถ้าต้องการล้างข้อมูลตัวอย่างทั้งหมดกลับไปเริ่มใหม่ ให้เปิด console แล้วรัน:
     localStorage.removeItem('rehaverse.profiles.v1'); localStorage.removeItem('rehaverse.codeSeq.v1');
   แล้วรีเฟรชหน้า
   -------------------------------------------------------------------------- */