const button = document.getElementById("revealBtn");
const result = document.getElementById("result");
const drumroll = document.getElementById("drumroll");

button.addEventListener("click", () => {
  result.style.display = "none";

  // Play drumroll
  drumroll.currentTime = 0;
  drumroll.play().catch(() => {
    alert("Please interact with the page to allow audio playback!");
  });

  setTimeout(() => {
    // 1/100 chance to show "Michael Winsor"
    let randomNumber = Math.floor(Math.random() * 100) + 1;
    if (randomNumber === 1) {
      result.textContent = "Michael Winsor";
    } else {
      result.textContent = "Sebastian Kavanagh";
    }

    result.style.display = "block";
    drumroll.pause();
  }, 1500); // 1.5 seconds drumroll
});