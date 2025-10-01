// Firebase Auth + Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// DOM references
const loginBtn = document.getElementById("loginBtn");
const loginCard = document.getElementById("loginCard");
const adminContent = document.getElementById("adminContent");

const announcementInput = document.getElementById("announcementInput");
const postAnnouncementBtn = document.getElementById("postAnnouncementBtn");

const eventNameInput = document.getElementById("eventNameInput");
const eventMultiplierInput = document.getElementById("eventMultiplierInput");
const startEventBtn = document.getElementById("startEventBtn");
const endEventBtn = document.getElementById("endEventBtn");

const resetPlayerInput = document.getElementById("resetPlayerInput");
const resetPlayerBtn = document.getElementById("resetPlayerBtn");

const lbList = document.getElementById("leaderboardList");

// Your admin email
const ADMIN_EMAIL = "aaravsahni1037@gmail.com";

// --- AUTH ---
loginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// Auth state
auth.onAuthStateChanged(user => {
  if (user && user.email === ADMIN_EMAIL) {
    loginCard.classList.add("hidden");
    adminContent.classList.remove("hidden");
    loadLeaderboard();
  } else {
    adminContent.classList.add("hidden");
    loginCard.classList.remove("hidden");
  }
});

// --- ANNOUNCEMENTS ---
postAnnouncementBtn.addEventListener("click", async () => {
  const msg = announcementInput.value.trim();
  if (!msg) return alert("Enter a message!");
  try {
    await db.collection("announcements").add({
      message: msg,
      created: Date.now()
    });
    alert("Announcement posted!");
    announcementInput.value = "";
  } catch (err) {
    alert("Failed: " + err.message);
  }
});

// --- EVENTS ---
startEventBtn.addEventListener("click", async () => {
  const name = eventNameInput.value.trim();
  const mult = parseFloat(eventMultiplierInput.value) || 1;
  try {
    await db.collection("events").doc("current").set({
      name,
      multiplier: mult,
      created: Date.now()
    });
    alert("Event started!");
  } catch (err) {
    alert("Failed: " + err.message);
  }
});

endEventBtn.addEventListener("click", async () => {
  try {
    await db.collection("events").doc("current").delete();
    alert("Event ended!");
  } catch (err) {
    alert("Failed: " + err.message);
  }
});

// --- RESET PLAYER SCORE ---
resetPlayerBtn.addEventListener("click", async () => {
  const player = resetPlayerInput.value.trim();
  if (!player) return alert("Enter a name!");
  try {
    await db.collection("leaderboard").doc(player).set({
      score: 0,
      updated: Date.now()
    });
    alert("Score reset for " + player);
    resetPlayerInput.value = "";
    loadLeaderboard();
  } catch (err) {
    alert("Failed: " + err.message);
  }
});

// --- LEADERBOARD ---
async function loadLeaderboard() {
  lbList.innerHTML = "";
  try {
    const snap = await db.collection("leaderboard").orderBy("score","desc").limit(20).get();
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
  } catch (err) {
    const li = document.createElement("li");
    li.textContent = "Error: " + err.message;
    lbList.appendChild(li);
  }
}
