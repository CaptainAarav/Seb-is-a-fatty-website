document.addEventListener("DOMContentLoaded", () => {
  // HUD
  const scoreDisplay = document.getElementById("score");
  const bpsDisplay = document.getElementById("bps");
  const errorMsg = document.getElementById("errorMsg");

  // Leaderboard
  const lbList = document.getElementById("leaderboardList");
  const leaderboardBtn = document.getElementById("leaderboardBtn");
  const lbBackdrop = document.getElementById("leaderboardBackdrop");
  const closeLeaderboardBtn = document.getElementById("closeLeaderboardBtn");
  const quotaBanner = document.getElementById("quotaBanner");

  const STORAGE_KEY = "bb_state_v4";
  const NAME_KEY = "bb_player_name";
  let bigbacks = 0;
  let eventMultiplier = 1;
  let playerName = (localStorage.getItem(NAME_KEY) || "").trim();
  let lastPushAt = 0;

  // Shop Items
  const shopItems = {
    seb:       { cost: 20,        bps: 1,          owned: 0, button: document.getElementById("buySebBtn"),       ownedEl: document.getElementById("sebOwned") },
    michael:   { cost: 50,        bps: 5,          owned: 0, button: document.getElementById("buyMichaelBtn"),   ownedEl: document.getElementById("michaelOwned") },
    ibrahim:   { cost: 100,       bps: 10,         owned: 0, button: document.getElementById("buyIbrahimBtn"),   ownedEl: document.getElementById("ibrahimOwned") },
    bobby:     { cost: 500,       bps: 100,        owned: 0, button: document.getElementById("buyBobbyBtn"),     ownedEl: document.getElementById("bobbyOwned") },
    peterGen:  { cost: 5000,      bps: 3000,       owned: 0, button: document.getElementById("buyPeterBtn"),     ownedEl: document.getElementById("peterOwned") },
    aaravGen:  { cost: 10000,     bps: 1000,       owned: 0, button: document.getElementById("buyAaravBtn"),     ownedEl: document.getElementById("aaravOwned") },
    alex:      { cost: 100000,    bps: 10000,      owned: 0, button: document.getElementById("buyAlexBtn"),      ownedEl: document.getElementById("alexOwned") },
    oscar:     { cost: 1000000,   bps: 100000,     owned: 0, button: document.getElementById("buyOscarBtn"),     ownedEl: document.getElementById("oscarOwned") },
    sebUltimate:{ cost: 1000000000, bps: 10000000, owned: 0, button: document.getElementById("buySebUltimateBtn"), ownedEl: document.getElementById("sebUltimateOwned") },
    harvey:    { cost: 5000000000, bps: 300000000, owned: 0, button: document.getElementById("buyHarveyBtn"),    ownedEl: document.getElementById("harveyOwned") },
  };

  const db = window._db || null;

  function calcBPS() {
    return Object.values(shopItems).reduce((s,i)=>s+i.owned*i.bps,0);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bigbacks, last: Date.now(),
      items: Object.fromEntries(Object.entries(shopItems).map(([k,v])=>[k,{cost:v.cost, owned:v.owned}]))
    }));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      bigbacks = d.bigbacks || 0;
      if (d.items){
        for (const k in d.items){
          if (shopItems[k]){
            shopItems[k].owned = d.items[k].owned ?? 0;
            shopItems[k].cost  = d.items[k].cost ?? shopItems[k].cost;
          }
        }
      }
    } catch {}
  }

  function updateDisplay(){
    scoreDisplay.textContent = Math.floor(bigbacks);
    bpsDisplay.textContent   = Math.floor(calcBPS() * eventMultiplier);
    for (const k in shopItems){
      const it = shopItems[k];
      it.button.textContent = `Buy (Cost: ${Math.floor(it.cost)})`;
      it.ownedEl.textContent = `Owned: ${it.owned}`;
    }
    saveState();
    maybePushLeaderboard();
  }

  // Shop buy logic
  for (const k in shopItems){
    const it = shopItems[k];
    it.button.addEventListener("click", ()=>{
      if (bigbacks < it.cost){
        errorMsg.textContent = "Not enough Bigbacks!";
        errorMsg.classList.add("show");
        setTimeout(()=> errorMsg.classList.remove("show"),2000);
        return;
      }
      bigbacks -= it.cost;
      it.owned++;
      it.cost = Math.ceil(it.cost * 1.2);
      updateDisplay();
    });
  }

  setInterval(()=>{
    bigbacks += calcBPS() * eventMultiplier;
    updateDisplay();
  },1000);

  // Leaderboard
  async function maybePushLeaderboard(force=false){
    if (!db || !playerName) return;
    const now = Date.now();
    if (!force && (now - lastPushAt < 60000)) return;
    try {
      await db.collection("leaderboard").doc(playerName).set({
        score: Math.floor(bigbacks),
        updated: now
      }, { merge: true });
      lastPushAt = now;
      quotaBanner.classList.add("hidden");
    } catch(e) {
      console.error("Leaderboard update failed:", e);
      if (e.code === "resource-exhausted") {
        quotaBanner.textContent = "⚠️ Leaderboard unavailable (quota exceeded, try again later).";
        quotaBanner.classList.remove("hidden");
      }
    }
  }

  async function loadLeaderboard(){
    lbList.innerHTML = "";
    if (!db) return;
    try {
      const snap = await db.collection("leaderboard").orderBy("score","desc").limit(20).get();
      snap.forEach(doc=>{
        const d = doc.data();
        const li = document.createElement("li");
        li.textContent = `${doc.id} — ${d.score}`;
        lbList.appendChild(li);
      });
      quotaBanner.classList.add("hidden");
    } catch(e) {
      console.error("Leaderboard load failed:", e);
      if (e.code === "resource-exhausted") {
        quotaBanner.textContent = "⚠️ Leaderboard unavailable (quota exceeded, try again later).";
        quotaBanner.classList.remove("hidden");
      }
    }
  }

  leaderboardBtn.addEventListener("click", ()=>{
    loadLeaderboard();
    lbBackdrop.style.display = "flex";
    lbBackdrop.setAttribute("aria-hidden","false");
  });
  closeLeaderboardBtn.addEventListener("click", ()=>{
    lbBackdrop.setAttribute("aria-hidden","true");
    setTimeout(()=> lbBackdrop.style.display="none",250);
  });

  // Init
  loadState();
  updateDisplay();
  setInterval(loadLeaderboard, 60000);
});
