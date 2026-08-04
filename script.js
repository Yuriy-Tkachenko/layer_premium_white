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

document.documentElement.classList.add("js");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealGroups = [
  ".section-heading",
  ".about-grid > *",
  ".contact-grid > *",
  ".service-grid article",
  ".three-cards article",
  ".steps li",
  ".stage-list article",
  ".fact-row span",
  ".footer-grid > *",
];
const revealItems = document.querySelectorAll(revealGroups.join(","));

revealItems.forEach((item, index) => {
  item.classList.add("reveal");
  item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
});

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-revealed"));
  document.querySelector(".hero")?.classList.add("hero-ready");
} else {
  requestAnimationFrame(() => document.querySelector(".hero")?.classList.add("hero-ready"));
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -7%" },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}
