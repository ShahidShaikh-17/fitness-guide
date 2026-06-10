document.addEventListener("DOMContentLoaded", function() {
  // Apply saved theme on page load
  const savedTheme = localStorage.getItem('theme') || 'light';
  const themeIconNav = document.getElementById('themeIconNav');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeIconNav) {
      themeIconNav.textContent = '☀️';
    }
    console.log('Dark mode applied from localStorage');
  } else {
    if (themeIconNav) {
      themeIconNav.textContent = '🌙';
    }
  }

  // Listen for theme changes from other pages
  window.addEventListener('storage', function(e) {
    if (e.key === 'theme') {
      if (e.newValue === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeIconNav) {
          themeIconNav.textContent = '☀️';
        }
        console.log('Dark mode applied from storage event');
      } else {
        document.body.classList.remove('dark-mode');
        if (themeIconNav) {
          themeIconNav.textContent = '🌙';
        }
        console.log('Light mode applied from storage event');
      }
    }
  });

  let slideIndex = 0;

  // Initialize slideshow only if slides exist on this page
  try {
    const initialSlides = document.querySelectorAll(".mySlides");
    if (initialSlides && initialSlides.length > 0) {
      showSlides();
    }
  } catch (error) {
    console.error("Error initializing slideshow:", error);
  }

  function showSlides() {
      try {
          let slides = document.querySelectorAll(".mySlides");
          if (slides.length === 0) {
              return;
          }
          
          // Use requestAnimationFrame for smoother transitions
          requestAnimationFrame(() => {
              // Batch DOM operations
              for (let i = 0; i < slides.length; i++) {
                  slides[i].style.display = "none";
              }
              
              slideIndex++;
              if (slideIndex > slides.length) { slideIndex = 1; }
              slides[slideIndex - 1].style.display = "block";
          });
          
          setTimeout(showSlides, 3000); // Change slide every 3s
      } catch (error) {
          console.error("Error in showSlides:", error);
      }
  }
});
document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector("nav ul");

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }
});

