const galleryImageSets = [
  ["12.50.13 PM", [" (1)"]],
  ["12.50.14 PM", [" (3)", " (4)", ""]],
  ["12.50.15 PM", [" (1)", " (2)", " (3)", ""]],
  ["12.50.16 PM", [" (1)", " (2)", ""]],
  ["12.50.17 PM", [" (1)", " (2)", " (3)"]],
  ["12.50.18 PM", [" (1)", " (2)", " (3)", " (4)", ""]],
  ["12.50.19 PM", [" (1)", " (2)", " (3)", " (4)", ""]],
  ["12.50.20 PM", [" (1)", " (2)", " (3)", ""]],
  ["12.50.21 PM", [" (1)", " (2)", " (3)", " (4)", ""]],
  ["12.50.22 PM", [" (1)", " (2)", " (3)", " (4)", ""]],
  ["12.50.23 PM", [" (1)", " (2)", " (3)", " (4)", ""]],
  ["12.50.24 PM", [" (1)", " (2)", " (3)", ""]],
  ["12.50.25 PM", [" (1)", " (2)", ""]],
  ["12.50.30 PM", [" (1)", " (2)", ""]],
  ["12.50.31 PM", [" (1)", " (2)", " (3)"]],
  ["12.50.32 PM", [" (1)", " (2)", " (3)", " (4)", ""]],
  ["12.50.33 PM", [" (1)", " (2)", " (3)", ""]],
  ["12.50.34 PM", [" (1)", " (2)", " (3)", " (4)", ""]],
  ["12.50.35 PM", [" (1)", " (2)", " (3)", ""]],
  ["12.50.36 PM", [" (1)", " (2)", " (3)", ""]],
  ["12.50.37 PM", [" (1)", " (2)", " (3)", " (4)", ""]],
  ["12.50.38 PM", [" (1)", " (2)", " (3)", ""]],
  ["12.50.39 PM", [" (2)", " (3)", " (4)", ""]],
  ["12.50.40 PM", [" (1)", ""]]
];

const galleryImages = galleryImageSets.flatMap(([time, variants]) => (
  variants.map((variant) => `WhatsApp Image 2026-09-07 at ${time}${variant}.jpeg`)
));

const galleryGrid = document.querySelector("[data-gallery-grid]");
const galleryLightbox = document.querySelector("[data-gallery-lightbox]");
const galleryLightboxImage = document.querySelector("[data-gallery-lightbox-image]");
const galleryCloseButton = document.querySelector("[data-gallery-close]");

function getGalleryImagePath(filename) {
  return `/assets/gallery/${encodeURIComponent(filename)}`;
}

function openGalleryImage(filename, index) {
  if (!galleryLightbox || !galleryLightboxImage) {
    return;
  }

  galleryLightboxImage.src = getGalleryImagePath(filename);
  galleryLightboxImage.alt = `Sofa design ${index + 1}`;
  galleryLightbox.showModal();
}

if (galleryGrid) {
  const galleryFragment = document.createDocumentFragment();

  galleryImages.forEach((filename, index) => {
    const galleryButton = document.createElement("button");
    galleryButton.className = "product-gallery-item";
    galleryButton.type = "button";
    galleryButton.setAttribute("aria-label", `View sofa design ${index + 1}`);

    const galleryImage = document.createElement("img");
    galleryImage.src = getGalleryImagePath(filename);
    galleryImage.alt = `Sofa design ${index + 1}`;
    galleryImage.loading = "lazy";
    galleryImage.decoding = "async";

    galleryButton.append(galleryImage);
    galleryButton.addEventListener("click", () => openGalleryImage(filename, index));
    galleryFragment.append(galleryButton);
  });

  galleryGrid.append(galleryFragment);
}

galleryCloseButton?.addEventListener("click", () => galleryLightbox?.close());

galleryLightbox?.addEventListener("click", (event) => {
  if (event.target === galleryLightbox) {
    galleryLightbox.close();
  }
});

galleryLightbox?.addEventListener("close", () => {
  if (galleryLightboxImage) {
    galleryLightboxImage.src = "";
  }
});
