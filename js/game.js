/* ==========================================================================
   RehaVerse — ระบบอนุภาคบน canvas และหน้าจอเกม
   ========================================================================== */
/* ==========================================================================
   VFX : ระบบอนุภาคบน canvas
   ========================================================================== */
const FX={
  cv:null,ctx:null,W:640,Hh:400,scale:1,ox:0,oy:0,parts:[],amb:[],shake:0,glow:0,
  /* ไม่มีอนุภาคพื้นหลังลอยตลอดเวลา — ฉากต้องนิ่งเพื่อไม่ให้แย่งความสนใจจากเกจ */
  attach(cv){this.cv=cv;this.ctx=cv.getContext('2d');this.parts=[];this.shake=0;this.glow=0;
    this.amb=[];this.resize();},
  resize(){if(!this.cv)return;const r=this.cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
    this.cv.width=r.width*dpr;this.cv.height=r.height*dpr;
    this.scale=Math.min(r.width/640,r.height/400)*dpr;
    this.ox=(r.width*dpr-640*this.scale)/2;this.oy=(r.height*dpr-400*this.scale)/2;},
  burst(x,y,n,colors,spd=170){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=spd*(.25+Math.random());
    this.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-40,life:1,decay:.55+Math.random()*.7,
      r:2+Math.random()*5,c:colors[(Math.random()*colors.length)|0],t:Math.random()<.42?'star':'dot',rot:Math.random()*6})}},
  ring(x,y,c){this.parts.push({x,y,life:1,decay:1.5,r:20,c,t:'ring'})},
  spark(x,y,c){const a=Math.random()*Math.PI*2;
    this.parts.push({x,y,vx:Math.cos(a)*26,vy:Math.sin(a)*26-24,life:1,decay:1.5,r:1.6+Math.random()*2.4,c,t:'dot',rot:0})},
  fly(x,y,tx,ty,c){this.parts.push({x,y,tx,ty,life:1,decay:.85,r:6,c,t:'fly',rot:0})},
  step(dt){
    for(const p of this.parts){
      p.life-=p.decay*dt;
      if(p.t==='fly'){p.x+=(p.tx-p.x)*Math.min(1,dt*4.5);p.y+=(p.ty-p.y)*Math.min(1,dt*4.5)}
      else if(p.t!=='ring'){p.vy+=250*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.rot+=dt*7}
      else p.r+=190*dt;
    }
    this.parts=this.parts.filter(p=>p.life>0);
    for(const b of this.amb){b.y-=b.v*dt;if(b.y<-8){b.y=408;b.x=Math.random()*640}}
    this.shake=Math.max(0,this.shake-dt*22);this.glow=Math.max(0,this.glow-dt*2.2);
  },
  draw(){
    const c=this.ctx;if(!c)return;
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.cv.width,this.cv.height);
    const sx=(Math.random()-.5)*this.shake,sy=(Math.random()-.5)*this.shake;
    c.setTransform(this.scale,0,0,this.scale,this.ox+sx*this.scale,this.oy+sy*this.scale);
    for(const b of this.amb){c.globalAlpha=b.a;c.fillStyle='#CFF3F7';c.beginPath();c.arc(b.x,b.y,b.r,0,7);c.fill()}
    for(const p of this.parts){
      c.globalAlpha=clamp(p.life,0,1);c.fillStyle=p.c;c.strokeStyle=p.c;
      if(p.t==='ring'){c.globalAlpha=clamp(p.life,0,1)*.6;c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.stroke()}
      else if(p.t==='star'){c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.beginPath();
        for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?p.r*.42:p.r*1.5;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}
        c.closePath();c.fill();c.restore()}
      else{c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill()}
    }
    c.globalAlpha=1;c.globalCompositeOperation='source-over';
  }
};
window.addEventListener('resize',()=>FX.resize());

/* ==========================================================================
   เกม — ไม่มีตัวเลขบนหน้าจอเด็ก
   ========================================================================== */
const G={force:0,target:0,raf:null,holdT:0,tStart:0,active:false,
         samples:[],results:[],popping:false,rt:0,bound:false,sparkT:0,rescued:0};
/* แตะหนึ่งครั้ง = เลื่อนแรงหนึ่งขั้น ไม่มีการกดค้าง ไม่มีการลาก */
const G_STEP=12;
const gBump=n=>{G.target=clamp(G.target+n*G_STEP,0,100)};

SC.game=()=>`
<div class="screen">
  <button class="backbtn" data-go="reward" aria-label="เสร็จแล้ว ออกจากเกม">
    <span class="ic" aria-hidden="true">✓</span>เสร็จแล้ว</button>
  <div class="gamewrap" id="stage">
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid meet" role="img"
         aria-label="เกมบีบลูกบอล พาหน้ายิ้มขึ้นไปอยู่ในแถบสีเหลือง">
      <!-- ดาวที่เก็บได้ -->
      <g id="saved" transform="translate(30,40)"></g>

      <!-- เกจแรง : ขาวขอบดำหนา แถบเป้าหมายสีเหลือง ระดับแรงสีน้ำเงิน -->
      <g transform="translate(496,0)">
        <rect x="0" y="40" width="112" height="320" rx="28" fill="#FFFFFF" stroke="#12121A" stroke-width="5"/>
        <rect id="band" x="5" y="180" width="102" height="60" fill="#FFD166"/>
        <path id="bandTop" d="M 5,180 H 107" stroke="#12121A" stroke-width="4" stroke-linecap="round"/>
        <path id="bandBot" d="M 5,240 H 107" stroke="#12121A" stroke-width="4" stroke-linecap="round"/>
        <rect id="fill" x="5" y="330" width="102" height="26" fill="#98DFEA"/>
        <rect x="0" y="40" width="112" height="320" rx="28" fill="none" stroke="#12121A" stroke-width="5"/>
        <g id="fishG" transform="translate(56,340)">
          <circle r="23" fill="#FFFFFF" stroke="#12121A" stroke-width="4"/>
          <circle cx="-7" cy="-5" r="3.8" fill="#12121A"/><circle cx="8" cy="-5" r="3.8" fill="#12121A"/>
          <path d="M -9,8 q 9,8 18,0" fill="none" stroke="#12121A" stroke-width="3.6" stroke-linecap="round"/>
        </g>
      </g>

      <!-- ลูกศรบอกว่าต้องบีบขึ้นหรือผ่อนลง -->
      <g id="arrow" transform="translate(424,200)" opacity="0">
        <g id="arrowIn">
          <path d="M 0,-36 L 28,6 L 11,6 L 11,36 L -11,36 L -11,6 L -28,6 Z"
                fill="#98DFEA" stroke="#12121A" stroke-width="4" stroke-linejoin="round"/>
        </g>
      </g>

      <!-- ฟองกลางจอ -->
      <g id="bubbleG" transform="translate(232,200)">
        <circle id="bubbleC" r="104" fill="#FFFFFF" stroke="#12121A" stroke-width="5"/>
        <g id="critter">
          <circle cx="0" cy="4" r="54" fill="#FFD166" stroke="#12121A" stroke-width="4"/>
          <circle id="eyeL" cx="-18" cy="-6" r="6.5" fill="#12121A"/>
          <circle id="eyeR" cx="18" cy="-6" r="6.5" fill="#12121A"/>
          <path id="mouth" d="M -16,18 q 16,13 32,0" fill="none" stroke="#12121A" stroke-width="4.5" stroke-linecap="round"/>
        </g>
        <circle id="ring" r="118" fill="none" stroke="#8CE99A" stroke-width="13" stroke-linecap="round"
                stroke-dasharray="741" stroke-dashoffset="741" transform="rotate(-90)"/>
      </g>
    </svg>
    <canvas id="fx"></canvas>
  </div>

  <div class="pair">
    <button class="ctrl up" id="btnUp" aria-label="บีบแรงขึ้น">
      <span class="ar" aria-hidden="true">▲</span><span class="cl">บีบแรงขึ้น</span></button>
    <button class="ctrl down" id="btnDown" aria-label="ผ่อนแรง">
      <span class="ar" aria-hidden="true">▼</span><span class="cl">ผ่อนแรง</span></button>
  </div>
</div>`;

function mountGame(){
  const stage=$('stage'),bandR=$('band'),bandT=$('bandTop'),bandB=$('bandBot'),
        fillR=$('fill'),fishG=$('fishG'),arrow=$('arrow'),arrowIn=$('arrowIn'),
        ring=$('ring'),bub=$('bubbleC'),bg=$('bubbleG'),saved=$('saved'),
        eyeL=$('eyeL'),eyeR=$('eyeR'),mouth=$('mouth');
  FX.attach($('fx'));
  const TOP=44,BOT=356,SPAN=BOT-TOP;          // เกจในพิกัด SVG
  const yOf=f=>BOT-clamp(f,0,100)/100*SPAN;

  function drawBand(){
    const d=H.engine.diff,yTop=yOf(d.target_force+d.tolerance_band),yBot=yOf(d.target_force-d.tolerance_band);
    bandR.setAttribute('y',yTop);bandR.setAttribute('height',Math.max(8,yBot-yTop));
    bandT.setAttribute('d',`M 5,${yTop} H 107`);bandB.setAttribute('d',`M 5,${yBot} H 107`);
  }
  function drawSaved(){
    saved.innerHTML=Array.from({length:5},(_,i)=>
      i<G.rescued?`<text x="${i*46}" y="6" font-size="38">⭐</text>`
                 :`<circle cx="${i*46+17}" cy="-6" r="15" fill="#FFFFFF" stroke="#12121A" stroke-width="4"/>`).join('');
  }
  drawBand();drawSaved();

  /* ---------- อินพุต : แตะทีละครั้งเท่านั้น ----------
     ไม่มีการลาก ไม่มีการปัด ไม่มีการกดค้าง — แตะหนึ่งครั้งเลื่อนแรงหนึ่งขั้น
     ปุ่มเป็น <button> จริง จึงกด Enter หรือ Space จากคีย์บอร์ดและสวิตช์ได้ทันที */
  $('btnUp').addEventListener('click',()=>gBump(1));
  $('btnDown').addEventListener('click',()=>gBump(-1));
  if(!G.bound){G.bound=true;
    window.addEventListener('keydown',e=>{
      if(e.key==='ArrowUp'){gBump(1);e.preventDefault()}
      else if(e.key==='ArrowDown'){gBump(-1);e.preventDefault()}});}

  bg.style.transition='transform .6s cubic-bezier(.2,.9,.3,1)';
  bg.style.transform='translate(232px,200px)';
  Object.assign(G,{force:0,holdT:0,samples:[],rt:0,tStart:performance.now(),
                   active:true,popping:false,target:0,sparkT:0});

  function endTrial(ok){
    if(!G.active)return;G.active=false;
    const d={...H.engine.diff};
    const inb=G.samples.filter(f=>Math.abs(f-d.target_force)<=d.tolerance_band);
    const base=inb.length?inb:G.samples,mu=mean(base)||1;
    const sd=Math.sqrt(mean(base.map(f=>(f-mu)**2))||0);
    H.trials.push({i:H.trials.length+1,live:true,ok,diff:d,
      GSI:Math.round(clamp(100*(1-sd/Math.max(mu,1)),0,100)),
      GAS:Math.round(clamp(100*(1-mean(G.samples.map(f=>Math.abs(f-d.target_force)))/d.target_force),0,100)),
      GES:Math.round(clamp(100*inb.length/Math.max(1,G.samples.length),0,100)),
      RT :Math.round(G.rt||0),
      GDI:Math.round(clamp(45+100*(1-sd/Math.max(mu,1))*.35+(Math.random()*8-4),0,100))});
    G.results.push(ok?1:0);H.engine.results.push(ok?1:0);S.live++;
    const rec=updateEngine(H.engine);
    drawBand();

    /* ทำสำเร็จ = ภาพ + เสียง + การสั่น พร้อมกัน
       การซ้อนสามช่องทางช่วยตอกย้ำการเรียนรู้สำหรับเด็กที่มีพัฒนาการช้า */
    if(ok){
      G.popping=true;G.rescued=Math.min(5,G.rescued+1);
      bub.setAttribute('opacity','0');ring.setAttribute('stroke-dashoffset','0');
      bg.style.transform='translate(232px,120px)';
      FX.burst(232,200,54,['#FFD166','#8CE99A','#98DFEA','#FFFFFF'],210);
      FX.ring(232,200,'#8CE99A');
      setTimeout(()=>FX.ring(232,200,'#FFD166'),110);
      setTimeout(()=>FX.ring(232,200,'#98DFEA'),220);
      /* ดาวลอยไปเก็บที่มุมซ้ายบน ทำให้เห็นว่ารางวัลไปอยู่ที่ไหน */
      setTimeout(()=>FX.fly(232,200,30+(G.rescued-1)*46,40,'#FFD166'),300);
      celebrate('เก่งมาก ทำได้แล้ว');
      setTimeout(drawSaved,420);
      if(S.p){S.p.seeds=Math.min(9,S.p.seeds+(G.rescued%2===0?1:0));saveStore();}
    }else{
      mouth.setAttribute('d','M -16,24 q 16,-11 32,0');
      speak('ไม่เป็นไร ลองใหม่อีกครั้ง');
    }
    setTimeout(()=>{
      Object.assign(G,{force:0,holdT:0,samples:[],rt:0,tStart:performance.now(),
                       active:true,popping:false,target:0});
      bub.setAttribute('opacity','1');bg.style.transform='translate(232px,200px)';
      ring.setAttribute('stroke-dashoffset','741');mouth.setAttribute('d','M -16,18 q 16,13 32,0');
    },2100);
  }

  let last=performance.now();
  function loop(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;
    /* แรงไม่ตกเอง — ระดับที่เด็กแตะไว้จะค้างอยู่อย่างนั้น
       เด็กจึงมีเวลาไม่จำกัดในการเล็งให้เข้าแถบสีเหลือง ไม่มีความกดดันเรื่องเวลา */
    G.force+=(G.target-G.force)*Math.min(1,dt*8);
    const d=H.engine.diff,diff=G.force-d.target_force,good=Math.abs(diff)<=d.tolerance_band;

    if(G.active){
      G.samples.push(G.force);
      if(!G.rt&&G.force>10)G.rt=now-G.tStart;
      if(good)G.holdT+=dt;else G.holdT=Math.max(0,G.holdT-dt*1.3);
      if(G.holdT>=d.hold_time)endTrial(true);
      /* ขีดจำกัดภายในที่กว้างมากและไม่แสดงให้เห็น มีไว้ให้ adaptive engine
         ได้สัญญาณว่าโจทย์ยากเกินไป ไม่ใช่นาฬิกาจับเวลาและไม่มีอะไรเตือนบนจอ */
      else if((now-G.tStart)/1000>60)endTrial(false);
    }

    /* เกจ */
    const y=yOf(G.force);
    fillR.setAttribute('y',y);fillR.setAttribute('height',Math.max(8,BOT-y));
    /* หน้ายิ้มต้องอยู่ในหลอดเสมอ ไม่งั้นตอนแรงเป็นศูนย์จะโผล่พ้นขอบล่าง */
    fishG.setAttribute('transform',`translate(56,${clamp(y,TOP+26,BOT-26)})`);

    /* ลูกศรบอกทิศ : ขึ้น = ต้องบีบเพิ่ม, ลง = ต้องผ่อน */
    if(!G.active||good){arrow.setAttribute('opacity','0')}
    else{
      const upNeeded=diff<0;
      arrow.setAttribute('opacity','1');
      arrow.setAttribute('transform',`translate(424,${clamp(y,90,320)})`);
      arrowIn.setAttribute('transform',upNeeded?'rotate(0)':'rotate(180)');
    }

    /* ฟอง + สีหน้า : อยู่ในเป้า = ขอบเขียวและยิ้ม */
    if(!G.popping){
      bub.setAttribute('stroke',good?'#8CE99A':'#12121A');
      bub.setAttribute('stroke-width',good?'10':'5');
      const blink=Math.sin(now/900)>.97?2:6.5;
      eyeL.setAttribute('r',blink);eyeR.setAttribute('r',blink);
      mouth.setAttribute('d',good?'M -18,14 q 18,18 36,0':'M -16,18 q 16,13 32,0');
    }
    if(good&&G.active){G.sparkT+=dt;
      if(G.sparkT>.12){G.sparkT=0;
        const a=Math.random()*Math.PI*2;FX.spark(232+Math.cos(a)*112,200+Math.sin(a)*112,'#8CE99A')}}

    ring.setAttribute('stroke-dashoffset',String(741-741*clamp(G.holdT/d.hold_time,0,1)));

    FX.step(dt);FX.draw();
    G.raf=requestAnimationFrame(loop);
  }
  cancelAnimationFrame(G.raf);G.raf=requestAnimationFrame(loop);
}
