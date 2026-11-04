import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const viewport = document.querySelector('#viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1622);
scene.fog = new THREE.Fog(0x0b1622, 18, 42);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(10, 8, 13);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 1.6, 0);
controls.minDistance = 5;
controls.maxDistance = 25;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xc7e5ff, 0x263342, 2.0));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
keyLight.position.set(6, 12, 8); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048); scene.add(keyLight);
const rimLight = new THREE.PointLight(0x39bde8, 70, 22);
rimLight.position.set(-7, 5, -5); scene.add(rimLight);

const metal = new THREE.MeshStandardMaterial({ color: 0x727f89, metalness: .78, roughness: .32 });
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x303b45, metalness: .82, roughness: .3 });
const tankMat = new THREE.MeshStandardMaterial({ color: 0x59636c, metalness: .72, roughness: .28 });
const blueMat = new THREE.MeshStandardMaterial({ color: 0x168bc4, metalness: .5, roughness: .28 });
const redMat = new THREE.MeshStandardMaterial({ color: 0xb52d32, metalness: .4, roughness: .32 });
const waterMat = new THREE.MeshStandardMaterial({ color: 0x168bfa, emissive: 0x073e8b, emissiveIntensity: .45, metalness: .35, roughness: .25 });
const processMat = new THREE.MeshStandardMaterial({ color: 0x20c69a, emissive: 0x075d48, emissiveIntensity: .35, metalness: .35, roughness: .25 });
const hotMat = new THREE.MeshStandardMaterial({ color: 0xf0a04b, emissive: 0x6c3108, emissiveIntensity: .3, metalness: .35, roughness: .25 });

const pickables = [];
const flowDots = [];
const equipment = [];
function register(obj, data) { obj.userData.info = data; pickables.push(obj); equipment.push(obj); return obj; }
function addMesh(geometry, material, position, parent=scene, cast=true) {
  const m = new THREE.Mesh(geometry, material); m.position.set(...position); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
}
function cylinderBetween(a, b, radius, material, parent=scene, radial=16) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const dir = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), radial), material);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function pipe(points, material, radius=.075, parent=scene) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(30, points.length*12), radius, 12, false), material);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  // Animated beads travel along the same route.
  const bead = new THREE.Mesh(new THREE.SphereGeometry(radius*1.25, 10, 10), new THREE.MeshBasicMaterial({ color: material.color, transparent:true, opacity:.95 }));
  bead.visible = false; scene.add(bead); flowDots.push({ bead, curve, offset: Math.random() }); return mesh;
}
function flange(x,y,z, axis='x', radius=.16) {
  const g = new THREE.CylinderGeometry(radius, radius, .07, 24);
  const m = addMesh(g, metal, [x,y,z]);
  if (axis === 'x') m.rotation.z = Math.PI/2;
  if (axis === 'z') m.rotation.x = Math.PI/2;
  return m;
}
function labelSprite(text) {
  const canvas = document.createElement('canvas'); canvas.width=512; canvas.height=128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle='rgba(7,18,29,.88)'; ctx.fillRect(0,0,512,128);
  ctx.strokeStyle='#36c6ed'; ctx.lineWidth=5; ctx.strokeRect(3,3,506,122);
  ctx.fillStyle='#eaf7ff'; ctx.font='bold 48px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text,256,65);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true }));
  sprite.scale.set(1.35,.34,1); return sprite;
}

// Industrial platform and gridded floor.
addMesh(new THREE.BoxGeometry(12,.35,7), darkMetal, [0,-.18,0]);
const platformTop = addMesh(new THREE.BoxGeometry(11.8,.08,6.8), new THREE.MeshStandardMaterial({color:0x394a57, metalness:.65, roughness:.48}), [0,.035,0]);
const grid = new THREE.GridHelper(24, 48, 0x38556a, 0x243b4c); grid.position.y=.09; grid.scale.set(.5,1,.5); scene.add(grid);
for (let x=-5.6;x<=5.6;x+=.4) {
  const line=addMesh(new THREE.BoxGeometry(.018,.012,6.5), new THREE.MeshBasicMaterial({color:0x718b9d, transparent:true, opacity:.17}), [x,.09,0], scene, false);
}
for (let z=-3.2;z<=3.2;z+=.4) addMesh(new THREE.BoxGeometry(11.5,.012,.018), new THREE.MeshBasicMaterial({color:0x718b9d, transparent:true, opacity:.17}), [0,.09,z], scene, false);

// Equipment: two vertical tanks.
function makeTank(x, id, name) {
  const group = new THREE.Group(); group.position.set(x,0,0); scene.add(group);
  const body=addMesh(new THREE.CylinderGeometry(.82,.82,3.0,48,1,false), tankMat, [0,1.68,0], group);
  const top=addMesh(new THREE.CylinderGeometry(.82,.82,.12,48), metal, [0,3.22,0], group);
  const bottom=addMesh(new THREE.CylinderGeometry(.86,.86,.13,48), darkMetal, [0,.16,0], group);
  const foot=addMesh(new THREE.BoxGeometry(1.95,.16,1.95), darkMetal, [0,.08,0], group);
  const manway=addMesh(new THREE.CylinderGeometry(.19,.19,.08,24), metal, [0,3.32,0], group);
  const nozzle=addMesh(new THREE.CylinderGeometry(.14,.14,.35,20), metal, [0,2.8,.82], group); nozzle.rotation.x=Math.PI/2;
  const band=addMesh(new THREE.TorusGeometry(.825,.035,8,48), darkMetal, [0,2.65,0], group); band.rotation.x=Math.PI/2;
  const tag=labelSprite(id); tag.position.set(0,2.1, .86); group.add(tag);
  register(body,{id,name,description:'Reservatório vertical destinado ao armazenamento temporário do fluido. Em uma instalação real, pressão, nível, material e acessórios dependem do processo e do projeto.'});
  register(top,{id:id+'-T',name:'Tampa do '+name,description:'Fechamento superior do reservatório, com conexões e acessórios de inspeção.'});
  return {group,x};
}
const tankL=makeTank(-4.25,'TQ-01','Reservatório esquerdo');
const tankR=makeTank(4.25,'TQ-02','Reservatório direito');

// Pumps with motor, casing and base.
function makePump(x,z,id,name) {
  const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  addMesh(new THREE.BoxGeometry(1.55,.18,.85),darkMetal,[0,.22,0],g);
  const motor=addMesh(new THREE.CylinderGeometry(.34,.34,.92,32),blueMat,[.28,.72,0],g); motor.rotation.z=Math.PI/2;
  const casing=addMesh(new THREE.SphereGeometry(.48,28,20),blueMat,[-.45,.68,0],g);
  const outlet=addMesh(new THREE.CylinderGeometry(.15,.15,.4,20),metal,[-.45,1.05,0],g);
  const foot=addMesh(new THREE.BoxGeometry(.55,.18,.65),metal,[-.45,.28,0],g);
  const tag=labelSprite(id); tag.position.set(0,1.45,.35); g.add(tag);
  register(casing,{id,name,description:'Conjunto de bombeamento que fornece energia ao fluido para promover sua circulação pela rede. A seleção da bomba real exige dados de vazão, altura manométrica e características do fluido.'});
  return g;
}
makePump(-1.25,-.75,'B-01','Bomba principal');
makePump(1.25,.85,'B-02','Bomba auxiliar');

// Pipework: color-coded lines.
const waterPath=[[-4.25,2.35,.82],[-3.4,2.35,.82],[-3.4,2.65,1.45],[-1.9,2.65,1.45],[-1.9,1.2,1.45],[-.8,1.2,1.45],[0,1.2,1.45],[1.9,1.2,1.45],[1.9,2.65,1.45],[3.4,2.65,1.45],[3.4,2.35,.82],[4.25,2.35,.82]];
const processPath=[[-4.25,1.15,.82],[-3.3,1.15,.82],[-3.3,1.55,-1.45],[-1.6,1.55,-1.45],[-1.6,2.9,-1.45],[0,2.9,-1.45],[1.6,2.9,-1.45],[1.6,1.55,-1.45],[3.3,1.55,-1.45],[3.3,1.15,.82],[4.25,1.15,.82]];
const hotPath=[[-4.25,2.85,-.82],[-3.5,2.85,-.82],[-3.5,3.75,-.82],[0,3.75,-.82],[3.5,3.75,-.82],[3.5,2.85,-.82],[4.25,2.85,-.82]];
pipe(waterPath,waterMat,.075);
pipe(processPath,processMat,.075);
pipe(hotPath,hotMat,.075);

// Visible branch lines and pump connections.
pipe([[-1.25,.9,-.75],[-1.25,1.35,-.75],[-1.25,1.55,-1.45]],processMat,.09);
pipe([[1.25,.9,.85],[1.25,1.35,.85],[1.25,1.2,1.45]],waterMat,.09);
pipe([[-4.25,.9,0],[-4.25,.55,0],[-2.4,.55,0],[-2.4,.95,-.75]],metal,.085);
pipe([[4.25,.9,0],[4.25,.55,0],[2.4,.55,0],[2.4,.95,.85]],metal,.085);

// Flanges along selected pipe runs.
[[-3.4,2.65,1.45],[-1.9,2.65,1.45],[1.9,2.65,1.45],[3.4,2.65,1.45]].forEach(p=>flange(...p,'z',.16));
[[-3.5,3.75,-.82],[3.5,3.75,-.82]].forEach(p=>flange(...p,'x',.17));

// Valves: body, wheel, stem and red lockout tags.
function makeValve(x,y,z,id,name,material=metal) {
  const g=new THREE.Group(); g.position.set(x,y,z); scene.add(g);
  addMesh(new THREE.SphereGeometry(.22,20,16),material,[0,0,0],g);
  cylinderBetween([0,-.1,0],[0,.35,0],.055,metal,g);
  const wheel=new THREE.Mesh(new THREE.TorusGeometry(.23,.035,8,28),redMat); wheel.position.y=.42; g.add(wheel);
  const spokes=new THREE.Mesh(new THREE.BoxGeometry(.42,.035,.035),redMat); spokes.position.y=.42; g.add(spokes);
  const tag=labelSprite('LOTO'); tag.scale.set(.55,.14,1); tag.position.set(.28,-.28,0); g.add(tag);
  register(g,{id,name,description:'Válvula de bloqueio manual. Em procedimentos reais, o bloqueio deve seguir análise de risco, identificação de todas as fontes de energia, isolamento, dissipação e verificação de energia zero. O cadeado e a etiqueta identificam o responsável pelo bloqueio.'});
  return g;
}
makeValve(-3.1,2.65,1.45,'VL-01','Válvula de bloqueio da linha de água');
makeValve(0,2.9,-1.45,'VL-02','Válvula de bloqueio da linha de processo');
makeValve(3.1,3.75,-.82,'VL-03','Válvula de bloqueio da linha quente');

// Control cabinet at the right.
const cabinet=addMesh(new THREE.BoxGeometry(.75,1.55,.6),new THREE.MeshStandardMaterial({color:0x89939a,metalness:.55,roughness:.4}),[5.2,.9,1.5]);
const door=addMesh(new THREE.BoxGeometry(.04,1.35,.48),darkMetal,[5.6,.9,1.5]);
const knob=addMesh(new THREE.SphereGeometry(.07,16,12),redMat,[5.65,.9,1.5]);
register(cabinet,{id:'QD-01',name:'Painel elétrico de comando',description:'Painel conceitual de comando e alimentação dos equipamentos. Intervenções elétricas exigem profissional habilitado e procedimento formal de bloqueio e etiquetagem.'});

// Pipe support frames.
for (const x of [-3.45,3.45]) {
  cylinderBetween([x,.18,-1.55],[x,3.95,-1.55],.045,metal);
  cylinderBetween([x,.18,1.55],[x,2.85,1.55],.045,metal);
  cylinderBetween([x,3.95,-1.55],[x,3.95,1.55],.045,metal);
}

// Small lockout padlocks hanging on valve handles.
function makePadlock(x,y,z) {
  const body=addMesh(new THREE.BoxGeometry(.18,.22,.07),redMat,[x,y,z]);
  const shackle=new THREE.Mesh(new THREE.TorusGeometry(.075,.025,8,18,Math.PI),metal);
  shackle.position.set(x,y+.12,z); shackle.rotation.z=Math.PI; scene.add(shackle);
  register(body,{id:'LOTO',name:'Cadeado de bloqueio',description:'Dispositivo físico de bloqueio. Impede a operação não autorizada do ponto isolado durante uma intervenção.'});
}
makePadlock(-3.1,2.95,1.7); makePadlock(0,3.2,-1.2); makePadlock(3.1,4.05,-.55);

// Lighting and ground shadow catcher.
const ground=addMesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x0b1622,roughness:.95}),[0,-.43,0],scene,false);
ground.rotation.x=-Math.PI/2;

// Raycasting selection.
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
let selected=null, flowOn=false, tourStep=0, tourTimer=null;
const originalMaterials=new Map();
function showInfo(data) {
  document.querySelector('#infoTitle').textContent=data.name;
  document.querySelector('#infoText').textContent=data.description;
  document.querySelector('#selectedName').textContent=data.name;
  document.querySelector('#selectedId').textContent=data.id;
  document.querySelector('#details').textContent=data.description;
}
function selectObject(obj) {
  if (selected && selected.material && originalMaterials.has(selected)) selected.material=originalMaterials.get(selected);
  selected=obj;
  if (obj?.material && obj.material.isMaterial) {
    if (!originalMaterials.has(obj)) originalMaterials.set(obj,obj.material);
    obj.material=obj.material.clone(); obj.material.emissive=new THREE.Color(0x0b7899); obj.material.emissiveIntensity=.55;
  }
  if (obj?.userData.info) showInfo(obj.userData.info);
}
renderer.domElement.addEventListener('pointerup', event=>{
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(pickables,true);
  if (!hits.length) return;
  let obj=hits[0].object;
  while(obj && !obj.userData.info) obj=obj.parent;
  if(obj) selectObject(obj);
});

function setView(mode) {
  document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('active',b.dataset.view===mode));
  if(mode==='overview') {
    camera.position.set(10,8,13); controls.target.set(0,1.6,0);
    showInfo({name:'Visão geral',description:'A instalação reúne reservatórios, bombas, válvulas e linhas de tubulação para demonstrar armazenamento, bombeamento e distribuição de fluidos.'});
  } else if(mode==='pipes') {
    camera.position.set(9,5.8,10); controls.target.set(0,2.3,0);
    showInfo({name:'Sistema de tubulações',description:'As linhas coloridas representam circuitos didáticos distintos. Azul: água. Verde: linha de processo. Laranja: fluido quente. As cores são ilustrativas e devem ser adaptadas às normas e identificação adotadas na instalação real.'});
  } else if(mode==='equipment') {
    camera.position.set(0,10,12); controls.target.set(0,1.1,0);
    showInfo({name:'Equipamentos',description:'Selecione os reservatórios, bombas, válvulas ou painel elétrico para consultar a função de cada componente.'});
  } else if(mode==='loto') {
    camera.position.set(7,5,8); controls.target.set(0,2.3,0);
    showInfo({name:'Segurança LOTO',description:'Lockout/Tagout é um procedimento de controle de energias perigosas. A representação é didática: o procedimento real deve seguir as normas aplicáveis, instruções locais e avaliação de riscos.'});
    makeLotoVisible(true);
  }
}
function makeLotoVisible(on) {
  scene.traverse(o=>{ if(o.userData.info?.id==='LOTO') o.visible=on; });
}
document.querySelectorAll('.tool').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelector('#resetBtn').addEventListener('click',()=>{camera.position.set(10,8,13);controls.target.set(0,1.6,0);controls.update();});
document.querySelector('#flowBtn').addEventListener('click',e=>{
  flowOn=!flowOn; flowDots.forEach(d=>d.bead.visible=flowOn);
  e.currentTarget.textContent=flowOn?'Ⅱ Pausar fluxo':'▶ Ativar fluxo';
});
document.querySelector('#tourBtn').addEventListener('click',()=>{
  const stops=[
    {pos:[10,7,12],target:[0,1.5,0],name:'1. Visão geral',desc:'Observe a disposição dos reservatórios, das bombas e das linhas de interligação.'},
    {pos:[-8,4,7],target:[-4,1.7,0],name:'2. Armazenamento',desc:'Os reservatórios recebem e armazenam fluidos antes de sua transferência.'},
    {pos:[0,4,7],target:[0,.8,0],name:'3. Bombeamento',desc:'As bombas fornecem energia ao fluido para movimentá-lo pela tubulação.'},
    {pos:[7,5,7],target:[0,2.5,0],name:'4. Bloqueio e segurança',desc:'Válvulas e dispositivos LOTO ajudam a isolar fontes de energia durante manutenção.'}
  ];
  const s=stops[tourStep%stops.length]; tourStep++;
  camera.position.set(...s.pos); controls.target.set(...s.target);
  showInfo({name:s.name,description:s.desc});
});
makeLotoVisible(true);

function resize() {
  const w=viewport.clientWidth, h=viewport.clientHeight;
  camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
}
window.addEventListener('resize',resize); resize();

const clock=new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  if(flowOn) flowDots.forEach((d,i)=>{ const p=d.curve.getPoint((t*.12+d.offset)%1); d.bead.position.copy(p); });
  controls.update(); renderer.render(scene,camera);
}
animate();
