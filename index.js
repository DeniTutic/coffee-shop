// Menu Carousel
const menuGrid = document.getElementById("menuGrid");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
let isSecondSet = false;

function updateButtons() {
  prevBtn.style.display = isSecondSet ? "flex" : "none";
  nextBtn.style.display = isSecondSet ? "none" : "flex";
}

function slideMenu(direction) {
  const menuItems = menuGrid.querySelectorAll(".menu-item");
  const itemWidth = menuItems[0].offsetWidth;
  const slideAmount = (itemWidth + 32) * 4;

  menuGrid.style.transform =
    direction === "next" ? `translateX(-${slideAmount}px)` : "translateX(0)";

  isSecondSet = direction === "next";
  updateButtons();
}

prevBtn.addEventListener("click", () => slideMenu("prev"));
nextBtn.addEventListener("click", () => slideMenu("next"));

// Initialize buttons
updateButtons();

document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // Show notification
  const notification = document.getElementById("notification");
  notification.classList.add("show");

  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);

  // Reset form
  this.reset();
});

// Scroll to Top Button
const scrollTopBtn = document.getElementById("scrollTop");

window.addEventListener("scroll", () => {
  if (window.pageYOffset > 300) {
    scrollTopBtn.classList.add("visible");
  } else {
    scrollTopBtn.classList.remove("visible");
  }
});

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Night Mode Toggle
const nightModeToggle = document.getElementById("nightModeToggle");
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  body.classList.add("night-mode");
  nightModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

nightModeToggle.addEventListener("click", () => {
  body.classList.toggle("night-mode");

  // Update icon
  if (body.classList.contains("night-mode")) {
    nightModeToggle.innerHTML = "<i class='fas fa-sun'></i>";
    localStorage.setItem("theme", "dark");
  } else {
    nightModeToggle.innerHTML = "<i class='fas fa-moon'></i>";
    localStorage.setItem("theme", "light");
  }
});

// Newsletter Popup
const newsletterPopup = document.getElementById("newsletterPopup");
const closePopup = document.getElementById("closePopup");
const newsletterForm = document.getElementById("newsletterForm");

// Show popup after 5 seconds
setTimeout(() => {
  newsletterPopup.classList.add("show");
}, 5000);

// Close popup when clicking the close button
closePopup.addEventListener("click", () => {
  newsletterPopup.classList.remove("show");
});

// Handle form submission
newsletterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = newsletterForm.querySelector('input[type="email"]').value;
  //Send this to backend!
  console.log("Subscribed email:", email);
  newsletterPopup.classList.remove("show");

  // Show success notification
  const notification = document.getElementById("notification");
  notification.textContent = "Thank you for subscribing!";
  notification.classList.add("show");

  // Show balloons
  showBalloons();

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
});

// Brewing Timer
const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const startTimerBtn = document.getElementById("startTimer");
const resetTimerBtn = document.getElementById("resetTimer");

let timeLeft = 240; // 4 min
let timerId = null;

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  minutesDisplay.textContent = minutes.toString().padStart(2, "0");
  secondsDisplay.textContent = seconds.toString().padStart(2, "0");
}

function startTimer() {
  if (timerId === null) {
    timerId = setInterval(() => {
      timeLeft--;
      updateDisplay();

      if (timeLeft === 0) {
        clearInterval(timerId);
        timerId = null;
        startTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        // Play notification sound
        const audio = new Audio(
          "https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3"
        );
        audio.play();
      }
    }, 1000);
    startTimerBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
  } else {
    clearInterval(timerId);
    timerId = null;
    startTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start';
  }
}

function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  timeLeft = 240;
  updateDisplay();
  startTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start';
}

startTimerBtn.addEventListener("click", startTimer);
resetTimerBtn.addEventListener("click", resetTimer);

// Coffee Quiz
const quizStart = document.getElementById("quiz-start");
const quizQuestions = document.getElementById("quiz-questions");
const quizResult = document.getElementById("quiz-result");
const startQuizBtn = document.getElementById("start-quiz");
const retakeQuizBtn = document.getElementById("retake-quiz");
const resultContent = document.getElementById("result-content");

const questions = [
  {
    question: "How do you prefer your coffee?",
    options: ["Strong and bold", "Smooth and creamy", "Light and fruity"],
    results: {
      "Strong and bold":
        "Espresso or Americano - Perfect for those who love a strong, intense coffee experience.",
      "Smooth and creamy":
        "Latte or Cappuccino - Ideal for those who enjoy a balanced, creamy coffee with milk.",
      "Light and fruity":
        "Pour Over or Cold Brew - Great choice for those who appreciate subtle, fruity notes in their coffee.",
    },
  },
];

function showScreen(screen) {
  [quizStart, quizQuestions, quizResult].forEach((s) =>
    s.classList.remove("active")
  );
  screen.classList.add("active");
}

function handleOptionClick(option) {
  const result = questions[0].results[option];
  resultContent.innerHTML = `
          <p>${result}</p>
          <div class="recommended-drinks">
            <h4>Recommended Drinks:</h4>
            <ul>
              ${
                option === "Strong and bold"
                  ? "<li>Espresso</li><li>Americano</li><li>Ristretto</li>"
                  : option === "Smooth and creamy"
                  ? "<li>Latte</li><li>Cappuccino</li><li>Flat White</li>"
                  : "<li>Pour Over</li><li>Cold Brew</li><li>Chemex</li>"
              }
            </ul>
          </div>
        `;
  showScreen(quizResult);
}

startQuizBtn.addEventListener("click", () => showScreen(quizQuestions));
retakeQuizBtn.addEventListener("click", () => showScreen(quizStart));

document.querySelectorAll(".option").forEach((option) => {
  option.addEventListener("click", () => handleOptionClick(option.textContent));
});

// Special Offers Button
document.querySelector(".offer-button").addEventListener("click", () => {
  const notification = document.getElementById("notification");
  notification.textContent = "Join our loyalty program at the counter!";
  notification.classList.remove("hide");
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
    notification.classList.add("hide");
  }, 3000);
});

function createBalloon() {
  const balloon = document.createElement("div");
  balloon.className = "balloon";
  balloon.innerHTML = '<i class="fas fa-heart"></i>';
  balloon.style.left = Math.random() * 100 + "vw";
  balloon.style.animationDuration = Math.random() * 2 + 1.5 + "s";
  return balloon;
}

function showBalloons() {
  const container = document.getElementById("balloonsContainer");
  container.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const balloon = createBalloon();
    container.appendChild(balloon);
  }

  setTimeout(() => {
    container.innerHTML = "";
  }, 5000);
}

// Scroll Progress Bar
window.addEventListener("scroll", () => {
  const scrollProgress = document.querySelector(".scroll-progress");
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = window.scrollY;
  const progress = (scrolled / scrollable) * 100;
  scrollProgress.style.width = progress + "%";
});

// Coffee of the Day Order Button
document.querySelector(".order-now-btn").addEventListener("click", function () {
  const notification = document.getElementById("notification");
  notification.textContent = "Added to cart: Cold Brew Delight";
  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
    notification.classList.add("hide");
  }, 3000);
});
