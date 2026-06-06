import { useEffect, useState } from "react";

const API_BASE = String(import.meta.env.VITE_API_URL || window.API_BASE_URL || "").replace(/\/$/, "");
const DEFAULT_IMAGE = "/assets/marketplace-bg.png";

function isStandaloneDisplay() {
  return Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone);
}

function money(amount, code = "USD") {
  const currency = String(code || "USD").toUpperCase();
  const decimals = currencyDecimals(currency);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: decimals
    }).format(Number(amount || 0));
  } catch {
    return `${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(Number(amount || 0))} ${currency}`;
  }
}

function currencyDecimals(code = "USD") {
  const currency = String(code || "USD").toUpperCase();
  if (currency === "BTC") return 8;
  if (currency === "USDT" || currency === "USD") return 2;
  return 0;
}

function convertForDisplay(totalUsd, method, rates) {
  const currency = String(method?.currency || "USD").toUpperCase();
  const rateKey = String(method?.rateKey || currency).toUpperCase();
  const rate = currency === "USD" ? 1 : Number(rates?.[rateKey] || 1);
  return Number((Number(totalUsd || 0) * rate).toFixed(currencyDecimals(currency)));
}

function durationText(variant) {
  const days = Number(variant?.durationDays || 0);
  return days > 0 ? `${days} day${days === 1 ? "" : "s"}` : "Lifetime / custom";
}

function methodIcon(method) {
  const text = `${method?.id || ""} ${method?.name || ""}`.toLowerCase();
  if (text.includes("bkash")) return "bK";
  if (text.includes("nagad")) return "Ng";
  if (text.includes("rocket")) return "R";
  if (text.includes("trc20")) return "TRC";
  if (text.includes("bep20") || text.includes("bsc")) return "BSC";
  if (text.includes("btc") || text.includes("bitcoin")) return "BTC";
  if (text.includes("usdt")) return "USDT";
  if (text.includes("binance")) return "BN";
  if (text.includes("upi") || text.includes("india")) return "UPI";
  return (method?.name || "PM").slice(0, 2).toUpperCase();
}

function paymentTone(method) {
  const text = `${method?.id || ""} ${method?.name || ""}`.toLowerCase();
  if (text.includes("bkash")) return "bkash";
  if (text.includes("nagad")) return "nagad";
  if (text.includes("rocket")) return "rocket";
  if (text.includes("binance") || text.includes("usdt") || text.includes("btc") || text.includes("bitcoin")) return "binance";
  if (text.includes("upi") || text.includes("india")) return "india";
  return "default";
}

function isBinanceLike(method) {
  const group = String(method?.group || "").toLowerCase();
  const text = `${method?.id || ""} ${method?.name || ""}`.toLowerCase();
  return group === "binance" || text.includes("binance") || text.includes("usdt") || text.includes("trc20") || text.includes("bep20") || text.includes("bsc") || text.includes("btc") || text.includes("bitcoin");
}

function isIndiaLike(method) {
  const text = `${method?.id || ""} ${method?.name || ""}`.toLowerCase();
  return text.includes("india") || text.includes("upi");
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (!file.type.startsWith("image/")) return reject(new Error("Please choose an image file."));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Image upload failed."));
    reader.readAsDataURL(file);
  });
}

async function copyText(value) {
  const text = String(value || "");
  if (!text) return false;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

function youtubeEmbed(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/watch")) return `https://www.youtube.com/embed/${parsed.searchParams.get("v") || ""}`;
      if (parsed.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${parsed.pathname.split("/")[2] || ""}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
    }
    return url;
  } catch {
    return "";
  }
}

function supportHref(type, value) {
  const text = String(value || "").trim();
  if (!text) return "#";
  if (/^https?:\/\//i.test(text)) return text;
  if (type === "whatsapp") {
    const phone = text.replace(/[^\d+]/g, "").replace(/^\+/, "");
    return phone ? `https://wa.me/${phone}` : "#";
  }
  const username = text.replace(/^@/, "").replace(/^t\.me\//i, "");
  return username ? `https://t.me/${username}` : "#";
}

function Logo({ settings, size = "normal" }) {
  const cls = size === "small" ? "logo size-small" : "logo";
  if (settings?.logoUrl) return <span className={cls}><img src={settings.logoUrl} alt={settings.siteName || "Logo"} /></span>;
  return <span className={cls}>{settings?.logoText || "GP"}</span>;
}

function PaymentLogo({ method }) {
  return (
    <span className="payment-logo">
      {method?.logoUrl ? <img src={method.logoUrl} alt={method.name || "Payment"} /> : <b>{methodIcon(method)}</b>}
    </span>
  );
}

function TrustIcon({ icon }) {
  if (icon === "support") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M4 13v4a2 2 0 0 0 2 2h2v-7H6a2 2 0 0 0-2 2Z" />
        <path d="M20 13v4a2 2 0 0 1-2 2h-2v-7h2a2 2 0 0 1 2 2Z" />
        <path d="M15 19h-2.5a2 2 0 0 1-2-2" />
      </svg>
    );
  }
  if (icon === "shield") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 19 6v5c0 4.5-2.8 8.2-7 10-4.2-1.8-7-5.5-7-10V6l7-3Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7h10v10H3z" />
      <path d="M13 10h3.5l2.5 3v4h-6z" />
      <path d="M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}

function BrandIcon({ type }) {
  if (type === "telegram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" />
        <path d="M17.8 7.2 5.7 12c-.8.3-.8.8-.1 1l3.1 1 1.2 3.7c.2.6.5.7.9.2l1.7-1.7 3.3 2.4c.6.3 1 .1 1.2-.6l2.2-10.2c.2-.8-.3-1.1-1.2-.8Z" />
        <path d="m9 14 7.4-4.7-5.8 5.7-.2 2" />
      </svg>
    );
  }
  if (type === "help") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M4 13v4a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
        <path d="M20 13v4a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
        <path d="M14 19h-2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" />
      <path d="M8.4 6.7c.4-.3 1-.2 1.3.2l.9 1.4c.3.5.2 1.1-.2 1.5l-.6.6c.7 1.4 1.8 2.5 3.2 3.2l.7-.6c.4-.4 1-.4 1.5-.1l1.4.9c.4.3.5.9.2 1.3-.8 1.1-1.8 1.5-3.2 1.1-3.3-.9-5.9-3.5-6.8-6.8-.4-1.4 0-2.4 1.1-3.2Z" />
    </svg>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("panel_token") || "");
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("panel_theme") || "dark");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authMessage, setAuthMessage] = useState("");
  const [demoProduct, setDemoProduct] = useState(null);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [notice, setNotice] = useState("");
  const [introVisible, setIntroVisible] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [routeKey, setRouteKey] = useState(() => `${window.location.pathname}${window.location.hash}`);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [appInstalled, setAppInstalled] = useState(isStandaloneDisplay);
  const [installMessage, setInstallMessage] = useState("");

  const isAdminRoute = routeKey.startsWith("/admin");

  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Request failed");
    return payload;
  }

  function saveToken(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("panel_token", nextToken);
  }

  function logout() {
    localStorage.removeItem("panel_token");
    setToken("");
    setUser(null);
    setOrders([]);
    setDashboard(null);
    setHistoryOpen(false);
  }

  async function loadBootstrap() {
    const payload = await api("/api/bootstrap");
    setData(payload);
    setUser(payload.user || null);
  }

  async function loadAccount() {
    if (!token) return;
    try {
      const payload = await api("/api/me");
      setUser(payload.user);
      setOrders(payload.orders || []);
    } catch {
      logout();
    }
  }

  async function loadDashboard() {
    const payload = await api("/api/admin/dashboard");
    setDashboard(payload);
  }

  async function requestInstall() {
    if (appInstalled) return;
    if (!installPrompt) {
      setInstallMessage("Install from browser menu > Add to Home Screen.");
      setTimeout(() => setInstallMessage(""), 3600);
      return;
    }
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice?.outcome === "accepted") {
      setAppInstalled(true);
      setInstallMessage("App install started.");
    } else {
      setInstallMessage("Install cancelled.");
    }
    setTimeout(() => setInstallMessage(""), 2400);
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("panel_theme", theme);
  }, [theme]);

  useEffect(() => {
    loadBootstrap().catch((error) => setNotice(error.message));
  }, []);

  useEffect(() => {
    const syncRoute = () => setRouteKey(`${window.location.pathname}${window.location.hash}`);
    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.("(display-mode: standalone)");
    const updateInstalled = () => setAppInstalled(isStandaloneDisplay());
    const capturePrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setAppInstalled(false);
    };
    const installed = () => {
      setInstallPrompt(null);
      setAppInstalled(true);
      setInstallMessage("");
    };
    updateInstalled();
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", installed);
    media?.addEventListener?.("change", updateInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", installed);
      media?.removeEventListener?.("change", updateInstalled);
    };
  }, []);

  useEffect(() => {
    loadAccount();
  }, [token]);

  useEffect(() => {
    if (isAdminRoute && token) loadDashboard().catch(() => setDashboard(null));
  }, [isAdminRoute, token]);

  useEffect(() => {
    const timer = setInterval(() => loadBootstrap().catch(() => {}), 2000);
    return () => clearInterval(timer);
  }, [token]);

  useEffect(() => {
    if (!isAdminRoute || !token) return undefined;
    const timer = setInterval(() => loadDashboard().catch(() => {}), 1500);
    return () => clearInterval(timer);
  }, [isAdminRoute, token]);

  useEffect(() => {
    if (!data || isAdminRoute || data.settings?.introAnimation === false) {
      setIntroVisible(false);
      return undefined;
    }
    setIntroVisible(true);
    const timer = setTimeout(() => setIntroVisible(false), 1650);
    return () => clearTimeout(timer);
  }, [data?.settings?.siteName, data?.settings?.introAnimation, isAdminRoute]);

  if (!data) {
    return <div className="min-h-screen bg-ink text-white grid place-items-center"><div className="loader-card">Loading marketplace...</div></div>;
  }

  const settings = data.settings || {};

  return (
    <div className="min-h-screen bg-ink text-white">
      <HeaderShell
        settings={settings}
        user={user}
        isAdminRoute={isAdminRoute}
        theme={theme}
        orders={orders}
        onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        onAuth={() => { setAuthMode("login"); setAuthOpen(true); }}
        onHistory={() => setHistoryOpen(true)}
        onLogout={logout}
        onInstall={requestInstall}
        showInstall={!isAdminRoute && !appInstalled}
        installReady={Boolean(installPrompt)}
      />

      {installMessage && !isAdminRoute && <div className="install-toast">{installMessage}</div>}

      {introVisible && !isAdminRoute && <IntroSplash settings={settings} />}

      {isAdminRoute ? (
        <AdminPanel
          api={api}
          token={token}
          user={user}
          dashboard={dashboard}
          setDashboard={setDashboard}
          loadDashboard={loadDashboard}
          saveToken={saveToken}
          notice={notice}
          setNotice={setNotice}
        />
      ) : (
        <StorefrontShell
          data={data}
          user={user}
          orders={orders}
          setAuthOpen={setAuthOpen}
          setAuthMode={setAuthMode}
          openDemo={setDemoProduct}
          openCheckout={setCheckoutProduct}
        />
      )}

      <HelpDock settings={settings} />

      {demoProduct && <DemoModal product={demoProduct} onClose={() => setDemoProduct(null)} />}

      {historyOpen && user && <OrderHistoryModal orders={orders} onClose={() => setHistoryOpen(false)} />}

      {checkoutProduct && (
        <CheckoutFlow
          data={data}
          user={user}
          product={checkoutProduct}
          api={api}
          onClose={() => setCheckoutProduct(null)}
          onLogin={(mode = "login") => { setAuthMode(mode); setAuthOpen(true); }}
          onOrder={(order) => setOrders((items) => [order, ...items])}
        />
      )}

      {authOpen && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          message={authMessage}
          setMessage={setAuthMessage}
          googleClientId={settings.googleClientId}
          onClose={() => setAuthOpen(false)}
          onSubmit={async (form) => {
            setAuthMessage("Checking...");
            const path = authMode === "forgot" ? "/api/auth/forgot-password" : authMode === "login" ? "/api/auth/login" : "/api/auth/register";
            const payload = await api(path, { method: "POST", body: form });
            if (authMode === "forgot") {
              if (form.phase === "request") {
                setAuthMessage(payload.message || "Reset code sent to your Gmail.");
                return payload;
              }
              setAuthMode("login");
              setAuthMessage("Password reset. Login with your new password.");
              return;
            }
            saveToken(payload.token, payload.user);
            setAuthOpen(false);
            setAuthMessage("");
          }}
          onGoogleCredential={async (credential) => {
            const payload = await api("/api/auth/google", { method: "POST", body: { credential } });
            saveToken(payload.token, payload.user);
            setAuthOpen(false);
            setAuthMessage("");
          }}
        />
      )}
    </div>
  );
}

function HeaderShell({ settings, user, isAdminRoute, theme, orders, onTheme, onAuth, onHistory, onLogout, onInstall, showInstall, installReady }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const orderCount = orders?.length || 0;
  return (
    <header className="shop-header">
      <div className="shop-header-inner">
        <a className="brand-block" href={isAdminRoute ? "/" : "#products"}>
          <Logo settings={settings} />
          <strong>{settings.siteName || "ACI STORE"}</strong>
        </a>
        <nav className="shop-actions">
          {isAdminRoute ? <a className="icon-button" href="/" aria-label="Storefront"><span className="icon-home" /></a> : null}
          {showInstall ? <button className={`icon-button install-action ${installReady ? "ready" : ""}`} type="button" onClick={onInstall} aria-label="Install app"><span className="icon-install" /></button> : null}
          <button className="icon-button" type="button" onClick={onTheme} aria-label="Toggle theme"><span className={theme === "dark" ? "icon-sun" : "icon-moon"} /></button>
          {user ? (
            <div className="user-menu">
              <button className="user-trigger" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Account menu" aria-expanded={menuOpen}>
                <span className="icon-user" />
                <strong>{user.email}</strong>
              </button>
              {menuOpen && (
                <div className="user-dropdown">
                  <small>Signed in</small>
                  <strong>{user.email}</strong>
                  <button type="button" onClick={() => { setMenuOpen(false); onHistory(); }}>History {orderCount ? `(${orderCount})` : ""}</button>
                  <button type="button" onClick={() => { setMenuOpen(false); onLogout(); }}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button className="icon-button primary" type="button" onClick={onAuth} aria-label="Login"><span className="icon-user" /></button>
          )}
        </nav>
      </div>
    </header>
  );
}

function IntroSplash({ settings }) {
  return (
    <div className="intro-splash" aria-hidden="true">
      <div className="intro-card">
        <Logo settings={settings} />
        <strong>{settings.siteName || "ACI STORE"}</strong>
        <span>Secure digital store</span>
      </div>
    </div>
  );
}

function Header({ settings, user, isAdminRoute, theme, onTheme, onAuth, onLogout }) {
  return (
    <header className="shop-header">
      <div className="shop-header-inner">
        <a className="brand-block" href={isAdminRoute ? "/" : "#products"}>
          <Logo settings={settings} />
          <strong>{settings.siteName || "ACI STORE"}</strong>
        </a>
        <nav className="shop-actions">
          {isAdminRoute ? <a className="icon-button" href="/" aria-label="Storefront"><span className="icon-home" /></a> : null}
          <button className="icon-pill" type="button" onClick={onTheme}>{theme === "dark" ? "☀" : "●"}</button>
          <button className="icon-button primary" type="button" onClick={user ? onLogout : onAuth} aria-label={user ? "Logout" : "Login"}><span className="icon-user" /></button>
        </nav>
      </div>
    </header>
  );
}

function StorefrontShell({ data, user, orders, setAuthOpen, setAuthMode, openDemo, openCheckout }) {
  const settings = data.settings;
  const [slide, setSlide] = useState(0);
  const slides = (settings.heroSlides || []).filter((item) => item.image);
  const activeSlide = slides[slide] || { image: settings.backgroundImage || DEFAULT_IMAGE, title: settings.heroTitle, subtitle: settings.heroSubtitle };

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const seconds = Math.max(3, Number(settings.heroIntervalSeconds || 6));
    const timer = setInterval(() => setSlide((value) => (value + 1) % slides.length), seconds * 1000);
    return () => clearInterval(timer);
  }, [slides.length, settings.heroIntervalSeconds]);

  return (
    <main className="shop-page">
      <section className="shop-banner">
        <img src={activeSlide.image || DEFAULT_IMAGE} alt={activeSlide.title || settings.siteName} />
        <div className="banner-shade" />
        <div className="banner-copy">
          <span>Verified manual checkout</span>
          <h1>{activeSlide.title || settings.heroTitle || settings.siteName}</h1>
          <p>{activeSlide.subtitle || settings.heroSubtitle}</p>
        </div>
      </section>
      {slides.length > 1 && (
        <div className="slider-dots" aria-label="Hero slides">
          {slides.map((item, index) => <button key={item.id || index} className={index === slide ? "active" : ""} type="button" onClick={() => setSlide(index)} aria-label={`Slide ${index + 1}`} />)}
        </div>
      )}

      <section id="products" className="mx-auto max-w-6xl px-4 py-10">
        <div className="section-title center">
          <h2>Our <span>Products</span></h2>
        </div>
        {data.sections.map((section) => {
          const products = data.products.filter((product) => product.sectionId === section.id);
          if (!products.length) return null;
          return (
            <div key={section.id} className="mb-12">
              <div className="category-line"><span>{section.title}</span></div>
              {section.subtitle && <p className="category-subtitle">{section.subtitle}</p>}
              <div className="product-grid">
                {products.map((product) => <ProductTile key={product.id} product={product} openDemo={openDemo} openCheckout={openCheckout} />)}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="section-title center">
          <h2>Why Choose <span>Us?</span></h2>
          <p>Premium products, manual payment verification, and a cleaner delivery workflow.</p>
        </div>
        <div className="trust-grid">
          {[
            ["delivery", "Instant Delivery", "Keys and order details stay organized after admin approval."],
            ["support", "24/7 Support", "WhatsApp and Telegram help links are controlled from admin."],
            ["shield", "100% Secure", "Manual verification keeps payment proof and order status clear."]
          ].map(([icon, title, text]) => <TrustCard key={title} icon={icon} title={title} text={text} />)}
        </div>
      </section>

      <footer className="shop-footer">
        <strong>{settings.siteName || "ACI STORE"}</strong>
        <p>&copy; 2026 {settings.siteName || "ACI STORE"}. All rights reserved.</p>
      </footer>
    </main>
  );
}

function OrderHistoryModal({ orders, onClose }) {
  return (
    <Modal onClose={onClose} className="history-modal">
      <div className="history-head">
        <div>
          <span>Account</span>
          <h2>Order History</h2>
        </div>
        <button className="checkout-close" type="button" onClick={onClose}>x</button>
      </div>
      <div className="history-list">
        {!orders.length && <p className="history-empty">No orders yet.</p>}
        {orders.map((order) => (
          <article className="history-item" key={order.id}>
            <div>
              <strong>{order.productName}</strong>
              <span>{order.variantName} x {order.quantity}</span>
              <small>{new Date(order.createdAt).toLocaleString()}</small>
            </div>
            <div>
              <b>{money(order.totalUsd)}</b>
              <span>{money(order.totalLocal, order.currency)}</span>
              <em className={`status ${order.status}`}>{order.status}</em>
            </div>
          </article>
        ))}
      </div>
    </Modal>
  );
}

function ProductTile({ product, openDemo, openCheckout }) {
  const lowest = Math.min(...(product.variants || []).map((variant) => Number(variant.priceUsd || 0)));
  return (
    <article className="product-card">
      <div className="product-image">
        <img src={product.image || DEFAULT_IMAGE} alt={product.name} />
        {product.badge && <span className="badge">{product.badge}</span>}
      </div>
      <div className="product-body">
        <div className="product-head">
          <span className="product-mark" />
          <div>
            <h3>{product.name}</h3>
            <span>Verified</span>
          </div>
        </div>
        <p>{product.shortDescription}</p>
        <div className="feature-list">
          {(product.features || []).slice(0, 4).map((feature) => <span className="feature-chip" key={feature}>{feature}</span>)}
        </div>
        <div className="price-line">
          <span>From</span>
          <strong>{money(Number.isFinite(lowest) ? lowest : 0)}</strong>
        </div>
        <div className="product-actions">
          <button className="demo-action" type="button" onClick={() => openDemo(product)}><span className="icon-play" /><span className="action-text">Demo</span></button>
          <button className="buy-action" type="button" onClick={() => openCheckout(product)}><span className="icon-cart" /><span className="action-text">Buy</span></button>
        </div>
      </div>
    </article>
  );
}

function TrustCard({ icon, title, text }) {
  return (
    <article className="feature-card">
      <span className={`feature-symbol ${icon}`}><TrustIcon icon={icon} /></span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Storefront({ data, user, orders, setAuthOpen, setAuthMode, openDemo, openCheckout }) {
  const settings = data.settings;
  const [slide, setSlide] = useState(0);
  const slides = (settings.heroSlides || []).filter((item) => item.image);
  const activeSlide = slides[slide] || { image: settings.backgroundImage || DEFAULT_IMAGE, title: settings.heroTitle, subtitle: settings.heroSubtitle };

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const seconds = Math.max(3, Number(settings.heroIntervalSeconds || 6));
    const timer = setInterval(() => setSlide((value) => (value + 1) % slides.length), seconds * 1000);
    return () => clearInterval(timer);
  }, [slides.length, settings.heroIntervalSeconds]);

  return (
    <main>
      <section className="hero-section">
        <div className="hero-bg" style={{ backgroundImage: `url("${activeSlide.image || DEFAULT_IMAGE}")` }} />
        <div className="hero-grid" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="status-dot">Secure manual payment marketplace</span>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{activeSlide.title || settings.heroTitle || settings.siteName}</h1>
            <p className="mt-4 text-lg text-slate-200">{activeSlide.subtitle || settings.heroSubtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a className="primary-action" href="#products">Browse Products</a>
              {!user && <button className="secondary-action" type="button" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>Login / Register</button>}
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-7xl px-4 py-12">
        <div className="section-title">
          <span>Our Products</span>
          <h2>Available Panels</h2>
        </div>
        {data.sections.map((section) => {
          const products = data.products.filter((product) => product.sectionId === section.id);
          if (!products.length) return null;
          return (
            <div key={section.id} className="mb-12">
              <div className="category-line"><span>{section.title}</span></div>
              <p className="mb-5 text-slate-400">{section.subtitle}</p>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => <ProductCard key={product.id} product={product} openDemo={openDemo} openCheckout={openCheckout} />)}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="section-title text-center">
          <span>Why choose us</span>
          <h2>Fast, secure, organized delivery</h2>
          <p>Preview, select, pay manually, and track order status from one account.</p>
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {[
            ["🚀", "Instant workflow", "Variant, quantity, payment gateway, and reference submission are arranged step by step."],
            ["🎧", "24/7 support", "Admin can update WhatsApp and Telegram support links anytime."],
            ["🛡", "Manual verification", "Orders stay pending until admin checks payment and approves delivery."]
          ].map(([icon, title, text]) => <FeatureCard key={title} icon={icon} title={title} text={text} />)}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-panel/70 px-4 py-8 text-center text-slate-400">
        <strong className="text-white">{settings.siteName || "ACI STORE"}</strong>
        <p className="mt-3 text-sm">&copy; 2026 {settings.siteName || "ACI STORE"}. All rights reserved.</p>
      </footer>
    </main>
  );
}

function Info({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function ProductCard({ product, openDemo, openCheckout }) {
  const lowest = Math.min(...(product.variants || []).map((variant) => Number(variant.priceUsd || 0)));
  return (
    <article className="product-card">
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-lg bg-black">
        <img className="h-full w-full object-cover" src={product.image || DEFAULT_IMAGE} alt={product.name} />
        {product.badge && <span className="badge">{product.badge}</span>}
      </div>
      <div className="grid flex-1 gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black">{product.name}</h3>
            <span className="text-sm text-neon">Verified</span>
          </div>
          <span className="panel-chip">{product.panelName || "Panel"}</span>
        </div>
        <p className="text-sm text-slate-400">{product.shortDescription}</p>
        <div className="flex flex-wrap gap-2">
          {(product.features || []).slice(0, 5).map((feature) => <span className="feature-chip" key={feature}>{feature}</span>)}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-slate-400">From</span>
          <strong className="text-2xl text-neon">{money(Number.isFinite(lowest) ? lowest : 0)}</strong>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="danger-action" type="button" onClick={() => openDemo(product)}>Demo</button>
          <button className="primary-action compact" type="button" onClick={() => openCheckout(product)}>Buy</button>
        </div>
      </div>
    </article>
  );
}

function FeatureCard({ icon, title, text }) {
  const lowered = `${icon || ""} ${title || ""}`.toLowerCase();
  const normalizedIcon = lowered.includes("support")
    ? "support"
    : lowered.includes("secure") || lowered.includes("verification")
      ? "shield"
      : "delivery";
  return (
    <article className="feature-card">
      <span className={`feature-symbol ${normalizedIcon}`}><TrustIcon icon={normalizedIcon} /></span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function AuthModal({ mode, setMode, message, setMessage, googleClientId, onClose, onSubmit, onGoogleCredential }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", code: "" });
  const [codeSent, setCodeSent] = useState(false);
  const title = mode === "forgot" ? "Forgot Password" : mode === "login" ? "Login" : "Register";
  const buttonText = mode === "forgot" ? (codeSent ? "Verify Code & Reset" : "Send Reset Code") : mode === "login" ? "Login" : "Create Account";
  useEffect(() => {
    setCodeSent(false);
    setForm((current) => ({ ...current, code: "", password: "" }));
  }, [mode]);

  async function submitForm() {
    const payload = await onSubmit({ ...form, phase: mode === "forgot" ? (codeSent ? "reset" : "request") : mode });
    if (mode === "forgot" && !codeSent) setCodeSent(true);
    return payload;
  }

  async function googleLogin() {
    if (!googleClientId) {
      setMessage("Google Client ID admin settings theke set korte hobe.");
      return;
    }
    setMessage("Opening Google sign-in...");
    if (!window.google?.accounts?.id) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error("Google script failed to load"));
        document.head.appendChild(script);
      });
    }
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => onGoogleCredential(response.credential).catch((error) => setMessage(error.message))
    });
    window.google.accounts.id.prompt();
  }

  return (
    <Modal onClose={onClose} className="max-w-md">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="segmented">
        <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>Login</button>
        <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>Register</button>
      </div>
      <p className="rounded-lg border border-sky/20 bg-sky/10 p-3 text-sm text-slate-300">Use your own Gmail. Site password is separate; never enter your real Gmail password here.</p>
      {mode === "register" && <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />}
      <Field label="Personal Gmail" value={form.email} onChange={(email) => setForm({ ...form, email })} />
      {mode === "forgot" && codeSent && <Field label="Reset code" value={form.code} onChange={(code) => setForm({ ...form, code })} />}
      {(mode !== "forgot" || codeSent) && <PasswordField label={mode === "forgot" ? "New site password" : "Site password"} value={form.password} onChange={(password) => setForm({ ...form, password })} />}
      <button className="primary-action w-full" type="button" onClick={() => submitForm().catch((error) => setMessage(error.message))}>
        {buttonText}
      </button>
      {mode === "login" && <button className="forgot-link" type="button" onClick={() => { setMessage(""); setMode("forgot"); }}>Forgot password?</button>}
      {mode !== "forgot" && <button className="google-button" type="button" onClick={() => googleLogin().catch((error) => setMessage(error.message))}>
        <span className="google-logo">G</span> Continue with Google
      </button>}
      {message && <p className="text-sm text-warn">{message}</p>}
    </Modal>
  );
}

function CheckoutFlow({ data, user, product, api, onClose, onLogin, onOrder }) {
  const paymentMethods = data.paymentMethods || [];
  const binanceMethods = paymentMethods.filter(isBinanceLike);
  const directMethods = paymentMethods.filter((item) => !isBinanceLike(item));
  const indiaMethods = directMethods.filter(isIndiaLike);
  const localMethods = directMethods.filter((item) => !isIndiaLike(item));
  const binanceGateway = { id: "__binance-pay__", name: "Binance Pay", currency: "USD", group: "binance", instructions: `${binanceMethods.length} Binance payment options`, isGroup: true };
  const mainGateways = [...localMethods, ...(binanceMethods.length ? [binanceGateway] : []), ...indiaMethods];
  const firstGateway = mainGateways[0] || paymentMethods[0] || null;
  const firstMethod = firstGateway?.isGroup ? binanceMethods[0] : firstGateway;
  const [step, setStep] = useState(1);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [gatewayId, setGatewayId] = useState(firstGateway?.id || "");
  const [methodId, setMethodId] = useState(firstMethod?.id || "");
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const variant = product.variants.find((item) => item.id === variantId) || product.variants[0];
  const activeGateway = mainGateways.find((item) => item.id === gatewayId) || firstGateway || binanceGateway;
  const method = paymentMethods.find((item) => item.id === methodId) || firstMethod || paymentMethods[0];
  const displayMethod = activeGateway?.isGroup ? binanceGateway : method;
  const qty = Math.max(1, Number(quantity || 1));
  const totalUsd = Number((Number(variant?.priceUsd || 0) * qty).toFixed(2));
  const local = convertForDisplay(totalUsd, method, data.settings.currencyRates);
  const displayLocal = convertForDisplay(totalUsd, displayMethod, data.settings.currencyRates);
  const tone = paymentTone(displayMethod || method);
  const proofLabel = isBinanceLike(method) ? "Order ID" : "Transaction ID / Payment Reference";
  const proofPlaceholder = isBinanceLike(method) ? "Order ID" : "Transaction ID";

  useEffect(() => {
    if (user && step === 2) setStep(3);
  }, [user, step]);

  async function placeOrder() {
    if (!user) {
      setStep(2);
      return;
    }
    if (!transactionId.trim()) {
      setMessage(`${isBinanceLike(method) ? "Order ID" : "Transaction ID"} is required.`);
      return;
    }
    setMessage("Submitting payment proof...");
    const payload = await api("/api/orders", {
      method: "POST",
      body: { productId: product.id, variantId, quantity: qty, paymentMethodId: methodId, transactionId, contact: user?.email || "" }
    });
    onOrder(payload.order);
    setMessage("Order submitted. Admin approval pending.");
  }

  async function copyAccount() {
    try {
      if (!method?.account) {
        setMessage("Payment account is not set.");
        return;
      }
      await copyText(method?.account || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      setMessage(error.message || "Copy failed.");
    }
  }

  function chooseMainGateway(item) {
    setMessage("");
    setGatewayId(item.id);
    if (item.isGroup) {
      setMethodId(binanceMethods[0]?.id || "");
      setStep(4);
      return;
    }
    setMethodId(item.id);
  }

  return (
    <Modal onClose={onClose} className={`checkout-modal tone-${tone}`}>
      <div className="checkout-head">
        <div>
          <span>Secure checkout</span>
          <h2>{product.name}</h2>
        </div>
        <button className="checkout-close" type="button" onClick={onClose}>x</button>
      </div>
      <PaymentSteps step={step} />

      {step === 1 && (
        <div className="checkout-step">
          <div className="checkout-product-strip">
            <img src={product.image || DEFAULT_IMAGE} alt={product.name} />
            <div>
              <strong>{product.name}</strong>
              <span>{product.panelName || "Panel"} / In stock</span>
            </div>
            <b>{money(totalUsd)}</b>
          </div>
          <label className="field">
            <span>Select Option</span>
            <select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
              {product.variants.map((item) => (
                <option key={item.id} value={item.id}>{item.name} - {money(item.priceUsd)} - {durationText(item)}</option>
              ))}
            </select>
          </label>
          <div className="quantity-box">
            <span>Quantity</span>
            <div>
              <button type="button" onClick={() => setQuantity(Math.max(1, qty - 1))}>-</button>
              <strong>{qty}</strong>
              <button type="button" onClick={() => setQuantity(qty + 1)}>+</button>
            </div>
          </div>
          <div className="selected-box compact">
            <div><strong>{variant?.name}</strong><span>{durationText(variant)} / In stock</span></div>
            <b>{money(totalUsd)}</b>
          </div>
          <button className="pay-action" type="button" onClick={() => setStep(user ? 3 : 2)}>Continue</button>
        </div>
      )}

      {step === 2 && (
        <div className="account-required premium">
          <span className="account-lock" />
          <h3>Account Required</h3>
          <p>This shop requires email verification. Login or register to continue.</p>
          <div className="account-actions">
            <button className="pay-action" type="button" onClick={() => onLogin("login")}>Login</button>
            <button className="text-action" type="button" onClick={() => onLogin("register")}>Create Account</button>
          </div>
          <button className="text-action" type="button" onClick={() => setStep(1)}>Back</button>
        </div>
      )}

      {step === 3 && (
        <div className="checkout-step">
          <div className="payment-shop-card">
            <Logo settings={data.settings} size="small" />
            <div><strong>{data.settings.siteName}</strong><small>{product.name} / {variant?.name} x {qty}</small></div>
            <div className="text-right"><span>Pay Total Amount</span><b>{displayMethod?.currency === "USD" ? money(totalUsd) : money(displayLocal, displayMethod?.currency)}</b></div>
          </div>
          <div className="gateway-tabs">
            <span>Select Payment</span>
            <div>
              <button type="button">Choose Gateway</button>
              <button type="button">Help</button>
              <button type="button">Info</button>
            </div>
          </div>
          <div className="gateway-list">
            {mainGateways.map((item) => (
              <button key={item.id} className={`gateway-item ${gatewayId === item.id ? "active" : ""}`} type="button" onClick={() => chooseMainGateway(item)}>
                <PaymentLogo method={item} />
                <div><strong>{item.name}</strong><small>{item.isGroup ? `${binanceMethods.length} crypto options` : `Pay with ${item.currency}`}</small></div>
                <b>&gt;</b>
              </button>
            ))}
          </div>
          <div className="checkout-actions gateway-actions">
            <button className="text-action" type="button" onClick={() => setStep(1)}>Back</button>
            <button className="pay-action" type="button" onClick={() => { setMessage(""); setStep(activeGateway?.isGroup ? 4 : 5); }}><span className="icon-pay" />{activeGateway?.isGroup ? "Choose Binance Option" : "Pay Now"}</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="checkout-step">
          <div className="payment-shop-card">
            <PaymentLogo method={binanceGateway} />
            <div><strong>Binance Pay</strong><small>Select one Binance payment option</small></div>
            <div className="text-right"><span>Pay Total Amount</span><b>{money(totalUsd)}</b></div>
          </div>
          <div className="gateway-tabs">
            <span>Binance Options</span>
            <div>
              <button type="button">USDT / BTC / Pay ID</button>
            </div>
          </div>
          <div className="gateway-list">
            {binanceMethods.map((item) => (
              <button key={item.id} className={`gateway-item ${methodId === item.id ? "active" : ""}`} type="button" onClick={() => { setMessage(""); setMethodId(item.id); }}>
                <PaymentLogo method={item} />
                <div><strong>{item.name}</strong><small>{item.instructions || `Pay with ${item.currency}`}</small></div>
                <b>&gt;</b>
              </button>
            ))}
          </div>
          {!binanceMethods.length && <p className="payment-note">No Binance payment options are enabled. Add one from Admin &gt; Payments.</p>}
          <div className="selected-box">
            <span>Selected Binance Method</span>
            <b>{method?.name || "Not selected"}</b>
          </div>
          <div className="checkout-actions">
            <button className="text-action" type="button" onClick={() => setStep(3)}>Back</button>
            <button className="pay-action" type="button" disabled={!methodId} onClick={() => { setMessage(""); setStep(5); }}><span className="icon-pay" />Pay Now</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="checkout-step">
          <div className="payment-receipt">
            <div className="receipt-brand">
              <PaymentLogo method={method} />
            </div>
            <label className="transaction-field">
              <span>{proofLabel}</span>
              <input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder={proofPlaceholder} />
            </label>
            <div className="copy-line receiver-line">
              <div>
                <small>Account / wallet</small>
                <b>{method?.account || "Not set"}</b>
              </div>
              <button type="button" onClick={copyAccount}>{copied ? "Copied" : "Copy"}</button>
            </div>
            <div className="receipt-lines">
              <p><span>1</span><b>Send payment</b> through the selected gateway.</p>
              <p><span>2</span>Amount: <b>{money(local, method?.currency || "USD")}</b></p>
              <p><span>3</span>{method?.instructions || "Complete the payment, then submit your transaction reference."}</p>
              <p><span>4</span>Enter the {isBinanceLike(method) ? "Order ID" : "Transaction ID"}, then click <b>Verify Payment</b>.</p>
            </div>
          </div>
          <div className="checkout-actions">
            <button className="text-action" type="button" onClick={() => setStep(isBinanceLike(method) ? 4 : 3)}>Back</button>
            <button className="pay-action" type="button" onClick={() => placeOrder().catch((error) => setMessage(error.message))}>Verify Payment</button>
          </div>
          {message && <p className="text-sm text-warn">{message}</p>}
        </div>
      )}
    </Modal>
  );
}

function PaymentSteps({ step }) {
  return (
    <div className="stepper premium">
      {[1, 2, 3, 4, 5].map((item) => <span key={item} className={item === step ? "active" : item < step ? "done" : ""}>{item}</span>)}
    </div>
  );
}

function CheckoutModal({ data, user, product, api, onClose, onLogin, onOrder }) {
  const [step, setStep] = useState(1);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [methodId, setMethodId] = useState(data.paymentMethods?.[0]?.id || "");
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState("");
  const variant = product.variants.find((item) => item.id === variantId) || product.variants[0];
  const method = data.paymentMethods.find((item) => item.id === methodId) || data.paymentMethods[0];
  const totalUsd = Number((Number(variant?.priceUsd || 0) * Math.max(1, Number(quantity || 1))).toFixed(2));
  const local = convertForDisplay(totalUsd, method, data.settings.currencyRates);
  const proofLabel = isBinanceLike(method) ? "Order ID" : "Transaction ID / Reference";

  useEffect(() => {
    if (user && step === 2) setStep(3);
  }, [user, step]);

  async function placeOrder() {
    if (!user) {
      setStep(2);
      return;
    }
    if (!transactionId.trim()) {
      setMessage(`${isBinanceLike(method) ? "Order ID" : "Transaction ID"} required.`);
      return;
    }
    setMessage("Submitting...");
    const payload = await api("/api/orders", {
      method: "POST",
      body: { productId: product.id, variantId, quantity, paymentMethodId: methodId, transactionId, contact: user?.email || "" }
    });
    onOrder(payload.order);
    setMessage("Order submitted. Admin approval pending.");
  }

  return (
    <Modal onClose={onClose} className="max-w-2xl payment-modal">
      <div className="payment-title">
        <h2>🛒 {product.name}</h2>
        <span>Encrypted</span>
      </div>
      <Stepper step={step} />

      {step === 1 && (
        <div className="grid gap-5 md:grid-cols-[.9fr_1.1fr]">
          <div>
            <img className="rounded-lg border border-white/10" src={product.image || DEFAULT_IMAGE} alt={product.name} />
            <p className="mt-3 text-sm text-slate-300">{product.shortDescription}</p>
          </div>
          <div className="gateway-panel">
            <FieldSelect label="Select option" value={variantId} onChange={setVariantId} options={product.variants.map((item) => ({
              value: item.id,
              label: `${item.name} - ${money(item.priceUsd)} - ${durationText(item)} - In stock`
            }))} />
            <Field label="Quantity" type="number" value={quantity} onChange={setQuantity} />
            <div className="selected-box">
              <div><strong>{variant?.name}</strong><span>{durationText(variant)} / In stock</span></div>
              <b>{money(variant?.priceUsd)}</b>
            </div>
            <button className="primary-action w-full" type="button" onClick={() => setStep(user ? 3 : 2)}>Continue</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="account-required">
          <div className="text-5xl">🔐</div>
          <h3>Account Required</h3>
          <p>This shop requires email verification. Login or register to continue.</p>
          <button className="primary-action w-full" type="button" onClick={onLogin}>Login / Register</button>
          <button className="secondary-action" type="button" onClick={() => setStep(1)}>Back</button>
        </div>
      )}

      {step === 3 && (
        <div className="gateway-panel">
          <div className="payment-shop-card">
            <Logo settings={data.settings} size="small" />
            <div><strong>{data.settings.siteName}</strong><small>{product.name} / {variant.name} x {quantity}</small></div>
            <div className="text-right"><span>Pay</span><b>{money(totalUsd)}</b></div>
          </div>
          <div className="gateway-list">
            {data.paymentMethods.map((item) => (
              <button key={item.id} className={`gateway-item ${methodId === item.id ? "active" : ""}`} type="button" onClick={() => setMethodId(item.id)}>
                <PaymentLogo method={item} />
                <div><strong>{item.name}</strong><small>Pay with {item.currency}</small></div>
                <b>›</b>
              </button>
            ))}
          </div>
          <div className="selected-box">
            <span>Total amount</span>
            <b>{money(local, method?.currency || "USD")}</b>
          </div>
          <div className="payment-note">
            <strong>{method?.name}</strong><br />
            Account: {method?.account || "Not set"}<br />
            {method?.instructions}
          </div>
          <Field label={proofLabel} value={transactionId} onChange={setTransactionId} />
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <button className="secondary-action" type="button" onClick={() => setStep(1)}>Back</button>
            <button className="primary-action w-full" type="button" onClick={() => placeOrder().catch((error) => setMessage(error.message))}>Verify Payment</button>
          </div>
          {message && <p className="text-sm text-warn">{message}</p>}
        </div>
      )}
    </Modal>
  );
}

function Stepper({ step }) {
  return (
    <div className="stepper">
      {[1, 2, 3].map((item) => <span key={item} className={item === step ? "active" : item < step ? "done" : ""}>{item}</span>)}
    </div>
  );
}

function AdminPanel({ api, token, user, dashboard, setDashboard, loadDashboard, saveToken, notice, setNotice }) {
  const [login, setLogin] = useState({ email: "admin@example.com", password: "Admin@12345" });
  const [tab, setTab] = useState("settings");

  if (!token || !dashboard || user?.role !== "admin") {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="admin-card">
          <h1>Admin login</h1>
          <Field label="Email" value={login.email} onChange={(email) => setLogin({ ...login, email })} />
          <PasswordField label="Password" value={login.password} onChange={(password) => setLogin({ ...login, password })} />
          <button className="primary-action w-full" type="button" onClick={async () => {
            try {
              const payload = await api("/api/auth/login", { method: "POST", body: login });
              saveToken(payload.token, payload.user);
              setNotice("");
            } catch (error) {
              setNotice(error.message);
            }
          }}>Login</button>
          {notice && <p className="text-warn">{notice}</p>}
        </div>
      </main>
    );
  }

  const tabs = ["settings", "sections", "payments", "products", "stock", "orders", "users", "security"];
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="admin-tabs">
        {tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} type="button">{item}</button>)}
      </div>
      {notice && <p className="admin-notice">{notice}</p>}
      {tab === "settings" && <SettingsAdmin api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} />}
      {tab === "sections" && <SectionsAdmin api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} />}
      {tab === "payments" && <PaymentsAdmin api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} />}
      {tab === "products" && <ProductsAdmin api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} loadDashboard={loadDashboard} />}
      {tab === "stock" && <StockAdmin api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} />}
      {tab === "orders" && <OrdersAdmin api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} loadDashboard={loadDashboard} />}
      {tab === "users" && <UsersAdmin api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} />}
      {tab === "security" && <SecurityAdmin api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} />}
    </main>
  );
}

function SettingsAdmin({ api, dashboard, setDashboard, setNotice }) {
  const [settings, setSettings] = useState(dashboard.settings);
  return (
    <AdminCard title="Website settings" action="Save Settings" onAction={async () => {
      const payload = await api("/api/admin/settings", { method: "PUT", body: settings });
      setDashboard({ ...dashboard, settings: payload.settings });
      setNotice("Settings saved.");
    }}>
      <div className="form-grid">
        <Field label="Site name" value={settings.siteName} onChange={(siteName) => setSettings({ ...settings, siteName })} />
        <Field label="Logo text" value={settings.logoText} onChange={(logoText) => setSettings({ ...settings, logoText })} />
        <ImageField label="Logo" value={settings.logoUrl} onChange={(logoUrl) => setSettings({ ...settings, logoUrl })} />
        <ImageField label="Background image" value={settings.backgroundImage} onChange={(backgroundImage) => setSettings({ ...settings, backgroundImage })} />
        <Field label="Hero title" value={settings.heroTitle} onChange={(heroTitle) => setSettings({ ...settings, heroTitle })} />
        <Field label="Hero interval seconds" type="number" value={settings.heroIntervalSeconds} onChange={(heroIntervalSeconds) => setSettings({ ...settings, heroIntervalSeconds: Number(heroIntervalSeconds) })} />
        <Field label="BDT per USD" type="number" value={settings.currencyRates?.BDT} onChange={(BDT) => setSettings({ ...settings, currencyRates: { ...settings.currencyRates, BDT: Number(BDT) } })} />
        <Field label="INR per USD" type="number" value={settings.currencyRates?.INR} onChange={(INR) => setSettings({ ...settings, currencyRates: { ...settings.currencyRates, INR: Number(INR) } })} />
        <Field label="WhatsApp number/link" value={settings.supportWhatsApp} onChange={(supportWhatsApp) => setSettings({ ...settings, supportWhatsApp })} />
        <Field label="Telegram username/link" value={settings.supportTelegram} onChange={(supportTelegram) => setSettings({ ...settings, supportTelegram })} />
      </div>
      <TextArea label="Hero subtitle" value={settings.heroSubtitle} onChange={(heroSubtitle) => setSettings({ ...settings, heroSubtitle })} />
      <HeroSlidesEditor settings={settings} setSettings={setSettings} />
    </AdminCard>
  );
}

function HeroSlidesEditor({ settings, setSettings }) {
  const slides = settings.heroSlides || [];
  return (
    <div className="mt-5 grid gap-3">
      <div className="flex items-center justify-between"><h3 className="font-black">Hero slider images</h3><button className="secondary-action" type="button" onClick={() => setSettings({ ...settings, heroSlides: [...slides, { id: "", title: "New slide", subtitle: "", image: settings.backgroundImage || DEFAULT_IMAGE }] })}>Add slide</button></div>
      {slides.map((slide, index) => (
        <div className="nested-card" key={index}>
          <Field label="Title" value={slide.title} onChange={(title) => setSettings({ ...settings, heroSlides: slides.map((item, i) => i === index ? { ...item, title } : item) })} />
          <Field label="Subtitle" value={slide.subtitle} onChange={(subtitle) => setSettings({ ...settings, heroSlides: slides.map((item, i) => i === index ? { ...item, subtitle } : item) })} />
          <ImageField label="Slide image" value={slide.image} onChange={(image) => setSettings({ ...settings, heroSlides: slides.map((item, i) => i === index ? { ...item, image } : item) })} />
          <button className="danger-action" type="button" onClick={() => setSettings({ ...settings, heroSlides: slides.filter((_, i) => i !== index) })}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function PaymentsAdmin({ api, dashboard, setDashboard, setNotice }) {
  const [methods, setMethods] = useState(dashboard.paymentMethods || []);
  return (
    <AdminCard title="Payment methods" action="Save Payments" onAction={async () => {
      const payload = await api("/api/admin/payment-methods", { method: "PUT", body: { paymentMethods: methods } });
      setDashboard({ ...dashboard, paymentMethods: payload.paymentMethods });
      setNotice("Payment methods saved.");
    }}>
      <button className="secondary-action mb-4" type="button" onClick={() => setMethods([...methods, { id: `method-${Date.now()}`, name: "New Method", currency: "USD", rateKey: "USD", account: "", logoUrl: "", group: "main", instructions: "", enabled: true }])}>Add payment method</button>
      <div className="grid gap-4">
        {methods.map((method, index) => <PaymentEditor key={index} method={method} onChange={(next) => setMethods(methods.map((item, i) => i === index ? next : item))} onDelete={() => setMethods(methods.filter((_, i) => i !== index))} />)}
      </div>
    </AdminCard>
  );
}

function PaymentEditor({ method, onChange, onDelete }) {
  return (
    <div className="nested-card">
      <div className="form-grid">
        <Field label="ID" value={method.id} onChange={(id) => onChange({ ...method, id })} />
        <Field label="Name" value={method.name} onChange={(name) => onChange({ ...method, name })} />
        <Field label="Currency" value={method.currency} onChange={(currency) => onChange({ ...method, currency })} />
        <Field label="Rate key" value={method.rateKey} onChange={(rateKey) => onChange({ ...method, rateKey })} />
        <Field label="Account" value={method.account} onChange={(account) => onChange({ ...method, account })} />
        <FieldSelect label="Group" value={method.group || "main"} onChange={(group) => onChange({ ...method, group })} options={[{ value: "main", label: "Main payment list" }, { value: "binance", label: "Inside Binance Pay" }]} />
        <ImageField label="Payment logo" value={method.logoUrl} onChange={(logoUrl) => onChange({ ...method, logoUrl })} />
      </div>
      <TextArea label="Instructions" value={method.instructions} onChange={(instructions) => onChange({ ...method, instructions })} />
      <label className="check-line"><input type="checkbox" checked={method.enabled} onChange={(e) => onChange({ ...method, enabled: e.target.checked })} /> Enabled</label>
      <button className="danger-action" type="button" onClick={onDelete}>Delete</button>
    </div>
  );
}

function ProductsAdmin({ api, dashboard, setDashboard, setNotice, loadDashboard }) {
  return (
    <AdminCard title="Products" action="New Product" onAction={async () => {
      if (!dashboard.sections.length) {
        setNotice("Create a section before adding products.");
        return;
      }
      const payload = await api("/api/admin/products", { method: "POST", body: { sectionId: dashboard.sections[0]?.id, name: "New Product", panelName: "Panel", shortDescription: "Describe product", image: dashboard.settings.backgroundImage, demoVideoUrl: "", badge: "New", enabled: true, features: ["Manual payment"], variants: [{ name: "Basic", priceUsd: 5, durationDays: 1, description: "Starter", stockKeys: [] }] } });
      setDashboard({ ...dashboard, products: [payload.product, ...dashboard.products] });
      setNotice("Product added.");
    }}>
      <div className="grid gap-4">
        {dashboard.products.map((product) => <ProductEditor key={product.id} api={api} dashboard={dashboard} product={product} setDashboard={setDashboard} setNotice={setNotice} loadDashboard={loadDashboard} />)}
      </div>
    </AdminCard>
  );
}

function SectionsAdmin({ api, dashboard, setDashboard, setNotice }) {
  const sorted = [...(dashboard.sections || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  return (
    <AdminCard title="Panel sections" action="Add Section" onAction={async () => {
      const payload = await api("/api/admin/sections", {
        method: "POST",
        body: {
          title: "New Panel Section",
          subtitle: "Describe this panel group.",
          image: dashboard.settings.backgroundImage,
          enabled: true,
          sortOrder: (dashboard.sections?.length || 0) + 1
        }
      });
      setDashboard({ ...dashboard, sections: [...dashboard.sections, payload.section] });
      setNotice("Section added.");
    }}>
      <div className="grid gap-4">
        {sorted.map((section) => (
          <SectionEditor
            key={section.id}
            api={api}
            dashboard={dashboard}
            section={section}
            setDashboard={setDashboard}
            setNotice={setNotice}
          />
        ))}
      </div>
    </AdminCard>
  );
}

function SectionEditor({ api, dashboard, section, setDashboard, setNotice }) {
  const [draft, setDraft] = useState(section);
  const productCount = dashboard.products.filter((product) => product.sectionId === section.id).length;
  return (
    <div className="nested-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black">{section.title}</h3>
          <p className="text-sm text-slate-400">{productCount} products in this section</p>
        </div>
        <span className="panel-chip">Order {section.sortOrder}</span>
      </div>
      <div className="form-grid mt-4">
        <Field label="Section title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
        <Field label="Sort order" type="number" value={draft.sortOrder} onChange={(sortOrder) => setDraft({ ...draft, sortOrder: Number(sortOrder) })} />
        <ImageField label="Section image" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
      </div>
      <TextArea label="Subtitle" value={draft.subtitle} onChange={(subtitle) => setDraft({ ...draft, subtitle })} />
      <label className="check-line"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /> Enabled on storefront</label>
      <div className="flex flex-wrap gap-3">
        <button className="primary-action compact" type="button" onClick={async () => {
          const payload = await api(`/api/admin/sections/${section.id}`, { method: "PUT", body: draft });
          setDashboard({ ...dashboard, sections: dashboard.sections.map((item) => item.id === section.id ? payload.section : item) });
          setNotice("Section saved.");
        }}>Save</button>
        <button className="danger-action" type="button" onClick={async () => {
          if (!window.confirm("Delete this section and every product inside it?")) return;
          await api(`/api/admin/sections/${section.id}`, { method: "DELETE" });
          setDashboard({
            ...dashboard,
            sections: dashboard.sections.filter((item) => item.id !== section.id),
            products: dashboard.products.filter((item) => item.sectionId !== section.id)
          });
          setNotice("Section deleted.");
        }}>Delete Section</button>
      </div>
    </div>
  );
}

function ProductEditor({ api, dashboard, product, setDashboard, setNotice }) {
  const [draft, setDraft] = useState(product);
  return (
    <div className="nested-card">
      <div className="flex items-center justify-between gap-3"><h3 className="font-black">{product.name}</h3><span className="panel-chip">{product.panelName}</span></div>
      <div className="form-grid">
        <FieldSelect label="Section" value={draft.sectionId} onChange={(sectionId) => setDraft({ ...draft, sectionId })} options={dashboard.sections.map((section) => ({ value: section.id, label: section.title }))} />
        <Field label="Name" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
        <Field label="Panel name" value={draft.panelName} onChange={(panelName) => setDraft({ ...draft, panelName })} />
        <Field label="Badge" value={draft.badge} onChange={(badge) => setDraft({ ...draft, badge })} />
        <ImageField label="Product image" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
        <Field label="YouTube demo URL" value={draft.demoVideoUrl} onChange={(demoVideoUrl) => setDraft({ ...draft, demoVideoUrl })} />
      </div>
      <TextArea label="Short description" value={draft.shortDescription} onChange={(shortDescription) => setDraft({ ...draft, shortDescription })} />
      <TextArea label="Features, one per line" value={(draft.features || []).join("\n")} onChange={(value) => setDraft({ ...draft, features: value.split("\n").map((line) => line.trim()).filter(Boolean) })} />
      <VariantsEditor variants={draft.variants || []} onChange={(variants) => setDraft({ ...draft, variants })} />
      <label className="check-line"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /> Enabled</label>
      <div className="flex gap-3">
        <button className="primary-action compact" type="button" onClick={async () => {
          const payload = await api(`/api/admin/products/${product.id}`, { method: "PUT", body: draft });
          setDashboard({ ...dashboard, products: dashboard.products.map((item) => item.id === product.id ? payload.product : item) });
          setNotice("Product saved.");
        }}>Save</button>
        <button className="danger-action" type="button" onClick={async () => {
          await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
          setDashboard({ ...dashboard, products: dashboard.products.filter((item) => item.id !== product.id) });
          setNotice("Product deleted.");
        }}>Delete</button>
      </div>
    </div>
  );
}

function StockAdmin({ api, dashboard, setDashboard, setNotice }) {
  const [productId, setProductId] = useState(dashboard.products[0]?.id || "");
  const product = dashboard.products.find((item) => item.id === productId) || dashboard.products[0];
  const [variantId, setVariantId] = useState(product?.variants?.[0]?.id || "");
  const variant = product?.variants?.find((item) => item.id === variantId) || product?.variants?.[0];
  const [durationDays, setDurationDays] = useState(variant?.durationDays || 0);
  const [keys, setKeys] = useState("");

  useEffect(() => {
    setVariantId(product?.variants?.[0]?.id || "");
  }, [productId]);

  useEffect(() => {
    setDurationDays(variant?.durationDays || 0);
  }, [variantId]);

  function replaceProduct(nextProduct) {
    setDashboard({ ...dashboard, products: dashboard.products.map((item) => item.id === nextProduct.id ? nextProduct : item) });
  }

  return (
    <AdminCard title="Variant key stock" action="Add Stock" onAction={async () => {
      const payload = await api("/api/admin/stock", { method: "POST", body: { productId: product.id, variantId: variant.id, durationDays, keys } });
      replaceProduct(payload.product);
      setKeys("");
      setNotice("Stock updated.");
    }}>
      <div className="form-grid">
        <FieldSelect label="Product" value={product?.id || ""} onChange={setProductId} options={dashboard.products.map((item) => ({ value: item.id, label: item.name }))} />
        <FieldSelect label="Variant" value={variant?.id || ""} onChange={setVariantId} options={(product?.variants || []).map((item) => ({ value: item.id, label: `${item.name} - ${item.stockKeys?.length || 0} keys` }))} />
        <Field label="Duration days" type="number" value={durationDays} onChange={setDurationDays} />
      </div>
      <TextArea label="Keys, one per line" value={keys} onChange={setKeys} />
      <div className="nested-card">
        <h3 className="font-black">{product?.name} / {variant?.name}</h3>
        <p className="text-slate-400">{variant?.stockKeys?.length || 0} keys in stock</p>
        <div className="mt-3 flex flex-wrap gap-2">{(variant?.stockKeys || []).map((key) => <code className="key-chip" key={key}>{key}</code>)}</div>
        <button className="danger-action mt-4" type="button" onClick={async () => {
          const payload = await api("/api/admin/stock", { method: "DELETE", body: { productId: product.id, variantId: variant.id, clear: true } });
          replaceProduct(payload.product);
          setNotice("Variant stock cleared.");
        }}>Clear Variant Stock</button>
      </div>
    </AdminCard>
  );
}

function OrdersAdmin({ api, dashboard, setDashboard, setNotice, loadDashboard }) {
  const [selected, setSelected] = useState([]);
  async function saveOrder(order, status) {
    const payload = await api(`/api/admin/orders/${order.id}`, { method: "PUT", body: { status, adminNote: order.adminNote || "" } });
    setDashboard({ ...dashboard, orders: dashboard.orders.map((item) => item.id === order.id ? payload.order : item) });
    setNotice("Order updated.");
    loadDashboard?.().catch(() => {});
  }
  return (
    <AdminCard title="Orders" action="Delete Selected" onAction={async () => {
      const payload = await api("/api/admin/orders/delete-bulk", { method: "POST", body: { ids: selected } });
      setDashboard({ ...dashboard, orders: dashboard.orders.filter((item) => !selected.includes(item.id)) });
      setSelected([]);
      setNotice(`${payload.deleted} orders deleted.`);
      loadDashboard?.().catch(() => {});
    }}>
      <div className="table-wrap">
        <table>
          <thead><tr><th></th><th>Order</th><th>User</th><th>Product</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {[...dashboard.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((order) => (
              <tr key={order.id}>
                <td><input type="checkbox" checked={selected.includes(order.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, order.id] : selected.filter((id) => id !== order.id))} /></td>
                <td>{order.id.slice(0, 8)}<br /><small>{new Date(order.createdAt).toLocaleString()}</small></td>
                <td>{order.userEmail}<br /><small>{order.contact}</small></td>
                <td>{order.productName}<br /><small>{order.variantName} x {order.quantity}</small></td>
                <td>{money(order.totalUsd)}<br /><small>{money(order.totalLocal, order.currency)}</small></td>
                <td><span className={`status ${order.status}`}>{order.status}</span></td>
                <td className="flex gap-2"><button onClick={() => saveOrder(order, "approved")} className="secondary-action" type="button">Approve</button><button onClick={() => saveOrder(order, "rejected")} className="danger-action" type="button">Reject</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}

function UsersAdmin({ api, dashboard, setDashboard, setNotice }) {
  return (
    <AdminCard title="Users and balance">
      <div className="grid gap-3">
        {dashboard.users.map((user) => <UserEditor key={user.id} user={user} api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} />)}
      </div>
    </AdminCard>
  );
}

function UserEditor({ user, api, dashboard, setDashboard, setNotice }) {
  const [balanceUsd, setBalanceUsd] = useState(user.balanceUsd || 0);
  return (
    <div className="nested-card flex flex-wrap items-center justify-between gap-3">
      <div><strong>{user.name}</strong><br /><span className="text-slate-400">{user.email} / {user.role}</span></div>
      <Field label="Balance USD" type="number" value={balanceUsd} onChange={setBalanceUsd} />
      <button className="primary-action compact" type="button" onClick={async () => {
        const payload = await api(`/api/admin/users/${user.id}`, { method: "PUT", body: { balanceUsd, note: "Admin balance update" } });
        setDashboard({ ...dashboard, users: dashboard.users.map((item) => item.id === user.id ? payload.user : item) });
        setNotice("User saved.");
      }}>Save</button>
    </div>
  );
}

function SecurityAdmin({ api, dashboard, setDashboard, setNotice }) {
  const [newPassword, setNewPassword] = useState("");
  const adminUser = dashboard.users.find((item) => item.role === "admin") || dashboard.users[0];
  const [adminEmail, setAdminEmail] = useState(adminUser?.email || dashboard.defaultCredentials.adminEmail || "");
  return (
    <AdminCard title="Security" action="Change Password" onAction={async () => {
      await api("/api/admin/password", { method: "PUT", body: { newPassword } });
      setNewPassword("");
      setNotice("Admin password changed.");
    }}>
      <p className="mb-4 text-slate-400">Default admin password: {dashboard.defaultCredentials.adminPassword}</p>
      <div className="nested-card mb-4">
        <div className="form-grid">
          <Field label="Admin login Gmail" value={adminEmail} onChange={setAdminEmail} />
          <div className="grid content-end">
            <button className="primary-action compact" type="button" onClick={async () => {
              const payload = await api("/api/admin/account", { method: "PUT", body: { email: adminEmail } });
              setDashboard({ ...dashboard, users: dashboard.users.map((item) => item.id === payload.user.id ? payload.user : item), defaultCredentials: { ...dashboard.defaultCredentials, adminEmail: payload.user.email } });
              setNotice("Admin login Gmail changed.");
            }}>Save Admin Gmail</button>
          </div>
        </div>
      </div>
      <PasswordField label="New admin password" value={newPassword} onChange={setNewPassword} />
    </AdminCard>
  );
}

function AdminCard({ title, action, onAction, children }) {
  return (
    <section className="admin-card">
      <div className="admin-card-head">
        <h1>{title}</h1>
        {action && <button className="primary-action compact" type="button" onClick={() => Promise.resolve(onAction?.()).catch((error) => alert(error.message))}>{action}</button>}
      </div>
      {children}
    </section>
  );
}

function DemoModal({ product, onClose }) {
  const embed = youtubeEmbed(product.demoVideoUrl);
  return (
    <Modal onClose={onClose} className="demo-modal">
      <div className="demo-head">
        <div>
          <span>Product Demo</span>
          <h2>{product.name}</h2>
        </div>
        <button className="checkout-close" type="button" onClick={onClose}>x</button>
      </div>
      <div className="demo-video">
        {embed ? <iframe src={embed} title={`${product.name} demo`} allowFullScreen /> : <div>Demo video will appear here</div>}
      </div>
      <div className="demo-foot">
        <span>{product.panelName || "Panel"}</span>
        <strong>{product.badge || "Verified"}</strong>
      </div>
    </Modal>
  );
}

function HelpDock({ settings }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="help-dock">
      {open && (
        <div className="help-menu">
          <a className="help-channel whatsapp" href={supportHref("whatsapp", settings.supportWhatsApp)} target="_blank" rel="noreferrer">
            <BrandIcon type="whatsapp" />
            <span>WhatsApp</span>
          </a>
          <a className="help-channel telegram" href={supportHref("telegram", settings.supportTelegram)} target="_blank" rel="noreferrer">
            <BrandIcon type="telegram" />
            <span>Telegram</span>
          </a>
        </div>
      )}
      <button className="help-button" type="button" onClick={() => setOpen(!open)} aria-label="Support help">
        <BrandIcon type="help" />
      </button>
    </div>
  );
}

function Modal({ children, onClose, className = "" }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={`modal-panel ${className}`} onMouseDown={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose}>x</button>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return <label className="field"><span>{label}</span><input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></label>;
}

function PasswordField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field password-field">
      <span>{label}</span>
      <div className="password-wrap">
        <input type={visible ? "text" : "password"} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        <button type="button" onClick={() => setVisible((show) => !show)}>{visible ? "Hide" : "Show"}</button>
      </div>
    </label>
  );
}

function ImageField({ label, value, onChange }) {
  const [message, setMessage] = useState("");
  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setMessage("Uploading...");
      onChange(await readImageFile(file));
      setMessage("Uploaded from gallery.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="image-field">
      <Field label={`${label} URL/data`} value={value} onChange={onChange} />
      <div className="image-tools">
        <label className="upload-action">
          Upload from gallery
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>
        {value && <img src={value} alt={label} />}
      </div>
      {message && <small>{message}</small>}
    </div>
  );
}

function VariantsEditor({ variants, onChange }) {
  function update(index, patch) {
    onChange(variants.map((variant, i) => i === index ? { ...variant, ...patch } : variant));
  }

  return (
    <div className="variants-editor">
      <div className="variants-head">
        <h3>Variants</h3>
        <button className="secondary-action compact" type="button" onClick={() => onChange([...variants, { id: "", name: "New Variant", durationDays: 1, priceUsd: 1, description: "", stockKeys: [] }])}>Add variant</button>
      </div>
      {variants.map((variant, index) => (
        <div className="variant-row" key={variant.id || index}>
          <Field label="Variant name" value={variant.name} onChange={(name) => update(index, { name })} />
          <Field label="Days" type="number" value={variant.durationDays || 0} onChange={(durationDays) => update(index, { durationDays: Number(durationDays || 0) })} />
          <Field label="Price USD" type="number" value={variant.priceUsd || 0} onChange={(priceUsd) => update(index, { priceUsd: Number(priceUsd || 0) })} />
          <Field label="Description" value={variant.description || ""} onChange={(description) => update(index, { description })} />
          <button className="danger-action compact" type="button" onClick={() => onChange(variants.filter((_, i) => i !== index))}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return <label className="field"><span>{label}</span><textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></label>;
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export default App;
