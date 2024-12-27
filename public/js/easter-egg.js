const konamiCode = ["p", "a", "r", "t", "y"];

let konamiCodePosition = 0;

document.addEventListener("keydown", function (e) {
  const key = e.key.toLowerCase();
  const requiredKey = konamiCode[konamiCodePosition];

  if (key === requiredKey) {
    konamiCodePosition++;

    if (konamiCodePosition === konamiCode.length) {
      activateEasterEgg();
      konamiCodePosition = 0;
    }
  } else {
    konamiCodePosition = 0;
  }
});

function activateEasterEgg() {
  document.body.classList.add("konami-active");

  const partyMessage = document.createElement("div");
  partyMessage.textContent = "Party Time!";
  partyMessage.style.position = "fixed";
  partyMessage.style.top = "50%";
  partyMessage.style.left = "50%";
  partyMessage.style.transform = "translate(-50%, -50%)";
  partyMessage.style.fontSize = "48px";
  partyMessage.style.color = "#fff";
  partyMessage.style.zIndex = "10000";
  document.body.appendChild(partyMessage);

  setTimeout(() => {
    document.body.classList.remove("konami-active");
    document.body.removeChild(partyMessage);
  }, 15000);
}
