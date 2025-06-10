document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll(".carousel-image");
  let current = 0;

  function showNextImage() {
    images[current].classList.remove("active");
    current = (current + 1) % images.length;
    images[current].classList.add("active");
  }

  setInterval(showNextImage, 3000); // Slide every 3 seconds
});
