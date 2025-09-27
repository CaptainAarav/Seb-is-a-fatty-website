const button = document.getElementById("revealBtn");
const result = document.getElementById("result");
const drumroll = document.getElementById("drumroll");

button.addEventListener("click", () => {
  result.style.display = "none";

  // Try playing drumroll multiple times in case browser blocks autoplay
  drumroll.currentTime = 0;
  drumroll.play().catch(() => {
    alert("Please interact with the page to allow audio playback!");
  });

  setTimeout(() => {
    result.style.display = "block";
    drumroll.pause();
  }, 1500); // adjust duration if you want longer drumroll
});