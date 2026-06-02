const state = {
  token: localStorage.getItem("panel_token") || "",
  data: null
};

const API_BASE = String(window.API_BASE_URL || localStorage.getItem("panel_api_base") || "").replace(/\/$/, "");

const els = {
  brandLogo: document.getElementById("brandLogo"),
  brandName: document.getElementById("brandName"),
  themeToggle: document.getElementById("themeToggle"),
  logoutBtn: document.getElementById("logoutBtn"),
  adminLogin: document.getElementById("adminLogin"),
  adminArea: document.getElementById("adminArea"),
  adminEmail: document.getElementById("adminEmail"),
  adminPassword: document.getElementById("adminPassword"),
  adminLoginBtn: document.getElementById("adminLoginBtn"),
  loginMessage: document.getElementById("loginMessage"),
  adminNotice: document.getElementById("adminNotice"),
  siteName: document.getElementById("siteName"),
  logoText: document.getElementById("logoText"),
  logoUrl: document.getElementById("logoUrl"),
  backgroundImage: document.getElementById("backgroundImage"),
  heroIntervalSeconds: document.getElementById("heroIntervalSeconds"),
  heroTitle: document.getElementById("heroTitle"),
  heroSubtitle: document.getElementById("heroSubtitle"),
  supportWhatsApp: document.getElementById("supportWhatsApp"),
  supportTelegram: document.getElementById("supportTelegram"),
  rateBDT: document.getElementById("rateBDT"),
  rateINR: document.getElementById("rateINR"),
  googleClientId: document.getElementById("googleClientId"),
  introAnimation: document.getElementById("introAnimation"),
  saveSettings: document.getElementById("saveSettings"),
  logoUpload: document.getElementById("logoUpload"),
  backgroundUpload: document.getElementById("backgroundUpload"),
  badgeEditor: document.getElementById("heroSlideEditor"),
  addBadge: document.getElementById("addHeroSlide"),
  paymentEditor: document.getElementById("paymentEditor"),
  addPayment: document.getElementById("addPayment"),
  savePayments: document.getElementById("savePayments"),
  sectionEditor: document.getElementById("sectionEditor"),
  newSection: document.getElementById("newSection"),
  productEditor: document.getElementById("productEditor"),
  newProduct: document.getElementById("newProduct"),
  stockProductSelect: document.getElementById("stockProductSelect"),
  stockVariantSelect: document.getElementById("stockVariantSelect"),
  stockDurationDays: document.getElementById("stockDurationDays"),
  stockKeysInput: document.getElementById("stockKeysInput"),
  stockList: document.getElementById("stockList"),
  saveStock: document.getElementById("saveStock"),
  deleteSelectedStock: document.getElementById("deleteSelectedStock"),
  clearStock: document.getElementById("clearStock"),
  ordersTable: document.getElementById("ordersTable"),
  deleteSelectedOrders: document.getElementById("deleteSelectedOrders"),
  usersTable: document.getElementById("usersTable"),
  newAdminPassword: document.getElementById("newAdminPassword"),
  savePassword: document.getElementById("savePassword"),
  securityMessage: document.getElementById("securityMessage"),
  defaultCredentials: document.getElementById("defaultCredentials")
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function currency(amount, code = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: code === "USD" ? 2 : 0
  }).format(Number(amount || 0));
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function setMessage(element, message, type = "") {
  if (!element) return;
  element.textContent = message || "";
  element.classList.toggle("error", type === "error");
  element.classList.toggle("ok", type === "ok");
}

function notice(message, type = "ok") {
  setMessage(els.adminNotice, message, type);
  if (message) {
    window.clearTimeout(notice.timer);
    notice.timer = window.setTimeout(() => setMessage(els.adminNotice, ""), 3200);
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("panel_theme", theme);
}

function setupTheme() {
  applyTheme(localStorage.getItem("panel_theme") || "light");
  els.themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
}

function showLogo() {
  const settings = state.data?.settings || {};
  els.brandName.textContent = `${settings.siteName || "Panel Marketplace"} Admin`;
  els.brandLogo.innerHTML = "";
  if (settings.logoUrl) {
    const img = document.createElement("img");
    img.src = settings.logoUrl;
    img.alt = settings.siteName || "Logo";
    els.brandLogo.appendChild(img);
  } else {
    els.brandLogo.textContent = settings.logoText || "PP";
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function rowByData(root, attr, value) {
  return [...root.querySelectorAll(`[${attr}]`)].find((row) => row.dataset[attr.replace(/^data-/, "").replace(/-([a-z])/g, (_, char) => char.toUpperCase())] === value);
}

function showAdmin(isReady) {
  els.adminLogin.classList.toggle("hide", isReady);
  els.adminArea.classList.toggle("hide", !isReady);
}

async function loadDashboard() {
  const payload = await api("/api/admin/dashboard");
  state.data = payload;
  showAdmin(true);
  showLogo();
  fillSettings();
  renderBadges();
  renderPayments();
  renderSections();
  renderProducts();
  renderStock();
  renderOrders();
  renderUsers();
  renderSecurity();
}

async function login() {
  setMessage(els.loginMessage, "Checking...");
  try {
    const payload = await api("/api/auth/login", {
      method: "POST",
      body: {
        email: els.adminEmail.value,
        password: els.adminPassword.value
      }
    });
    if (payload.user.role !== "admin") throw new Error("This account is not admin");
    state.token = payload.token;
    localStorage.setItem("panel_token", state.token);
    await loadDashboard();
    setMessage(els.loginMessage, "");
  } catch (error) {
    setMessage(els.loginMessage, error.message, "error");
  }
}

function fillSettings() {
  const settings = state.data.settings;
  els.siteName.value = settings.siteName || "";
  els.logoText.value = settings.logoText || "";
  els.logoUrl.value = settings.logoUrl || "";
  els.backgroundImage.value = settings.backgroundImage || "";
  els.heroIntervalSeconds.value = settings.heroIntervalSeconds || 6;
  els.heroTitle.value = settings.heroTitle || "";
  els.heroSubtitle.value = settings.heroSubtitle || "";
  els.supportWhatsApp.value = settings.supportWhatsApp || "";
  els.supportTelegram.value = settings.supportTelegram || "";
  els.rateBDT.value = settings.currencyRates?.BDT || 118;
  els.rateINR.value = settings.currencyRates?.INR || 84;
  els.googleClientId.value = settings.googleClientId || "";
  els.introAnimation.checked = Boolean(settings.introAnimation);
}

function badgeRow(badge, index) {
  return `
    <div class="editor-row" data-badge-index="${index}">
      <div class="editor-row-head">
        <strong>${escapeHtml(badge.title || `Slide ${index + 1}`)}</strong>
        <div class="row-actions">
          <label class="file-btn">Upload<input data-badge-upload="${index}" type="file" accept="image/*"></label>
          <button class="danger-btn" data-delete-badge="${index}" type="button">Delete</button>
        </div>
      </div>
      <div class="form-grid">
        <label><span>Title</span><input data-badge-name="${index}" value="${escapeAttr(badge.title || "")}"></label>
        <label><span>Subtitle</span><input data-badge-subtitle="${index}" value="${escapeAttr(badge.subtitle || "")}"></label>
        <label><span>Image URL / data</span><input data-badge-image="${index}" value="${escapeAttr(badge.image || "")}"></label>
      </div>
    </div>
  `;
}

function renderBadges() {
  const badges = state.data.settings.heroSlides || [];
  els.badgeEditor.innerHTML = `<div class="editor-list">${badges.map(badgeRow).join("")}</div>`;
  els.badgeEditor.querySelectorAll("[data-delete-badge]").forEach((button) => {
    button.addEventListener("click", () => {
      state.data.settings.heroSlides = state.data.settings.heroSlides || [];
      state.data.settings.heroSlides.splice(Number(button.dataset.deleteBadge), 1);
      renderBadges();
    });
  });
  els.badgeEditor.querySelectorAll("[data-badge-upload]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file);
      const imageInput = els.badgeEditor.querySelector(`[data-badge-image="${input.dataset.badgeUpload}"]`);
      imageInput.value = dataUrl;
    });
  });
}

function collectBadges() {
  return [...els.badgeEditor.querySelectorAll("[data-badge-index]")].map((row) => {
    const index = row.dataset.badgeIndex;
    const old = state.data.settings.heroSlides?.[Number(index)] || {};
    return {
      id: old.id,
      title: row.querySelector(`[data-badge-name="${index}"]`).value,
      subtitle: row.querySelector(`[data-badge-subtitle="${index}"]`).value,
      image: row.querySelector(`[data-badge-image="${index}"]`).value
    };
  });
}

async function saveSettings() {
  notice("Saving website settings...");
  const body = {
    siteName: els.siteName.value,
    logoText: els.logoText.value,
    logoUrl: els.logoUrl.value,
    backgroundImage: els.backgroundImage.value,
    heroIntervalSeconds: Number(els.heroIntervalSeconds.value || 6),
    heroTitle: els.heroTitle.value,
    heroSubtitle: els.heroSubtitle.value,
    supportWhatsApp: els.supportWhatsApp.value,
    supportTelegram: els.supportTelegram.value,
    googleClientId: els.googleClientId.value,
    introAnimation: els.introAnimation.checked,
    currencyRates: {
      BDT: Number(els.rateBDT.value || 118),
      INR: Number(els.rateINR.value || 84)
    },
    heroSlides: collectBadges()
  };
  const payload = await api("/api/admin/settings", { method: "PUT", body });
  state.data.settings = payload.settings;
  showLogo();
  renderBadges();
  notice("Settings saved. Refresh storefront if you already had it open.");
}

function paymentRow(method, index) {
  return `
    <div class="editor-row" data-payment-index="${index}">
      <div class="editor-row-head">
        <strong>${escapeHtml(method.name || "Payment method")}</strong>
        <button class="danger-btn" data-delete-payment="${index}" type="button">Delete</button>
      </div>
      <div class="form-grid">
        <label><span>ID</span><input data-payment-id="${index}" value="${escapeAttr(method.id || "")}"></label>
        <label><span>Name</span><input data-payment-name="${index}" value="${escapeAttr(method.name || "")}"></label>
        <label><span>Currency</span><input data-payment-currency="${index}" value="${escapeAttr(method.currency || "USD")}"></label>
        <label><span>Rate key</span><input data-payment-rate="${index}" value="${escapeAttr(method.rateKey || method.currency || "USD")}"></label>
        <label><span>Account</span><input data-payment-account="${index}" value="${escapeAttr(method.account || "")}"></label>
        <label><span>Instructions</span><textarea data-payment-instructions="${index}">${escapeHtml(method.instructions || "")}</textarea></label>
        <label class="check-row"><input data-payment-enabled="${index}" type="checkbox" ${method.enabled ? "checked" : ""}><span>Enabled</span></label>
      </div>
    </div>
  `;
}

function renderPayments() {
  els.paymentEditor.innerHTML = `<div class="editor-list">${state.data.paymentMethods.map(paymentRow).join("")}</div>`;
  els.paymentEditor.querySelectorAll("[data-delete-payment]").forEach((button) => {
    button.addEventListener("click", () => {
      state.data.paymentMethods.splice(Number(button.dataset.deletePayment), 1);
      renderPayments();
    });
  });
}

function collectPayments() {
  return [...els.paymentEditor.querySelectorAll("[data-payment-index]")].map((row) => {
    const index = row.dataset.paymentIndex;
    return {
      id: row.querySelector(`[data-payment-id="${index}"]`).value,
      name: row.querySelector(`[data-payment-name="${index}"]`).value,
      currency: row.querySelector(`[data-payment-currency="${index}"]`).value,
      rateKey: row.querySelector(`[data-payment-rate="${index}"]`).value,
      account: row.querySelector(`[data-payment-account="${index}"]`).value,
      instructions: row.querySelector(`[data-payment-instructions="${index}"]`).value,
      enabled: row.querySelector(`[data-payment-enabled="${index}"]`).checked
    };
  });
}

async function savePayments() {
  notice("Saving payment methods...");
  const payload = await api("/api/admin/payment-methods", {
    method: "PUT",
    body: { paymentMethods: collectPayments() }
  });
  state.data.paymentMethods = payload.paymentMethods;
  renderPayments();
  notice("Payment methods saved.");
}

function sectionRow(section) {
  return `
    <div class="editor-row" data-section-id="${escapeAttr(section.id)}">
      <div class="editor-row-head">
        <strong>${escapeHtml(section.title || "Section")}</strong>
        <div class="row-actions">
          <label class="file-btn">Upload<input data-section-upload="${escapeAttr(section.id)}" type="file" accept="image/*"></label>
          <button class="secondary-btn" data-save-section="${escapeAttr(section.id)}" type="button">Save</button>
          <button class="danger-btn" data-delete-section="${escapeAttr(section.id)}" type="button">Delete</button>
        </div>
      </div>
      <div class="form-grid">
        <label><span>Title</span><input data-section-title value="${escapeAttr(section.title || "")}"></label>
        <label><span>Subtitle</span><input data-section-subtitle value="${escapeAttr(section.subtitle || "")}"></label>
        <label><span>Image URL / data</span><input data-section-image value="${escapeAttr(section.image || "")}"></label>
        <label><span>Sort order</span><input data-section-sort type="number" value="${escapeAttr(section.sortOrder || 1)}"></label>
        <label class="check-row"><input data-section-enabled type="checkbox" ${section.enabled ? "checked" : ""}><span>Enabled</span></label>
      </div>
    </div>
  `;
}

function renderSections() {
  els.sectionEditor.innerHTML = `<div class="editor-list">${state.data.sections.map(sectionRow).join("")}</div>`;
  els.sectionEditor.querySelectorAll("[data-save-section]").forEach((button) => {
    button.addEventListener("click", () => saveSection(button.dataset.saveSection).catch((error) => notice(error.message, "error")));
  });
  els.sectionEditor.querySelectorAll("[data-delete-section]").forEach((button) => {
    button.addEventListener("click", () => deleteSection(button.dataset.deleteSection));
  });
  els.sectionEditor.querySelectorAll("[data-section-upload]").forEach((input) => {
    input.addEventListener("change", async () => {
      const row = input.closest("[data-section-id]");
      row.querySelector("[data-section-image]").value = await fileToDataUrl(input.files[0]);
    });
  });
}

function sectionPayload(row) {
  return {
    title: row.querySelector("[data-section-title]").value,
    subtitle: row.querySelector("[data-section-subtitle]").value,
    image: row.querySelector("[data-section-image]").value,
    sortOrder: Number(row.querySelector("[data-section-sort]").value || 1),
    enabled: row.querySelector("[data-section-enabled]").checked
  };
}

async function saveSection(id) {
  notice("Saving section...");
  const row = rowByData(els.sectionEditor, "data-section-id", id);
  if (!row) throw new Error("Section row not found");
  const payload = await api(`/api/admin/sections/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: sectionPayload(row)
  });
  const index = state.data.sections.findIndex((section) => section.id === id);
  state.data.sections[index] = payload.section;
  renderSections();
  renderProducts();
  notice("Section saved.");
}

async function deleteSection(id) {
  if (!confirm("Delete this section and its products?")) return;
  await api(`/api/admin/sections/${encodeURIComponent(id)}`, { method: "DELETE" });
  state.data.sections = state.data.sections.filter((section) => section.id !== id);
  state.data.products = state.data.products.filter((product) => product.sectionId !== id);
  renderSections();
  renderProducts();
  notice("Section deleted.");
}

async function newSection() {
  const payload = await api("/api/admin/sections", {
    method: "POST",
    body: {
      title: "New Section",
      subtitle: "Describe this product group.",
      image: state.data.settings.backgroundImage,
      enabled: true,
      sortOrder: state.data.sections.length + 1
    }
  });
  state.data.sections.push(payload.section);
  renderSections();
  renderProducts();
  notice("New section added.");
}

function variantsToText(variants = []) {
  return variants.map((variant) => `${variant.name}|${variant.priceUsd}|${variant.durationDays || 0}|${variant.description || ""}`).join("\n");
}

function textToVariants(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, priceUsd, durationDays, ...description] = line.split("|");
      return {
        name: name?.trim() || "Variant",
        priceUsd: Number(priceUsd || 0),
        durationDays: Number(durationDays || 0),
        description: description.join("|").trim()
      };
    });
}

function sectionOptions(selected) {
  return state.data.sections.map((section) => `
    <option value="${escapeAttr(section.id)}" ${section.id === selected ? "selected" : ""}>${escapeHtml(section.title)}</option>
  `).join("");
}

function productRow(product) {
  return `
    <div class="editor-row" data-product-id="${escapeAttr(product.id)}">
      <div class="editor-row-head">
        <strong>${escapeHtml(product.name || "Product")}</strong>
        <div class="row-actions">
          <label class="file-btn">Upload<input data-product-upload="${escapeAttr(product.id)}" type="file" accept="image/*"></label>
          <button class="secondary-btn" data-save-product="${escapeAttr(product.id)}" type="button">Save</button>
          <button class="danger-btn" data-delete-product="${escapeAttr(product.id)}" type="button">Delete</button>
        </div>
      </div>
      <div class="form-grid">
        <label><span>Section</span><select data-product-section>${sectionOptions(product.sectionId)}</select></label>
        <label><span>Name</span><input data-product-name value="${escapeAttr(product.name || "")}"></label>
        <label><span>Panel name</span><input data-product-panel value="${escapeAttr(product.panelName || "")}"></label>
        <label><span>Badge</span><input data-product-badge value="${escapeAttr(product.badge || "")}"></label>
        <label><span>Image URL / data</span><input data-product-image value="${escapeAttr(product.image || "")}"></label>
        <label><span>YouTube demo URL</span><input data-product-demo value="${escapeAttr(product.demoVideoUrl || "")}"></label>
        <label><span>Short description</span><textarea data-product-description>${escapeHtml(product.shortDescription || "")}</textarea></label>
        <label><span>Features, one per line</span><textarea data-product-features>${escapeHtml((product.features || []).join("\n"))}</textarea></label>
        <label><span>Variants: name|priceUsd|durationDays|description</span><textarea data-product-variants>${escapeHtml(variantsToText(product.variants))}</textarea></label>
        <label class="check-row"><input data-product-enabled type="checkbox" ${product.enabled ? "checked" : ""}><span>Enabled</span></label>
      </div>
    </div>
  `;
}

function renderProducts() {
  els.productEditor.innerHTML = `<div class="editor-list">${state.data.products.map(productRow).join("")}</div>`;
  els.productEditor.querySelectorAll("[data-save-product]").forEach((button) => {
    button.addEventListener("click", () => saveProduct(button.dataset.saveProduct).catch((error) => notice(error.message, "error")));
  });
  els.productEditor.querySelectorAll("[data-delete-product]").forEach((button) => {
    button.addEventListener("click", () => deleteProduct(button.dataset.deleteProduct));
  });
  els.productEditor.querySelectorAll("[data-product-upload]").forEach((input) => {
    input.addEventListener("change", async () => {
      const row = input.closest("[data-product-id]");
      row.querySelector("[data-product-image]").value = await fileToDataUrl(input.files[0]);
    });
  });
}

function productPayload(row) {
  return {
    sectionId: row.querySelector("[data-product-section]").value,
    name: row.querySelector("[data-product-name]").value,
    panelName: row.querySelector("[data-product-panel]").value,
    badge: row.querySelector("[data-product-badge]").value,
    image: row.querySelector("[data-product-image]").value,
    demoVideoUrl: row.querySelector("[data-product-demo]").value,
    shortDescription: row.querySelector("[data-product-description]").value,
    features: row.querySelector("[data-product-features]").value.split("\n").map((line) => line.trim()).filter(Boolean),
    variants: textToVariants(row.querySelector("[data-product-variants]").value),
    enabled: row.querySelector("[data-product-enabled]").checked
  };
}

async function saveProduct(id) {
  notice("Saving product...");
  const row = rowByData(els.productEditor, "data-product-id", id);
  if (!row) throw new Error("Product row not found");
  const payload = await api(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: productPayload(row)
  });
  const index = state.data.products.findIndex((product) => product.id === id);
  state.data.products[index] = payload.product;
  renderProducts();
  renderStock();
  notice("Product saved.");
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  await api(`/api/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
  state.data.products = state.data.products.filter((product) => product.id !== id);
  renderProducts();
  renderStock();
  notice("Product deleted.");
}

async function newProduct() {
  const sectionId = state.data.sections[0]?.id;
  const payload = await api("/api/admin/products", {
    method: "POST",
    body: {
      sectionId,
      name: "New Product",
      panelName: "Panel",
      shortDescription: "Describe this product.",
      image: state.data.settings.backgroundImage,
      demoVideoUrl: "",
      badge: "New",
      enabled: true,
      features: ["Manual payment", "Admin editable"],
      variants: [{ name: "Basic", priceUsd: 5, durationDays: 1, description: "Starter variant", stockKeys: [] }]
    }
  });
  state.data.products.unshift(payload.product);
  renderProducts();
  renderStock();
  notice("New product added.");
}

function replaceProduct(product) {
  const index = state.data.products.findIndex((item) => item.id === product.id);
  if (index >= 0) {
    state.data.products[index] = product;
  } else {
    state.data.products.unshift(product);
  }
}

function stockLabel(variant) {
  const duration = Number(variant.durationDays || 0) > 0 ? `${variant.durationDays} days` : "Lifetime / custom";
  const count = Array.isArray(variant.stockKeys) ? variant.stockKeys.length : Number(variant.stockCount || 0);
  return `${variant.name} - ${duration} - ${count} keys`;
}

function getStockSelection() {
  const product = state.data.products.find((item) => item.id === els.stockProductSelect.value) || state.data.products[0];
  const variant = product?.variants?.find((item) => item.id === els.stockVariantSelect.value) || product?.variants?.[0];
  return { product, variant };
}

function renderStock() {
  if (!state.data || !els.stockProductSelect) return;
  const currentProductId = els.stockProductSelect.value || state.data.products[0]?.id || "";
  els.stockProductSelect.innerHTML = state.data.products.map((product) => `
    <option value="${escapeAttr(product.id)}">${escapeHtml(product.name)}</option>
  `).join("");
  if (state.data.products.some((product) => product.id === currentProductId)) {
    els.stockProductSelect.value = currentProductId;
  }

  const product = state.data.products.find((item) => item.id === els.stockProductSelect.value) || state.data.products[0];
  if (!product) {
    els.stockVariantSelect.innerHTML = "";
    els.stockList.innerHTML = `<div class="note-box">Add a product first, then stock keys can be added here.</div>`;
    return;
  }

  const currentVariantId = els.stockVariantSelect.value || product.variants?.[0]?.id || "";
  els.stockVariantSelect.innerHTML = (product.variants || []).map((variant) => `
    <option value="${escapeAttr(variant.id)}">${escapeHtml(stockLabel(variant))}</option>
  `).join("");
  if ((product.variants || []).some((variant) => variant.id === currentVariantId)) {
    els.stockVariantSelect.value = currentVariantId;
  }

  const variant = (product.variants || []).find((item) => item.id === els.stockVariantSelect.value) || product.variants?.[0];
  if (!variant) {
    els.stockList.innerHTML = `<div class="note-box">This product has no variants yet.</div>`;
    return;
  }

  els.stockDurationDays.value = Number(variant.durationDays || 0);
  const keys = Array.isArray(variant.stockKeys) ? variant.stockKeys : [];
  els.stockList.innerHTML = `
    <div class="stock-head">
      <strong>${escapeHtml(product.name)} / ${escapeHtml(variant.name)}</strong>
      <span>${keys.length} key${keys.length === 1 ? "" : "s"} in stock</span>
    </div>
    ${keys.length ? keys.map((key) => `
      <label class="stock-key-row">
        <input data-stock-key type="checkbox" value="${escapeAttr(key)}">
        <code>${escapeHtml(key)}</code>
      </label>
    `).join("") : `<div class="note-box">No keys added for this variant yet.</div>`}
  `;
}

async function saveStock() {
  const { product, variant } = getStockSelection();
  if (!product || !variant) throw new Error("Select a product and variant first");
  notice("Saving stock...");
  const keys = els.stockKeysInput.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const payload = await api("/api/admin/stock", {
    method: "POST",
    body: {
      productId: product.id,
      variantId: variant.id,
      durationDays: Number(els.stockDurationDays.value || 0),
      keys
    }
  });
  replaceProduct(payload.product);
  els.stockKeysInput.value = "";
  renderProducts();
  renderStock();
  notice(keys.length ? `${keys.length} key(s) added.` : "Variant duration updated.");
}

async function deleteSelectedStock() {
  const { product, variant } = getStockSelection();
  const keys = [...els.stockList.querySelectorAll("[data-stock-key]:checked")].map((input) => input.value);
  if (!product || !variant) throw new Error("Select a product and variant first");
  if (!keys.length) throw new Error("Select at least one key to delete");
  if (!confirm(`Delete ${keys.length} selected key(s)?`)) return;
  const payload = await api("/api/admin/stock", {
    method: "DELETE",
    body: { productId: product.id, variantId: variant.id, keys }
  });
  replaceProduct(payload.product);
  renderProducts();
  renderStock();
  notice("Selected keys deleted.");
}

async function clearStock() {
  const { product, variant } = getStockSelection();
  if (!product || !variant) throw new Error("Select a product and variant first");
  if (!confirm(`Clear all keys for ${variant.name}?`)) return;
  const payload = await api("/api/admin/stock", {
    method: "DELETE",
    body: { productId: product.id, variantId: variant.id, clear: true }
  });
  replaceProduct(payload.product);
  renderProducts();
  renderStock();
  notice("Variant stock cleared.");
}

function renderOrders() {
  const rows = [...state.data.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  els.ordersTable.innerHTML = `
    <thead>
      <tr>
        <th>Select</th><th>Order</th><th>User</th><th>Product</th><th>Amount</th><th>Payment</th><th>Status</th><th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((order) => `
        <tr data-order-id="${escapeAttr(order.id)}">
          <td><input data-order-select type="checkbox" value="${escapeAttr(order.id)}"></td>
          <td>${escapeHtml(order.id.slice(0, 8))}<br><span class="label">${escapeHtml(new Date(order.createdAt).toLocaleString())}</span></td>
          <td>${escapeHtml(order.userEmail)}<br>${escapeHtml(order.contact || "")}</td>
          <td>${escapeHtml(order.productName)}<br>${escapeHtml(order.variantName)} x ${escapeHtml(order.quantity)}${order.deliveredKeys?.length ? `<br><span class="label">Keys: ${escapeHtml(order.deliveredKeys.join(", "))}</span>` : ""}</td>
          <td>${currency(order.totalUsd)}<br>${currency(order.totalLocal, order.currency)}</td>
          <td>${escapeHtml(order.paymentMethodName)}<br>${escapeHtml(order.transactionId || "No reference")}</td>
          <td><span class="status-pill status-${escapeAttr(order.status)}">${escapeHtml(order.status)}</span></td>
          <td>
            <select data-order-status>
              <option value="pending" ${order.status === "pending" ? "selected" : ""}>pending</option>
              <option value="approved" ${order.status === "approved" ? "selected" : ""}>approved</option>
              <option value="rejected" ${order.status === "rejected" ? "selected" : ""}>rejected</option>
            </select>
            <input data-order-note value="${escapeAttr(order.adminNote || "")}" placeholder="Admin note">
            <button class="secondary-btn" data-save-order="${escapeAttr(order.id)}" type="button">Save</button>
          </td>
        </tr>
      `).join("")}
    </tbody>
  `;
  els.ordersTable.querySelectorAll("[data-save-order]").forEach((button) => {
    button.addEventListener("click", () => saveOrder(button.dataset.saveOrder).catch((error) => notice(error.message, "error")));
  });
}

async function saveOrder(id) {
  notice("Updating order...");
  const row = rowByData(els.ordersTable, "data-order-id", id);
  if (!row) throw new Error("Order row not found");
  const payload = await api(`/api/admin/orders/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: {
      status: row.querySelector("[data-order-status]").value,
      adminNote: row.querySelector("[data-order-note]").value
    }
  });
  const index = state.data.orders.findIndex((order) => order.id === id);
  state.data.orders[index] = payload.order;
  renderOrders();
  renderUsers();
  await loadDashboard();
  notice("Order updated.");
}

async function deleteSelectedOrders() {
  const ids = [...els.ordersTable.querySelectorAll("[data-order-select]:checked")].map((input) => input.value);
  if (!ids.length) throw new Error("Select at least one order to delete");
  if (!confirm(`Delete ${ids.length} selected order(s)?`)) return;
  const payload = await api("/api/admin/orders/delete-bulk", {
    method: "POST",
    body: { ids }
  });
  state.data.orders = state.data.orders.filter((order) => !ids.includes(order.id));
  renderOrders();
  notice(`${payload.deleted || ids.length} order(s) deleted.`);
}

function renderUsers() {
  els.usersTable.innerHTML = `
    <thead>
      <tr><th>User</th><th>Role</th><th>Balance</th><th>History</th><th>Action</th></tr>
    </thead>
    <tbody>
      ${state.data.users.map((user) => `
        <tr data-user-id="${escapeAttr(user.id)}">
          <td><input data-user-name value="${escapeAttr(user.name || "")}"><br>${escapeHtml(user.email)}</td>
          <td>${escapeHtml(user.role)}</td>
          <td><input data-user-balance type="number" step="0.01" value="${escapeAttr(user.balanceUsd || 0)}"></td>
          <td>${(user.history || []).slice(-3).reverse().map((item) => `${escapeHtml(item.type)} ${currency(item.amountUsd || 0)}`).join("<br>")}</td>
          <td>
            <input data-user-note placeholder="Balance note">
            <button class="secondary-btn" data-save-user="${escapeAttr(user.id)}" type="button">Save</button>
          </td>
        </tr>
      `).join("")}
    </tbody>
  `;
  els.usersTable.querySelectorAll("[data-save-user]").forEach((button) => {
    button.addEventListener("click", () => saveUser(button.dataset.saveUser).catch((error) => notice(error.message, "error")));
  });
}

async function saveUser(id) {
  notice("Saving user...");
  const row = rowByData(els.usersTable, "data-user-id", id);
  if (!row) throw new Error("User row not found");
  const payload = await api(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: {
      name: row.querySelector("[data-user-name]").value,
      balanceUsd: Number(row.querySelector("[data-user-balance]").value || 0),
      note: row.querySelector("[data-user-note]").value
    }
  });
  const index = state.data.users.findIndex((user) => user.id === id);
  state.data.users[index] = payload.user;
  renderUsers();
  notice("User saved.");
}

function renderSecurity() {
  const creds = state.data.defaultCredentials;
  els.defaultCredentials.innerHTML = `
    Default admin: <strong>${escapeHtml(creds.adminEmail)}</strong> / <strong>${escapeHtml(creds.adminPassword)}</strong><br>
    Users register themselves with their own Gmail address and their own site password.<br>
    Change the admin password here before final hosting.
  `;
}

async function savePassword() {
  setMessage(els.securityMessage, "Saving...");
  try {
    await api("/api/admin/password", {
      method: "PUT",
      body: { newPassword: els.newAdminPassword.value }
    });
    els.newAdminPassword.value = "";
    setMessage(els.securityMessage, "Password changed.", "ok");
  } catch (error) {
    setMessage(els.securityMessage, error.message, "error");
  }
}

function wireEvents() {
  els.adminLoginBtn.addEventListener("click", login);
  els.logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("panel_token");
    state.token = "";
    showAdmin(false);
  });
  document.querySelectorAll(".admin-nav button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".admin-nav button").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.querySelector(`[data-panel-view="${button.dataset.panel}"]`).classList.add("active");
    });
  });
  els.saveSettings.addEventListener("click", () => saveSettings().catch((error) => notice(error.message, "error")));
  els.addBadge.addEventListener("click", () => {
    state.data.settings.heroSlides = state.data.settings.heroSlides || [];
    state.data.settings.heroSlides.push({
      id: "",
      title: "New slide",
      subtitle: "Add a short banner subtitle.",
      image: state.data.settings.backgroundImage || "/assets/marketplace-bg.png"
    });
    renderBadges();
  });
  els.logoUpload.addEventListener("change", async () => {
    const file = els.logoUpload.files[0];
    if (file) els.logoUrl.value = await fileToDataUrl(file);
  });
  els.backgroundUpload.addEventListener("change", async () => {
    const file = els.backgroundUpload.files[0];
    if (file) els.backgroundImage.value = await fileToDataUrl(file);
  });
  els.addPayment.addEventListener("click", () => {
    state.data.paymentMethods.push({
      id: `method-${Date.now()}`,
      name: "New Method",
      currency: "USD",
      rateKey: "USD",
      account: "",
      instructions: "",
      enabled: true
    });
    renderPayments();
  });
  els.savePayments.addEventListener("click", () => savePayments().catch((error) => notice(error.message, "error")));
  els.newSection.addEventListener("click", () => newSection().catch((error) => notice(error.message, "error")));
  els.newProduct.addEventListener("click", () => newProduct().catch((error) => notice(error.message, "error")));
  els.stockProductSelect.addEventListener("change", renderStock);
  els.stockVariantSelect.addEventListener("change", renderStock);
  els.saveStock.addEventListener("click", () => saveStock().catch((error) => notice(error.message, "error")));
  els.deleteSelectedStock.addEventListener("click", () => deleteSelectedStock().catch((error) => notice(error.message, "error")));
  els.clearStock.addEventListener("click", () => clearStock().catch((error) => notice(error.message, "error")));
  els.deleteSelectedOrders.addEventListener("click", () => deleteSelectedOrders().catch((error) => notice(error.message, "error")));
  els.savePassword.addEventListener("click", savePassword);
}

async function bootstrap() {
  setupTheme();
  wireEvents();
  if (!state.token) {
    showAdmin(false);
    return;
  }
  try {
    await loadDashboard();
  } catch {
    showAdmin(false);
  }
}

bootstrap();
