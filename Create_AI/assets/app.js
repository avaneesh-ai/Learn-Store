const SESSION_KEY = "learnStore:session";
const PENDING_LOGIN_KEY = "learnStore:pendingLogin";
const SHARED_APPS_KEY = "learnStore:sharedApps";
const CATALOG_RESET_KEY = "learnStore:catalogCleared:v1";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const PENDING_LOGIN_TTL_MS = 10 * 60 * 1000;
const MAX_UPLOAD_BYTES = 800 * 1024;
const HELP_CHAT_LIMIT = 40;

const categoryColors = {
  ai: ["#b5512f", "#7c5cff"],
  learning: ["#9a4226", "#e0902f"],
  robotics: ["#7c5cff", "#2bbfae"],
  sports: ["#2bbfae", "#e0902f"],
  tools: ["#b5512f", "#2bbfae"],
};

const state = {
  user: null,
  pendingLogin: {
    email: "",
    name: "",
    mobile: "",
    token: "",
    expiresAt: 0,
  },
  filter: "all",
  search: "",
  installed: [],
  uploaded: [],
  sharedApps: [],
  helpMessages: [],
  currentHtml: "",
  currentBlobUrl: "",
  deferredInstallPrompt: null,
};

const elements = {
  flowField: document.querySelector("#flow-field"),
  authShell: document.querySelector("#auth-shell"),
  appShell: document.querySelector("#app-shell"),
  accountForm: document.querySelector("#account-form"),
  profileForm: document.querySelector("#profile-form"),
  sentScreen: document.querySelector("#sent-screen"),
  confirmScreen: document.querySelector("#confirm-screen"),
  authScreens: document.querySelectorAll(".auth-screen"),
  stepDots: {
    account: document.querySelector('[data-step-dot="account"]'),
    profile: document.querySelector('[data-step-dot="profile"]'),
    verify: document.querySelector('[data-step-dot="verify"]'),
  },
  loginName: document.querySelector("#login-name"),
  loginMobile: document.querySelector("#login-mobile"),
  loginEmail: document.querySelector("#login-email"),
  loginPassword: document.querySelector("#login-password"),
  togglePassword: document.querySelector("#toggle-password"),
  loginErrors: {
    name: document.querySelector("#login-name-error"),
    mobile: document.querySelector("#login-mobile-error"),
    email: document.querySelector("#login-email-error"),
    password: document.querySelector("#login-password-error"),
  },
  backToAccount: document.querySelector("#back-to-account"),
  editProfile: document.querySelector("#edit-profile"),
  mailTo: document.querySelector("#mail-to"),
  verificationLink: document.querySelector("#verification-link"),
  confirmEmail: document.querySelector("#confirm-email"),
  enterApp: document.querySelector("#enter-app"),
  sidebarName: document.querySelector("#sidebar-name"),
  sidebarEmail: document.querySelector("#sidebar-email"),
  welcomeTitle: document.querySelector("#welcome-title"),
  logout: document.querySelector("#logout"),
  search: document.querySelector("#app-search"),
  filterButtons: document.querySelectorAll("[data-filter]"),
  navButtons: document.querySelectorAll("[data-section]"),
  sections: document.querySelectorAll(".app-section"),
  officialList: document.querySelector("#official-app-list"),
  uploadedList: document.querySelector("#uploaded-app-list"),
  uploadedHeading: document.querySelector("#community-heading"),
  installedList: document.querySelector("#installed-app-list"),
  installedEmpty: document.querySelector("#installed-empty"),
  uploadForm: document.querySelector("#upload-form"),
  uploadName: document.querySelector("#upload-name"),
  uploadCategory: document.querySelector("#upload-category"),
  uploadDescription: document.querySelector("#upload-description"),
  uploadLink: document.querySelector("#upload-link"),
  uploadFile: document.querySelector("#upload-file"),
  uploadErrors: {
    name: document.querySelector("#upload-name-error"),
    description: document.querySelector("#upload-description-error"),
    link: document.querySelector("#upload-link-error"),
    file: document.querySelector("#upload-file-error"),
  },
  myUploadList: document.querySelector("#my-upload-list"),
  uploadEmpty: document.querySelector("#upload-empty"),
  agentForm: document.querySelector("#agent-form"),
  agentInput: document.querySelector("#agent-input"),
  agentMessages: document.querySelector("#agent-messages"),
  agentAppSelect: document.querySelector("#agent-app-select"),
  officialCount: document.querySelector("#official-count"),
  installedCount: document.querySelector("#installed-count"),
  uploadCount: document.querySelector("#upload-count"),
  settingsSession: document.querySelector("#settings-session"),
  clearLocalData: document.querySelector("#clear-local-data"),
  installStore: document.querySelector("#install-store"),
  installModal: document.querySelector("#install-modal"),
  closeInstallModal: document.querySelector("#close-install-modal"),
  appModal: document.querySelector("#app-modal"),
  closeAppModal: document.querySelector("#close-app-modal"),
  modalAppIcon: document.querySelector("#modal-app-icon"),
  modalAppCategory: document.querySelector("#modal-app-category"),
  modalAppTitle: document.querySelector("#modal-app-title"),
  appFrame: document.querySelector("#app-frame"),
  openExternalApp: document.querySelector("#open-external-app"),
  downloadOpenApp: document.querySelector("#download-open-app"),
};

const starterApps = [];

function cleanText(value, maxLength = 1000) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  const slug = cleanText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "uploaded-app";
}

function getInitials(name) {
  const cleaned = cleanText(name, 80).replace(/[_-]+/g, " ");
  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function getCategoryLabel(category) {
  const labels = {
    ai: "AI",
    learning: "Learning",
    robotics: "Robotics",
    sports: "Sports",
    tools: "Tools",
  };

  return labels[category] || "App";
}

function getAppColors(app) {
  return app.colors || categoryColors[app.category] || categoryColors.tools;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidMobile(value) {
  return /^[0-9+\-\s()]{7,16}$/.test(value);
}

function createToken() {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getBaseUrl() {
  return window.location.href.split("#")[0];
}

function showAuthScreen(name) {
  const screenMap = {
    account: elements.accountForm,
    profile: elements.profileForm,
    sent: elements.sentScreen,
    confirm: elements.confirmScreen,
  };

  elements.authScreens.forEach((screen) => {
    screen.classList.toggle("active", screen === screenMap[name]);
  });

  elements.stepDots.account.classList.toggle("active", name === "account");
  elements.stepDots.account.classList.toggle("done", name !== "account");
  elements.stepDots.profile.classList.toggle("active", name === "profile");
  elements.stepDots.profile.classList.toggle("done", name === "sent" || name === "confirm");
  elements.stepDots.verify.classList.toggle("active", name === "sent" || name === "confirm");
  elements.stepDots.verify.classList.toggle("done", name === "confirm");
}

function savePendingLogin() {
  localStorage.setItem(PENDING_LOGIN_KEY, JSON.stringify(state.pendingLogin));
}

function loadPendingLogin() {
  const saved = localStorage.getItem(PENDING_LOGIN_KEY);

  if (!saved) {
    return false;
  }

  try {
    const pending = JSON.parse(saved);

    if (!pending.expiresAt || Date.now() > pending.expiresAt || !pending.email || !pending.token) {
      localStorage.removeItem(PENDING_LOGIN_KEY);
      return false;
    }

    state.pendingLogin = pending;
    return true;
  } catch {
    localStorage.removeItem(PENDING_LOGIN_KEY);
    return false;
  }
}

function sendLoginLink() {
  state.pendingLogin.token = createToken();
  state.pendingLogin.expiresAt = Date.now() + PENDING_LOGIN_TTL_MS;
  savePendingLogin();

  const link = `${getBaseUrl()}#verify=${encodeURIComponent(state.pendingLogin.token)}`;
  elements.mailTo.textContent = `To: ${state.pendingLogin.email}`;
  elements.verificationLink.href = link;
}

function resetAuthFlow() {
  state.pendingLogin = {
    email: "",
    name: "",
    mobile: "",
    token: "",
    expiresAt: 0,
  };
  elements.loginPassword.value = "";
  showAuthScreen("account");
}

function handleVerificationRoute() {
  if (!window.location.hash.startsWith("#verify=")) {
    return false;
  }

  const token = decodeURIComponent(window.location.hash.replace("#verify=", ""));

  if (!loadPendingLogin() || token !== state.pendingLogin.token) {
    resetAuthFlow();
    setError(elements.loginErrors.email, "Login link expired. Please start again.");
    return true;
  }

  elements.confirmEmail.textContent = state.pendingLogin.email;
  showAuthScreen("confirm");
  return true;
}

function finishVerifiedLogin() {
  const user = {
    email: state.pendingLogin.email,
    name: state.pendingLogin.name,
    mobile: state.pendingLogin.mobile,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  localStorage.removeItem(PENDING_LOGIN_KEY);
  window.location.hash = "";
  enterApp(user);
}

function getUserKey(prefix) {
  const email = state.user?.email || "guest";
  return `learnStore:${prefix}:${email.toLowerCase()}`;
}

function readJson(key, fallback) {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(saved);
    return parsed ?? fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSafeAppLink(value) {
  const link = cleanText(value, 500);

  if (!link) {
    return "";
  }

  try {
    const url = new URL(link);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {
    return "";
  }

  return "";
}

function normalizeStoredApp(app) {
  if (!app || typeof app !== "object") {
    return null;
  }

  const name = cleanText(app.name, 90);
  const link = getSafeAppLink(app.link);
  const category = categoryColors[app.category] ? app.category : "tools";

  if (!name || !link) {
    return null;
  }

  return {
    id: cleanText(app.id, 160) || `shared-${Date.now()}-${slugify(name)}`,
    name,
    category,
    source: "Uploaded",
    rating: cleanText(app.rating, 16) || "New",
    size: cleanText(app.size, 24) || "Link",
    description: cleanText(app.description, 220) || `Open ${name} from its published app URL.`,
    link,
    html: cleanText(app.html, MAX_UPLOAD_BYTES),
    colors: Array.isArray(app.colors) ? app.colors.slice(0, 2).map((color) => cleanText(color, 20)) : categoryColors[category],
    publisherName: cleanText(app.publisherName, 80) || "Learn_Store user",
    publisherEmail: cleanText(app.publisherEmail, 254).toLowerCase(),
    installs: Math.max(0, Math.min(Number(app.installs) || 0, 999999)),
    uploadedAt: cleanText(app.uploadedAt, 40) || new Date().toISOString(),
  };
}

function getStoredSession() {
  const saved = sessionStorage.getItem(SESSION_KEY);

  if (!saved) {
    return null;
  }

  try {
    const user = JSON.parse(saved);

    if (!user.expiresAt || Date.now() > user.expiresAt || !user.email || !user.name) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return user;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    expiresAt: Date.now() + SESSION_TTL_MS,
  }));
}

function clearExistingCatalogOnce() {
  if (localStorage.getItem(CATALOG_RESET_KEY) === "done") {
    return;
  }

  Object.keys(localStorage).forEach((key) => {
    if (key === SHARED_APPS_KEY || key.startsWith("learnStore:uploaded:") || key.startsWith("learnStore:installed:")) {
      localStorage.removeItem(key);
    }
  });
  localStorage.setItem(CATALOG_RESET_KEY, "done");
}

function loadSharedStore() {
  clearExistingCatalogOnce();
  const shared = readJson(SHARED_APPS_KEY, []);
  state.sharedApps = Array.isArray(shared) ? shared.map(normalizeStoredApp).filter(Boolean) : [];
  saveSharedApps();
}

function loadUserStore() {
  loadSharedStore();
  state.installed = readJson(getUserKey("installed"), []);
  state.uploaded = readJson(getUserKey("uploaded"), []);

  if (!Array.isArray(state.installed)) {
    state.installed = [];
  }

  if (!Array.isArray(state.uploaded)) {
    state.uploaded = [];
  }

  state.uploaded = state.uploaded.map(normalizeStoredApp).filter(Boolean);

  state.uploaded.forEach((app) => {
    if (!state.sharedApps.some((sharedApp) => sharedApp.id === app.id)) {
      state.sharedApps.unshift(app);
    }
  });

  saveUploaded();
  saveSharedApps();
}

function saveInstalled() {
  writeJson(getUserKey("installed"), state.installed);
}

function saveUploaded() {
  writeJson(getUserKey("uploaded"), state.uploaded);
}

function saveSharedApps() {
  writeJson(SHARED_APPS_KEY, state.sharedApps);
}

function getAllApps() {
  return [...starterApps, ...state.sharedApps];
}

function findApp(id) {
  return getAllApps().find((app) => app.id === id) || null;
}

function isInstalled(id) {
  return state.installed.includes(id);
}

function setError(target, message) {
  if (target) {
    target.textContent = message;
  }
}

function clearLoginErrors() {
  Object.values(elements.loginErrors).forEach((error) => setError(error, ""));
}

function clearUploadErrors() {
  Object.values(elements.uploadErrors).forEach((error) => setError(error, ""));
}

function showSection(name) {
  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === name);
  });

  elements.sections.forEach((section) => {
    section.classList.toggle("active", section.id === `section-${name}`);
  });
}

function updateAccountUi() {
  const firstName = state.user.name.split(/\s+/)[0] || state.user.name;
  const minutesLeft = Math.max(1, Math.ceil((state.user.expiresAt - Date.now()) / 60000));

  elements.sidebarName.textContent = state.user.name;
  elements.sidebarEmail.textContent = state.user.email;
  elements.welcomeTitle.textContent = `Hi, ${firstName}`;
  elements.settingsSession.textContent = `Active for ${minutesLeft} min`;
}

function enterApp(user) {
  state.user = user;
  saveSession(user);
  loadUserStore();
  elements.authShell.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  updateAccountUi();
  renderAll();
  renderAgentMessages();
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  state.user = null;
  state.installed = [];
  state.uploaded = [];
  elements.loginPassword.value = "";
  elements.appShell.classList.add("hidden");
  elements.authShell.classList.remove("hidden");
  resetAuthFlow();
  closeAppModal();
}

function renderAll() {
  renderCounts();
  renderCatalog();
  renderInstalled();
  renderUploads();
  renderAgentAppOptions();
}

function renderCounts() {
  elements.officialCount.textContent = String(starterApps.length);
  elements.installedCount.textContent = String(state.installed.filter((id) => findApp(id)).length);
  elements.uploadCount.textContent = String(state.uploaded.length);
}

function appMatchesFilter(app) {
  const matchesFilter = state.filter === "all" || app.category === state.filter;
  const haystack = `${app.name} ${app.category} ${app.description} ${app.source || ""}`.toLowerCase();
  const matchesSearch = !state.search || haystack.includes(state.search.toLowerCase());
  return matchesFilter && matchesSearch;
}

function createAppCard(app, context = "store") {
  const card = document.createElement("article");
  const [iconColor, iconAccent] = getAppColors(app);
  const installed = isInstalled(app.id);
  const category = getCategoryLabel(app.category);
  const installLabel = installed ? "Installed" : "Install";
  const openLabel = installed || context === "installed" ? "Open" : "Preview";
  const canRemoveUpload = app.source === "Uploaded" && app.publisherEmail === state.user?.email;
  const publisher = app.source === "Uploaded" ? app.publisherName || "Learn_Store user" : app.source || "Official";
  const installs = Number(app.installs) || 0;

  card.className = "app-card";
  card.style.setProperty("--icon-color", iconColor);
  card.style.setProperty("--icon-accent", iconAccent);
  card.innerHTML = `
    <div class="app-card-top">
      <div class="app-icon" aria-hidden="true">${escapeHtml(getInitials(app.name))}</div>
      <div>
        <h4>${escapeHtml(app.name)}</h4>
        <div class="app-meta">
          <span>${escapeHtml(category)}</span>
          <span>${escapeHtml(app.rating || "New")}</span>
          <span>${escapeHtml(app.size || "Local")}</span>
          ${app.source === "Uploaded" ? `<span>${escapeHtml(installs)} installs</span>` : ""}
        </div>
      </div>
    </div>
    <p>${escapeHtml(app.description)}</p>
    <span class="publisher-line">By ${escapeHtml(publisher)}</span>
    <div class="app-actions">
      ${context === "installed" ? "" : `<button class="primary-button compact" type="button" data-action="install" data-app-id="${escapeHtml(app.id)}" ${installed ? "disabled" : ""}>${installLabel}</button>`}
      <button class="secondary-button compact" type="button" data-action="open" data-app-id="${escapeHtml(app.id)}">${openLabel}</button>
      ${installed ? `<button class="secondary-button compact remove-button" type="button" data-action="uninstall" data-app-id="${escapeHtml(app.id)}">Uninstall</button>` : ""}
      ${canRemoveUpload ? `<button class="secondary-button compact remove-button" type="button" data-action="delete-upload" data-app-id="${escapeHtml(app.id)}">Delete</button>` : ""}
    </div>
  `;

  return card;
}

function renderCatalog() {
  const officialApps = starterApps.filter(appMatchesFilter);
  const uploadedApps = state.sharedApps.filter(appMatchesFilter);

  if (officialApps.length > 0) {
    elements.officialList.replaceChildren(...officialApps.map((app) => createAppCard(app)));
  } else {
    elements.officialList.replaceChildren(createEmptyStoreCard());
  }
  elements.uploadedList.replaceChildren(...uploadedApps.map((app) => createAppCard(app)));

  const showUploaded = state.sharedApps.length > 0;
  elements.uploadedHeading.classList.toggle("hidden", !showUploaded);
  elements.uploadedList.classList.toggle("hidden", !showUploaded);
}

function createEmptyStoreCard() {
  const card = document.createElement("article");
  card.className = "empty-state";
  card.innerHTML = "<strong>No apps yet</strong><span>Publish your first app from the Upload section.</span>";
  return card;
}

function renderInstalled() {
  const installedApps = state.installed.map(findApp).filter(Boolean);

  elements.installedList.replaceChildren(...installedApps.map((app) => createAppCard(app, "installed")));
  elements.installedEmpty.classList.toggle("hidden", installedApps.length > 0);
}

function renderUploads() {
  elements.myUploadList.replaceChildren();

  state.uploaded.forEach((app) => {
    const row = document.createElement("article");
    row.className = "upload-row";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(app.name)}</strong>
        <span>${escapeHtml(getCategoryLabel(app.category))} · ${escapeHtml(app.size || "Local")}</span>
      </div>
      <button class="secondary-button compact remove-button" type="button" data-action="delete-upload" data-app-id="${escapeHtml(app.id)}">Delete</button>
    `;
    elements.myUploadList.append(row);
  });

  elements.uploadEmpty.classList.toggle("hidden", state.uploaded.length > 0);
}

function installApp(id) {
  if (!isInstalled(id) && findApp(id)) {
    state.installed.push(id);
    const sharedApp = state.sharedApps.find((app) => app.id === id);

    if (sharedApp) {
      sharedApp.installs = (Number(sharedApp.installs) || 0) + 1;
      saveSharedApps();
    }

    saveInstalled();
    renderAll();
  }
}

function uninstallApp(id) {
  state.installed = state.installed.filter((installedId) => installedId !== id);
  saveInstalled();
  renderAll();
}

function deleteUploadedApp(id) {
  const app = findApp(id);

  if (!app || app.source !== "Uploaded" || app.publisherEmail !== state.user?.email) {
    return;
  }

  state.uploaded = state.uploaded.filter((uploadedApp) => uploadedApp.id !== id);
  state.sharedApps = state.sharedApps.filter((uploadedApp) => uploadedApp.id !== id);
  state.installed = state.installed.filter((installedId) => installedId !== id);
  saveUploaded();
  saveSharedApps();
  saveInstalled();
  renderAll();
}

function closeAppModal() {
  elements.appModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  elements.appFrame.removeAttribute("src");
  elements.appFrame.removeAttribute("srcdoc");
  state.currentHtml = "";

  if (state.currentBlobUrl) {
    URL.revokeObjectURL(state.currentBlobUrl);
    state.currentBlobUrl = "";
  }
}

function openApp(app) {
  const [iconColor, iconAccent] = getAppColors(app);
  const category = getCategoryLabel(app.category);
  let html = "";

  if (typeof app.html === "function") {
    html = app.html();
  } else if (app.html) {
    html = app.html;
  }

  elements.modalAppIcon.style.setProperty("--icon-color", iconColor);
  elements.modalAppIcon.style.setProperty("--icon-accent", iconAccent);
  elements.modalAppIcon.textContent = getInitials(app.name);
  elements.modalAppCategory.textContent = category;
  elements.modalAppTitle.textContent = app.name;

  if (state.currentBlobUrl) {
    URL.revokeObjectURL(state.currentBlobUrl);
    state.currentBlobUrl = "";
  }

  state.currentHtml = html;

  if (html) {
    const blob = new Blob([html], { type: "text/html" });
    state.currentBlobUrl = URL.createObjectURL(blob);
    elements.appFrame.srcdoc = html;
    elements.openExternalApp.href = state.currentBlobUrl;
    elements.downloadOpenApp.classList.remove("hidden");
  } else {
    const safeLink = getSafeAppLink(app.link) || "#";
    elements.appFrame.srcdoc = createExternalLinkPreview(app, safeLink);
    elements.openExternalApp.href = safeLink;
    elements.downloadOpenApp.classList.add("hidden");
  }

  elements.appModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function handleAppAction(event) {
  const button = event.target.closest("[data-action][data-app-id]");

  if (!button) {
    return;
  }

  const id = button.dataset.appId;
  const action = button.dataset.action;
  const app = findApp(id);

  if (!app) {
    return;
  }

  if (action === "install") {
    installApp(id);
  } else if (action === "uninstall") {
    uninstallApp(id);
  } else if (action === "delete-upload") {
    deleteUploadedApp(id);
  } else if (action === "open") {
    openApp(app);
  }
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsText(file);
  });
}

function getReadableSize(bytes) {
  if (!bytes) {
    return "Link";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

function isValidAppLink(value) {
  return Boolean(getSafeAppLink(value));
}

async function handleUpload(event) {
  event.preventDefault();
  clearUploadErrors();

  const name = cleanText(elements.uploadName.value, 90);
  const category = elements.uploadCategory.value;
  const description = cleanText(elements.uploadDescription.value, 220);
  const link = cleanText(elements.uploadLink.value, 500);
  const file = elements.uploadFile.files?.[0] || null;
  let valid = true;

  if (name.length < 2) {
    setError(elements.uploadErrors.name, "Enter an app name.");
    valid = false;
  }

  if (!link) {
    setError(elements.uploadErrors.link, "Add the app URL.");
    valid = false;
  }

  if (link && !isValidAppLink(link)) {
    setError(elements.uploadErrors.link, "Use a valid http or https link.");
    valid = false;
  }

  if (file && file.size > MAX_UPLOAD_BYTES) {
    setError(elements.uploadErrors.file, "Use an HTML file smaller than 800 KB.");
    valid = false;
  }

  if (!valid) {
    return;
  }

  let html = "";

  if (file) {
    html = await readFileText(file);
  }

  const colors = categoryColors[category] || categoryColors.tools;
  const uploadedApp = {
    id: `user-${Date.now()}-${slugify(name)}`,
    name,
    category,
    source: "Uploaded",
    rating: "New",
    size: file ? getReadableSize(file.size) : "Link",
    description: description || `Open ${name} from its published app URL.`,
    link: getSafeAppLink(link),
    html,
    colors,
    publisherName: state.user?.name || "Learn_Store user",
    publisherEmail: state.user?.email || "",
    installs: 0,
    uploadedAt: new Date().toISOString(),
  };

  state.uploaded.unshift(uploadedApp);
  state.sharedApps.unshift(uploadedApp);
  saveUploaded();
  saveSharedApps();
  elements.uploadForm.reset();
  renderAll();
}

function handleAccountStep(event) {
  event.preventDefault();
  clearLoginErrors();

  const email = cleanText(elements.loginEmail.value, 254).toLowerCase();
  const password = elements.loginPassword.value || "";
  let valid = true;

  if (!isValidEmail(email)) {
    setError(elements.loginErrors.email, "Enter a valid email id.");
    valid = false;
  }

  if (password.length < 6) {
    setError(elements.loginErrors.password, "Use at least 6 characters.");
    valid = false;
  }

  if (!valid) {
    return;
  }

  state.pendingLogin.email = email;
  elements.loginPassword.value = "";
  showAuthScreen("profile");
  elements.loginName.focus();
}

function handleProfileStep(event) {
  event.preventDefault();
  clearLoginErrors();

  const name = cleanText(elements.loginName.value, 80);
  const mobile = cleanText(elements.loginMobile.value, 20);
  let valid = true;

  if (name.length < 2) {
    setError(elements.loginErrors.name, "Enter your name.");
    valid = false;
  }

  if (!isValidMobile(mobile)) {
    setError(elements.loginErrors.mobile, "Enter a valid mobile number.");
    valid = false;
  }

  if (!state.pendingLogin.email) {
    showAuthScreen("account");
    setError(elements.loginErrors.email, "Enter your email id first.");
    return;
  }

  if (!valid) {
    return;
  }

  state.pendingLogin.name = name;
  state.pendingLogin.mobile = mobile;
  sendLoginLink();
  showAuthScreen("sent");
}

function clearLocalData() {
  if (!state.user) {
    return;
  }

  const confirmed = window.confirm("Clear installed apps and uploads for this account?");

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(getUserKey("installed"));
  localStorage.removeItem(getUserKey("uploaded"));
  state.installed = [];
  state.uploaded = [];
  renderAll();
}

function downloadCurrentHtml() {
  if (!state.currentHtml) {
    return;
  }

  const fileName = `${slugify(elements.modalAppTitle.textContent)}.html`;
  const blob = new Blob([state.currentHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function openInstallModal() {
  elements.installModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeInstallModal() {
  elements.installModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

async function installStore() {
  if (state.deferredInstallPrompt) {
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice.catch(() => null);
    state.deferredInstallPrompt = null;
    return;
  }

  openInstallModal();
}

function createMiniAppShell(title, accent, content, script) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#16201e;background:#f5f7f3}main{min-height:100vh;display:grid;grid-template-columns:minmax(280px,420px) 1fr;gap:14px;padding:16px}.panel,.stage{border:1px solid rgba(22,32,30,.12);border-radius:8px;background:#fff;box-shadow:0 12px 32px rgba(20,38,34,.08);padding:18px}h1{font-size:2rem;line-height:1;margin:0 0 10px}h2{font-size:1.25rem;margin:0 0 10px}p{color:#5c6c68;line-height:1.5}label{display:block;margin:12px 0 6px;font-size:.82rem;font-weight:800;color:#263835}input,textarea,select{width:100%;border:1px solid rgba(22,32,30,.14);border-radius:8px;padding:12px;font:inherit}button{min-height:42px;border:0;border-radius:8px;padding:0 14px;font:inherit;font-weight:850;cursor:pointer;color:#fff;background:${accent}}.ghost{color:#16201e;background:#eef2ee}.stack{display:grid;gap:10px}.row{display:flex;flex-wrap:wrap;gap:8px}.card{border:1px solid rgba(22,32,30,.12);border-radius:8px;background:#f8faf7;padding:14px}.meter{height:10px;border-radius:999px;background:#e5ebe7;overflow:hidden}.meter span{display:block;height:100%;width:0;background:${accent};transition:width .2s}.pill{display:inline-flex;min-height:28px;align-items:center;padding:0 9px;border-radius:8px;background:#eef2ee;color:#50605c;font-size:.78rem;font-weight:800}@media(max-width:760px){main{grid-template-columns:1fr;padding:10px}h1{font-size:1.55rem}}
</style>
</head>
<body>
${content}
<script>
${script}
</script>
</body>
</html>`;
}

function createExternalLinkPreview(app, link) {
  return createMiniAppShell(
    app.name,
    getAppColors(app)[0],
    `<main>
  <section class="panel">
    <span class="pill">${escapeHtml(getCategoryLabel(app.category))}</span>
    <h1>${escapeHtml(app.name)}</h1>
    <p>${escapeHtml(app.description)}</p>
    <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"><button type="button">Open App Link</button></a>
  </section>
  <section class="stage">
    <h2>App link</h2>
    <div class="card"><p>${escapeHtml(link)}</p></div>
  </section>
</main>`,
    ""
  );
}

function createAgentWelcome() {
  return {
    role: "assistant",
    text: "Ask me about any app in Learn_Store. I can explain what it does, how to install it, who published it, and where it opens.",
  };
}

function renderAgentAppOptions() {
  if (!elements.agentAppSelect) {
    return;
  }

  const currentValue = elements.agentAppSelect.value;
  elements.agentAppSelect.replaceChildren();

  const autoOption = document.createElement("option");
  autoOption.value = "auto";
  autoOption.textContent = "Auto-detect app";
  elements.agentAppSelect.append(autoOption);

  getAllApps().forEach((app) => {
    const option = document.createElement("option");
    option.value = app.id;
    option.textContent = app.name;
    elements.agentAppSelect.append(option);
  });

  if ([...elements.agentAppSelect.options].some((option) => option.value === currentValue)) {
    elements.agentAppSelect.value = currentValue;
  }
}

function renderAgentMessages() {
  if (!elements.agentMessages) {
    return;
  }

  elements.agentMessages.replaceChildren();

  if (state.helpMessages.length === 0) {
    state.helpMessages = [createAgentWelcome()];
  }

  state.helpMessages.forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `agent-message ${message.role}`;
    bubble.textContent = message.text;
    elements.agentMessages.append(bubble);
  });

  elements.agentMessages.scrollTop = elements.agentMessages.scrollHeight;
}

function addAgentMessage(role, text) {
  state.helpMessages.push({ role, text: cleanText(text, 1600) });
  state.helpMessages = state.helpMessages.slice(-HELP_CHAT_LIMIT);
  renderAgentMessages();
}

function findAppForQuestion(question) {
  const selectedId = elements.agentAppSelect?.value;

  if (selectedId && selectedId !== "auto") {
    return findApp(selectedId);
  }

  const lower = question.toLowerCase();
  return getAllApps().find((app) => lower.includes(app.name.toLowerCase())) || null;
}

function describeApp(app) {
  if (!app) {
    return "I could not match a specific app yet. Publish an app first, then ask with its app name.";
  }

  const lines = [
    `${app.name} is a ${getCategoryLabel(app.category)} app in Learn_Store.`,
    app.description,
    `Publisher: ${app.source === "Uploaded" ? app.publisherName || "Learn_Store user" : "Official"}.`,
  ];

  if (app.link) {
    lines.push(`App URL: ${getSafeAppLink(app.link) || "Blocked unsafe URL"}.`);
  }

  if (app.source === "Uploaded") {
    lines.push(`Install count: ${Number(app.installs) || 0}.`);
  }

  return lines.join("\n");
}

function buildLocalAgentReply(question, app) {
  const lower = question.toLowerCase();

  if (!app) {
    return describeApp(null);
  }

  if (lower.includes("install")) {
    return `${app.name} can be installed from the Store card. Click Install once, then it appears in the Installed section where you can open or uninstall it.`;
  }

  if (lower.includes("publisher") || lower.includes("who made") || lower.includes("owner")) {
    return `${app.name} was published by ${app.source === "Uploaded" ? app.publisherName || "Learn_Store user" : "Official"}.`;
  }

  if (lower.includes("link") || lower.includes("url") || lower.includes("open")) {
    const link = getSafeAppLink(app.link);
    return link ? `${app.name} opens from this safe URL: ${link}` : `${app.name} opens inside Learn_Store as a built-in app.`;
  }

  if (lower.includes("count") || lower.includes("many")) {
    return `${app.name} has ${Number(app.installs) || 0} recorded installs in this local Learn_Store catalog.`;
  }

  return describeApp(app);
}

async function callHelpBackend(question, app) {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      app: app ? {
        name: app.name,
        category: app.category,
        description: app.description,
        link: getSafeAppLink(app.link),
        publisherName: app.source === "Uploaded" ? app.publisherName : "Official",
        installs: Number(app.installs) || 0,
      } : null,
    }),
  });

  if (!response.ok) {
    throw new Error("Help backend unavailable.");
  }

  const data = await response.json();
  return cleanText(data.answer || data.output_text || "", 1600);
}

async function sendAgentQuestion(question) {
  const text = cleanText(question, 900);

  if (!text) {
    return;
  }

  const app = findAppForQuestion(text);
  addAgentMessage("user", text);
  elements.agentInput.value = "";
  elements.agentInput.disabled = true;
  elements.agentForm.querySelector("button").disabled = true;

  try {
    const backendReply = await callHelpBackend(text, app);
    addAgentMessage("assistant", backendReply || buildLocalAgentReply(text, app));
  } catch {
    addAgentMessage("assistant", buildLocalAgentReply(text, app));
  } finally {
    elements.agentInput.disabled = false;
    elements.agentForm.querySelector("button").disabled = false;
    elements.agentInput.focus();
  }
}

function bindEvents() {
  elements.accountForm.addEventListener("submit", handleAccountStep);
  elements.profileForm.addEventListener("submit", handleProfileStep);
  elements.togglePassword.addEventListener("click", () => {
    const isHidden = elements.loginPassword.type === "password";
    elements.loginPassword.type = isHidden ? "text" : "password";
    elements.togglePassword.textContent = isHidden ? "Hide" : "Show";
    elements.togglePassword.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
  elements.backToAccount.addEventListener("click", () => showAuthScreen("account"));
  elements.editProfile.addEventListener("click", () => showAuthScreen("profile"));
  elements.enterApp.addEventListener("click", finishVerifiedLogin);
  window.addEventListener("hashchange", handleVerificationRoute);

  elements.logout.addEventListener("click", logout);
  elements.search.addEventListener("input", () => {
    state.search = cleanText(elements.search.value, 120);
    renderCatalog();
  });

  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      elements.filterButtons.forEach((filterButton) => filterButton.classList.toggle("active", filterButton === button));
      renderCatalog();
    });
  });

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => showSection(button.dataset.section));
  });

  elements.officialList.addEventListener("click", handleAppAction);
  elements.uploadedList.addEventListener("click", handleAppAction);
  elements.installedList.addEventListener("click", handleAppAction);
  elements.myUploadList.addEventListener("click", handleAppAction);
  elements.uploadForm.addEventListener("submit", handleUpload);
  elements.agentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendAgentQuestion(elements.agentInput.value);
  });
  elements.clearLocalData.addEventListener("click", clearLocalData);
  elements.closeAppModal.addEventListener("click", closeAppModal);
  elements.appModal.addEventListener("click", (event) => {
    if (event.target === elements.appModal) {
      closeAppModal();
    }
  });
  elements.downloadOpenApp.addEventListener("click", downloadCurrentHtml);
  elements.installStore.addEventListener("click", installStore);
  elements.closeInstallModal.addEventListener("click", closeInstallModal);
  elements.installModal.addEventListener("click", (event) => {
    if (event.target === elements.installModal) {
      closeInstallModal();
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
  });
}

function initializeFlowField() {
  const canvas = elements.flowField;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    return;
  }

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pointer = { x: -9999, y: -9999, active: false };
  const particles = [];
  const colors = ["154,66,38", "181,81,47", "224,144,47", "124,92,255", "43,191,174"];
  const scale = 0.0019;
  let width = 0;
  let height = 0;
  let time = 0;
  let animationFrame = 0;

  function hash(x, y) {
    const seed = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return seed - Math.floor(seed);
  }

  function smooth(left, right, amount) {
    return left + (right - left) * (amount * amount * (3 - 2 * amount));
  }

  function noise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const topLeft = hash(xi, yi);
    const topRight = hash(xi + 1, yi);
    const bottomLeft = hash(xi, yi + 1);
    const bottomRight = hash(xi + 1, yi + 1);

    return smooth(smooth(topLeft, topRight, xf), smooth(bottomLeft, bottomRight, xf), yf);
  }

  function field(x, y) {
    return (noise(x * scale, y * scale + time) * 2 + noise(x * scale * 2.3, y * scale * 2.3 - time * 0.6)) * Math.PI * 2;
  }

  function spawn() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      life: 40 + Math.random() * 140,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    particles.length = 0;

    const count = Math.max(70, Math.min(reduceMotion.matches ? 120 : 340, Math.floor((width * height) / 4200)));

    for (let index = 0; index < count; index += 1) {
      particles.push(spawn());
    }
  }

  function draw() {
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "rgba(0,0,0,0.045)";
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "source-over";

    particles.forEach((particle) => {
      const angle = field(particle.x, particle.y);
      let vx = Math.cos(angle) * 0.9;
      let vy = Math.sin(angle) * 0.9;

      if (pointer.active) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 150 && distance > 0) {
          const force = (1 - distance / 150) * 2.2;
          vx += (dx / distance) * force;
          vy += (dy / distance) * force;
        }
      }

      const previousX = particle.x;
      const previousY = particle.y;
      particle.x += vx;
      particle.y += vy;
      particle.life -= 1;

      context.strokeStyle = `rgba(${particle.color},0.5)`;
      context.lineWidth = 1.15;
      context.beginPath();
      context.moveTo(previousX, previousY);
      context.lineTo(particle.x, particle.y);
      context.stroke();

      if (particle.life <= 0 || particle.x < -5 || particle.x > width + 5 || particle.y < -5 || particle.y > height + 5) {
        Object.assign(particle, spawn());
      }
    });

    time += 0.0009;

    if (!reduceMotion.matches) {
      animationFrame = window.requestAnimationFrame(draw);
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      window.cancelAnimationFrame(animationFrame);
      resize();
      for (let index = 0; index < 90; index += 1) {
        draw();
      }
    } else {
      resize();
      animationFrame = window.requestAnimationFrame(draw);
    }
  });

  resize();

  if (reduceMotion.matches) {
    for (let index = 0; index < 90; index += 1) {
      draw();
    }
  } else {
    animationFrame = window.requestAnimationFrame(draw);
  }
}

function initialize() {
  initializeFlowField();
  bindEvents();

  const routedToVerification = handleVerificationRoute();

  if (!routedToVerification) {
    const saved = getStoredSession();

    if (saved) {
      enterApp(saved);
    } else {
      showAuthScreen("account");
    }
  }

  if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

initialize();
