function applyTheme() {
  const theme = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark-mode", theme === "dark");
}

function setTheme(theme) {
  localStorage.setItem("theme", theme);
  applyTheme();
  const light = document.getElementById("themeLight");
  const dark  = document.getElementById("themeDark");
  if (light) light.classList.toggle("active", theme === "light");
  if (dark)  dark.classList.toggle("active",  theme === "dark");
}
