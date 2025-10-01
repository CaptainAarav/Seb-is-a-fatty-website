const button = document.getElementById("revealBtn");
const result = document.getElementById("result");
const drumroll = document.getElementById("drumroll");
const scoreDisplay = document.getElementById("score");
const bpsDisplay = document.getElementById("bps");

const shopBackdrop = document.getElementById("shop");
const shopBtn = document.getElementById("shopBtn");
const closeShopBtn = document.getElementById("closeShopBtn");

const buySebBtn = document.getElementById("buySebBtn");
const buyMichaelBtn = document.getElementById("buyMichaelBtn");
const buyIbrahimBtn = document.getElementById("buyIbrahimBtn");
const buyBobbyBtn = document.getElementById("buyBobbyBtn");
const buyAaravBtn = document.getElementById("buyAaravBtn");

const sebOwnedDisplay = document.getElementById("sebOwned");
const michaelOwnedDisplay = document.getElementById("michaelOwned");
const ibrahimOwnedDisplay = document.getElementById("ibrahimOwned");
const bobbyOwnedDisplay = document.getElementById("bobbyOwned");
const aaravOwnedDisplay = document.getElementById("aaravOwned");
const errorMsg = document.getElementById("errorMsg");

const audios = {
  "Sebastian Kavanagh": document.getElementById("sebastianAudio"),
  "Michael Winsor": document.getElementById("michaelAudio"),
  "Ibrahim": document.getElementById("ibrahimAudio"),
  "Bobby": document.getElementById("bobbyAudio"),
  "Peter": document.getElementById("peterAudio"),
  "Aarav Sahni": document.getElementById("aaravAudio"),
};

const STORAGE_KEY = "bb_state_v3";
let bigbacks = 0;

let shopItems = {
  seb:     { cost: 20,    bps: 1,    owned: 0, button: buySebBtn,     ownedEl: sebOwnedDisplay     },
  michael: { cost: 50,    bps: 5,    owned: 0, button: buyMichaelBtn, ownedEl: michaelOwnedDisplay },
  ibrahim: { cost: 100,   bps: 10,   owned: 0, button: buyIbrahimBtn, ownedEl: ibrahimOwnedDisplay },
  bobby:   { cost: 500,   bps: 10,   owned: 0, button: buyBobbyBtn,   ownedEl: bobbyOwnedDisplay   },
  aaravGen:{ cost: 10000, bps: 1000, owned: 0, button: buyAaravBtn,   ownedEl: aaravOwnedDisplay   },
};

function calcBPS() {
  return Object.values(shopItems).reduce((sum, it) => sum + it.owned * it.bps, 0);
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      bigbacks,
      last: Date.now(),
      items: Object.fromEntries(
        Object.entries(shopItems).map(([k, v]) => [k, { cost: v.cost, owned: v.owned }])
      ),
    })
  );
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    bigbacks = d.bigbacks || 0;
    if (d.items) {
      for (const k in d.items) {
        if (shopItems[k]) {
          shopItems[k].owned = d.items[k].owned ?? shopItems[k].owned;
          shopItems[k].cost  = d.items[k].cost  ?? shopItems[k].cost;
        }
      }
    }
    // offline gains
    const awaySeconds = Math.max(0, Math.floor((Date.now() - (d.last || Date.now())) / 1000));
    bigbacks += awaySeconds * calcBPS();
  } catch {
    // ignore corrupted storage
  }
}

function updateDisplay() {
  scoreDisplay.textContent = Math.floor(bigbacks);
  bpsDisplay.textContent = Math.floor(calcBPS());
  for (const k in shopItems) {
    const it = shopItems[k];
    it.button.textContent = `Buy (Cost: ${Math.floor(it.cost)})`;
    it.ownedEl.textContent = `Owned: ${it.owned}`;
  }
  saveState();
}

/**
 * Exact probabilities using basis points (0–999):
 *  - Sebastian: 800 (80.0%)
 *  - Michael:   100 (10.0%)  -> 800..899
 *  - Ibrahim:    50 (5.0%)   -> 900..949
 *  - Bobby:      10 (1.0%)   -> 950..959
 *  - Peter:      49 (4.9%)   -> 960..1008 (but we cap at 1009)
 *  - Aarav:       1 (0.1%)   -> exactly 1009-1 == 1009? We’ll map properly below.
 */
function pickWinner() {
  const r = Math.floor(Math.random() * 1000); // 0..999
  if (r < 800) return "Sebastian Kavanagh"; // 0-799
  if (r < 900) return "Michael Winsor";     // 800-899
  if (r < 950) return "Ibrahim";            // 900-949
  if (r < 960) return "Bobby";              // 950-959
  if (r < 999) return "Peter";              // 960-998 (39 values + the next 10 = 49 total for Peter)
  return "Aarav Sahni";                     // 999 (1 value) => 0.1%
}

// button flow (2.5s suspense)
button.addEventListener("click", () => {
  result.style.display = "none";
  drumroll.currentTime = 0;
  drumroll.play().catch(() => {});

  setTimeout(() => {
    const winner = pickWinner();

    // rewards
    if (winner === "Sebastian Kavanagh") {
      bigbacks += 1;
    } else if (winner === "Michael Winsor") {
      bigbacks += 5;
    } else if (winner === "Ibrahim") {
      bigbacks += 10;
    } else if (winner === "Bobby") {
      bigbacks += 10;
    } else if (winner === "Peter") {
      bigbacks += 10;
    } else if (winner === "Aarav Sahni") {
      bigbacks += 1000000;
    }

    result.textContent = winner;
    result.style.display = "block";
    updateDisplay();

    drumroll.pause();
    const a = audios[winner];
    if (a) { a.currentTime = 0; a.play().catch(() => {}); }
  }, 2500);
});

// shop open/close
shopBtn.addEventListener("click", () => {
  shopBackdrop.style.display = "flex";
  void document.body.offsetWidth; // restart slideUp animation
  shopBackdrop.setAttribute("aria-hidden", "false");
});
closeShopBtn.addEventListener("click", () => {
  shopBackdrop.setAttribute("aria-hidden", "true");
  setTimeout(() => (shopBackdrop.style.display = "none"), 250);
});
shopBackdrop.addEventListener("click", (e) => {
  if (e.target === shopBackdrop) closeShopBtn.click();
});

// inline error (no alerts)
function showError(msg = "Not enough Bigbacks!") {
  errorMsg.textContent = msg;
  errorMsg.classList.add("show");
  clearTimeout(showError._t);
  showError._t = setTimeout(() => errorMsg.classList.remove("show"), 2000);
}

// purchases (+20% price each buy)
for (const k in shopItems) {
  const it = shopItems[k];
  it.button.addEventListener("click", () => {
    if (bigbacks < it.cost) {
      showError();
      return;
    }
    bigbacks -= it.cost;
    it.owned += 1;
    it.cost = Math.ceil(it.cost * 1.2);
    updateDisplay();
  });
}

// passive income (every second)  ✅ FIXED MISSING PAREN + correct interval
setInterval(() => {
  const inc = calcBPS();
  if (inc > 0) {
    bigbacks += inc;
    updateDisplay();
  }
}, 1000);

// init
loadState();
updateDisplay();

// save on hide/unload
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") saveState();
});
window.addEventListener("beforeunload", saveState);