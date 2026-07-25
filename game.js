// ====== AYARLAR ======
// Hikaye: Hatay'dan tek başına çıkılıyor, Bandırma'da o biniyor,
// İstanbul'da arkaya kumral kıvırcık küçük bir kız katılıyor,
// sonunda hep birlikte Hatay'a dönülüyor.
const STAGES = [
  {
    name: "Hatay",
    road: "#7a3b2e",
    sky: ["#ff9a5a", "#3b1f3f"],
    occupants: ["girl"],
    eyebrow: "BAŞLANGIÇ",
    year: "2001 - 2018",
  },
  {
    name: "Bandırma",
    road: "#2f5a55",
    sky: ["#6fd3c7", "#1c3a44"],
    occupants: ["girl", "guy"],
    year: "2019 - 2024",
    note: "Aşkımda da bindi ✦",
  },
  {
    name: "İstanbul",
    road: "#33465c",
    sky: ["#5ba3c9", "#1f2a4a"],
    occupants: ["girl", "guy", "child"],
    year: "2025 - 2030",
    note: "Küçük bir yolcu katıldı ✦",
  },
  {
    name: "Hatay",
    road: "#7a3b2e",
    sky: ["#ff9a5a", "#3b1f3f"],
    occupants: ["girl", "guy", "child"],
    eyebrow: "DÖNÜŞ",
    note: "Hep birlikte eve dönüyoruz ✦",
  },
];
const STAGE_LENGTH = 3000; 
const BASE_SPEED = 3.3;
const SPEED_GROWTH = 1.1; 
const LANES = 3;
const ROAD_WIDTH_RATIO = 0.78; 
const CITY_BANNER_FRAMES = 130; 
const SIGN_GAP = 500; 
const TOTAL_HEARTS = 20; 

// ==========================================
// ENGEL AÇMA/KAPAMA AYARI
// Engeller kapalı. Açmak istersen true yapabilirsin.
let ENABLE_OBSTACLES = false; 

function setObstacles(state) {
  ENABLE_OBSTACLES = state;
  console.log("Engeller durumu: " + (state ? "AÇIK" : "KAPALI"));
}
// ==========================================

const STORY_LINES = [
  "Merhaba, ben Ece.",
  "Hataylıyım.",
  "Üniversite için Bandırma'ya gittim.",
  "Orada hayatımın aşkıyla tanıştım.",
  "Onunla hep hayalim evlenip çocuk sahibi olmaktı.",
  "Ama bizim yolumuz hiç kolay değil.",
  "Çok zorlu, çok engel var.",
  "Yine de hepsini aşacağımızı biliyorum.",
  "Sadece senin yardımın gerekli.",
  "Bu hikayemde yolculuğumu tamamlamama yardım eder misin?",
];

const LOVE_TIERS = [
  { min: 0, max: 4, label: "Seviyorum", color: "#ffd9e2" },
  { min: 5, max: 9, label: "Çok seviyorum", color: "#ffb4c6" },
  { min: 10, max: 14, label: "Çok çok seviyorum", color: "#ff8fab" },
  { min: 15, max: 20, label: "Çok çok çok seviyorum", color: "#ff4d6d" },
];

// ====== DURUM ======
let canvas, ctx;
let state = "start"; 
let lane = 1;
let currentX = 0;
let distance = 0;
let stageIndex = 0;
let hearts = 0;
let heartsSpawned = 0;
let speed = BASE_SPEED;
let entities = []; 
let signs = []; 
let distSinceSpawn = 0;
let nextSpawnAt = 140;
let distSinceSign = 0;
let cityBannerFrames = 0;
let rafId = null;
let laneWidth = 0;
let roadX0 = 0;
let roadWidth = 0;
let shoulderWidth = 0;
let playerW = 0;
let playerH = 0;
let playerY = 0;

const screens = {
  story: document.getElementById("screen-story"),
  start: document.getElementById("screen-start"),
  play: document.getElementById("screen-play"),
  win: document.getElementById("screen-win"),
  gameover: document.getElementById("screen-gameover"),
};

function showScreen(key) {
  Object.values(screens).forEach((s) => {
    if (s) s.classList.remove("active");
  });
  if (screens[key]) screens[key].classList.add("active");
}

// ====== MÜZİK ======
const bgMusic = document.getElementById("bg-music");
const muteBtn = document.getElementById("btn-mute");
let musicStarted = false;

function startMusic() {
  if (musicStarted) return;
  musicStarted = true;
  
  // HTML'de müzik dosyası yoksa kodun çökmesini engeller!
  if (bgMusic) {
    bgMusic.volume = 0.55;
    bgMusic.play().catch(() => {
      musicStarted = false;
    });
  }
}

if (muteBtn) {
  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startMusic();
    if (bgMusic) {
      bgMusic.muted = !bgMusic.muted;
      muteBtn.textContent = bgMusic.muted ? "🔇" : "🔊";
    }
  });
}

// ====== HİKAYE ======
let storyIndex = 0;

function renderStory() {
  const storyText = document.getElementById("story-text");
  if (storyText) storyText.textContent = STORY_LINES[storyIndex];
}

function advanceStory() {
  storyIndex++;
  if (storyIndex >= STORY_LINES.length) {
    showScreen("start");
  } else {
    renderStory();
  }
}

const screenStory = document.getElementById("screen-story");
if (screenStory) {
  screenStory.addEventListener("click", () => {
    startMusic();
    advanceStory();
  });
}
renderStory();

// ====== KURULUM ======
function setupCanvas() {
  canvas = document.getElementById("game-canvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

function resizeCanvas() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  roadWidth = w * ROAD_WIDTH_RATIO;
  roadX0 = (w - roadWidth) / 2;
  shoulderWidth = roadX0;
  laneWidth = roadWidth / LANES;
  playerW = laneWidth * 0.38;
  playerH = playerW * 1.55;
  playerY = h - playerH - 56;
  currentX = laneCenterX(lane);
}

function laneCenterX(l) {
  return roadX0 + laneWidth * (l + 0.5);
}

// ====== OYUNU SIFIRLA / BAŞLAT ======
function resetGame() {
  lane = 1;
  distance = 0;
  stageIndex = 0;
  hearts = 0;
  heartsSpawned = 0;
  speed = BASE_SPEED;
  entities = [];
  signs = [];
  distSinceSpawn = 0;
  nextSpawnAt = 140;
  distSinceSign = 0;
  cityBannerFrames = CITY_BANNER_FRAMES;
  currentX = laneCenterX(lane);
  updateHud();
}

function startPlaying() {
  showScreen("play");
  resizeCanvas();
  state = "playing";
  if (!rafId) rafId = requestAnimationFrame(loop);
}

function updateHud() {
  const stage = document.getElementById("hud-stage");
  const hrs = document.getElementById("hud-hearts");
  if(stage) stage.textContent = STAGES[stageIndex].name.toUpperCase();
  if(hrs) hrs.textContent = `♥ ${hearts}/${TOTAL_HEARTS}`;
}

// ====== GİRİŞ ======
function changeLane(dir) {
  if (state !== "playing") return;
  lane = Math.max(0, Math.min(LANES - 1, lane + dir));
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") changeLane(-1);
  if (e.key === "ArrowRight") changeLane(1);
});

const tLeft = document.getElementById("touch-left");
const tRight = document.getElementById("touch-right");
if (tLeft) tLeft.addEventListener("click", () => changeLane(-1));
if (tRight) tRight.addEventListener("click", () => changeLane(1));

const bStart = document.getElementById("btn-start");
const bReplay = document.getElementById("btn-replay");
const bReplayWin = document.getElementById("btn-replay-win");

if (bStart) bStart.addEventListener("click", () => { resetGame(); startPlaying(); });
if (bReplay) bReplay.addEventListener("click", () => { resetGame(); startPlaying(); });
if (bReplayWin) bReplayWin.addEventListener("click", () => { resetGame(); startPlaying(); });

// ====== SPAWN ======
function spawnEntity() {
  const lanes = [0, 1, 2];
  const safeDistance = playerH * 3.5 + 80;

  const recentlyOccupied = new Set(
    entities
      .filter((e) => e.type === "obstacle" && e.y < safeDistance)
      .map((e) => e.lane)
  );

  let availableLanes = lanes.filter((l) => {
    if (recentlyOccupied.size >= 2 && !recentlyOccupied.has(l)) return false; 
    return true;
  });

  const combineThreshold = playerH + 30;
  const strictlyOccupied = new Set(
    entities
      .filter((e) => e.type === "obstacle" && e.y < combineThreshold)
      .map((e) => e.lane)
  );

  const freeLanes = availableLanes.filter((l) => !strictlyOccupied.has(l));
  let obstaclesToAdd = 0;
  
  if (ENABLE_OBSTACLES && freeLanes.length > 0) {
    const roll = Math.random();
    if (roll < 0.15) {
      obstaclesToAdd = 0; 
    } 
    else if (roll > 0.8 && freeLanes.length >= 2 && recentlyOccupied.size === 0) {
      obstaclesToAdd = 2;
    } 
    else {
      obstaclesToAdd = 1; 
    }
  }

  const shuffledFree = [...freeLanes].sort(() => Math.random() - 0.5);
  const chosenLanes = shuffledFree.slice(0, obstaclesToAdd);

  chosenLanes.forEach((l) => entities.push({ type: "obstacle", lane: l, y: -80 }));

  if (heartsSpawned < TOTAL_HEARTS && Math.random() < 0.45) {
    const heartCandidates = lanes.filter((l) => !chosenLanes.includes(l));
    if (heartCandidates.length > 0) {
      const heartLane = heartCandidates[Math.floor(Math.random() * heartCandidates.length)];
      entities.push({ type: "heart", lane: heartLane, y: -80 });
      heartsSpawned++;
    }
  }
}

function spawnSign() {
  const onLeft = Math.random() < 0.5;
  const x = onLeft ? roadX0 - shoulderWidth * 0.5 : roadX0 + roadWidth + shoulderWidth * 0.5;
  signs.push({ x, y: -100, text: STAGES[stageIndex].name });
}

// ====== GÜNCELLE ======
function update() {
  distance += speed;
  distSinceSpawn += speed;
  distSinceSign += speed;

  if (distSinceSpawn >= nextSpawnAt) {
    distSinceSpawn = 0;
    nextSpawnAt = 100 + Math.random() * 80;
    spawnEntity();
  }

  if (distSinceSign >= SIGN_GAP) {
    distSinceSign = 0;
    spawnSign();
  }

  if (cityBannerFrames > 0) cityBannerFrames--;

  currentX += (laneCenterX(lane) - currentX) * 0.22;

  const h = canvas.height / Math.min(window.devicePixelRatio || 1, 2);
  entities.forEach((e) => (e.y += speed));
  entities = entities.filter((e) => e.y < h + 100);

  signs.forEach((s) => (s.y += speed));
  signs = signs.filter((s) => s.y < h + 100);

  entities.forEach((e) => {
    if (e.hit) return;
    const ex = laneCenterX(e.lane);
    const overlapX = Math.abs(ex - currentX) < (playerW + laneWidth * 0.5) / 2;
    const overlapY = e.y + 40 > playerY && e.y - 40 < playerY + playerH;
    if (overlapX && overlapY) {
      e.hit = true;
      if (e.type === "heart") {
        hearts++;
        updateHud();
      } else {
        triggerGameOver();
      }
    }
  });
  entities = entities.filter((e) => !(e.hit && e.type === "heart"));

  const newStageIndex = Math.min(Math.floor(distance / STAGE_LENGTH), STAGES.length - 1);
  if (newStageIndex !== stageIndex) {
    stageIndex = newStageIndex;
    speed *= SPEED_GROWTH;
    cityBannerFrames = CITY_BANNER_FRAMES;
    updateHud();
  }

  if (distance >= STAGE_LENGTH * STAGES.length) {
    triggerWin();
  }
}

function triggerGameOver() {
  state = "gameover";
  cancelLoop();
  const stg = document.getElementById("gameover-stage");
  const hrt = document.getElementById("gameover-hearts");
  if(stg) stg.textContent = `Vardığın durak: ${STAGES[stageIndex].name}`;
  if(hrt) hrt.textContent = hearts;
  showScreen("gameover");
}

function triggerWin() {
  state = "win";
  cancelLoop();
  const wh = document.getElementById("win-hearts");
  if(wh) wh.textContent = `${hearts} / ${TOTAL_HEARTS}`;
  renderScoreboard(hearts);
  showScreen("win");
}

function renderScoreboard(collected) {
  const board = document.getElementById("love-scoreboard");
  if(!board) return;
  board.innerHTML = "";
  LOVE_TIERS.forEach((tier) => {
    const isActive = collected >= tier.min && collected <= tier.max;
    const row = document.createElement("div");
    row.className = "scoreboard-row" + (isActive ? " active" : "");
    if (isActive) {
      row.style.background = tier.color;
      row.style.color = "#2b1b2f";
    }
    const range = document.createElement("span");
    range.className = "scoreboard-range";
    range.textContent = `${tier.min}-${tier.max}`;
    const label = document.createElement("span");
    label.className = "scoreboard-label";
    label.textContent = tier.label;
    row.appendChild(range);
    row.appendChild(label);
    board.appendChild(row);
  });
}

function cancelLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// ====== ÇİZİM ======
function draw() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const stage = STAGES[stageIndex];

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, stage.sky[0]);
  grad.addColorStop(1, stage.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = stage.road;
  ctx.fillRect(roadX0, 0, roadWidth, h);

  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(roadX0, 0);
  ctx.lineTo(roadX0, h);
  ctx.moveTo(roadX0 + roadWidth, 0);
  ctx.lineTo(roadX0 + roadWidth, h);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 3;
  ctx.setLineDash([22, 18]);
  const dashOffset = -(distance % 40);
  for (let i = 1; i < LANES; i++) {
    ctx.beginPath();
    ctx.lineDashOffset = dashOffset;
    ctx.moveTo(roadX0 + laneWidth * i, 0);
    ctx.lineTo(roadX0 + laneWidth * i, h);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  signs.forEach((s) => drawSign(s.x, s.y, s.text));

  entities.forEach((e) => {
    if (e.type === "obstacle") drawCone(laneCenterX(e.lane), e.y);
    else drawHeart(laneCenterX(e.lane), e.y);
  });

  drawCar(currentX, playerY, playerW, playerH, stage.occupants);

  drawCityBanner(w, h, stage);
}

function drawSign(x, y, text) {
  const boardW = Math.min(shoulderWidth * 0.92, 92);
  const boardH = 34;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#5b3a29";
  ctx.fillRect(-3, boardH * 0.4, 6, 26);
  ctx.fillStyle = "#ffb4c6";
  roundRect(-boardW / 2, -boardH / 2, boardW, boardH, 8);
  ctx.fill();
  ctx.fillStyle = "#2b1b2f";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawCone(x, y) {
  const s = laneWidth * 0.28;
  ctx.fillStyle = "#ff7a3d";
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x - s * 0.6, y + s * 0.6);
  ctx.lineTo(x + s * 0.6, y + s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff3e0";
  ctx.fillRect(x - s * 0.45, y, s * 0.9, s * 0.14);
}

function drawHeart(x, y) {
  const s = laneWidth * 0.16;
  ctx.fillStyle = "#ff6f91";
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.7);
  ctx.bezierCurveTo(x - s * 1.3, y - s * 0.6, x - s * 0.4, y - s * 1.3, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.4, y - s * 1.3, x + s * 1.3, y - s * 0.6, x, y + s * 0.7);
  ctx.closePath();
  ctx.fill();
}

function drawCar(cx, y, w, h, occupants) {
  ctx.save();
  ctx.translate(cx, y);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, h + 8, w * 0.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e6342f";
  roundRect(-w / 2, 0, w, h, w * 0.22);
  ctx.fill();

  const hasBackSeat = occupants.length === 3;
  const cabinH = hasBackSeat ? h * 0.5 : h * 0.36;
  ctx.fillStyle = "#f3e0c5";
  roundRect(-w * 0.35, h * 0.13, w * 0.7, cabinH, w * 0.12);
  ctx.fill();

  if (occupants.length === 1) {
    drawMiniHead(0, h * 0.29, w * 0.19, occupants[0]);
  } else {
    drawMiniHead(-w * 0.17, h * 0.29, w * 0.16, occupants[0]);
    drawMiniHead(w * 0.17, h * 0.29, w * 0.16, occupants[1]);
    if (hasBackSeat) {
      drawMiniHead(0, h * 0.5, w * 0.12, occupants[2]);
    }
  }

  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(-w * 0.62, h * 0.14, w * 0.14, h * 0.22);
  ctx.fillRect(w * 0.48, h * 0.14, w * 0.14, h * 0.22);
  ctx.fillRect(-w * 0.62, h * 0.62, w * 0.14, h * 0.22);
  ctx.fillRect(w * 0.48, h * 0.62, w * 0.14, h * 0.22);
  ctx.fillStyle = "#ffe9a8";
  ctx.fillRect(-w * 0.32, h * 0.02, w * 0.18, h * 0.05);
  ctx.fillRect(w * 0.14, h * 0.02, w * 0.18, h * 0.05);
  ctx.restore();
}

function drawMiniHead(x, y, r, type) {
  const isCurly = type === "girl" || type === "child";
  const skin = type === "girl" ? "#c98a5e" : type === "guy" ? "#e0a978" : "#d9a679";
  const hair = type === "guy" || type === "child" ? "#8a5a34" : "#3b2314";
  const eyeColor = type === "guy" ? "#1f5c40" : "#2a1a12";

  ctx.save();
  ctx.translate(x, y);
  if (isCurly) {
    const curlCount = type === "child" ? 6 : 10;
    const curlDist = type === "child" ? r * 0.9 : r * 1.05;
    const curlSize = type === "child" ? r * 0.24 : r * 0.34;
    const angleStart = type === "child" ? Math.PI * 0.82 : Math.PI * 0.7;
    const angleEnd = type === "child" ? Math.PI * 2.18 : Math.PI * 2.3;
    for (let i = 0; i < curlCount; i++) {
      const angle = angleStart + (i / (curlCount - 1)) * (angleEnd - angleStart);
      ctx.beginPath();
      ctx.fillStyle = hair;
      ctx.arc(Math.cos(angle) * curlDist, Math.sin(angle) * curlDist, curlSize, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = hair;
    const hairAngleStart = Math.PI * 0.85;
    const hairAngleEnd = Math.PI * 2.15;
    const steps = 20;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = hairAngleStart + t * (hairAngleEnd - hairAngleStart);
      const bulge = Math.sin(t * Math.PI);
      const radius = r * (1.04 + bulge * 0.62);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.05, r * 0.12, 0, Math.PI * 2);
  ctx.arc(r * 0.32, -r * 0.05, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCityBanner(w, h, stage) {
  if (cityBannerFrames <= 0) return;
  const t = 1 - cityBannerFrames / CITY_BANNER_FRAMES;
  let alpha;
  if (t < 0.15) alpha = t / 0.15;
  else if (t > 0.75) alpha = (1 - t) / 0.25;
  else alpha = 1;

  const lines = [
    { text: stage.eyebrow || "YENİ ŞEHİR", color: "#ffb4c6", size: 12, weight: 700 },
    { text: stage.name, color: "#fff6f0", size: Math.min(40, w * 0.11), weight: 700 },
  ];
  if (stage.year) lines.push({ text: stage.year, color: "#ffe5a8", size: 16, weight: 600 });
  if (stage.note) lines.push({ text: stage.note, color: "#ffe5a8", size: 14, weight: 600 });

  const bandH = h * (0.15 + lines.length * 0.06);
  const bandY = h * 0.5 - bandH / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(20,10,20,0.45)";
  ctx.fillRect(0, bandY, w, bandH);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const step = bandH / (lines.length + 1);
  lines.forEach((line, i) => {
    ctx.fillStyle = line.color;
    ctx.font = `${line.weight} ${line.size}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText(line.text, w / 2, bandY + step * (i + 1));
  });
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ====== DÖNGÜ ======
function loop() {
  if (state !== "playing") {
    rafId = null;
    return;
  }
  update();
  draw();
  if (state === "playing") {
    rafId = requestAnimationFrame(loop);
  } else {
    rafId = null;
  }
}

// ====== BAŞLAT ======
setupCanvas();
resetGame();
