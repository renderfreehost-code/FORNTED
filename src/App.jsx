import { useEffect, useState } from "react";

const API_BASE = String(import.meta.env.VITE_API_URL || window.API_BASE_URL || "").replace(/\/$/, "");
const DEFAULT_IMAGE = "/assets/marketplace-bg.png";

function money(amount, code = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: code === "USD" ? 2 : 0
  }).format(Number(amount || 0));
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
  if (text.includes("binance")) return "B";
  if (text.includes("upi") || text.includes("india")) return "UPI";
  return (method?.name || "PM").slice(0, 2).toUpperCase();
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

function Logo({ settings, size = "normal" }) {
  const cls = size === "small" ? "logo size-small" : "logo";
  if (settings?.logoUrl) return <span className={cls}><img src={settings.logoUrl} alt={settings.siteName || "Logo"} /></span>;
  return <span className={cls}>{settings?.logoText || "GP"}</span>;
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

  const isAdminRoute = routeKey.startsWith("/admin") || routeKey.endsWith("#admin");

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
    loadAccount();
  }, [token]);

  useEffect(() => {
    if (isAdminRoute && token) loadDashboard().catch(() => setDashboard(null));
  }, [isAdminRoute, token]);

  useEffect(() => {
    const timer = setInterval(() => loadBootstrap().catch(() => {}), 5000);
    return () => clearInterval(timer);
  }, [token]);

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
      />

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
            const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
            const payload = await api(path, { method: "POST", body: form });
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

function HeaderShell({ settings, user, isAdminRoute, theme, orders, onTheme, onAuth, onHistory, onLogout }) {
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
          {!isAdminRoute && user?.role === "admin" ? <a className="icon-button" href="/#admin" aria-label="Admin panel"><span className="icon-settings" /></a> : null}
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
                  {user.role === "admin" && <a href="/#admin" onClick={() => setMenuOpen(false)}>Admin Panel</a>}
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
          {!isAdminRoute && user?.role === "admin" ? <a className="icon-button" href="/#admin" aria-label="Admin panel"><span className="icon-settings" /></a> : null}
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
            ["rocket", "Instant Delivery", "Keys and order details stay organized after admin approval."],
            ["support", "24/7 Support", "WhatsApp and Telegram help links are controlled from admin."],
            ["shield", "100% Secure", "Manual verification keeps payment proof and order status clear."]
          ].map(([icon, title, text]) => <TrustCard key={title} icon={icon} title={title} text={text} />)}
        </div>
      </section>

      <footer className="shop-footer">
        <strong>{settings.siteName || "ACI STORE"}</strong>
        <div>
          <a href="#products">Products</a>
          <a href="/#admin">Admin</a>
        </div>
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
      <span className={`feature-symbol ${icon}`} />
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
        <div className="mt-3 flex justify-center gap-4">
          <a href="#products">Products</a>
          <a href="/#admin">Admin</a>
        </div>
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
  return (
    <article className="feature-card">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function AuthModal({ mode, setMode, message, setMessage, googleClientId, onClose, onSubmit, onGoogleCredential }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      <h2 className="text-2xl font-black">{mode === "login" ? "Login" : "Register"}</h2>
      <div className="segmented">
        <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>Login</button>
        <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>Register</button>
      </div>
      <p className="rounded-lg border border-sky/20 bg-sky/10 p-3 text-sm text-slate-300">Use your own Gmail. Site password is separate; never enter your real Gmail password here.</p>
      {mode === "register" && <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />}
      <Field label="Personal Gmail" value={form.email} onChange={(email) => setForm({ ...form, email })} />
      <Field label="Site password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
      <button className="primary-action w-full" type="button" onClick={() => onSubmit(form).catch((error) => setMessage(error.message))}>
        {mode === "login" ? "Login" : "Create Account"}
      </button>
      <button className="google-button" type="button" onClick={() => googleLogin().catch((error) => setMessage(error.message))}>
        <span className="google-logo">G</span> Continue with Google
      </button>
      {message && <p className="text-sm text-warn">{message}</p>}
    </Modal>
  );
}

function CheckoutFlow({ data, user, product, api, onClose, onLogin, onOrder }) {
  const [step, setStep] = useState(1);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [methodId, setMethodId] = useState(data.paymentMethods?.[0]?.id || "");
  const [transactionId, setTransactionId] = useState("");
  const [contact, setContact] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const variant = product.variants.find((item) => item.id === variantId) || product.variants[0];
  const method = data.paymentMethods.find((item) => item.id === methodId) || data.paymentMethods[0];
  const qty = Math.max(1, Number(quantity || 1));
  const totalUsd = Number((Number(variant?.priceUsd || 0) * qty).toFixed(2));
  const rate = method?.currency === "USD" ? 1 : Number(data.settings.currencyRates?.[method?.rateKey] || 1);
  const local = method?.currency === "USD" ? totalUsd : Math.round(totalUsd * rate);

  useEffect(() => {
    if (user?.email && !contact) setContact(user.email);
    if (user && step === 2) setStep(3);
  }, [user, step, contact]);

  async function placeOrder() {
    if (!user) {
      setStep(2);
      return;
    }
    if (!transactionId.trim()) {
      setMessage("Transaction ID is required.");
      return;
    }
    setMessage("Submitting payment proof...");
    const payload = await api("/api/orders", {
      method: "POST",
      body: { productId: product.id, variantId, quantity: qty, paymentMethodId: methodId, transactionId, contact }
    });
    onOrder(payload.order);
    setMessage("Order submitted. Admin approval pending.");
  }

  return (
    <Modal onClose={onClose} className="checkout-modal">
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
              <span>{product.panelName || "Panel"} / {variant?.stockCount || 0} in stock</span>
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
            <div><strong>{variant?.name}</strong><span>{durationText(variant)} / {variant?.stockCount || 0} in stock</span></div>
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
            <div className="text-right"><span>Pay</span><b>{method?.currency === "USD" ? money(totalUsd) : money(local, method?.currency)}</b></div>
          </div>
          <div className="gateway-tabs">
            <span>Select Payment</span>
            <button type="button">Choose Gateway</button>
            <button type="button">Help</button>
            <button type="button">Info</button>
          </div>
          <div className="gateway-list">
            {data.paymentMethods.map((item) => (
              <button key={item.id} className={`gateway-item ${methodId === item.id ? "active" : ""}`} type="button" onClick={() => setMethodId(item.id)}>
                <span>{methodIcon(item)}</span>
                <div><strong>{item.name}</strong><small>Pay with {item.currency}</small></div>
                <b>&gt;</b>
              </button>
            ))}
          </div>
          <div className="selected-box">
            <span>Total Amount</span>
            <b>{method?.currency === "USD" ? money(totalUsd) : money(local, method?.currency)}</b>
          </div>
          <div className="checkout-actions">
            <button className="text-action" type="button" onClick={() => setStep(1)}>Back</button>
            <button className="pay-action" type="button" onClick={() => { setMessage(""); setStep(4); }}>Pay Now</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="checkout-step">
          <div className="verify-header">
            <span className="gateway-logo">{methodIcon(method)}</span>
            <div>
              <strong>{method?.name}</strong>
              <span>Submit transaction proof</span>
            </div>
            <b>{method?.currency === "USD" ? money(totalUsd) : money(local, method?.currency)}</b>
          </div>
          <div className="payment-note verify-note">
            <strong>Payment Instructions</strong><br />
            Account: {method?.account || "Not set"}<br />
            {method?.instructions}<br />
            {method?.currency === "USD" ? "USD amount is fixed." : `Rate: ${rate} ${method?.currency}/USD`}
          </div>
          <Field label="Transaction ID / Reference" value={transactionId} onChange={setTransactionId} />
          <Field label="Contact" value={contact} onChange={setContact} />
          <div className="checkout-actions">
            <button className="text-action" type="button" onClick={() => setStep(3)}>Back</button>
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
      {[1, 2, 3, 4].map((item) => <span key={item} className={item === step ? "active" : item < step ? "done" : ""}>{item}</span>)}
    </div>
  );
}

function CheckoutModal({ data, user, product, api, onClose, onLogin, onOrder }) {
  const [step, setStep] = useState(1);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [methodId, setMethodId] = useState(data.paymentMethods?.[0]?.id || "");
  const [transactionId, setTransactionId] = useState("");
  const [contact, setContact] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const variant = product.variants.find((item) => item.id === variantId) || product.variants[0];
  const method = data.paymentMethods.find((item) => item.id === methodId) || data.paymentMethods[0];
  const totalUsd = Number((Number(variant?.priceUsd || 0) * Math.max(1, Number(quantity || 1))).toFixed(2));
  const rate = method?.currency === "USD" ? 1 : Number(data.settings.currencyRates?.[method?.rateKey] || 1);
  const local = method?.currency === "USD" ? totalUsd : Math.round(totalUsd * rate);

  useEffect(() => {
    if (user?.email && !contact) setContact(user.email);
    if (user && step === 2) setStep(3);
  }, [user, step, contact]);

  async function placeOrder() {
    if (!user) {
      setStep(2);
      return;
    }
    if (!transactionId.trim()) {
      setMessage("Transaction ID required.");
      return;
    }
    setMessage("Submitting...");
    const payload = await api("/api/orders", {
      method: "POST",
      body: { productId: product.id, variantId, quantity, paymentMethodId: methodId, transactionId, contact }
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
              label: `${item.name} - ${money(item.priceUsd)} - ${durationText(item)} - ${item.stockCount || 0} in stock`
            }))} />
            <Field label="Quantity" type="number" value={quantity} onChange={setQuantity} />
            <div className="selected-box">
              <div><strong>{variant?.name}</strong><span>{durationText(variant)} / {variant?.stockCount || 0} in stock</span></div>
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
                <span>{methodIcon(item)}</span>
                <div><strong>{item.name}</strong><small>Pay with {item.currency}</small></div>
                <b>›</b>
              </button>
            ))}
          </div>
          <div className="selected-box">
            <span>Total amount</span>
            <b>{method?.currency === "USD" ? money(totalUsd) : money(local, method?.currency)}</b>
          </div>
          <div className="payment-note">
            <strong>{method?.name}</strong><br />
            Account: {method?.account || "Not set"}<br />
            {method?.instructions}<br />
            {method?.currency === "USD" ? "USD amount is fixed." : `Rate: ${rate} ${method?.currency}/USD`}
          </div>
          <Field label="Transaction ID / Reference" value={transactionId} onChange={setTransactionId} />
          <Field label="Contact" value={contact} onChange={setContact} />
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
          <Field label="Password" type="password" value={login.password} onChange={(password) => setLogin({ ...login, password })} />
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
      {tab === "orders" && <OrdersAdmin api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} />}
      {tab === "users" && <UsersAdmin api={api} dashboard={dashboard} setDashboard={setDashboard} setNotice={setNotice} />}
      {tab === "security" && <SecurityAdmin api={api} dashboard={dashboard} setNotice={setNotice} />}
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
        <Field label="Logo URL/data" value={settings.logoUrl} onChange={(logoUrl) => setSettings({ ...settings, logoUrl })} />
        <Field label="Background image" value={settings.backgroundImage} onChange={(backgroundImage) => setSettings({ ...settings, backgroundImage })} />
        <Field label="Hero title" value={settings.heroTitle} onChange={(heroTitle) => setSettings({ ...settings, heroTitle })} />
        <Field label="Hero interval seconds" type="number" value={settings.heroIntervalSeconds} onChange={(heroIntervalSeconds) => setSettings({ ...settings, heroIntervalSeconds: Number(heroIntervalSeconds) })} />
        <Field label="BDT per USD" type="number" value={settings.currencyRates?.BDT} onChange={(BDT) => setSettings({ ...settings, currencyRates: { ...settings.currencyRates, BDT: Number(BDT) } })} />
        <Field label="INR per USD" type="number" value={settings.currencyRates?.INR} onChange={(INR) => setSettings({ ...settings, currencyRates: { ...settings.currencyRates, INR: Number(INR) } })} />
        <Field label="WhatsApp help" value={settings.supportWhatsApp} onChange={(supportWhatsApp) => setSettings({ ...settings, supportWhatsApp })} />
        <Field label="Telegram help" value={settings.supportTelegram} onChange={(supportTelegram) => setSettings({ ...settings, supportTelegram })} />
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
          <Field label="Image URL/data" value={slide.image} onChange={(image) => setSettings({ ...settings, heroSlides: slides.map((item, i) => i === index ? { ...item, image } : item) })} />
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
      <button className="secondary-action mb-4" type="button" onClick={() => setMethods([...methods, { id: `method-${Date.now()}`, name: "New Method", currency: "USD", rateKey: "USD", account: "", instructions: "", enabled: true }])}>Add payment method</button>
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
        <Field label="Image URL/data" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
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
  const variantsText = (draft.variants || []).map((item) => `${item.name}|${item.priceUsd}|${item.durationDays || 0}|${item.description || ""}`).join("\n");
  return (
    <div className="nested-card">
      <div className="flex items-center justify-between gap-3"><h3 className="font-black">{product.name}</h3><span className="panel-chip">{product.panelName}</span></div>
      <div className="form-grid">
        <FieldSelect label="Section" value={draft.sectionId} onChange={(sectionId) => setDraft({ ...draft, sectionId })} options={dashboard.sections.map((section) => ({ value: section.id, label: section.title }))} />
        <Field label="Name" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
        <Field label="Panel name" value={draft.panelName} onChange={(panelName) => setDraft({ ...draft, panelName })} />
        <Field label="Badge" value={draft.badge} onChange={(badge) => setDraft({ ...draft, badge })} />
        <Field label="Image URL/data" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
        <Field label="YouTube demo URL" value={draft.demoVideoUrl} onChange={(demoVideoUrl) => setDraft({ ...draft, demoVideoUrl })} />
      </div>
      <TextArea label="Short description" value={draft.shortDescription} onChange={(shortDescription) => setDraft({ ...draft, shortDescription })} />
      <TextArea label="Features, one per line" value={(draft.features || []).join("\n")} onChange={(value) => setDraft({ ...draft, features: value.split("\n").map((line) => line.trim()).filter(Boolean) })} />
      <TextArea label="Variants: name|priceUsd|durationDays|description" value={variantsText} onChange={(value) => setDraft({ ...draft, variants: value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => { const [name, priceUsd, durationDays, ...description] = line.split("|"); return { name, priceUsd: Number(priceUsd || 0), durationDays: Number(durationDays || 0), description: description.join("|") }; }) })} />
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

function OrdersAdmin({ api, dashboard, setDashboard, setNotice }) {
  const [selected, setSelected] = useState([]);
  async function saveOrder(order, status) {
    const payload = await api(`/api/admin/orders/${order.id}`, { method: "PUT", body: { status, adminNote: order.adminNote || "" } });
    setDashboard({ ...dashboard, orders: dashboard.orders.map((item) => item.id === order.id ? payload.order : item) });
    setNotice("Order updated.");
  }
  return (
    <AdminCard title="Orders" action="Delete Selected" onAction={async () => {
      const payload = await api("/api/admin/orders/delete-bulk", { method: "POST", body: { ids: selected } });
      setDashboard({ ...dashboard, orders: dashboard.orders.filter((item) => !selected.includes(item.id)) });
      setSelected([]);
      setNotice(`${payload.deleted} orders deleted.`);
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

function SecurityAdmin({ api, dashboard, setNotice }) {
  const [newPassword, setNewPassword] = useState("");
  return (
    <AdminCard title="Security" action="Change Password" onAction={async () => {
      await api("/api/admin/password", { method: "PUT", body: { newPassword } });
      setNewPassword("");
      setNotice("Admin password changed.");
    }}>
      <p className="mb-4 text-slate-400">Default admin: {dashboard.defaultCredentials.adminEmail} / {dashboard.defaultCredentials.adminPassword}</p>
      <Field label="New admin password" type="password" value={newPassword} onChange={setNewPassword} />
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
    <div className="fixed bottom-5 right-5 z-40">
      {open && <div className="mb-3 grid overflow-hidden rounded-lg border border-white/10 bg-panel shadow-deep"><a className="px-4 py-3" href={settings.supportWhatsApp || "#"} target="_blank" rel="noreferrer">WhatsApp</a><a className="px-4 py-3" href={settings.supportTelegram || "#"} target="_blank" rel="noreferrer">Telegram</a></div>}
      <button className="help-button" type="button" onClick={() => setOpen(!open)}>Help</button>
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
