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

// Google Login
loginBtn.addEventListener("click", async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  try {
    await auth.signOut();
    alert("Logged out!");
    location.reload(); // reload to show login screen again
  } catch (err) {
    alert("Logout failed: " + err.message);
  }
});

// Auth state listener
auth.onAuthStateChanged(user => {
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

// Post announcement
postAnnouncementBtn.addEventListener("click", async () => {
  const msg = announcementInput.value.trim();
  if (!msg) return;
  await db.collection("announcements").add({
    message: msg,
    created: Date.now()
  });
  alert("Announcement posted!");
  announcementInput.value = "";
});

// Set event
setEventBtn.addEventListener("click", async () => {
  const name = eventNameInput.value.trim();
  const multiplier = parseFloat(eventMultiplierInput.value);
  if (!name || !multiplier) return;
  await db.collection("events").doc("current").set({
    name,
    multiplier,
    created: Date.now()
  });
  alert("Event set!");
});

// Clear event
clearEventBtn.addEventListener("click", async () => {
  await db.collection("events").doc("current").delete();
  alert("Event cleared!");
});

// Load leaderboard
async function loadLeaderboard() {
  lbList.innerHTML = "";
  const snap = await db.collection("leaderboard").orderBy("score", "desc").limit(20).get();
  snap.forEach(doc => {
    const d = doc.data();
    const li = document.createElement("li");
    li.textContent = `${doc.id} — ${d.score}`;
    lbList.appendChild(li);
  });
}
