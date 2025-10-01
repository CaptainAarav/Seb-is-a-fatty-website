// DOM refs
const loginBtn = document.getElementById("loginBtn");
const loginSection = document.getElementById("loginSection");
const mainPanel = document.getElementById("mainPanel");

const announcementInput = document.getElementById("announcementInput");
const postAnnouncementBtn = document.getElementById("postAnnouncementBtn");

const eventNameInput = document.getElementById("eventNameInput");
const eventMultiplierInput = document.getElementById("eventMultiplierInput");
const startEventBtn = document.getElementById("startEventBtn");
const endEventBtn = document.getElementById("endEventBtn");

const adminLeaderboardList = document.getElementById("adminLeaderboardList");

let currentUser = null;

// --- Login with Google ---
loginBtn.addEventListener("click", async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    currentUser = result.user;
    console.log("Logged in as:", currentUser.email);

    // only allow admin account
    if (currentUser.email !== "aaravsahni1037@gmail.com") {
      alert("Not authorized.");
      await auth.signOut();
      return;
    }

    loginSection.classList.add("hidden");
    mainPanel.classList.remove("hidden");
    loadLeaderboard();
  } catch (e) {
    console.error("Login failed:", e);
    alert("Login failed: " + e.message);
  }
});

// --- Post Announcement ---
postAnnouncementBtn.addEventListener("click", async () => {
  const msg = (announcementInput.value || "").trim();
  if (!msg) return alert("Please write an announcement.");
  try {
    await db.collection("announcements").add({
      message: msg,
      created: Date.now()
    });
    alert("Announcement posted!");
    announcementInput.value = "";
  } catch (e) {
    console.error("Error posting announcement:", e);
    alert("Failed to post announcement.");
  }
});

// --- Start Event ---
startEventBtn.addEventListener("click", async () => {
  const name = (eventNameInput.value || "").trim();
  const multiplier = parseFloat(eventMultiplierInput.value);
  if (!name || isNaN(multiplier) || multiplier <= 0) {
    return alert("Enter event name and valid multiplier.");
  }
  try {
    await db.collection("events").doc("current").set({
      name,
      multiplier,
      created: Date.now()
    });
    alert(`Event "${name}" started with ${multiplier}x multiplier!`);
  } catch (e) {
    console.error("Error starting event:", e);
    alert("Failed to start event.");
  }
});

// --- End Event ---
endEventBtn.addEventListener("click", async () => {
  try {
    await db.collection("events").doc("current").delete();
    alert("Event ended.");
  } catch (e) {
    console.error("Error ending event:", e);
    alert("Failed to end event.");
  }
});

// --- Load Leaderboard ---
async function loadLeaderboard() {
  adminLeaderboardList.innerHTML = "";
  try {
    const snap = await db.collection("leaderboard")
      .orderBy("score", "desc")
      .limit(20)
      .get();

    if (snap.empty) {
      adminLeaderboardList.innerHTML = "<li>No entries yet.</li>";
      return;
    }

    snap.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");
      li.textContent = `${doc.id} — ${d.score}`;
      adminLeaderboardList.appendChild(li);
    });
  } catch (e) {
    console.error("Failed to load leaderboard:", e);
    adminLeaderboardList.innerHTML = "<li>Error loading leaderboard.</li>";
  }
}
