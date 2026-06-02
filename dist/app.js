const state = {
  data: null,
  token: localStorage.getItem("panel_token") || "",
  user: null,
  orders: [],
  buyProduct: null
};

const els = {
  intro: document.getElementById("intro"),
  introMark: document.getElementById("introMark"),
  brandLogo: document.getElementById("brandLogo"),
  brandName: document.getElementById("brandName"),
  heroMedia: document.getElementById("heroMedia"),
  heroTitle: document.getElementById("heroTitle"),
  heroSubtitle: document.getElementById("heroSubtitle"),
  productSections: document.getElementById("productSections"),
  accountBtn: document.getElementById("accountBtn"),
  openLoginHero: document.getElementById("openLoginHero"),
  adminLink: document.getElementById("adminLink"),
  accountBand: document.getElementById("accountBand"),
  accountName: document.getElementById("accountName"),
  accountBalance: document.getElementById("accountBalance"),
  lastOrder: document.getElementById("lastOrder"),
  logoutBtn: document.getElementById("logoutBtn"),
  themeToggle: document.getElementById("themeToggle"),
  helpDock: document.getElementById("helpDock"),
  helpMain: document.getElementById("helpMain"),
  whatsappHelp: document.getElementById("whatsappHelp"),
  telegramHelp: document.getElementById("telegramHelp"),
  authModal: document.getElementById("authModal"),
  authTitle: document.getElementById("authTitle"),
  authHint: document.getElementById("authHint"),
  loginTab: document.getElementById("loginTab"),
  registerTab: document.getElementById("registerTab"),
  authName: document.getElementById("authName"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authSubmit: document.getElementById("authSubmit"),
  googleBtn: document.getElementById("googleBtn"),
  authMessage: document.getElementById("authMessage"),
  demoModal: document.getElementById("demoModal"),
  demoTitle: document.getElementById("demoTitle"),
  demoFrame: document.getElementById("demoFrame"),
  buyModal: document.getElementById("buyModal"),
  buyTitle: document.getElementById("buyTitle"),
  buyImage: document.getElementById("buyImage"),
  buyDescription: document.getElementById("buyDescription"),
  buyFeatures: document.getElementById("buyFeatures"),
  variantSelect: document.getElementById("variantSelect"),
  quantityInput: document.getElementById("quantityInput"),
  paymentSelect: document.getElementById("paymentSelect"),
  priceTotal: document.getElementById("priceTotal"),
  priceLocal: document.getElementById("priceLocal"),
  paymentNote: document.getElementById("paymentNote"),
  transactionInput: document.getElementById("transactionInput"),
  contactInput: document.getElementById("contactInput"),
  placeOrderBtn: document.getElementById("placeOrderBtn"),
  orderMessage: document.getElementById("orderMessage")
};

let authMode = "login";
const API_BASE = String(window.API_BASE_URL || localStorage.getItem("panel_api_base") || "").replace(/\/$/, "");

function openModal(dialog) {
  document.body.classList.add("modal-open");
  dialog.showModal();
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
  element.textContent = message || "";
  element.classList.toggle("error", type === "error");
  element.classList.toggle("ok", type === "ok");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("panel_theme", theme);
}

function setupTheme() {
  applyTheme(localStorage.getItem("panel_theme") || "light");
  els.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(current);
  });
}

function showLogo(target, settings) {
  target.innerHTML = "";
  if (settings.logoUrl) {
    const img = document.createElement("img");
    img.src = settings.logoUrl;
    img.alt = settings.siteName || "Logo";
    target.appendChild(img);
  } else {
    target.textContent = settings.logoText || "PP";
  }
}

function renderBrand() {
  const settings = state.data.settings;
  document.title = settings.siteName || "Panel Marketplace";
  showLogo(els.brandLogo, settings);
  els.brandName.textContent = settings.siteName || "Panel Marketplace";
  els.introMark.textContent = settings.logoText || "PP";
  els.heroTitle.textContent = settings.heroTitle || settings.siteName || "Panel Marketplace";
  els.heroSubtitle.textContent = settings.heroSubtitle || "";
  els.heroMedia.style.backgroundImage = `url("${settings.backgroundImage || "/assets/marketplace-bg.png"}")`;
  els.whatsappHelp.href = settings.supportWhatsApp || "#";
  els.telegramHelp.href = settings.supportTelegram || "#";
}

function finishIntro() {
  const enabled = state.data?.settings?.introAnimation !== false;
  if (!enabled) {
    els.intro.classList.add("done");
    return;
  }
  setTimeout(() => els.intro.classList.add("done"), 1050);
}

function setupHeroMotion() {
  document.addEventListener("pointermove", (event) => {
    const x = `${event.clientX}px`;
    const y = `${event.clientY}px`;
    document.documentElement.style.setProperty("--cursor-x", x);
    document.documentElement.style.setProperty("--cursor-y", y);
  });
}

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

function featureChips(features = []) {
  return features.slice(0, 6).map((feature) => `<span class="feature-chip">${escapeHtml(feature)}</span>`).join("");
}

function productCard(product) {
  const lowest = Math.min(...product.variants.map((variant) => Number(variant.priceUsd || 0)));
  return `
    <article class="product-card" data-card-product="${escapeAttr(product.id)}" tabindex="0">
      <div class="product-image">
        <img src="${escapeAttr(product.image || state.data.settings.backgroundImage)}" alt="${escapeAttr(product.name)}">
        ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}
      </div>
      <div class="product-body">
        <div class="product-title-row">
          <h4>${escapeHtml(product.name)}</h4>
          <span class="panel-pill">${escapeHtml(product.panelName || "Panel")}</span>
        </div>
        <p>${escapeHtml(product.shortDescription)}</p>
        <div class="feature-row">${featureChips(product.features)}</div>
        <div class="price-box">
          <span>Starts from</span>
          <strong>${currency(Number.isFinite(lowest) ? lowest : 0)}</strong>
        </div>
        <div class="product-actions">
          <button class="secondary-btn" data-demo="${escapeAttr(product.id)}" type="button">🎬 Demo</button>
          <button class="primary-btn" data-buy="${escapeAttr(product.id)}" type="button">🛒 Buy</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const { sections, products } = state.data;
  els.productSections.innerHTML = sections.map((section) => {
    const items = products.filter((product) => product.sectionId === section.id);
    if (!items.length) return "";
    return `
      <section class="product-section" id="section-${escapeAttr(section.id)}">
        <h3>${escapeHtml(section.title)}</h3>
        <p>${escapeHtml(section.subtitle)}</p>
        <div class="product-grid">${items.map(productCard).join("")}</div>
      </section>
    `;
  }).join("");

  els.productSections.querySelectorAll("[data-demo]").forEach((button) => {
    button.addEventListener("click", () => openDemo(button.dataset.demo));
  });
  els.productSections.querySelectorAll("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => openBuy(button.dataset.buy));
  });
  els.productSections.querySelectorAll("[data-card-product]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      openBuy(card.dataset.cardProduct);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openBuy(card.dataset.cardProduct);
      }
    });
  });
}

function renderAccount() {
  const isLogged = Boolean(state.user);
  els.accountBtn.textContent = isLogged ? "👤 Account" : "🔐 Login";
  els.openLoginHero.textContent = isLogged ? "📜 Account History" : "🔐 Login / Register";
  els.accountBand.classList.toggle("hide", !isLogged);
  els.adminLink.classList.toggle("hide", state.user?.role !== "admin");
  if (state.buyProduct) {
    els.placeOrderBtn.textContent = isLogged ? "✅ Place Order" : "🔐 Login to Purchase";
  }

  if (!isLogged) return;
  els.accountName.textContent = `${state.user.name} (${state.user.email})`;
  els.accountBalance.textContent = currency(state.user.balanceUsd || 0);
  const last = state.orders[0];
  els.lastOrder.textContent = last ? `${last.productName} - ${last.status}` : "No order yet";
}

function getProduct(id) {
  return state.data.products.find((product) => product.id === id);
}

function youtubeEmbed(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    let id = "";
    if (parsed.hostname.includes("youtu.be")) id = parsed.pathname.slice(1);
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/watch")) id = parsed.searchParams.get("v") || "";
      if (parsed.pathname.startsWith("/shorts/")) id = parsed.pathname.split("/")[2] || "";
      if (parsed.pathname.startsWith("/embed/")) id = parsed.pathname.split("/")[2] || "";
    }
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return "";
  }
}

function openDemo(productId) {
  const product = getProduct(productId);
  if (!product) return;
  els.demoTitle.textContent = `${product.name} demo`;
  const embed = youtubeEmbed(product.demoVideoUrl);
  els.demoFrame.innerHTML = embed
    ? `<iframe src="${escapeAttr(embed)}" title="${escapeAttr(product.name)} demo" allowfullscreen></iframe>`
    : `<div class="empty-video">🎬 Demo video will appear here</div>`;
  openModal(els.demoModal);
}

function openBuy(productId) {
  const product = getProduct(productId);
  if (!product) return;
  state.buyProduct = product;
  els.buyTitle.textContent = `🛒 Buy ${product.name}`;
  els.buyImage.src = product.image || state.data.settings.backgroundImage;
  els.buyImage.alt = product.name;
  els.buyDescription.textContent = product.shortDescription || "";
  els.buyFeatures.innerHTML = featureChips(product.features);
  els.variantSelect.innerHTML = product.variants.map((variant) => `
    <option value="${escapeAttr(variant.id)}">${escapeHtml(variant.name)} - ${currency(variant.priceUsd)}</option>
  `).join("");
  els.paymentSelect.innerHTML = state.data.paymentMethods.map((method) => `
    <option value="${escapeAttr(method.id)}">${escapeHtml(method.name)} (${escapeHtml(method.currency)})</option>
  `).join("");
  els.quantityInput.value = 1;
  els.transactionInput.value = "";
  els.contactInput.value = state.user?.email || "";
  els.placeOrderBtn.textContent = state.user ? "✅ Place Order" : "🔐 Login to Purchase";
  setMessage(els.orderMessage, "");
  updatePrice();
  openModal(els.buyModal);
}

function currentCheckout() {
  const product = state.buyProduct;
  if (!product) return null;
  const variant = product.variants.find((item) => item.id === els.variantSelect.value) || product.variants[0];
  const method = state.data.paymentMethods.find((item) => item.id === els.paymentSelect.value) || state.data.paymentMethods[0];
  const quantity = Math.max(1, Number(els.quantityInput.value || 1));
  const totalUsd = Number((Number(variant?.priceUsd || 0) * quantity).toFixed(2));
  const rate = method.currency === "USD" ? 1 : Number(state.data.settings.currencyRates[method.rateKey] || 1);
  const local = method.currency === "USD" ? totalUsd : Math.round(totalUsd * rate);
  return { product, variant, method, quantity, totalUsd, local, rate };
}

function updatePrice() {
  const checkout = currentCheckout();
  if (!checkout) return;
  els.priceTotal.textContent = currency(checkout.totalUsd);
  els.priceLocal.textContent = checkout.method.currency === "USD"
    ? "Binance keeps the USD amount."
    : `${currency(checkout.local, checkout.method.currency)} at ${checkout.rate} ${checkout.method.currency}/USD`;
  els.paymentNote.innerHTML = `
    <strong>💳 ${escapeHtml(checkout.method.name)}</strong><br>
    Account: ${escapeHtml(checkout.method.account || "Not set")}<br>
    ${escapeHtml(checkout.method.instructions || "")}
  `;
}

async function placeOrder() {
  const checkout = currentCheckout();
  if (!checkout) return;
  if (!state.user) {
    setMessage(els.orderMessage, "Please login or register first. Your selected variant and price will stay here.", "error");
    openAuth("login");
    return;
  }
  setMessage(els.orderMessage, "Submitting...");
  try {
    const payload = await api("/api/orders", {
      method: "POST",
      body: {
        productId: checkout.product.id,
        variantId: checkout.variant.id,
        quantity: checkout.quantity,
        paymentMethodId: checkout.method.id,
        transactionId: els.transactionInput.value,
        contact: els.contactInput.value
      }
    });
    state.orders.unshift(payload.order);
    setMessage(els.orderMessage, "Order submitted. Admin approval is pending.", "ok");
    renderAccount();
  } catch (error) {
    setMessage(els.orderMessage, error.message, "error");
  }
}

function openAuth(mode = "login") {
  authMode = mode;
  els.loginTab.classList.toggle("active", mode === "login");
  els.registerTab.classList.toggle("active", mode === "register");
  els.authTitle.textContent = mode === "login" ? "🔐 Login" : "📝 Register";
  els.authSubmit.textContent = mode === "login" ? "🔑 Login" : "✨ Create Account";
  els.authHint.textContent = mode === "login"
    ? "Login with the Gmail address you registered on this site."
    : "Register with your own Gmail address and create a separate site password. Do not use your real Gmail password.";
  els.authPassword.autocomplete = mode === "login" ? "current-password" : "new-password";
  els.authName.parentElement.classList.toggle("hide", mode === "login");
  setMessage(els.authMessage, "");
  openModal(els.authModal);
}

async function submitAuth() {
  setMessage(els.authMessage, "Checking...");
  try {
    const email = els.authEmail.value.trim().toLowerCase();
    if (authMode === "register" && !/^[^\s@]+@gmail\.com$/.test(email)) {
      throw new Error("Use your own Gmail address, for example name@gmail.com");
    }
    const payload = await api(authMode === "login" ? "/api/auth/login" : "/api/auth/register", {
      method: "POST",
      body: {
        name: els.authName.value,
        email,
        password: els.authPassword.value
      }
    });
    loginWithPayload(payload);
    els.authModal.close();
  } catch (error) {
    setMessage(els.authMessage, error.message, "error");
  }
}

function loginWithPayload(payload) {
  state.token = payload.token;
  state.user = payload.user;
  localStorage.setItem("panel_token", state.token);
  loadAccount();
  renderAccount();
  if (state.buyProduct) {
    els.contactInput.value = state.user.email || els.contactInput.value;
    els.placeOrderBtn.textContent = "✅ Place Order";
    setMessage(els.orderMessage, "Logged in. You can submit the selected order now.", "ok");
  }
}

function logout() {
  localStorage.removeItem("panel_token");
  state.token = "";
  state.user = null;
  state.orders = [];
  renderAccount();
}

async function loadAccount() {
  if (!state.token) return;
  try {
    const payload = await api("/api/me");
    state.user = payload.user;
    state.orders = payload.orders || [];
  } catch {
    logout();
  }
}

function syncPublicData(payload) {
  state.data = payload;
  state.user = payload.user || state.user;
  renderBrand();
  renderProducts();
  renderAccount();
}

async function pollForAdminChanges() {
  try {
    const payload = await api("/api/bootstrap");
    if (!state.data?.updatedAt || payload.updatedAt !== state.data.updatedAt) {
      syncPublicData(payload);
    }
  } catch {
    // Keep the current storefront visible if a quick refresh request fails.
  }
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Google script failed to load"));
    document.head.appendChild(script);
  });
}

async function googleLogin() {
  const clientId = state.data.settings.googleClientId;
  if (!clientId) {
    setMessage(els.authMessage, "Google sign-in is not configured yet. Use Gmail + site password login/register.", "error");
    return;
  }
  try {
    await loadGoogleScript();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const payload = await api("/api/auth/google", {
            method: "POST",
            body: { credential: response.credential }
          });
          loginWithPayload(payload);
          els.authModal.close();
        } catch (error) {
          setMessage(els.authMessage, error.message, "error");
        }
      }
    });
    window.google.accounts.id.prompt();
    setMessage(els.authMessage, "Google sign-in window opened.", "ok");
  } catch (error) {
    setMessage(els.authMessage, error.message, "error");
  }
}

function wireEvents() {
  els.accountBtn.addEventListener("click", () => state.user ? document.getElementById("accountBand").scrollIntoView() : openAuth("login"));
  els.openLoginHero.addEventListener("click", () => state.user ? document.getElementById("accountBand").scrollIntoView() : openAuth("login"));
  els.logoutBtn.addEventListener("click", logout);
  els.helpMain.addEventListener("click", () => els.helpDock.classList.toggle("open"));
  els.loginTab.addEventListener("click", () => openAuth("login"));
  els.registerTab.addEventListener("click", () => openAuth("register"));
  els.authSubmit.addEventListener("click", submitAuth);
  els.googleBtn.addEventListener("click", googleLogin);
  [els.variantSelect, els.quantityInput, els.paymentSelect].forEach((input) => input.addEventListener("input", updatePrice));
  els.placeOrderBtn.addEventListener("click", placeOrder);
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => document.body.classList.remove("modal-open"));
  });
}

async function bootstrap() {
  setupTheme();
  setupHeroMotion();
  wireEvents();
  const payload = await api("/api/bootstrap");
  state.data = payload;
  state.user = payload.user;
  await loadAccount();
  renderBrand();
  renderProducts();
  renderAccount();
  finishIntro();
  window.setInterval(pollForAdminChanges, 4000);
}

bootstrap().catch((error) => {
  els.productSections.innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`;
  els.intro.classList.add("done");
});
