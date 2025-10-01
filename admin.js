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

// Firestore reference
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
    li.textContent = "Error loading leaderboard: " + err.message;
    lbList.appendChild(li);
  }
}
