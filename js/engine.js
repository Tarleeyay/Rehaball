/* ==========================================================================
   RehaVerse — Adaptive engine · simulated learner · AI แนะนำโหมด
   ========================================================================== */
/* ==========================================================================
   Adaptive engine
   ========================================================================== */
const PRIORITY=['hold_time','tolerance_band','target_force'];
const stepDim=(d,k,n)=>{const m=DIMS[k];d[k]=r1(clamp(d[k]+m.harder*m.step*n,m.min,m.max));return d};
const maxedOut=(d,k)=>DIMS[k].harder>0?d[k]>=DIMS[k].max:d[k]<=DIMS[k].min;
function newEngine(start){return{diff:{...start},pi:0,up:0,panic:0,results:[],log:[]}}
function updateEngine(e){
  const w=e.results.slice(-5);
  if(w.length<5)return{action:'wait',rate:mean(w)};
  const rate=mean(w),dim=PRIORITY[Math.min(e.pi,PRIORITY.length-1)],from=e.diff[dim];
  let action='hold';
  if(rate>=.80){e.panic=0;e.up++;if(e.up>=2){stepDim(e.diff,dim,1);e.up=0;action='up';
    if(maxedOut(e.diff,dim)&&e.pi<PRIORITY.length-1)e.pi++;}}
  else if(rate<.30){e.up=0;e.panic++;if(e.panic>=2){stepDim(e.diff,dim,-2);e.panic=0;action='down2';}}
  else if(rate<.55){e.up=0;e.panic=0;stepDim(e.diff,dim,-1);action='down';}
  else{e.up=0;e.panic=0;}
  const rec={i:e.results.length,rate,action,dim,from,to:e.diff[dim]};
  e.log.push(rec);return rec;
}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const loadOf=d=>.30*((d.target_force-20)/50)+.40*((d.hold_time-.5)/3.5)+.30*(1-(d.tolerance_band-4)/16);

/* ---------- simulated learner : สร้างประวัติของเคสจากพารามิเตอร์ในแฟ้ม ---------- */
function simulate(p){
  const rng=mulberry32(hash(p.code)), gs=()=>(rng()+rng()+rng()-1.5)*1.15;
  const e=newEngine(p.start), tr=[]; let ab=p.ability;
  for(let i=0;i<p.nTrials;i++){
    ab=clamp(ab+p.learn+rng()*p.learn*.55,0,1);
    const ok=rng()<1/(1+Math.exp(-9*((ab+.07)-loadOf(e.diff))));
    tr.push({i:i+1,live:false,ok,diff:{...e.diff},
      GSI:Math.round(clamp(34+ab*56+gs()*5,0,100)),
      GAS:Math.round(clamp(30+ab*60+gs()*5,0,100)),
      GES:Math.round(clamp((ok?80:38)+ab*20+gs()*4,0,100)),
      RT :Math.round(clamp(1520-ab*720+gs()*70,300,2500)),
      GDI:Math.round(clamp(38+ab*40+gs()*4,0,100))});
    e.results.push(ok?1:0);updateEngine(e);
  }
  return {trials:tr,engine:e,rng};
}

/* ==========================================================================
   AI Recommendation Engine
   เลือกโหมด Toy Only / Game Only / Toy+Game ให้เหมาะกับเด็กแต่ละคน
   แทนที่จะให้เลือกเองล้วน ๆ ระบบคำนวณคะแนนจากความสามารถมือ + พฤติกรรมต่อหน้าจอ
   ========================================================================== */
const REC_W1=0.6, REC_W2=0.4;   // น้ำหนัก: ความสามารถ/ความสนใจจอ vs สมาธิ
function recommendScores(ability,screenEngagement,attentionSpan){
  return {
    toy   : REC_W1*(1-screenEngagement) + REC_W2*(1-attentionSpan),
    game  : REC_W1*(1-ability)          + REC_W2*screenEngagement,
    hybrid: REC_W1*ability              + REC_W2*attentionSpan,
  };
}
const REC_KEYMAP={toy:'toy',game:'game',hybrid:'both'};
function recommendMode(p){
  const scores=recommendScores(p.ability,p.screenEngagement,p.attentionSpan);
  let order=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  if(!p.hasToy) order=order.filter(([k])=>k==='game');   // ไม่มีลูกบอล เหลือกล้องอย่างเดียว
  const top=order[0][0];
  const reasons=[];
  if(top==='toy')    reasons.push(
    `ความสนใจต่อหน้าจอยังไม่มาก (${Math.round(p.screenEngagement*100)}%)`,
    `ช่วงสมาธิสั้น (${Math.round(p.attentionSpan*100)}%) — ของเล่นจริงในมือดึงความสนใจได้ตรงกว่า`);
  if(top==='game')   reasons.push(
    `ความสามารถกำมือยังต่ำ (${Math.round(p.ability*100)}/100)`,
    `ตอบสนองต่อภาพและเสียงบนจอดี (${Math.round(p.screenEngagement*100)}%)`);
  if(top==='hybrid') reasons.push(
    `คุมมือได้ในระดับหนึ่งแล้ว (${Math.round(p.ability*100)}/100)`,
    `มีสมาธิพอจะเชื่อมของจริงกับสิ่งที่เกิดบนจอ (${Math.round(p.attentionSpan*100)}%)`);
  if(!p.hasToy) reasons.push('วันนี้ไม่มีลูกบอล ระบบจึงจำกัดตัวเลือกไว้ที่กล้องอย่างเดียว');
  return {scores,top,mode:REC_KEYMAP[top],reasons};
}
/* จำลองว่า "ทุกสัปดาห์ระบบประเมินใหม่" จะแนะนำอย่างไรเมื่อความสามารถค่อย ๆ ขึ้น */
function weeklyRecommendationTrail(p){
  const nWeeks=Math.max(3,Math.ceil(p.nTrials/6));
  const out=[];
  for(let w=0;w<nWeeks;w++){
    const mid=w*6+3;
    const ab=clamp(p.ability+p.learn*mid,0,1);
    out.push({week:w+1,...recommendMode({...p,ability:ab})});
  }
  return out;
}
