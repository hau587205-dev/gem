// Clean Flappy Bird implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const retryBtn = document.getElementById('retry');

const V_WIDTH = 360;
const V_HEIGHT = 640;
let scale = 1, yOffset = 0;

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  scale = canvas.width / V_WIDTH;
  const totalVHeight = V_HEIGHT * scale;
  yOffset = Math.max(0, (canvas.height - totalVHeight) / 2);
}
window.addEventListener('resize', resize);
resize();

// game state
let state = 'ready'; // 'ready' | 'playing' | 'over'
let bird = null;
let pipes = [];
let frame = 0;
let pipeTimer = 0;
let score = 0;

function reset(){
  bird = { x: V_WIDTH * 0.25, y: V_HEIGHT/2, r: 12, vel: 0, gravity: 0.6, jump: -10 };
  pipes = [];
  frame = 0; pipeTimer = 0; score = 0;
  state = 'ready';
  scoreEl.textContent = score;
  retryBtn.classList.add('hidden');
}

function spawnPipe(){
  const gap = Math.max(110, 140 - Math.floor(score/5));
  const minTop = 40, maxTop = V_HEIGHT - gap - 80;
  const top = Math.floor(Math.random() * (maxTop - minTop)) + minTop;
  pipes.push({ x: V_WIDTH + 20, w: 56, top, gap, passed: false });
}

function flap(){
  if(state === 'ready') state = 'playing';
  if(state !== 'playing') return;
  bird.vel = bird.jump;
}

function update(){
  frame++;
  if(state === 'playing'){
    bird.vel += bird.gravity;
    bird.y += bird.vel;

    pipeTimer++;
    if(pipeTimer > 90){ spawnPipe(); pipeTimer = 0; }

    for(let i = pipes.length - 1; i >= 0; i--){
      const p = pipes[i];
      p.x -= 2 + Math.min(2.5, score * 0.05);
      if(!p.passed && p.x + p.w < bird.x){ p.passed = true; score++; scoreEl.textContent = score; }
      if(p.x + p.w < -20) pipes.splice(i,1);
    }

    if(bird.y - bird.r < 0 || bird.y + bird.r > V_HEIGHT){ gameOver(); }

    for(const p of pipes){
      // AABB vs circle approx
      const closestX = clamp(bird.x, p.x, p.x + p.w);
      const closestYTop = clamp(bird.y, 0, p.top);
      const dx = bird.x - closestX; const dyTop = bird.y - closestYTop;
      if(dx*dx + dyTop*dyTop < bird.r * bird.r && bird.y < p.top) { gameOver(); }

      const closestYBot = clamp(bird.y, p.top + p.gap, V_HEIGHT);
      const dyBot = bird.y - closestYBot;
      if(dx*dx + dyBot*dyBot < bird.r * bird.r && bird.y > p.top + p.gap) { gameOver(); }
    }
  }
}

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

function gameOver(){
  if(state === 'over') return;
  state = 'over';
  retryBtn.classList.remove('hidden');
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(0, yOffset);
  ctx.scale(scale, scale);

  // sky
  ctx.fillStyle = '#9be7ef'; ctx.fillRect(0,0,V_WIDTH,V_HEIGHT);

  // ground
  ctx.fillStyle = '#bdb76b'; ctx.fillRect(0, V_HEIGHT - 80, V_WIDTH, 80);

  // pipes
  for(const p of pipes){
    ctx.fillStyle = '#2fb14f';
    ctx.fillRect(p.x, 0, p.w, p.top);
    ctx.fillRect(p.x, p.top + p.gap, p.w, V_HEIGHT - (p.top + p.gap) - 80);
  }

  // bird
  ctx.save(); ctx.translate(bird.x, bird.y);
  ctx.fillStyle = '#ffdd57'; ctx.beginPath(); ctx.arc(0,0,bird.r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(6,-2,3,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // messages
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.font = '18px system-ui'; ctx.textAlign = 'center';
  if(state === 'ready') ctx.fillText('Chạm hoặc nhấn Space để nhảy', V_WIDTH/2, V_HEIGHT/2 - 20);
  if(state === 'over') ctx.fillText('Game Over - Nhấn Chơi lại', V_WIDTH/2, V_HEIGHT/2 - 20);

  ctx.restore();
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }

// input
window.addEventListener('mousedown', e=>{ e.preventDefault(); flap(); });
window.addEventListener('touchstart', e=>{ e.preventDefault(); flap(); }, { passive: false });
window.addEventListener('keydown', e=>{ if(e.code === 'Space') { e.preventDefault(); flap(); } });

retryBtn.addEventListener('click', ()=>{ reset(); });

reset();
loop();
