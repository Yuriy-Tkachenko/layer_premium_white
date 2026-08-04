const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#nav");
toggle?.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  toggle.setAttribute("aria-label", open ? "Открыть меню" : "Закрыть меню");
  nav?.classList.toggle("open", !open);
});
nav?.addEventListener("click", () => {
  nav.classList.remove("open");
  toggle?.setAttribute("aria-expanded", "false");
});
const scrollTopButton = document.querySelector(".scroll-top");
const updateScrollTop = () =>
  scrollTopButton?.classList.toggle("is-visible", window.scrollY > 500);
window.addEventListener("scroll", updateScrollTop, { passive: true });
updateScrollTop();
scrollTopButton?.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" }),
);
const closeMenu = () => {
  nav?.classList.remove("open");
  toggle?.setAttribute("aria-expanded", "false");
};
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
document.addEventListener("click", (event) => {
  if (
    nav?.classList.contains("open") &&
    !nav.contains(event.target) &&
    !toggle?.contains(event.target)
  )
    closeMenu();
});
