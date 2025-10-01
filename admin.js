// ----- Firebase Refs -----
const db = firebase.firestore();
const auth = firebase.auth();
const ADMIN_EMAIL = "aaravsahni1037@gmail.com";

// ----- DOM Refs -----
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

// ----- Login -----
loginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();

  if (/Mobi|Android/i.test(navigator.userAgent)) {
    // Use redirect on mobile
    auth.signInWithRedirect(provider);
  } else {
    // Use popup on desktop
    auth.signInWithPopup(provider).catch(e => {
      alert("Login failed: " + e.message);
    });
  }
});

// Handle redirect result (mobile)
auth.getRedirectResult().then(result => {
  if (result.user && result.user.email === ADMIN_EMAIL) {
    loginCard.classList.add("hidden");
    adminContent.classList.remove("hidden");
    loadLeaderboard();
  }
}).catch(e => console.error("Redirect login error:", e));

// Handle auth state changes
auth.onAuthStateChanged(user => {
  if (user && user.email === ADMIN_EMAIL) {
    loginCard.classList.add("hidden");
    adminContent.classList.remove("hidden");
    loadLeaderboard();
  }
});

// ----- Announcements -----
if (postAnnouncementBtn) {
  postAnnouncementBtn.addEventListener("click", async () => {
    const msg = announcementInput.value.trim();
    if (!msg) return alert("Please enter a message.");
    try {
      await db.collection("announcements").add({
        message: msg,
        created: Date.now()
      });
      alert("✅ Announcement posted!");
      announcementInput.value = "";
    } catch (e) {
      console.error(e);
      alert("Error posting announcement.");
    }
  });
}

// ----- Events -----
if (startEventBtn) {
  startEventBtn.addEventListener("click", async () => {
    const name = eventNameInput.value.trim() || "Special Event";
    const multiplier = parseFloat(eventMultiplierInput.value) || 1;
    try {
      await db.collection("events").doc("current").set({
        name,
        multiplier,
        created: Date.now()
      });
      alert(`✅ Event "${name}" started (${multiplier}x)`);
    } catch (e) {
      console.error(e);
      alert("Error starting event.");
    }
  });
}

if (endEventBtn) {
  endEventBtn.addEventListener("click", async () => {
    try {
      await db.collection("events").doc("current").delete();
      alert("✅ Event ended.");
    } catch (e) {
      console.error(e);
      alert("Error ending event.");
    }
  });
}

// ----- Reset Player -----
if (resetPlayerBtn) {
  resetPlayerBtn.addEventListener("click", async () => {
    const name = (resetPlayerInput.value || "").trim();
    if (!name) return alert("Enter a player name.");
    try {
      await db.collection("leaderboard").doc(name).set({
        score: 0,
        updated: Date.now()
      }, { merge: true });
      alert(`✅ Reset ${name}'s score to 0`);
      resetPlayerInput.value = "";
      loadLeaderboard();
    } catch (e) {
      console.error(e);
      alert("Error resetting score.");
    }
  });
}

// ----- Leaderboard -----
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
  } catch (e) {
    console.error(e);
    lbList.innerHTML = "<li>Error loading leaderboard.</li>";
  }
}
