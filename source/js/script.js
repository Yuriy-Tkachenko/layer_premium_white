if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("pageshow", () => {
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
});

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

const consultationDialog = document.querySelector("#consultation-dialog");
const consultationTriggers = document.querySelectorAll(
  '.service-grid a[href="#contacts"], [data-open-consultation]',
);

consultationTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    if (!consultationDialog?.showModal) return;
    event.preventDefault();
    consultationDialog.showModal();
  });
});

consultationDialog
  ?.querySelector("[data-close-consultation]")
  ?.addEventListener("click", () => consultationDialog.close());

consultationDialog?.addEventListener("click", (event) => {
  const bounds = consultationDialog.getBoundingClientRect();
  const inside =
    event.clientX >= bounds.left &&
    event.clientX <= bounds.right &&
    event.clientY >= bounds.top &&
    event.clientY <= bounds.bottom;
  if (!inside) consultationDialog.close();
});

document.querySelectorAll('textarea[name="Комментарий"]').forEach((field) => {
  const resizeComment = () => {
    field.style.height = "46px";
    field.style.height = `${Math.max(46, field.scrollHeight)}px`;
  };
  const validateComment = () => {
    const textCharacters = field.value.replace(/\s/g, "").length;
    field.setCustomValidity(
      textCharacters >= 10 ? "" : "Введите комментарий не менее чем из 10 символов.",
    );
  };
  resizeComment();
  validateComment();
  field.addEventListener("input", () => {
    resizeComment();
    validateComment();
  });
});

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const fields = [...form.querySelectorAll("input, textarea")].filter(
      (field) => field.type !== "checkbox",
    );
    const originalButtonText = submitButton?.textContent;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "ОТПРАВЛЯЕМ…";
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields[0]?.value.trim(),
          phone: fields[1]?.value.trim(),
          comment: fields[2]?.value.trim(),
          website: "",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Не удалось отправить сообщение");

      form.reset();
      fields.forEach((field) => field.dispatchEvent(new Event("input")));
      if (submitButton) submitButton.textContent = "СООБЩЕНИЕ ОТПРАВЛЕНО ✓";
      if (form.closest("dialog")) setTimeout(() => form.closest("dialog")?.close(), 1400);
    } catch (error) {
      alert(error.message || "Не удалось отправить сообщение. Позвоните нам по телефону.");
      if (submitButton) submitButton.textContent = originalButtonText;
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        if (submitButton.textContent !== "СООБЩЕНИЕ ОТПРАВЛЕНО ✓") {
          submitButton.textContent = originalButtonText;
        }
      }
    }
  });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealGroups = [
  ".section-heading",
  ".about-grid > *",
  ".contact-grid > *",
  ".service-grid article",
  ".three-cards article",
  ".steps li",
  ".stage-list article",
  ".faq-intro",
  ".faq-list details",
  ".fact-row span",
  ".footer-grid > *",
];
const revealItems = document.querySelectorAll(revealGroups.join(","));

revealItems.forEach((item, index) => {
  item.classList.add("reveal");
  item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
});

const showHero = () => {
  document.documentElement.classList.add("intro-ready");
  document.querySelector(".hero")?.classList.add("hero-ready");
};

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-revealed"));
  showHero();
} else {
  requestAnimationFrame(() => requestAnimationFrame(showHero));
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
