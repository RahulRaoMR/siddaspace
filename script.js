const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const quoteForm = document.querySelector(".quote-card");
const toast = document.querySelector(".toast");
const estimateForm = document.querySelector(".estimate-form");
const estimateSection = document.querySelector(".estimate-wizard");
const wizardSteps = document.querySelectorAll(".wizard-step");
const progressSteps = document.querySelectorAll(".wizard-progress-step");
const wizardBack = document.querySelector(".wizard-back");
const wizardNext = document.querySelector(".wizard-next");
const contactCallButton = document.querySelector(".contact-call-btn");
const contactPhoneNumber = document.querySelector("#contact-phone-number");
const projectFilters = document.querySelectorAll(".project-filter");
const projectCards = document.querySelectorAll(".project-card");
const comparisonRanges = document.querySelectorAll(".comparison-range");
const backToTopButton = document.querySelector(".back-to-top");

// Store only public path context, never contact details or URL query strings.
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href]');
  if (link && new URL(link.href).origin === window.location.origin && new URL(link.href).pathname === "/estimate") {
    try { sessionStorage.setItem("siddaspace-estimate-source", window.location.pathname); } catch {}
  }
});

function leadSource() {
  if (window.location.pathname.replace(/\.html$/, "") === "/estimate") {
    try {
      const source = sessionStorage.getItem("siddaspace-estimate-source");
      if (source && /^\/[a-z0-9/-]*$/i.test(source)) return source;
    } catch {}
  }
  return window.location.pathname;
}

function validatePhoneFields(form) {
  let valid = true;
  form.querySelectorAll('input[type="tel"]').forEach((input) => {
    const digits = input.value.replace(/\D/g, "");
    const invalid = input.value && (digits.length < 7 || digits.length > 15);
    input.setCustomValidity(invalid ? "Enter a phone number with 7 to 15 digits, including the country code if used." : "");
    if (invalid) valid = false;
  });
  return valid;
}

function prepareVideos() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = navigator.connection?.saveData;
  const start = (video, userInitiated = false) => {
    if (video.dataset.poster && !video.poster) video.poster = video.dataset.poster;
    if ((reducedMotion || saveData) && video.autoplay && !userInitiated) return;
    if (!video.dataset.sourceReady) {
      video.querySelectorAll("source[data-src]").forEach((source) => { source.src = source.dataset.src; });
      video.dataset.sourceReady = "true";
      video.load();
    }
    if (video.autoplay && (!reducedMotion && !saveData || userInitiated)) video.play().catch(() => {});
  };
  const observer = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) start(target);
      else if (target.autoplay) target.pause();
    });
  }, { rootMargin: "100px", threshold: 0.1 }) : null;
  document.querySelectorAll("video").forEach((video) => {
    video.addEventListener("pointerdown", () => start(video, true), { once: true });
    video.addEventListener("focus", () => start(video, true), { once: true });
    if (video.classList.contains("hero-bg")) {
      const afterPoster = () => {
        const begin = () => requestAnimationFrame(() => start(video));
        if ('requestIdleCallback' in window) requestIdleCallback(begin, { timeout: 2000 });
        else setTimeout(begin, 0);
      };
      if (document.readyState === 'complete') afterPoster();
      else window.addEventListener('load', afterPoster, { once: true });
    }
    else if (observer) observer.observe(video);
    else if (video.autoplay) start(video);
  });
}
function createSiteNavigation() {
  const nav = header?.querySelector(".site-nav");
  if (!nav) {
    return;
  }

  const wordmark = header.querySelector(".brand-logo");
  if (wordmark) {
    wordmark.src = "/assets/sidda-space-logo-on-dark.png";
  }

  if (!header.querySelector(".header-location")) {
    const location = document.createElement("div");
    location.className = "header-location";
    location.setAttribute("role", "note");
    location.setAttribute("aria-label", "Service locations: Bangalore, Tumakur and Mysore");
    location.innerHTML = `
      <span class="header-location-window" aria-hidden="true">
        <span class="header-location-track">
          <span><span class="header-location-city-icon"><img src="/assets/optimized/city-bangalore-e4f7159ba5-104.webp" alt="" width="52" height="26" decoding="async"></span><span class="header-location-name">Bangalore</span></span>
          <span><span class="header-location-city-icon"><span class="header-location-icon"></span></span><span class="header-location-name">Tumakur</span></span>
          <span><span class="header-location-city-icon"><img src="/assets/optimized/city-mysore-aac4e7515f-104.webp" alt="" width="52" height="26" decoding="async"></span><span class="header-location-name">Mysore</span></span>
          <span><span class="header-location-city-icon"><img src="/assets/optimized/city-bangalore-e4f7159ba5-104.webp" alt="" width="52" height="26" decoding="async"></span><span class="header-location-name">Bangalore</span></span>
        </span>
      </span>
    `;
    header.append(location);
  }

  const items = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Projects", href: "/projects", children: [
      ["Projects", "/projects"],
      ["Live Projects", "/live-projects"]
    ] },
    { label: "Products", href: "/products", children: [
      ["Sofa & Living", "/gallery"],
      ["Products", "/products"]
    ] },
    { label: "Our Team", href: "/team" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" }
  ];
  const normalizePath = (path) => path.replace(/\.html$/, "").replace(/\/$/, "") || "/index";
  const currentPath = normalizePath(window.location.pathname);

  const productPaths = ["/office-chairs", "/workstations", "/conference-tables", "/reception-tables", "/storage-solutions"];
  nav.innerHTML = items.map(({ label, href, children }) => {
    const currentPage = normalizePath(href) === currentPath;
    const active = currentPage || children?.some(([, childHref]) => normalizePath(childHref) === currentPath) || (label === "Services" && currentPath.startsWith("/services/")) || (label === "Products" && productPaths.includes(currentPath)) || (label === "Blog" && currentPath.startsWith("/blog/")) || (label === "Contact" && currentPath.startsWith("/locations/"));
    const submenuId = `nav-${label.toLowerCase()}-submenu`;
    return `
      <div class="nav-item${children ? " nav-dropdown" : ""}">
        <a class="nav-top-link${active ? " is-active" : ""}" href="${href}"${currentPage ? ' aria-current="page"' : ""}><span class="nav-label">${label}</span></a>
        ${children ? `
          <button class="nav-dropdown-toggle" type="button" aria-label="Open ${label} menu" title="Open ${label} menu" aria-expanded="false" aria-controls="${submenuId}"><span aria-hidden="true"></span></button>
          <div class="nav-submenu" id="${submenuId}" hidden>${children.map(([childLabel, childHref]) => `<a href="${childHref}"${normalizePath(childHref) === currentPath ? ' aria-current="page"' : ""}>${childLabel}</a>`).join("")}</div>
        ` : ""}
      </div>
    `;
  }).join("");

  const dropdowns = Array.from(nav.querySelectorAll(".nav-dropdown"));
  const setOpen = (dropdown, open) => {
    const button = dropdown.querySelector("button");
    button.setAttribute("aria-expanded", String(open));
    const label = `${open ? "Close" : "Open"} ${dropdown.querySelector(".nav-label").textContent} menu`;
    button.setAttribute("aria-label", label);
    button.title = label;
    dropdown.querySelector(".nav-submenu").hidden = !open;
  };
  const closeDropdowns = () => dropdowns.forEach((dropdown) => setOpen(dropdown, false));
  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector("button");
    const links = Array.from(dropdown.querySelectorAll(".nav-submenu a"));
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      closeDropdowns();
      setOpen(dropdown, open);
    });
    dropdown.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(dropdown, false);
        button.focus();
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) && (event.target === button || links.includes(event.target))) {
        event.preventDefault();
        closeDropdowns();
        setOpen(dropdown, true);
        const index = links.indexOf(event.target);
        const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1 : event.key === "ArrowDown" ? (index + 1) % links.length : (index < 0 ? links.length - 1 : (index - 1 + links.length) % links.length);
        links[nextIndex].focus();
      }
    });
    dropdown.addEventListener("focusout", (event) => {
      if (!dropdown.contains(event.relatedTarget)) {
        setOpen(dropdown, false);
      }
    });
  });
  document.addEventListener("pointerdown", (event) => {
    if (!nav.contains(event.target)) {
      closeDropdowns();
    }
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeDropdowns));
  menuToggle?.addEventListener("click", closeDropdowns);
  window.matchMedia("(max-width: 1360px)").addEventListener("change", closeDropdowns);
}

createSiteNavigation();
const navLinks = document.querySelectorAll(".site-nav .nav-top-link");

const navigationIcons = {
  "Home": "house",
  "About": "info",
  "Services": "hammer",
  "Projects": "folder-open",
  "Sofa & Living": "sofa",
  "Our Team": "users",
  "Live Projects": "hard-hat",
  "Packages": "package",
  "Blog": "newspaper",
  "Products": "layout-grid",
  "Contact": "phone"
};

navLinks.forEach((link) => {
  const iconName = navigationIcons[link.textContent.trim()];
  if (!iconName) {
    return;
  }

  const icon = document.createElement("span");
  icon.className = "nav-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.style.maskImage = `url("/assets/icons/lucide/${iconName}.svg")`;
  link.prepend(icon);
});

const footerMarkup = `
  <footer class="site-footer">
    <div class="footer-main">
      <div class="footer-grid">
        <div class="footer-company">
          <a class="footer-logo-frame" href="/" aria-label="Siddaspace home">
            <img class="footer-brand-logo" src="/assets/sidda-space-footer-logo.png" alt="Siddaspace - Beyond Ideas">
          </a>
          <p>Karnataka-based premium interiors for modern homes and workspaces, crafted with elegant design, smart functionality, and reliable execution.</p>
          <div class="footer-socials" aria-label="Siddaspace social links">
          <a href="https://www.instagram.com/siddaspace/?hl=en" aria-label="Instagram" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm8.4 2H7.8A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path></svg>
          </a>
          <a href="https://www.youtube.com/@SiddaSpaceTrend" aria-label="YouTube" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.58 7.2a2.73 2.73 0 0 0-1.92-1.93C17.97 4.82 12 4.82 12 4.82s-5.97 0-7.66.45A2.73 2.73 0 0 0 2.42 7.2 28.43 28.43 0 0 0 2 12a28.43 28.43 0 0 0 .42 4.8 2.73 2.73 0 0 0 1.92 1.93c1.69.45 7.66.45 7.66.45s5.97 0 7.66-.45a2.73 2.73 0 0 0 1.92-1.93A28.43 28.43 0 0 0 22 12a28.43 28.43 0 0 0-.42-4.8zM10 15.2V8.8l5.5 3.2L10 15.2z"></path></svg>
          </a>
          <a href="https://x.com/Siddaspace" aria-label="X" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.15 10.16 22.6 0h-2l-7.34 8.82L7.4 0H.64l8.86 13.3L.64 24h2l7.75-9.33L16.58 24h6.76l-9.19-13.84zm-2.74 3.3-.9-1.33L3.37 1.55h3.07l5.77 8.55.9 1.33 7.49 11.1h-3.07l-6.12-9.07z"></path></svg>
          </a>
          <a href="https://www.facebook.com/profile.php?id=61592084728599" aria-label="Facebook" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8.5V6.25c0-.62.5-1.12 1.12-1.12H17V2h-2.75A4.25 4.25 0 0 0 10 6.25V8.5H7v3.5h3v10h4V12h2.75l.65-3.5H14z"></path></svg>
          </a>
        </div>
        </div>
        <div class="footer-column">
          <h3>Explore</h3>
          <nav class="footer-links" aria-label="Explore Siddaspace">
            <a href="/"><span class="footer-icon" data-footer-icon="house" aria-hidden="true"></span>Home</a>
            <a href="/about.html"><span class="footer-icon" data-footer-icon="user" aria-hidden="true"></span>About</a>
            <a href="/projects.html"><span class="footer-icon" data-footer-icon="layout-grid" aria-hidden="true"></span>Projects</a>
            <a href="/team.html"><span class="footer-icon" data-footer-icon="users" aria-hidden="true"></span>Our Team</a>
            <a href="/blog.html"><span class="footer-icon" data-footer-icon="newspaper" aria-hidden="true"></span>Blog</a>
            <a href="/products.html"><span class="footer-icon" data-footer-icon="package" aria-hidden="true"></span>Products</a>
            <a href="/contact.html"><span class="footer-icon" data-footer-icon="phone" aria-hidden="true"></span>Contact</a>
          </nav>
        </div>
        <div class="footer-column">
          <h3>Services</h3>
          <nav class="footer-links" aria-label="Siddaspace services">
            <a href="/services/home-interiors.html"><span class="footer-icon" data-footer-icon="house" aria-hidden="true"></span>Home Interiors</a>
            <a href="/services/office-interiors.html"><span class="footer-icon" data-footer-icon="building-2" aria-hidden="true"></span>Office Interiors</a>
            <a href="/services/restaurant-interiors.html"><span class="footer-icon" data-footer-icon="utensils" aria-hidden="true"></span>Restaurant Interiors</a>
            <a href="/services.html"><span class="footer-icon" data-footer-icon="hard-hat" aria-hidden="true"></span>Construction &amp; Interiors</a>
            <a href="/gallery.html"><span class="footer-icon" data-footer-icon="sofa" aria-hidden="true"></span>Sofa &amp; Living</a>
            <a href="/packages.html"><span class="footer-icon" data-footer-icon="layers" aria-hidden="true"></span>Packages</a>
          </nav>
        </div>
        <div class="footer-column footer-contact">
          <h3>Contact</h3>
          <div class="footer-contact-row">
            <span class="footer-contact-badge"><span class="footer-icon" data-footer-icon="phone" aria-hidden="true"></span></span>
            <div><span class="footer-contact-label">Phone</span><a href="tel:+916364309878">+91 6364309878</a></div>
          </div>
          <div class="footer-contact-row">
            <span class="footer-contact-badge"><span class="footer-icon" data-footer-icon="mail" aria-hidden="true"></span></span>
            <div><span class="footer-contact-label">Email</span><a href="mailto:Info@siddaspace.com">Info@siddaspace.com</a></div>
          </div>
          <div class="footer-contact-row">
            <span class="footer-contact-badge"><span class="footer-icon" data-footer-icon="map-pin" aria-hidden="true"></span></span>
            <address><span class="footer-contact-label">Location</span><a href="https://www.google.com/maps/dir/?api=1&amp;destination=Siddaspace%2C%201st%20floor%20Parallel8%2F20%2F21%2C%203rd%20Floor%2C%20Chunchaghatta%20Main%20Roadto%2C%20Kanakapura%20Main%20Rd%2C%20Ganapathipura%2C%20Bengaluru%2C%20Karnataka%20560078" target="_blank" rel="noopener">Siddaspace, 1st floor,<br>Parallel8/20/21, 3rd Floor,<br>Chunchaghatta Main Road,<br>Kanakapura Main Rd,<br>Ganapathipura,<br>Bengaluru, Karnataka 560078</a></address>
          </div>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-content">
        <p>&copy; 2026 Siddaspace. All rights reserved.</p>
        <nav class="footer-legal" aria-label="Legal"><a href="/privacy-policy.html">Privacy Policy</a><a href="/terms">Terms &amp; Conditions</a></nav>
        <p class="footer-tagline"><span class="footer-icon" data-footer-icon="house" aria-hidden="true"></span>Spaces for a Better Tomorrow</p>
      </div>
    </div>
  </footer>
`;

const consultationFormMarkup = `
  <h2>Free Design Consultation</h2>
  <p>Share a few details and our design expert will call you back.</p>
  <div class="consultation-benefits" aria-label="Consultation benefits">
    <span><strong>&#10003;</strong> Expert Interior Designer</span>
    <span><strong>&#10003;</strong> Agreed Project Schedule</span>
    <span><strong>&#10003;</strong> Site Measurements</span>
    <span><strong>&#10003;</strong> Transparent Pricing</span>
  </div>
  <label>
    Full name
    <input type="text" name="name" placeholder="Enter your name" autocomplete="name" required>
  </label>
  <label>
    Mobile number
    <input type="tel" name="phone" placeholder="Enter mobile number" autocomplete="tel" inputmode="tel" maxlength="24" aria-describedby="phone-hint" required>
    <small id="phone-hint">Include your country code if needed.</small>
  </label>
  <label>
    Home type
    <select name="homeType" required>
      <option value="">Select home type</option>
      <option>1 BHK</option>
      <option>2 BHK</option>
      <option>3 BHK</option>
      <option>4 BHK</option>
      <option>Villa</option>
      <option>Commercial space</option>
    </select>
  </label>
  <button class="form-submit" type="submit">Book Your Consultation</button>
  <small>No spam. Only a professional consultation call.</small>
`;

function showToast(message) {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("is-visible");

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

function getConsultationMessage(form) {
  const formData = new FormData(form);
  const name = formData.get("name");
  const phone = formData.get("phone");
  const homeType = formData.get("homeType");
  const service = formData.get("consultationService");
  const description = formData.get("consultationDescription");
  const fee = formData.get("consultationFee");
  const isHomeService = Boolean(service && !fee);

  return [
    service ? `Hello Siddaspace, I want to book a ${isHomeService ? "home service" : "consultation"}.` : "Hello Siddaspace, I want to book a free consultation.",
    "",
    ...(service ? [
      `Service: ${service}`,
      ...(description ? [`${isHomeService ? "Service details" : "Consultation"}: ${description}`] : []),
      ...(fee ? [`Consultation fee: Rs ${Number(fee).toLocaleString("en-IN")} / hour`] : []),
      ""
    ] : []),
    `Name: ${name}`,
    `Mobile number: ${phone}`,
    `Home type: ${homeType}`,
    `Source page: ${leadSource()}`
  ].join("\n");
}

function submitConsultationForm(form) {
  validatePhoneFields(form);
  if (!form.reportValidity()) return;
  const whatsappUrl = `https://wa.me/916364309878?text=${encodeURIComponent(getConsultationMessage(form))}`;

  window.open(whatsappUrl, "_blank", "noopener");
  form.reset();
  showToast("Opening WhatsApp with your booking details.");
}

function createSiteFooter() {
  if (document.querySelector(".site-footer")) {
    return;
  }

  const main = document.querySelector("main");
  const template = document.createElement("template");
  template.innerHTML = footerMarkup.trim();
  const footer = template.content.firstElementChild;

  if (main) {
    main.insertAdjacentElement("afterend", footer);
    return;
  }

  document.body.append(footer);
}

function createConsultationWidget() {
  if (document.querySelector(".consultation-modal")) {
    return;
  }

  const modal = document.createElement("div");
  modal.className = "consultation-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="consultation-backdrop" data-consultation-close></div>
    <section class="consultation-dialog" role="dialog" aria-modal="false" aria-labelledby="consultation-title">
      <button class="consultation-close" type="button" aria-label="Close consultation form" data-consultation-close>&times;</button>
      <form class="consultation-popup-card" aria-label="Get free interior design quote">
        ${consultationFormMarkup.replace("<h2>", "<h2 id=\"consultation-title\">")}
        <input type="hidden" name="consultationService" value="">
        <input type="hidden" name="consultationDescription" value="">
        <input type="hidden" name="consultationFee" value="">
      </form>
    </section>
  `;

  document.body.append(modal);

  const popupForm = modal.querySelector(".consultation-popup-card");
  popupForm.addEventListener("input", (event) => {
    if (event.target.matches('input[type="tel"]')) event.target.setCustomValidity("");
  });
  popupForm.addEventListener("input", (event) => {
    if (event.target.matches('input[type="tel"]')) event.target.setCustomValidity("");
  });
  const setConsultationService = (service = "", fee = "", description = "") => {
    popupForm.elements.consultationService.value = service;
    popupForm.elements.consultationDescription.value = description;
    popupForm.elements.consultationFee.value = fee;
    popupForm.setAttribute("aria-label", service ? `${fee ? "Consultation" : "Service"} enquiry: ${service}` : "Get free interior design quote");
    popupForm.querySelector(".consultation-benefits").hidden = Boolean(service);
    popupForm.querySelector("h2").textContent = service ? (fee ? (description || service) : service) : "Free Design Consultation";
    popupForm.querySelector("p").textContent = service
      ? (fee
        ? `${service} \u00b7 \u20b9${Number(fee).toLocaleString("en-IN")} / hour. Share your details to arrange a visit.`
        : `${description}. Share your details to arrange a service visit.`)
      : "Share a few details and our design expert will call you back.";
    popupForm.querySelector(".form-submit").textContent = service && !fee ? "Book Your Service" : "Book Your Consultation";
    popupForm.querySelector("small").textContent = service && !fee ? "Our team will contact you to confirm your service details." : "No spam. Only a professional consultation call.";
  };
  const focusableSelector = "button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])";
  let lastFocusedElement = null;
  let isPopupOpen = false;
  let focusTimer;

  const hideModal = () => {
    window.clearTimeout(focusTimer);
    isPopupOpen = false;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };

  const closeModal = () => {
    if (!isPopupOpen) {
      return;
    }

    hideModal();

    if (lastFocusedElement) {
      const focusTarget = lastFocusedElement.inert && lastFocusedElement.matches(".booking-card")
        ? Array.from(document.querySelectorAll(".booking-card:not([inert])"))
          .find((card) => card.dataset.consultationService === lastFocusedElement.dataset.consultationService)
        : lastFocusedElement;
      focusTarget?.focus();
    }
  };

  const showModal = () => {
    isPopupOpen = true;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    focusTimer = window.setTimeout(() => modal.querySelector("input")?.focus(), 140);
  };

  const openModal = () => {
    if (isPopupOpen) {
      return;
    }

    lastFocusedElement = document.activeElement;
    showModal();
  };

  document.querySelectorAll('[data-open-consultation], a[href="#quote"]').forEach((quoteLink) => {
    quoteLink.addEventListener("click", (event) => {
      event.preventDefault();
      setConsultationService();
      openModal();
    });
  });

  document.querySelectorAll(".booking-card[data-consultation-service]").forEach((button) => {
    button.addEventListener("click", () => {
      setConsultationService(button.dataset.consultationService, button.dataset.consultationFee, button.dataset.consultationDescription);
      if (isPopupOpen) {
        lastFocusedElement = button;
      }
      openModal();
    });
  });

  modal.querySelectorAll("[data-consultation-close]").forEach((closeButton) => {
    closeButton.addEventListener("click", closeModal);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!isPopupOpen) {
      return;
    }

    if (modal.contains(event.target)) {
      return;
    }

    closeModal();
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(modal.querySelectorAll(focusableSelector))
      .filter((element) => !element.disabled && element.offsetParent !== null);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  popupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitConsultationForm(popupForm);
    closeModal();
  });
}

function createBookingCarousel(carousel) {
  if (!carousel) {
    return;
  }

  const track = carousel.querySelector(".consultation-bookings-grid");
  const viewport = carousel.querySelector(".booking-viewport");
  const slides = Array.from(track.querySelectorAll(".booking-card"));
  const controls = carousel.querySelector(".booking-controls");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const modal = document.querySelector(".consultation-modal");
  const cloneCount = 4;
  slides.forEach((slide, index) => { slide.dataset.bookingIndex = index; });
  const cloneSlide = (slide) => {
    const clone = slide.cloneNode(true);
    clone.removeAttribute("id");
    clone.dataset.bookingClone = "true";
    clone.inert = true;
    clone.tabIndex = -1;
    clone.setAttribute("aria-hidden", "true");
    clone.addEventListener("click", () => slide.click());
    return clone;
  };
  // Buffer cards let the loop wrap without moving backwards or exposing empty space.
  track.prepend(...slides.slice(-cloneCount).map(cloneSlide));
  track.append(...slides.slice(0, cloneCount).map(cloneSlide));
  const allSlides = Array.from(track.children);
  let activeIndex = 0;
  let position = cloneCount;
  let step = 0;
  let timer;
  let animationFallback;
  let isAnimating = false;
  let hovered = false;
  let inView = false;
  let gesture = null;
  let suppressClickUntil = 0;

  const dotsGroup = document.createElement("div");
  dotsGroup.className = "booking-dots";
  dotsGroup.setAttribute("role", "group");
  dotsGroup.setAttribute("aria-label", carousel.classList.contains("home-service-bookings") ? "Choose a home service slide" : "Choose a consultation slide");
  const dots = slides.map((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "booking-dot";
    dot.setAttribute("aria-label", `Show ${slide.dataset.consultationService}, slide ${index + 1} of ${slides.length}`);
    dot.title = slide.dataset.consultationService;
    slide.id = `${carousel.id}-slide-${index + 1}`;
    dot.setAttribute("aria-controls", slide.id);
    dot.addEventListener("click", () => showSlide(index));
    dotsGroup.append(dot);
    return dot;
  });

  controls.append(dotsGroup);
  controls.hidden = false;
  carousel.classList.add("is-carousel");
  const previous = carousel.querySelector(".booking-previous");
  const next = carousel.querySelector(".booking-next");
  previous.hidden = false;
  next.hidden = false;
  previous.addEventListener("click", () => shiftSlide(-1));
  next.addEventListener("click", () => shiftSlide(1));

  function scheduleNextSlide() {
    window.clearTimeout(timer);
    // Never move a booking button while it is being used or its form is open.
    if (reducedMotion.matches || !inView || hovered || document.hidden || isAnimating || gesture ||
        carousel.contains(document.activeElement) || modal?.classList.contains("is-open")) {
      return;
    }
    timer = window.setTimeout(() => shiftSlide(1), 4500);
  }

  function updateAccessibility() {
    const fullCards = Number(getComputedStyle(viewport).getPropertyValue("--booking-full-cards"));
    const focusedCard = allSlides.includes(document.activeElement) ? document.activeElement : null;
    allSlides.forEach((slide, index) => {
      const visible = index >= position && index < position + fullCards;
      slide.inert = !visible;
      slide.setAttribute("aria-hidden", String(!visible));
      slide.tabIndex = visible ? 0 : -1;
    });
    dots.forEach((dot, index) => dot.setAttribute("aria-current", String(index === activeIndex)));
    if (focusedCard?.inert) {
      allSlides.find((slide) => !slide.inert && slide.dataset.bookingIndex === focusedCard.dataset.bookingIndex)?.focus();
    }
  }

  function jumpToPosition() {
    track.style.transition = "none";
    track.style.transform = `translateX(-${position * step}px)`;
    track.getBoundingClientRect();
    track.style.transition = "";
  }

  function finishAnimation() {
    window.clearTimeout(animationFallback);
    isAnimating = false;
    if (position < cloneCount || position >= cloneCount + slides.length) {
      position = cloneCount + activeIndex;
      jumpToPosition();
    }
    updateAccessibility();
    scheduleNextSlide();
  }

  function animateTo(nextPosition, index) {
    if (isAnimating) {
      return;
    }
    window.clearTimeout(timer);
    position = nextPosition;
    activeIndex = index;
    isAnimating = true;
    track.style.transition = "";
    track.style.transform = `translateX(-${position * step}px)`;
    updateAccessibility();
    if (reducedMotion.matches) {
      finishAnimation();
    } else {
      animationFallback = window.setTimeout(finishAnimation, 600);
    }
  }

  function showSlide(index) {
    animateTo(cloneCount + index, index);
  }

  function shiftSlide(direction) {
    animateTo(position + direction, (activeIndex + direction + slides.length) % slides.length);
  }

  track.addEventListener("transitionend", (event) => {
    if (event.target === track && event.propertyName === "transform" && isAnimating) {
      finishAnimation();
    }
  });

  dotsGroup.addEventListener("keydown", (event) => {
    const index = dots.indexOf(document.activeElement);
    if (index < 0) {
      return;
    }
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % slides.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + slides.length) % slides.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = slides.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      dots[nextIndex].focus();
      showSlide(nextIndex);
    }
  });
  carousel.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      hovered = true;
      scheduleNextSlide();
    }
  });
  carousel.addEventListener("pointerleave", () => {
    hovered = false;
    scheduleNextSlide();
  });
  carousel.addEventListener("focusin", scheduleNextSlide);
  carousel.addEventListener("focusout", () => window.setTimeout(scheduleNextSlide, 0));
  carousel.addEventListener("click", (event) => {
    if (Date.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  viewport.addEventListener("pointerdown", (event) => {
    if (isAnimating || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, delta: 0, horizontal: false };
    scheduleNextSlide();
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!gesture || gesture.id !== event.pointerId) {
      return;
    }
    const delta = event.clientX - gesture.x;
    if (!gesture.horizontal && Math.abs(delta) > 12 && Math.abs(delta) > Math.abs(event.clientY - gesture.y)) {
      gesture.horizontal = true;
      viewport.setPointerCapture(event.pointerId);
    }
    if (gesture.horizontal) {
      event.preventDefault();
      gesture.delta = Math.max(-step, Math.min(step, delta));
      track.style.transition = "none";
      track.style.transform = `translateX(${-position * step + gesture.delta}px)`;
    }
  });
  const finishGesture = (event) => {
    if (!gesture || gesture.id !== event.pointerId) {
      return;
    }
    const { horizontal, delta } = gesture;
    gesture = null;
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    if (horizontal) {
      suppressClickUntil = Date.now() + 500;
      if (document.activeElement?.matches(".booking-card")) {
        document.activeElement.blur();
      }
      track.getBoundingClientRect();
      const direction = event.type !== "pointercancel" && Math.abs(delta) >= 40 ? (delta < 0 ? 1 : -1) : 0;
      shiftSlide(direction);
    } else {
      scheduleNextSlide();
    }
  };
  window.addEventListener("pointerup", finishGesture);
  window.addEventListener("pointercancel", finishGesture);
  document.addEventListener("visibilitychange", scheduleNextSlide);
  reducedMotion.addEventListener("change", scheduleNextSlide);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    scheduleNextSlide();
  }, { threshold: 0.1 }).observe(carousel);
  if (modal) {
    new MutationObserver(scheduleNextSlide).observe(modal, { attributes: true, attributeFilter: ["class"] });
  }
  new ResizeObserver(() => {
    window.clearTimeout(animationFallback);
    isAnimating = false;
    gesture = null;
    step = slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
    position = cloneCount + activeIndex;
    jumpToPosition();
    updateAccessibility();
    scheduleNextSlide();
  }).observe(viewport);
}

function createPeopleScroller() {
  const track = document.querySelector(".sidda-people-grid");
  if (!track) {
    return;
  }
  const slider = track.closest(".sidda-people-slider");
  const controls = slider.querySelector(".sidda-people-controls");
  const previous = controls.querySelector(".sidda-people-previous");
  const next = controls.querySelector(".sidda-people-next");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const getStep = () => track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
  const updateControls = () => {
    previous.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    controls.style.marginTop = `${Math.max(0, (track.firstElementChild.offsetWidth - 40) / 2)}px`;
    if (window.matchMedia("(max-width: 600px)").matches) {
      controls.style.marginTop = "0";
    }
  };
  const scrollTo = (left) => track.scrollTo({ left, behavior: reducedMotion.matches ? "instant" : "smooth" });
  previous.addEventListener("click", () => scrollTo(track.scrollLeft - getStep()));
  next.addEventListener("click", () => scrollTo(track.scrollLeft + getStep()));
  track.addEventListener("scroll", updateControls, { passive: true });
  track.addEventListener("keydown", (event) => {
    let left;
    if (event.key === "ArrowLeft") left = track.scrollLeft - getStep();
    if (event.key === "ArrowRight") left = track.scrollLeft + getStep();
    if (event.key === "Home") left = 0;
    if (event.key === "End") left = track.scrollWidth;
    if (left !== undefined) {
      event.preventDefault();
      scrollTo(left);
    }
  });
  controls.hidden = false;
  new ResizeObserver(updateControls).observe(track);
  updateControls();
}

function createProjectImageViewer() {
  const images = document.querySelectorAll(".project-image img, .residential-card > img");
  if (!images.length) {
    return;
  }

  const viewer = document.createElement("dialog");
  viewer.className = "gallery-lightbox project-lightbox";
  viewer.setAttribute("aria-labelledby", "project-image-title");
  viewer.innerHTML = `
    <div class="gallery-lightbox-bar">
      <p id="project-image-title" aria-live="polite"></p>
      <button class="gallery-lightbox-close" type="button" aria-label="Close image preview" title="Close image preview">&times;</button>
    </div>
    <div class="project-lightbox-stage">
      <button class="project-lightbox-arrow" type="button" data-image-previous aria-label="Previous image" title="Previous image">&lsaquo;</button>
      <img alt="">
      <button class="project-lightbox-arrow" type="button" data-image-next aria-label="Next image" title="Next image">&rsaquo;</button>
    </div>
  `;
  document.body.append(viewer);

  const preview = viewer.querySelector("img");
  const title = viewer.querySelector("p");
  let opener = null;
  let galleryImages = [];
  let currentImageIndex = 0;

  const showImage = (index) => {
    currentImageIndex = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[currentImageIndex];
    preview.src = image.dataset.originalSrc || image.src;
    preview.width = Number(image.getAttribute("width")) || image.naturalWidth;
    preview.height = Number(image.getAttribute("height")) || image.naturalHeight;
    preview.alt = image.alt;
    title.textContent = image.alt || "Project image";
  };

  images.forEach((image) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "project-image-button";
    button.setAttribute("aria-label", `View ${image.alt || "project image"}`);
    button.setAttribute("aria-haspopup", "dialog");
    image.before(button);
    button.append(image);
    button.addEventListener("click", () => {
      opener = button;
      const grid = image.closest(".project-grid, .residential-grid");
      galleryImages = Array.from(images).filter((item) => (
        item.closest(".project-grid, .residential-grid") === grid &&
        !item.closest(".is-hidden")
      ));
      showImage(galleryImages.indexOf(image));
      viewer.showModal();
      document.body.classList.add("image-preview-open");
    });
  });

  viewer.querySelector(".gallery-lightbox-close").addEventListener("click", () => viewer.close());
  viewer.querySelector("[data-image-previous]").addEventListener("click", () => showImage(currentImageIndex - 1));
  viewer.querySelector("[data-image-next]").addEventListener("click", () => showImage(currentImageIndex + 1));
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showImage(currentImageIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  viewer.addEventListener("click", (event) => {
    const bounds = viewer.getBoundingClientRect();
    if (event.target === viewer && (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    )) {
      viewer.close();
    }
  });
  viewer.addEventListener("close", () => {
    document.body.classList.remove("image-preview-open");
    preview.removeAttribute("src");
    opener?.focus({ preventScroll: true });
  });
}

createProjectImageViewer();
createSiteFooter();
prepareVideos();
document.querySelectorAll("[data-footer-icon]").forEach((icon) => {
  icon.style.maskImage = `url("/assets/icons/lucide/${icon.dataset.footerIcon}.svg")`;
});
createConsultationWidget();
document.querySelectorAll(".consultation-bookings").forEach((carousel) => createBookingCarousel(carousel));
createPeopleScroller();

if (header && menuToggle) {
  const updateHeaderShadow = () => {
    header.classList.toggle("has-shadow", window.scrollY > 8);
  };

  updateHeaderShadow();
  window.addEventListener("scroll", updateHeaderShadow, { passive: true });

  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  document.querySelectorAll(".site-nav a, .header-brand").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    });
  });
  header.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("is-open")) {
      header.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
      menuToggle.focus();
    }
  });
}

if (navLinks.length) {
  const navSectionPairs = Array.from(navLinks)
    .map((link) => {
      if (!link.hash) {
        return null;
      }

      const section = document.querySelector(link.hash);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  const setActiveNavLink = (activeLink) => {
    navLinks.forEach((link) => {
      const isActive = link === activeLink;
      link.classList.toggle("is-active", isActive);
      link.setAttribute("aria-current", isActive ? "page" : "false");
    });
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setActiveNavLink(link));
  });

  if (navSectionPairs.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

      if (!visibleEntry) {
        return;
      }

      const activePair = navSectionPairs.find((pair) => pair.section === visibleEntry.target);

      if (activePair) {
        setActiveNavLink(activePair.link);
      }
    }, {
      rootMargin: "-35% 0px -45% 0px",
      threshold: [0.12, 0.28, 0.5]
    });

    navSectionPairs.forEach(({ section }) => navObserver.observe(section));
  }
}

if (projectFilters.length && projectCards.length) {
  projectFilters.forEach((filterButton) => {
    filterButton.addEventListener("click", () => {
      const activeFilter = filterButton.dataset.projectFilter;

      projectFilters.forEach((button) => {
        button.classList.toggle("is-active", button === filterButton);
      });

      projectCards.forEach((card) => {
        const categories = card.dataset.projectCategory.split(" ");
        const shouldShow = activeFilter === "all" || categories.includes(activeFilter);

        card.classList.toggle("is-hidden", !shouldShow);
      });
    });
  });
}

comparisonRanges.forEach((range) => {
  const slider = range.closest(".comparison-slider");

  if (!slider) {
    return;
  }

  const updateComparison = () => {
    const position = Number(range.value);

    slider.style.setProperty("--position", `${position}%`);
    slider.style.setProperty("--position-num", String(position / 100));
  };

  range.addEventListener("input", updateComparison);
  updateComparison();
});

if (backToTopButton) {
  const updateBackToTop = () => {
    backToTopButton.classList.toggle("is-visible", window.scrollY > 520);
  };

  updateBackToTop();
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (quoteForm) {
  quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitConsultationForm(quoteForm);
  });
}

if (contactCallButton && contactPhoneNumber) {
  contactCallButton.addEventListener("click", () => {
    contactPhoneNumber.hidden = false;
    contactCallButton.setAttribute("aria-expanded", "true");
    showToast("Call Siddaspace at +91 6364309878.");
  });
}

if (estimateForm) {
  estimateForm.addEventListener("input", (event) => {
    if (event.target.matches('input[type="tel"]')) event.target.setCustomValidity("");
  });
  let currentWizardStep = 0;

function getCheckedValue(name) {
  const checked = estimateForm.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}

function updateWizard() {
  wizardSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === currentWizardStep);
  });

  progressSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === currentWizardStep);
    step.classList.toggle("is-complete", index < currentWizardStep);
  });

  estimateForm.classList.toggle("is-first", currentWizardStep === 0);
  estimateForm.classList.toggle("is-final", currentWizardStep === wizardSteps.length - 1);
}

function validateWizardStep() {
  if (currentWizardStep === 0 && !getCheckedValue("bhkType")) {
    showToast("Please select your BHK type.");
    return false;
  }

  if (currentWizardStep === 2 && !getCheckedValue("packageType")) {
    showToast("Please select a package.");
    return false;
  }

  return true;
}

function goToWizardStep(nextStep) {
  currentWizardStep = Math.max(0, Math.min(nextStep, wizardSteps.length - 1));
  updateWizard();
  estimateSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setRoomCount(roomName, value) {
  const roomRow = document.querySelector(`.room-row[data-room="${roomName}"]`);
  if (!roomRow) {
    return;
  }

  roomRow.querySelector("[data-count]").textContent = String(value);
}

document.querySelectorAll('input[name="bhkType"]').forEach((input) => {
  input.addEventListener("change", () => {
    const bhkDefaults = {
      "1 BHK": { living: 1, kitchen: 1, bedroom: 1, bathroom: 1, dining: 0 },
      "2 BHK": { living: 1, kitchen: 1, bedroom: 2, bathroom: 2, dining: 1 },
      "3 BHK": { living: 1, kitchen: 1, bedroom: 3, bathroom: 3, dining: 1 },
      "4 BHK": { living: 2, kitchen: 1, bedroom: 4, bathroom: 4, dining: 1 },
      "5 BHK+": { living: 2, kitchen: 1, bedroom: 5, bathroom: 5, dining: 1 }
    };
    const selectedDefaults = bhkDefaults[input.value];

    setRoomCount("Living Room", selectedDefaults.living);
    setRoomCount("Kitchen", selectedDefaults.kitchen);
    setRoomCount("Bedroom", selectedDefaults.bedroom);
    setRoomCount("Bathroom", selectedDefaults.bathroom);
    setRoomCount("Dining", selectedDefaults.dining);
  });
});

document.querySelectorAll("[data-counter-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest(".room-row");
    const count = row.querySelector("[data-count]");
    const action = button.dataset.counterAction;
    const currentCount = Number(count.textContent);
    const nextCount = action === "plus" ? currentCount + 1 : currentCount - 1;

    count.textContent = String(Math.max(0, Math.min(10, nextCount)));
  });
});

wizardNext.addEventListener("click", () => {
  if (!validateWizardStep()) {
    return;
  }

  goToWizardStep(currentWizardStep + 1);
});

wizardBack.addEventListener("click", () => {
  goToWizardStep(currentWizardStep - 1);
});

progressSteps.forEach((step) => {
  step.addEventListener("click", () => {
    const requestedStep = Number(step.dataset.stepJump);

    if (requestedStep <= currentWizardStep) {
      goToWizardStep(requestedStep);
      return;
    }

    while (currentWizardStep < requestedStep) {
      if (!validateWizardStep()) {
        break;
      }

      currentWizardStep += 1;
    }

    updateWizard();
  });
});

estimateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  validatePhoneFields(estimateForm);

  if (!estimateForm.reportValidity()) {
    return;
  }

  const formData = new FormData(estimateForm);
  const rooms = Array.from(document.querySelectorAll(".room-row"))
    .map((row) => {
      const count = Number(row.querySelector("[data-count]").textContent);
      return count > 0 ? `${row.dataset.room}: ${count}` : "";
    })
    .filter(Boolean)
    .join(", ");
  const message = [
    "Hello Siddaspace, I would like a quotation for my home interiors.",
    "",
    `BHK type: ${formData.get("bhkType")}`,
    `Rooms to design: ${rooms || "Not selected"}`,
    `Package: ${formData.get("packageType")}`,
    "",
    `Name: ${formData.get("estimateName")}`,
    `Email: ${formData.get("estimateEmail")}`,
    `Phone number: ${formData.get("estimatePhone")}`,
    `City: ${formData.get("estimateCity")}`,
    `WhatsApp updates: ${formData.get("whatsappUpdates") ? "Yes" : "No"}`,
    `Source page: ${leadSource()}`
  ].join("\n");
  const whatsappUrl = `https://wa.me/916364309878?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, "_blank", "noopener");
  showToast("Opening WhatsApp with your quotation request details.");
});

  updateWizard();
}
