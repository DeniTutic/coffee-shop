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
