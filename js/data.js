/* ==========================================================================
   RehaVerse — ข้อมูลคงที่ของระบบ และที่เก็บแฟ้มเด็ก
   ========================================================================== */
/* ---------- มิติความยากที่ระบบปรับได้ ---------- */
const DIMS={
 target_force  :{min:20,max:70,step:5,   harder:+1,label:'แรงเป้าหมาย',        unit:'%F_work',kidUp:'บีบแรงขึ้นอีกนิด',      kidDn:'บีบเบาลงได้',        ico:'💪'},
 tolerance_band:{min:4, max:20,step:2,   harder:-1,label:'ความกว้างช่วงเป้า',  unit:'±%',     kidUp:'ช่องเป้าหมายแคบลง',    kidDn:'ช่องเป้าหมายกว้างขึ้น',ico:'🎯'},
 hold_time     :{min:0.5,max:4,step:0.5, harder:+1,label:'เวลาค้างแรง',        unit:'วิ',     kidUp:'ค้างนานขึ้น',          kidDn:'ค้างสั้นลง',          ico:'⏳'},
 target_size   :{min:8, max:26,step:3,   harder:-1,label:'ขนาดเป้าหมาย',       unit:'% จอ',  kidUp:'เป้าเล็กลง',           kidDn:'เป้าใหญ่ขึ้น',        ico:'⭕'},
 reps          :{min:3, max:12,step:1,   harder:+1,label:'จำนวนภารกิจต่อรอบ',  unit:'ครั้ง',  kidUp:'ภารกิจเยอะขึ้น',       kidDn:'ภารกิจน้อยลง',        ico:'🔁'},
 directions    :{min:1, max:6, step:1,   harder:+1,label:'ทิศทางการเคลื่อนไหว',unit:'ทิศ',    kidUp:'ต้องเอื้อมหลายทางขึ้น',kidDn:'เอื้อมทางเดียวพอ',    ico:'🧭'},
 react_window  :{min:1, max:3, step:0.25,harder:-1,label:'ช่วงเวลาตอบสนอง',    unit:'วิ',     kidUp:'ต้องรีบขึ้น',          kidDn:'มีเวลาคิดนานขึ้น',    ico:'⚡'},
 contact_zones :{min:2, max:8, step:1,   harder:+1,label:'จำนวนโซนสัมผัส',     unit:'โซน',    kidUp:'ใช้มือหลายส่วนขึ้น',   kidDn:'ใช้มือน้อยส่วนลง',    ico:'🖐️'},
};

/* ---------- roadmap ---------- */
const LEVELS=[
 {n:1,em:'🌱',th:'สำรวจและเอื้อม',name:'Explore & Reach',goal:'สร้างความคุ้นเคยกับการใช้มือ เปิดมือ เอื้อม และปล่อยวัตถุ',adapts:['target_size','reps','directions'],modes:{
   toy:{name:'Shape Explorer',desc:'กล่องหยอดรูปทรงขนาดใหญ่ หยิบบล็อก หมุนให้ตรงมุม แล้วใส่ลงช่อง เซนเซอร์ในกล่องบอกว่าใส่ถูกช่องไหมและใช้เวลาเท่าไร',skills:['Reach','Grasp','Release','Wrist rotation']},
   game:{name:'Shape Match',desc:'กล้องตรวจจับมือ เด็กเอื้อมไปหยิบรูปทรงบนหน้าจอ แล้วลากไปใส่ช่องที่ตรงกัน',skills:['Hand tracking','Visual attention','Reach']},
   both:{name:'Magic Portal',desc:'ถือบล็อกจริงในมือ กล้อง AI ตรวจจับ พอหย่อนลงกล่อง บ้านบนหน้าจอสร้างเสร็จทันที',skills:['Reach','Release','Cause–effect']}}},
 {n:2,em:'🌼',th:'เริ่มบีบ',name:'Grip Control',goal:'เริ่มฝึกการบีบ ให้เด็กรู้ว่ามือตัวเองสั่งงานได้',adapts:['target_force','hold_time','reps'],modes:{
   toy:{name:'Squeeze Animal',desc:'ของเล่นนิ่ม บีบแล้วสัตว์ร้อง มี LED เปลี่ยนสีตามแรงบีบ',skills:['Grip initiation','Force awareness']},
   game:{name:'Bubble Pop',desc:'กล้องตรวจการกำมือ เด็กกำมือเพื่อแตกฟองบนหน้าจอ ใช้ได้แม้ยังถือลูกบอลไม่ได้',skills:['Hand closing','Timing'],playable:true},
   both:{name:'Bubble Rescue',desc:'บีบ RehaBall ให้ถึงช่วงแรงเป้าหมายแล้วค้างไว้ ฟองแตก สัตว์ได้รับการช่วยเหลือ',skills:['Grip initiation','Grip endurance','Force stability'],playable:true}}},
 {n:3,em:'🚀',th:'คุมแรงให้แม่น',name:'Force Control',goal:'ควบคุมแรงให้อยู่ในช่วงที่กำหนด ไม่ใช่บีบให้แรงที่สุด',adapts:['target_force','tolerance_band','hold_time'],modes:{
   toy:{name:'Rocket Pump',desc:'ของเล่นมีเกจแรงแบบเข็ม เด็กบีบให้เข็มค้างอยู่ในแถบสีเขียว',skills:['Graded force','Visual matching']},
   game:{name:'Rocket Simulator',desc:'กล้องวัดระดับการกำมือ ใช้บังคับความสูงของจรวดให้บินผ่านวงแหวน',skills:['Graded hand closing']},
   both:{name:'Rocket Power',desc:'แรงบีบแปลงเป็นความสูงของจรวดโดยตรง ต้องเพิ่มและลดแรงตามตำแหน่งวงแหวน',skills:['Force modulation','Controlled release']}}},
 {n:4,em:'🎯',th:'จังหวะและการปล่อย',name:'Timing & Release',goal:'ฝึกจังหวะ บีบให้ทัน และปล่อยให้ตรงเวลา',adapts:['react_window','reps','target_size'],modes:{
   toy:{name:'Light Catch',desc:'ไฟติดขึ้นแบบสุ่ม เด็กต้องบีบและปล่อยให้ทันก่อนไฟดับ',skills:['Reaction time','Release control']},
   game:{name:'Feed Monster',desc:'กล้องตรวจการอ้า–หุบมือ ใช้เปิดปากสัตว์ประหลาดให้ตรงจังหวะ',skills:['Hand opening','Timing']},
   both:{name:'Feed Monster+',desc:'บีบเพื่อเปิดปาก ค้างไว้จนอาหารมาถึง แล้วคลายมือให้อาหารตกลงพอดี',skills:['Reaction time','Grip–release cycle']}}},
 {n:5,em:'🌳',th:'รูปแบบการจับ',name:'Grip Pattern',goal:'กระจายแรงรอบมือ ไม่กระจุกอยู่จุดเดียว',adapts:['contact_zones','hold_time','reps'],modes:{
   toy:{name:'Texture Ball',desc:'ลูกบอลหลายพื้นผิวในลูกเดียว เด็กลองจับหลายแบบ',skills:['Tactile awareness','Grip diversity']},
   game:{name:'Magic Garden Lite',desc:'กล้องตรวจรูปทรงของมือ เปลี่ยนท่ามือให้พืชโตต่างชนิดกัน',skills:['Hand shaping','Finger extension']},
   both:{name:'Magic Garden',desc:'Heat Map จากเซนเซอร์ 12 จุด ต้นไม้โตตามรูปแบบการกระจายแรง ไม่ใช่ตามความแรง',skills:['Contact distribution','Grip diversity']}}},
 {n:6,em:'🏴',th:'เคลื่อนแขนพร้อมคุมมือ',name:'Functional Movement',goal:'ใช้มือร่วมกับการเคลื่อนไหวแขนและลำตัว',adapts:['directions','target_size','reps'],modes:{
   toy:{name:'Treasure Box',desc:'ถือลูกบอลเดินไปวางตามจุดต่าง ๆ ที่ผู้ดูแลจัดไว้',skills:['Reach','Trunk control','Carry']},
   game:{name:'Treasure Runner',desc:'กล้องตรวจตำแหน่งมือ เอื้อมไปหยิบและย้ายสมบัติบนหน้าจอ',skills:['Reach accuracy','Shoulder movement']},
   both:{name:'Treasure Delivery',desc:'ถือลูกบอลเดินไปยังเกาะที่กำหนด กล้องตรวจตำแหน่ง IMU ตรวจการเคลื่อนที่ FSR ตรวจแรง',skills:['Grip during movement','Trunk control']}}},
 {n:7,em:'🍳',th:'กิจวัตรประจำวัน',name:'Daily Living',goal:'เลียนแบบการเคลื่อนไหวที่ใช้จริงในชีวิตประจำวัน',adapts:['reps','directions','hold_time'],modes:{
   toy:{name:'Kitchen Set',desc:'ชุดครัวของเล่น คนซุป เทน้ำ หยิบของ ตามลำดับขั้นตอน',skills:['Forearm rotation','Bilateral use']},
   game:{name:'Cooking Story',desc:'กล้องตรวจการหมุนและเคลื่อนมือ ใช้ทำอาหารตามสูตรบนหน้าจอ',skills:['Wrist motion','Sequencing']},
   both:{name:'Smart Cooking',desc:'ลูกบอลแทนวัตถุดิบ เอียงเพื่อเท หมุนเพื่อคน บีบเพื่อคั้น',skills:['Forearm rotation','Functional task']}}},
 {n:8,em:'👑',th:'ภารกิจรวม',name:'Adventure Challenge',goal:'รวมทุกทักษะไว้ในภารกิจเดียว',adapts:['target_force','hold_time','directions','reps','target_size'],modes:{
   toy:{name:'Mission Board',desc:'กระดานภารกิจ หยิบ ใส่ ย้าย เรียง ตามการ์ดที่จั่วได้',skills:['Combined skills','Planning']},
   game:{name:'Adventure Island',desc:'ภารกิจหลายรูปแบบต่อเนื่องกัน ใช้ Hand Tracking อย่างเดียว',skills:['Combined skills','Endurance']},
   both:{name:'RehaVerse Quest',desc:'ด่านเดียวรวมทุกอย่าง เดิน ถือบอล บีบ คลาย วาง เอื้อม หมุน',skills:['All axes','Motor planning']}}},
];
const MODE_META={toy:{em:'🧸',label:'Toy Only',kid:'ของเล่น',sub:'ของเล่นอย่างเดียว ไม่ต้องมีจอ'},
                 game:{em:'🎮',label:'Game Only',kid:'กล้อง',sub:'กล้อง AI อย่างเดียว ไม่ต้องมีอุปกรณ์'},
                 both:{em:'🧸🎮',label:'Toy + Game',kid:'ของเล่น + จอ',sub:'ลูกบอลจริงทำงานร่วมกับหน้าจอ'}};

/* ประโยคเดียวต่อด่าน สำหรับหน้าจอเด็ก — สั้นพอที่เด็กอ่านจบในครั้งเดียว
   คำอธิบายฉบับเต็มอยู่ในแดชบอร์ดนักกายภาพ ไม่ต้องเอามาไว้ตรงนี้ */
const KID_LINE={1:'เอื้อมไปหยิบของ',2:'ลองบีบดูสิ',3:'บีบให้พอดี',4:'บีบให้ทันเวลา',
                5:'จับหลาย ๆ แบบ',6:'ถือของแล้วเดินไป',7:'ทำอาหารเล่นกัน',8:'รวมทุกอย่างที่เก่ง'};

/* ---------- ต้นไม้ทักษะ : re-skin ของ Ability Profile 6 แกน ที่มีอยู่แล้ว ---------- */
const SKILLS=[
 {key:'GC',icon:'🤚',name:'จับแน่น',    desc:'ความสามารถในการกำและถือของ',    levels:[2,3,5,8]},
 {key:'FA',icon:'🎯',name:'บีบแม่น',    desc:'ควบคุมแรงให้พอดีกับเป้าหมาย',   levels:[3,5,8]},
 {key:'FS',icon:'🧘',name:'มือนิ่ง',    desc:'คุมแรงให้คงที่ไม่แกว่ง',        levels:[2,3,5]},
 {key:'EN',icon:'🔋',name:'ความทน',     desc:'คงแรงได้นานตามที่ต้องใช้',      levels:[2,7]},
 {key:'TM',icon:'⚡',name:'จังหวะไว',   desc:'ตอบสนองได้ทันเวลา',             levels:[4,8]},
 {key:'CD',icon:'🌈',name:'จับหลากแบบ', desc:'กระจายแรงรอบมือได้หลายรูปแบบ',  levels:[5,8]},
];
const skillLevel=score=>clamp(Math.ceil(clamp(score,0,100)/20),1,5);
/* ==========================================================================
   แฟ้มเด็ก
   ========================================================================== */
const AVATARS=['🦊','🐨','🐸','🐙','🦄','🐧','🐢','🦁'];
function blankProfile(){
  return {code:nextCode(),name:'',nick:'',avatar:'🦊',age:6,hand:'ขวา',dx:'Spastic hemiplegia',
    macs:3,gmfcs:2,cal:{rest:.4,comf:2.0,prf:5.0},
    ability:.30,learn:.011,nTrials:24,start:{target_force:30,tolerance_band:14,hold_time:1.0},
    screenEngagement:.5,attentionSpan:.5,
    level:1,mode:'both',hasToy:true,seeds:0};
}
let codeSeq=300;
const nextCode=()=>'CP-0'+(codeSeq++);
const SEED_PROFILES=[
 {code:'CP-0142',name:'พลอย ว.',nick:'พลอย',avatar:'🦊',age:7,hand:'ขวา',dx:'Spastic hemiplegia (ขวา)',
  macs:3,gmfcs:2,cal:{rest:.42,comf:2.1,prf:5.8},ability:.34,learn:.010,nTrials:32,
  start:{target_force:30,tolerance_band:14,hold_time:0.5},
  screenEngagement:.35,attentionSpan:.60,level:2,mode:'both',hasToy:true,seeds:3},
 {code:'CP-0088',name:'ต้นกล้า พ.',nick:'ต้นกล้า',avatar:'🐨',age:5,hand:'ซ้าย',dx:'Spastic diplegia',
  macs:2,gmfcs:2,cal:{rest:.31,comf:2.8,prf:7.4},ability:.52,learn:.015,nTrials:30,
  start:{target_force:35,tolerance_band:12,hold_time:1.5},
  screenEngagement:.55,attentionSpan:.65,level:4,mode:'both',hasToy:true,seeds:5},
 {code:'CP-0233',name:'มีนา ส.',nick:'มีนา',avatar:'🐙',age:10,hand:'ขวา',dx:'Dyskinetic CP',
  macs:4,gmfcs:3,cal:{rest:.68,comf:1.4,prf:3.2},ability:.16,learn:.006,nTrials:22,
  start:{target_force:25,tolerance_band:18,hold_time:0.5},
  screenEngagement:.75,attentionSpan:.30,level:1,mode:'game',hasToy:false,seeds:2},
];

/* ---------- ที่เก็บถาวร : localStorage ---------- */
const STORE_KEY='rehaverse.profiles.v1';
const SEQ_KEY='rehaverse.codeSeq.v1';
function loadStore(){
  try{
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){const arr=JSON.parse(raw);if(Array.isArray(arr)&&arr.length)return arr;}
  }catch(e){console.warn('อ่าน localStorage ไม่ได้ ใช้ข้อมูลตัวอย่างแทน',e);}
  return SEED_PROFILES.map(p=>({...p}));
}
function saveStore(){
  try{
    localStorage.setItem(STORE_KEY,JSON.stringify(PROFILES));
    localStorage.setItem(SEQ_KEY,String(codeSeq));
  }catch(e){console.warn('บันทึก localStorage ไม่ได้ (โหมดส่วนตัว หรือพื้นที่เต็ม)',e);}
}
const PROFILES=loadStore();
try{
  const savedSeq=localStorage.getItem(SEQ_KEY);
  if(savedSeq)codeSeq=Math.max(codeSeq,+savedSeq);
  const maxExisting=Math.max(0,...PROFILES.map(p=>{
    const m=/CP-0*(\d+)/.exec(p.code||'');return m?+m[1]:0;}));
  codeSeq=Math.max(codeSeq,maxExisting+1);
}catch(e){}
