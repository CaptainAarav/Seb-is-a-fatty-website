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
const resetAllBtn = document.getElementById("resetAllBtn");

const db = window._db;

// ----- Login -----
loginBtn.addEventListener("click", async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithPopup(provider);
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// ----- Logout -----
logoutBtn.addEventListener("click", async () => {
  try {
    await firebase.auth().signOut();
    alert("Logged out!");
    location.reload();
  } catch (err) {
    alert("Logout failed: " + err.message);
  }
});

// ----- Auth State -----
firebase.auth().onAuthStateChanged(user => {
  if (user && user.email === "aaravsahni1037@gmail.com") {
    loginSection.classList.add("hidden");
    adminContent.classList.remove("hidden");
    welcomeMsg.textContent = `Welcome, ${user.displayName || user.email}`;
    loadLeaderboard();
  } else {
    loginSection.classList.remove("hidden");
    adminContent.classList.add("hidden");
  }
});

// ----- Post Announcement -----
postAnnouncementBtn.addEventListener("click", async () => {
  const msg = announcementInput.value.trim();
  if (!msg) return;
  try {
    await db.collection("announcements").add({
      message: msg,
      created: Date.now()
    });
    alert("Announcement posted!");
    announcementInput.value = "";
  } catch (err) {
    alert("Failed to post: " + err.message);
  }
});

// ----- Set Event -----
setEventBtn.addEventListener("click", async () => {
  const name = eventNameInput.value.trim();
  const multiplier = parseFloat(eventMultiplierInput.value);
  if (!name || isNaN(multiplier)) return;
  try {
    await db.collection("events").doc("current").set({
      name,
      multiplier,
      created: Date.now()
    });
    alert("Event set!");
  } catch (err) {
    alert("Failed to set event: " + err.message);
  }
});

// ----- Clear Event -----
clearEventBtn.addEventListener("click", async () => {
  try {
    await db.collection("events").doc("current").delete();
    alert("Event cleared!");
  } catch (err) {
    alert("Failed to clear event: " + err.message);
  }
});

// ----- Reset Individual Player -----
async function resetPlayerScore(playerName) {
  if (!confirm(`Reset score for ${playerName}?`)) return;
  try {
    await db.collection("leaderboard").doc(playerName).set({
      score: 0,
      updated: Date.now()
    });
    alert(`${playerName}'s score has been reset!`);
    loadLeaderboard();
  } catch (err) {
    alert("Failed to reset score: " + err.message);
  }
}

// ----- Reset ALL Players -----
resetAllBtn.addEventListener("click", async () => {
  if (!confirm("⚠️ This will reset ALL players' scores to 0. Continue?")) return;
  try {
    const snap = await db.collection("leaderboard").get();
    const batch = db.batch();
    snap.forEach(doc => {
      batch.set(doc.ref, {
        score: 0,
        updated: Date.now()
      });
    });
    await batch.commit();
    alert("All scores have been reset!");
    loadLeaderboard();
  } catch (err) {
    alert("Failed to reset all scores: " + err.message);
  }
});

// ----- Load Leaderboard -----
async function loadLeaderboard() {
  lbList.innerHTML = "";
  try {
    const snap = await db.collection("leaderboard")
      .orderBy("score", "desc")
      .limit(20)
      .get();

    snap.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `
        ${doc.id} — ${d.score}
        <button class="btn danger btn-small" onclick="resetPlayerScore('${doc.id}')">Reset</button>
      `;
      lbList.appendChild(li);
    });

    if (lbList.children.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No players yet.";
      lbList.appendChild(li);
    }
  } catch (err) {
    const li = document.createElement("li");
    li.textContent = "Error loading leaderboard: " + err.message;
    lbList.appendChild(li);
  }
}
