const STORAGE_KEY = "midnight-garage-cars";
const publishedCars = Array.isArray(window.PUBLISHED_CARS) ? window.PUBLISHED_CARS : [];

const form = document.querySelector("#car-form");
const gallery = document.querySelector("#gallery");
const filters = document.querySelector("#category-filters");
const template = document.querySelector("#car-card-template");

let localCars = loadCars();
let activeCategory = "All";

render();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.querySelector("#car-name").value.trim();
  const category = document.querySelector("#car-category").value.trim();
  const description = document.querySelector("#car-description").value.trim();
  const imageInput = document.querySelector("#car-image");
  const file = imageInput.files[0];

  if (!name || !category || !description || !file) {
    return;
  }

  const imageData = await fileToDataUrl(file);

  localCars.unshift({
    id: crypto.randomUUID(),
    name,
    category,
    description,
    image: imageData,
    source: "local",
  });

  saveCars();
  form.reset();
  activeCategory = category;
  render();
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) {
    return;
  }

  activeCategory = button.dataset.category;
  render();
});

gallery.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) {
    return;
  }

  localCars = localCars.filter((car) => car.id !== button.dataset.id);

  if (activeCategory !== "All" && !getAllCars().some((car) => car.category === activeCategory)) {
    activeCategory = "All";
  }

  saveCars();
  render();
});

function render() {
  renderFilters();
  renderGallery();
}

function renderFilters() {
  const categories = ["All", ...new Set(getAllCars().map((car) => car.category))];
  filters.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-button${category === activeCategory ? " active" : ""}`;
      button.dataset.category = category;
      button.textContent = category;
      return button;
    })
  );
}

function renderGallery() {
  const visibleCars =
    activeCategory === "All"
      ? getAllCars()
      : getAllCars().filter((car) => car.category === activeCategory);

  if (!visibleCars.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML =
      "<h3>No cars parked here yet.</h3><p>Add your first published car in cars-data.js or use the local preview form above.</p>";
    gallery.replaceChildren(empty);
    return;
  }

  const cards = visibleCars.map((car) => {
    const fragment = template.content.cloneNode(true);
    const image = fragment.querySelector(".card-image");
    image.src = car.image;
    image.alt = car.name;

    fragment.querySelector(".category-pill").textContent = car.category;
    fragment.querySelector(".card-title").textContent = car.name;
    fragment.querySelector(".card-description").textContent = car.description;

    const deleteButton = fragment.querySelector(".delete-button");
    deleteButton.dataset.id = car.id;
    deleteButton.hidden = car.source !== "local";

    return fragment;
  });

  gallery.replaceChildren(...cards);
}

function loadCars() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const cars = stored ? JSON.parse(stored) : [];
    return cars.map((car) => ({
      ...car,
      image: car.image ?? car.imageData,
      source: "local",
    }));
  } catch {
    return [];
  }
}

function saveCars() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localCars));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function getAllCars() {
  return [...publishedCars, ...localCars];
}
