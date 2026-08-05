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
const counterElements = document.querySelectorAll("[data-counter-target]");
const testimonialTrack = document.querySelector(".testimonial-track");
const testimonialCards = document.querySelectorAll(".testimonial-card");
const testimonialPrev = document.querySelector(".slider-arrow.prev");
const testimonialNext = document.querySelector(".slider-arrow.next");
const testimonialDots = document.querySelector(".testimonial-dots");
const comparisonRanges = document.querySelectorAll(".comparison-range");
const backToTopButton = document.querySelector(".back-to-top");
const navLinks = document.querySelectorAll(".site-nav a");

const consultationFormMarkup = `
  <h2>Free Design Consultation</h2>
  <p>Share a few details and our design expert will call you back.</p>
  <div class="consultation-benefits" aria-label="Consultation benefits">
    <span><strong>&#10003;</strong> Expert Interior Designer</span>
    <span><strong>&#10003;</strong> 45-Day Delivery</span>
    <span><strong>&#10003;</strong> Free Site Visit</span>
    <span><strong>&#10003;</strong> Transparent Pricing</span>
  </div>
  <label>
    Full name
    <input type="text" name="name" placeholder="Enter your name" required>
  </label>
  <label>
    Mobile number
    <input type="tel" name="phone" placeholder="Enter mobile number" required>
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

  return [
    "Hello Sidda Space, I want to book a free consultation.",
    "",
    `Name: ${name}`,
    `Mobile number: ${phone}`,
    `Home type: ${homeType}`
  ].join("\n");
}

function submitConsultationForm(form) {
  const whatsappUrl = `https://wa.me/917624881416?text=${encodeURIComponent(getConsultationMessage(form))}`;

  window.open(whatsappUrl, "_blank", "noopener");
  form.reset();
  showToast("Opening WhatsApp with your consultation details.");
}

function createConsultationWidget() {
  if (document.querySelector(".consultation-float")) {
    return;
  }

  const launcher = document.createElement("button");
  launcher.className = "consultation-float";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open free design consultation");
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML = `
    <span class="consultation-float-icon" aria-hidden="true">
      <span class="consultation-window"></span>
      <span class="consultation-door"></span>
    </span>
    <span class="consultation-float-text">Free Consultation</span>
  `;

  const modal = document.createElement("div");
  modal.className = "consultation-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="consultation-backdrop" data-consultation-close></div>
    <section class="consultation-dialog" role="dialog" aria-modal="false" aria-labelledby="consultation-title">
      <button class="consultation-close" type="button" aria-label="Close consultation form" data-consultation-close>&times;</button>
      <form class="consultation-popup-card" aria-label="Get free interior design quote">
        ${consultationFormMarkup.replace("<h2>", "<h2 id=\"consultation-title\">")}
      </form>
    </section>
  `;

  document.body.append(launcher, modal);

  const popupForm = modal.querySelector(".consultation-popup-card");
  const focusableSelector = "button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])";
  let lastFocusedElement = null;
  const door = launcher.querySelector(".consultation-door");
  const doorAnimationDuration = 650;
  let isDoorOpen = false;
  let isPopupOpen = false;
  let isAnimating = false;

  const waitForDoorAnimation = () => new Promise((resolve) => {
    let isResolved = false;

    const finish = () => {
      if (isResolved) {
        return;
      }

      isResolved = true;
      door.removeEventListener("transitionend", handleTransitionEnd);
      window.clearTimeout(animationFallback);
      resolve();
    };

    const handleTransitionEnd = (event) => {
      if (event.target === door && event.propertyName === "transform") {
        finish();
      }
    };

    const animationFallback = window.setTimeout(finish, doorAnimationDuration + 120);
    door.addEventListener("transitionend", handleTransitionEnd);
  });

  const setDoorOpen = async (shouldOpen) => {
    if (isDoorOpen === shouldOpen) {
      return;
    }

    isAnimating = true;
    const doorAnimation = waitForDoorAnimation();
    launcher.setAttribute("aria-expanded", "true");
    launcher.classList.toggle("is-door-open", shouldOpen);
    await doorAnimation;
    isDoorOpen = shouldOpen;

    if (!shouldOpen && !isPopupOpen) {
      launcher.setAttribute("aria-expanded", "false");
    }

    isAnimating = false;
  };

  const hideModal = () => {
    isPopupOpen = false;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };

  const closeModal = async () => {
    if (!isPopupOpen || isAnimating) {
      return;
    }

    hideModal();
    await setDoorOpen(false);

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  };

  const showModal = () => {
    isPopupOpen = true;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    window.setTimeout(() => modal.querySelector("input")?.focus(), 140);
  };

  const openModal = async () => {
    if (isPopupOpen || isAnimating) {
      return;
    }

    lastFocusedElement = document.activeElement;
    await setDoorOpen(true);
    showModal();
  };

  launcher.addEventListener("click", () => {
    if (isPopupOpen) {
      closeModal();
      return;
    }

    openModal();
  });

  document.querySelectorAll('a[href="#quote"]').forEach((quoteLink) => {
    quoteLink.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  });

  modal.querySelectorAll("[data-consultation-close]").forEach((closeButton) => {
    closeButton.addEventListener("click", closeModal);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!isPopupOpen || isAnimating) {
      return;
    }

    if (modal.contains(event.target) || launcher.contains(event.target)) {
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

createConsultationWidget();

if (header && menuToggle) {
  const updateHeaderShadow = () => {
    header.classList.toggle("has-shadow", window.scrollY > 8);
  };

  updateHeaderShadow();
  window.addEventListener("scroll", updateHeaderShadow, { passive: true });

  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".site-nav a, .header-cta").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
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

if (counterElements.length) {
  const formatCounter = (value, decimals, suffix) => `${value.toFixed(decimals)}${suffix}`;

  const animateCounter = (counter) => {
    if (counter.dataset.counterAnimated) {
      return;
    }

    counter.dataset.counterAnimated = "true";

    const target = Number(counter.dataset.counterTarget);
    const decimals = Number(counter.dataset.counterDecimals || 0);
    const suffix = counter.dataset.counterSuffix || "";
    const duration = 1400;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = target * eased;

      counter.textContent = formatCounter(currentValue, decimals, suffix);

      if (progress < 1) {
        requestAnimationFrame(tick);
        return;
      }

      counter.textContent = formatCounter(target, decimals, suffix);
    };

    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    counterElements.forEach((counter) => counterObserver.observe(counter));
  } else {
    counterElements.forEach(animateCounter);
  }
}

if (testimonialTrack && testimonialCards.length) {
  let activeTestimonial = 0;
  const dotButtons = [];

  const updateTestimonials = () => {
    testimonialTrack.style.transform = `translateX(-${activeTestimonial * 100}%)`;

    dotButtons.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeTestimonial);
      dot.setAttribute("aria-current", index === activeTestimonial ? "true" : "false");
    });
  };

  testimonialCards.forEach((card, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show testimonial ${index + 1}`);
    dot.addEventListener("click", () => {
      activeTestimonial = index;
      updateTestimonials();
    });

    testimonialDots.appendChild(dot);
    dotButtons.push(dot);
  });

  testimonialPrev.addEventListener("click", () => {
    activeTestimonial = (activeTestimonial - 1 + testimonialCards.length) % testimonialCards.length;
    updateTestimonials();
  });

  testimonialNext.addEventListener("click", () => {
    activeTestimonial = (activeTestimonial + 1) % testimonialCards.length;
    updateTestimonials();
  });

  updateTestimonials();
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
    showToast("Call Sidda Space at +91 7624881416.");
  });
}

if (estimateForm) {
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
    "Hello Sidda Space, I want an instant interior estimate.",
    "",
    `BHK type: ${formData.get("bhkType")}`,
    `Rooms to design: ${rooms || "Not selected"}`,
    `Package: ${formData.get("packageType")}`,
    "",
    `Name: ${formData.get("estimateName")}`,
    `Email: ${formData.get("estimateEmail")}`,
    `Phone number: ${formData.get("estimatePhone")}`,
    `City: ${formData.get("estimateCity")}`,
    `WhatsApp updates: ${formData.get("whatsappUpdates") ? "Yes" : "No"}`
  ].join("\n");
  const whatsappUrl = `https://wa.me/917624881416?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, "_blank", "noopener");
  showToast("Opening WhatsApp with your complete estimate details.");
});

  updateWizard();
}
