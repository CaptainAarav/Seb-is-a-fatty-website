// ----- DOM Refs -----
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginSection = document.getElementById("loginSection");
const adminContent = document.getElementById("adminContent");
const welcomeMsg = document.getElementById("welcomeMsg");

const announcementInput = document.getElementById("announcementInput");
const postAnnouncementBtn = document.getElementById("postAnnouncementBtn");

const eventNameInput = document.getElementById("eventNameInput");
const eventMultiplierInput = document.getElementById("eventMultiplierInput");
const setEventBtn = document.getElementById("setEventBtn");
const clearEventBtn = document.getElementById("clearEventBtn");

const lbList = document.getElementById("leaderboardList");

const resetPlayerInput = document.getElementById("resetPlayerInput");
const resetPlayerBtn = document.getElementById("resetPlayerBtn");
const resetAllBtn = document.getElementById("resetAllBtn");

// ----- Login -----
loginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await window.auth.signInWithPopup(provider);
  } catch (err) {
    console.warn("Popup login failed, trying redirect:", err.message);
    await window.auth.signInWithRedirect(provider);
  }
});

// ----- Logout -----
logoutBtn.addEventListener("click", async () => {
  try {
    await window.auth.signOut();
    alert("Logged out!");
    location.reload();
  } catch (err) {
    alert("Logout failed: " + err.message);
  }
});

// ----- Auth State -----
window.auth.onAuthStateChanged(user => {
  console.log("🔑 Auth state changed:", user?.email);
  if (user && user.email === "aaravsahni1037@gmail.com") {
    console.log("✅ Admin login success:", user.email);
    loginSection.classList.add("hidden");
    adminContent.classList.remove("hidden");
    welcomeMsg.textContent = `Welcome, ${user.displayName || user.email}`;
    loadLeaderboard();
    // 🔹 Only refresh once per minute
    setInterval(loadLeaderboard, 60000);
  } else {
    loginSection.classList.remove("hidden");
    adminContent.classList.add("hidden");
    if (user) console.warn("⚠️ Wrong Gmail:", user.email);
  }
});

// ----- Post Announcement -----
postAnnouncementBtn.addEventListener("click", async () => {
  const msg = announcementInput.value.trim();
  if (!msg) return;
  try {
    await window.db.collection("announcements").add({
      message: msg,
      created: Date.now()
    });
    console.log("✅ Announcement posted:", msg);
    alert("Announcement posted!");
    announcementInput.value = "";
  } catch (err) {
    console.error("❌ Failed to post announcement:", err);
    alert("Failed to post: " + err.message);
  }
});

// ----- Set Event -----
setEventBtn.addEventListener("click", async () => {
  const name = eventNameInput.value.trim();
  const multiplier = parseFloat(eventMultiplierInput.value);
  if (!name || isNaN(multiplier)) return;
  try {
    await window.db.collection("events").doc("current").set({
      name,
      multiplier,
      created: Date.now()
    });
    console.log(`✅ Event set: ${name} x${multiplier}`);
    alert("Event set!");
  } catch (err) {
    console.error("❌ Failed to set event:", err);
    alert("Failed to set event: " + err.message);
  }
});

// ----- Clear Event -----
clearEventBtn.addEventListener("click", async () => {
  try {
    await window.db.collection("events").doc("current").delete();
    console.log("✅ Event cleared");
    alert("Event cleared!");
  } catch (err) {
    console.error("❌ Failed to clear event:", err);
    alert("Failed to clear event: " + err.message);
  }
});

// ----- Load Leaderboard -----
async function loadLeaderboard() {
  lbList.innerHTML = "";
  console.log("📊 Loading leaderboard...");
  try {
    const snap = await window.db.collection("leaderboard")
      .orderBy("score", "desc")
      .limit(50) // 🔹 50 players max
      .get();

    snap.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");
      li.textContent = `${doc.id} — ${d.score}`;
      lbList.appendChild(li);
    });

    if (lbList.children.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No players yet.";
      lbList.appendChild(li);
    }

    console.log("✅ Leaderboard loaded with", lbList.children.length, "entries");
  } catch (err) {
    console.error("❌ Leaderboard load error:", err);
    const li = document.createElement("li");
    li.textContent = "Error loading leaderboard.";
    lbList.appendChild(li);
  }
}

// ----- Reset Scores -----
resetPlayerBtn.addEventListener("click", async () => {
  const player = resetPlayerInput.value.trim();
  if (!player) return;
  try {
    await window.db.collection("leaderboard").doc(player).set({
      score: 0,
      updated: Date.now(),
      forceReset: true
    }, { merge: true });
    console.log(`✅ Player reset: ${player}`);
    alert(`Reset ${player}'s score to 0!`);
    loadLeaderboard();
  } catch (err) {
    console.error("❌ Failed to reset player:", err);
    alert("Failed to reset: " + err.message);
  }
});

resetAllBtn.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to reset ALL scores?")) return;
  try {
    const snap = await window.db.collection("leaderboard").get();
    const batch = window.db.batch();
    let count = 0;
    snap.forEach(doc => {
      batch.set(doc.ref, { score: 0, updated: Date.now(), forceReset: true }, { merge: true });
      count++;
    });
    await batch.commit();
    console.log(`✅ Reset ALL scores (${count} players)`);
    alert("All scores reset!");
    loadLeaderboard();
  } catch (err) {
    console.error("❌ Failed to reset all:", err);
    alert("Failed to reset all: " + err.message);
  }
});
