const db = window._db;
const auth = window._auth;

// Login
document.getElementById("loginBtn").addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;

    // Show admin panel
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    document.getElementById("adminInfo").textContent = `Logged in as ${user.email}`;

    // Load leaderboard immediately
    loadAdminLeaderboard();
    // Auto-refresh every 10s
    setInterval(loadAdminLeaderboard, 10000);
  } catch (e) {
    alert("Login failed: " + e.message);
  }
});

// Post Announcement
document.getElementById("postAnnouncementBtn").addEventListener("click", async () => {
  const msg = document.getElementById("announcementInput").value.trim();
  if (!msg) return;
  await db.collection("announcements").add({
    message: msg,
    created: Date.now()
  });
  alert("✅ Announcement posted!");
});

// Reset Leaderboard
document.getElementById("resetLeaderboardBtn").addEventListener("click", async () => {
  const snap = await db.collection("leaderboard").get();
  const batch = db.batch();
  snap.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  alert("✅ Leaderboard reset!");
  loadAdminLeaderboard();
});

// Reset Player Score
document.getElementById("resetPlayerBtn").addEventListener("click", async () => {
  const name = document.getElementById("resetPlayerInput").value.trim();
  if (!name) return;
  await db.collection("leaderboard").doc(name).set({ score: 0, updated: Date.now() });
  alert(`✅ Reset ${name}'s score to 0`);
  loadAdminLeaderboard();
});

// Post Event
document.getElementById("postEventBtn").addEventListener("click", async () => {
  const name = document.getElementById("eventNameInput").value.trim();
  const multiplier = parseInt(document.getElementById("eventMultiplierInput").value, 10);
  if (!name || isNaN(multiplier)) return;
  await db.collection("events").doc("current").set({
    name, multiplier, created: Date.now()
  });
  alert(`✅ Event '${name}' set with multiplier ${multiplier}`);
});

// Load Leaderboard
async function loadAdminLeaderboard() {
  const ul = document.getElementById("adminLeaderboard");
  ul.innerHTML = "";
  try {
    const snap = await db.collection("leaderboard").orderBy("score","desc").limit(20).get();
    snap.forEach((doc, index) => {
      const d = doc.data();
      const li = document.createElement("li");
      li.textContent = `${index+1}. ${doc.id} — ${d.score}`;
      ul.appendChild(li);
    });
    if (ul.children.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No entries yet.";
      ul.appendChild(li);
    }
  } catch(e) {
    const li = document.createElement("li");
    li.textContent = "Error loading leaderboard.";
    ul.appendChild(li);
  }
}
