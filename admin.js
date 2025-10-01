const auth = window._auth;
const db = window._db;

const loginBtn = document.getElementById("loginBtn");
const loginCard = document.getElementById("loginCard");
const adminContent = document.getElementById("adminContent");

const announcementInput = document.getElementById("announcementInput");
const postAnnouncementBtn = document.getElementById("postAnnouncementBtn");

const eventNameInput = document.getElementById("eventNameInput");
const eventMultiplierInput = document.getElementById("eventMultiplierInput");
const setEventBtn = document.getElementById("setEventBtn");
const clearEventBtn = document.getElementById("clearEventBtn");

const leaderboardList = document.getElementById("leaderboardList");

const resetPlayerInput = document.getElementById("resetPlayerInput");
const resetPlayerBtn = document.getElementById("resetPlayerBtn");

const ADMIN_EMAIL = "aaravsahni1037@gmail.com";

// ----- LOGIN -----
loginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(e => {
    alert("Login failed: " + e.message);
  });
});

auth.onAuthStateChanged(user => {
  if (user && user.email === ADMIN_EMAIL) {
    loginCard.classList.add("hidden");
    adminContent.classList.remove("hidden");
    loadLeaderboard();
  } else {
    loginCard.classList.remove("hidden");
    adminContent.classList.add("hidden");
  }
});

// ----- Announcements -----
if (postAnnouncementBtn) {
  postAnnouncementBtn.addEventListener("click", async () => {
    const msg = (announcementInput.value || "").trim();
    if (!msg) return alert("Enter an announcement");
    try {
      await db.collection("announcements").add({
        message: msg,
        created: Date.now()
      });
      alert("✅ Announcement posted!");
      announcementInput.value = "";
    } catch(e) {
      alert("Error: " + e.message);
    }
  });
}

// ----- Events -----
if (setEventBtn) {
  setEventBtn.addEventListener("click", async () => {
    const name = (eventNameInput.value || "").trim();
    const multiplier = parseFloat(eventMultiplierInput.value || "1");
    if (!name || !multiplier) return alert("Enter name and multiplier");
    try {
      await db.collection("events").doc("current").set({
        name,
        multiplier,
        created: Date.now()
      });
      alert("✅ Event set!");
    } catch(e) {
      alert("Error: " + e.message);
    }
  });
}

if (clearEventBtn) {
  clearEventBtn.addEventListener("click", async () => {
    try {
      await db.collection("events").doc("current").delete();
      alert("✅ Event cleared!");
    } catch(e) {
      alert("Error: " + e.message);
    }
  });
}

// ----- Leaderboard -----
async function loadLeaderboard() {
  leaderboardList.innerHTML = "";
  try {
    const snap = await db.collection("leaderboard").orderBy("score","desc").limit(20).get();
    snap.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");
      li.textContent = `${doc.id} — ${d.score}`;
      leaderboardList.appendChild(li);
    });
    if (leaderboardList.children.length === 0) {
      leaderboardList.innerHTML = "<li>No players yet</li>";
    }
  } catch(e) {
    leaderboardList.innerHTML = "<li>Error loading leaderboard</li>";
  }
}

// ----- Reset Player Score -----
if (resetPlayerBtn) {
  resetPlayerBtn.addEventListener("click", async () => {
    const name = (resetPlayerInput.value || "").trim();
    if (!name) return alert("Enter player name");
    try {
      await db.collection("leaderboard").doc(name).set({
        score: 0,
        updated: Date.now()
      }, { merge: true });
      alert(`✅ Reset ${name}'s score to 0`);
      resetPlayerInput.value = "";
      loadLeaderboard();
    } catch(e) {
      alert("Error resetting score: " + e.message);
    }
  });
}
