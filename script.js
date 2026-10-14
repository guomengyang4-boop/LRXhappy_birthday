const cover = document.querySelector(".birthday-cover");
const canvas = document.querySelector("#petals");
const replayButton = document.querySelector("#replay");
const enterWishButton = document.querySelector("#enterWish");
const wishBackButton = document.querySelector("#wishBack");
const wishScene = document.querySelector("#wishScene");
const blowButton = document.querySelector("#blowButton");
const blowStatus = document.querySelector("#blowStatus");
const candles = [...document.querySelectorAll(".candle")];
const context = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let petals = [];
let animationFrame = 0;
let holdFrame = 0;
let holdStartedAt = 0;
let isHolding = false;
const HOLD_DURATION = 3000;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function makePetal(initial = false) {
  return {
    x: Math.random() * window.innerWidth,
    y: initial ? Math.random() * window.innerHeight : -30,
    size: 3 + Math.random() * 5,
    speed: .18 + Math.random() * .38,
    sway: Math.random() * Math.PI * 2,
    spin: Math.random() * Math.PI,
    opacity: .14 + Math.random() * .28
  };
}

function seedPetals() {
  petals = Array.from({ length: Math.min(30, Math.max(14, Math.floor(window.innerWidth / 38))) }, () => makePetal(true));
}

function drawPetals(time) {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  petals.forEach((petal, index) => {
    petal.y += petal.speed;
    petal.x += Math.sin(time / 1800 + petal.sway) * .18;
    petal.spin += .004;
    if (petal.y > window.innerHeight + 20) petals[index] = makePetal();

    context.save();
    context.translate(petal.x, petal.y);
    context.rotate(petal.spin);
    context.scale(1, .62);
    context.beginPath();
    context.ellipse(0, 0, petal.size, petal.size * .72, 0, 0, Math.PI * 2);
    context.fillStyle = `rgba(236, 180, 172, ${petal.opacity})`;
    context.fill();
    context.restore();
  });
  animationFrame = requestAnimationFrame(drawPetals);
}

function replay() {
  cover.classList.add("is-restarting");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => cover.classList.remove("is-restarting"));
  });
}

function openWishScene() {
  document.body.classList.add("show-wish");
  wishScene.setAttribute("aria-hidden", "false");
  window.setTimeout(() => blowButton.focus(), reducedMotion.matches ? 0 : 1250);
}

function closeWishScene() {
  cancelHold();
  document.body.classList.remove("show-wish");
  wishScene.setAttribute("aria-hidden", "true");
  enterWishButton.focus();
}

function extinguishCandle(candle) {
  if (candle.classList.contains("is-out")) return;
  candle.classList.add("is-out");
}

function extinguishAll() {
  candles.forEach((candle, index) => {
    window.setTimeout(() => extinguishCandle(candle), index * 120);
  });
  window.setTimeout(completeWish, 720);
}

function completeWish() {
  wishScene.classList.add("is-complete");
  blowStatus.textContent = "蜡烛已经全部熄灭";
}

function setHoldProgress(progress) {
  blowButton.style.setProperty("--hold-progress", `${Math.min(progress, 1) * 360}deg`);
}

function updateHold(time) {
  if (!isHolding) return;
  const progress = (time - holdStartedAt) / HOLD_DURATION;
  setHoldProgress(progress);
  const remaining = Math.max(0, Math.ceil((HOLD_DURATION - (time - holdStartedAt)) / 1000));
  blowStatus.textContent = remaining ? `继续按住… ${remaining}` : "愿望送达";
  if (progress >= 1) {
    isHolding = false;
    blowButton.classList.remove("is-holding");
    blowButton.disabled = true;
    extinguishAll();
    return;
  }
  holdFrame = requestAnimationFrame(updateHold);
}

function startHold(event) {
  if (isHolding || blowButton.disabled) return;
  event.preventDefault();
  if (event.pointerId !== undefined) event.currentTarget.setPointerCapture?.(event.pointerId);
  isHolding = true;
  holdStartedAt = performance.now();
  blowButton.classList.add("is-holding");
  blowStatus.textContent = "继续按住… 3";
  holdFrame = requestAnimationFrame(updateHold);
}

function cancelHold() {
  if (!isHolding) return;
  isHolding = false;
  cancelAnimationFrame(holdFrame);
  blowButton.classList.remove("is-holding");
  setHoldProgress(0);
  blowStatus.textContent = "松开得有点早，再长按 3 秒试试";
}

resizeCanvas();
seedPetals();
if (!reducedMotion.matches) animationFrame = requestAnimationFrame(drawPetals);

window.addEventListener("resize", () => {
  resizeCanvas();
  seedPetals();
});
replayButton.addEventListener("click", replay);
enterWishButton.addEventListener("click", openWishScene);
wishBackButton.addEventListener("click", closeWishScene);
blowButton.addEventListener("pointerdown", startHold);
blowButton.addEventListener("pointerup", cancelHold);
blowButton.addEventListener("pointercancel", cancelHold);
blowButton.addEventListener("contextmenu", event => event.preventDefault());
blowButton.addEventListener("keydown", event => {
  if ((event.key === " " || event.key === "Enter") && !event.repeat) startHold(event);
});
blowButton.addEventListener("keyup", event => {
  if (event.key === " " || event.key === "Enter") cancelHold();
});
window.addEventListener("pagehide", () => {
  cancelAnimationFrame(animationFrame);
  cancelHold();
});
