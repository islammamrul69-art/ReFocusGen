function setActive(link) {
  document.querySelectorAll(".navbar-link").forEach((l) => l.classList.remove("active"));
  link.classList.add("active");
}

function updateNavActive() {
  const page = window.location.pathname.split("/").pop();
  document.querySelectorAll(".navbar-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === page || (page === "" && href === "Index.html")) {
      link.classList.add("active");
    }
  });
}
