// ----- DOM Refs -----
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

// Leaderboard DOM
const leaderboardBtn = document.getElementById("leaderboardBtn");
const lbBackdrop = document.getElementById("leaderboardBackdrop");
const closeLeaderboardBtn = document.getElementById("closeLeaderboardBtn");
const lbList = document.getElementById("leaderboardList");
const nameRow = document.getElementById("nameRow");
const playerNameInput = document.getElementById("playerNameInput");
const saveNameBtn = document.getElementById("saveNameBtn");
const youAre = document.getElementById("youAre");

// Audio map
const audios = {
  "Sebastian Kavanagh": document.getElementById("sebastianAudio"),
  "Michael Winsor": document.getElementById("michaelAudio"),
  "Ibrahim": document.getElementById("ibrahimAudio"),
  "Bobby": document.getElementById("bobbyAudio"),
  "Peter": document.getElementById("peterAudio"),
  "Aarav Sahni": document.getElementById("aaravAudio"),
};

// ----- Game State -----
const STORAGE_KEY = "bb_state_v3";
const NAME_KEY = "bb_player_name";
let bigbacks = 0;

let shopItems = {
  seb:     { cost: 20,    bps: 1,    owned: 0, button: buySebBtn,     ownedEl: sebOwnedDisplay     },
  michael: { cost: 50,    bps: 5,    owned: 0, button: buyMichaelBtn, ownedEl: michaelOwnedDisplay },
  ibrahim: { cost: 100,   bps: 10,   owned: 0, button: buyIbrahimBtn, ownedEl: ibrahimOwnedDisplay },
  bobby:   { cost: 500,   bps: 10,   owned: 0, button: buyBobbyBtn,   ownedEl: bobbyOwnedDisplay   },
  aaravGen:{ cost: 10000, bps: 1000, owned: 0, button: buyAaravBtn,   ownedEl: aaravOwnedDisplay   },
};

function calcBPS(){
  return Object.values(shopItems).reduce((s,i)=>s+i.owned*i.bps,0);
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    bigbacks, last: Date.now(),
    items: Object.fromEntries(Object.entries(shopItems).map(([k,v])=>[k,{cost:v.cost, owned:v.owned}]))
  }));
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;
  try{
    const d = JSON.parse(raw);
    bigbacks = d.bigbacks || 0;
    if (d.items){
      for (const k in d.items){
        if (shopItems[k]){
          shopItems[k].owned = d.items[k].owned ?? shopItems[k].owned;
          shopItems[k].cost  = d.items[k].cost  ?? shopItems[k].cost;
        }
      }
    }
    const away = Math.max(0, Math.floor((Date.now() - (d.last || Date.now()))/1000));
    bigbacks += away * calcBPS();
  }catch{}
}

function updateDisplay(){
  scoreDisplay.textContent = Math.floor(bigbacks);
  bpsDisplay.textContent   = Math.floor(calcBPS());
  for (const k in shopItems){
    const it = shopItems[k];
    it.button.textContent = `Buy (Cost: ${Math.floor(it.cost)})`;
    it.ownedEl.textContent = `Owned: ${it.owned}`;
  }
  saveState();
  maybePushLeaderboard();
}

// RNG
function pickWinner(){
  const r = Math.floor(Math.random()*1000);
  if (r < 800) return "Sebastian Kavanagh"; // 80%
  if (r < 900) return "Michael Winsor";     // 10%
  if (r < 950) return "Ibrahim";            // 5%
  if (r < 960) return "Bobby";              // 1%
  if (r < 999) return "Peter";              // 3.9%
  return "Aarav Sahni";                     // 0.1%
}

// Reveal button
button.addEventListener("click", ()=>{
  result.style.display = "none";
  drumroll.currentTime = 0;
  drumroll.play().catch(()=>{});

  setTimeout(()=>{
    const winner = pickWinner();
    if (winner==="Sebastian Kavanagh") bigbacks += 1;
    else if (winner==="Michael Winsor") bigbacks += 5;
    else if (["Ibrahim","Bobby","Peter"].includes(winner)) bigbacks += 10;
    else if (winner==="Aarav Sahni") bigbacks += 1000000;

    result.textContent = winner;
    result.style.display = "block";
    updateDisplay();

    drumroll.pause();
    const a = audios[winner];
    if (a){ a.currentTime = 0; a.play().catch(()=>{}); }
  }, 2500);
});

// Shop
shopBtn.addEventListener("click", ()=>{
  shopBackdrop.style.display = "flex";
  void document.body.offsetWidth;
  shopBackdrop.setAttribute("aria-hidden","false");
});
closeShopBtn.addEventListener("click", ()=>{
  shopBackdrop.setAttribute("aria-hidden","true");
  setTimeout(()=> shopBackdrop.style.display = "none", 250);
});
shopBackdrop.addEventListener("click", (e)=>{
  if (e.target === shopBackdrop) closeShopBtn.click();
});

function showError(msg="Not enough Bigbacks!"){
  errorMsg.textContent = msg;
  errorMsg.classList.add("show");
  clearTimeout(showError._t);
  showError._t = setTimeout(()=> errorMsg.classList.remove("show"), 2000);
}

for (const k in shopItems){
  const it = shopItems[k];
  it.button.addEventListener("click", ()=>{
    if (bigbacks < it.cost){ showError(); return; }
    bigbacks -= it.cost;
    it.owned += 1;
    it.cost = Math.ceil(it.cost * 1.2);
    updateDisplay();
  });
}

setInterval(()=>{
  const inc = calcBPS();
  if (inc > 0){
    bigbacks += inc;
    updateDisplay();
  }
}, 1000);

// ----- Leaderboard -----
const db = window._db || null;
let playerName = (localStorage.getItem(NAME_KEY) || "").trim().slice(0,24) || "";
let lastPushAt = 0;
let lastPushedScore = -1;

function refreshNameUI(){
  if (playerName){
    nameRow.classList.add("hidden");
    youAre.classList.remove("hidden");
    youAre.textContent = `You are: ${playerName}`;
  } else {
    nameRow.classList.remove("hidden");
    youAre.classList.add("hidden");
  }
}

saveNameBtn.addEventListener("click", ()=>{
  const val = (playerNameInput.value || "").trim().slice(0,24);
  if (!val) return;
  playerName = val;
  localStorage.setItem(NAME_KEY, playerName);
  refreshNameUI();
  maybePushLeaderboard(true);
  loadLeaderboard();
});

async function maybePushLeaderboard(force=false){
  if (!db || !playerName) return;
  const now = Date.now();
  const score = Math.floor(bigbacks);
  if (!force && (now - lastPushAt < 10000) && Math.abs(score - lastPushedScore) < 100) return;
  try{
    await db.collection("leaderboard").doc(playerName).set({
      score: score,
      updated: now
    });
    lastPushAt = now;
    lastPushedScore = score;
  }catch(e){ console.warn("Failed to update leaderboard:", e); }
}

async function loadLeaderboard(){
  lbList.innerHTML = "";
  if (!db){
    const li = document.createElement("li");
    li.textContent = "Leaderboard not connected.";
    lbList.appendChild(li);
    return;
  }
  try{
    const snap = await db.collection("leaderboard").orderBy("score","desc").limit(20).get();
    let rank = 1;
    snap.forEach(doc=>{
      const d = doc.data();
      const li = document.createElement("li");
      li.textContent = `${rank}. ${doc.id} — ${d.score}`;
      lbList.appendChild(li);
      rank++;
    });
    if (rank === 1){
      const li = document.createElement("li");
      li.textContent = "No entries yet.";
      lbList.appendChild(li);
    }
  }catch(e){
    const li = document.createElement("li");
    li.textContent = "Error loading leaderboard.";
    lbList.appendChild(li);
  }
}

leaderboardBtn.addEventListener("click", ()=>{
  refreshNameUI();
  loadLeaderboard();
  lbBackdrop.style.display = "flex";
  void document.body.offsetWidth;
  lbBackdrop.setAttribute("aria-hidden","false");
});
closeLeaderboardBtn.addEventListener("click", ()=>{
  lbBackdrop.setAttribute("aria-hidden","true");
  setTimeout(()=> lbBackdrop.style.display = "none", 250);
});
lbBackdrop.addEventListener("click", (e)=>{
  if (e.target === lbBackdrop) closeLeaderboardBtn.click();
});

// Init
loadState();
updateDisplay();
refreshNameUI();