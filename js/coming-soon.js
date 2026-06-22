function submitToGoogleSheet(name, email) {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_SCRIPT_URL) {
      reject(new Error("GOOGLE_SCRIPT_URL is not configured"));
      return;
    }

    const iframe = document.getElementById("sheet-iframe");
    if (!iframe) {
      reject(new Error("Submission iframe is missing"));
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = GOOGLE_SCRIPT_URL;
    form.target = "sheet-iframe";
    form.style.display = "none";

    const fields = { name, email };
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    const timeout = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 2500);

    function onLoad() {
      window.clearTimeout(timeout);
      cleanup();
      resolve();
    }

    function cleanup() {
      iframe.removeEventListener("load", onLoad);
      form.remove();
    }

    iframe.addEventListener("load", onLoad);
    document.body.appendChild(form);
    form.submit();
  });
}

function initComingSoonPopup() {
  const overlay = document.getElementById("notify-overlay");
  const modal = document.getElementById("notify-modal");
  const form = document.getElementById("notify-form");
  const success = document.getElementById("notify-success");
  const error = document.getElementById("notify-error");
  const closeBtn = document.getElementById("notify-close");
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!overlay || !modal || !form) return;

  const storageKey = "chroma-notify-submitted";

  function openPopup() {
    overlay.hidden = false;
    modal.hidden = false;
    document.body.classList.add("notify-open");
  }

  function closePopup() {
    overlay.hidden = true;
    modal.hidden = true;
    document.body.classList.remove("notify-open");
  }

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    error.hidden = true;
    localStorage.setItem(storageKey, "1");
  }

  if (localStorage.getItem(storageKey) && GOOGLE_SCRIPT_URL) {
    showSuccess();
  }

  setTimeout(openPopup, 600);

  closeBtn?.addEventListener("click", closePopup);
  overlay?.addEventListener("click", closePopup);

  document.querySelectorAll("[data-open-notify]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openPopup();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closePopup();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.hidden = true;

    const name = form.name.value.trim();
    const email = form.email.value.trim();

    if (!name || !email) return;

    if (!GOOGLE_SCRIPT_URL) {
      error.textContent = "Form is not connected to Google Sheets yet. Add your script URL in js/config.js.";
      error.hidden = false;
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "SENDING...";
    }

    try {
      await submitToGoogleSheet(name, email);
      showSuccess();
    } catch (err) {
      error.textContent = "Could not save your details. Please try again.";
      error.hidden = false;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "NOTIFY ME";
      }
    }
  });
}

function initHeader() {
  const header = document.getElementById("header");
  const announcement = document.getElementById("announcement");
  const closeBtn = document.getElementById("close-announcement");

  window.addEventListener("scroll", () => {
    header?.classList.toggle("header--scrolled", window.scrollY > 50);
  });

  closeBtn?.addEventListener("click", () => {
    announcement?.classList.add("announcement--hidden");
    document.body.classList.add("announcement-closed");
  });
}

function initCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const cursor = document.getElementById("cursor");
  if (!cursor) return;

  document.documentElement.classList.add("has-custom-cursor");

  let x = -100;
  let y = -100;
  let currentX = x;
  let currentY = y;
  let visible = false;

  document.addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!visible) {
      visible = true;
      cursor.classList.remove("cursor--hidden");
    }

    const target = e.target.closest("a, button, input, .notify-modal");
    cursor.classList.toggle("cursor--small", !!target);
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.add("cursor--hidden");
    visible = false;
  });

  function animate() {
    currentX += (x - currentX) * 0.18;
    currentY += (y - currentY) * 0.18;
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    requestAnimationFrame(animate);
  }

  animate();
}

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initComingSoonPopup();
  initCursor();
});
