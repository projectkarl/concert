const installBtn = document.getElementById("installAppBtn");
const sheet = document.getElementById("installSheet");
const sheetBackdrop = document.getElementById("installBackdrop");
const sheetClose = document.getElementById("installClose");
const sheetTitle = document.getElementById("installTitle");
const sheetBody = document.getElementById("installBody");
const status = document.getElementById("pwaStatus");
let deferredPrompt = null;

const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isSafari = () => /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);

function setInstalledUI() {
  document.documentElement.classList.toggle("pwa-standalone", isStandalone());
  if (installBtn) {
    installBtn.hidden = isStandalone();
    installBtn.textContent = isStandalone() ? "已安裝" : "APP";
  }
  if (status) status.textContent = isStandalone() ? "已從主畫面啟動" : "可加入主畫面";
}

function openInstallSheet(kind = "generic") {
  if (!sheet || !sheetBackdrop) return;
  if (kind === "ios") {
    sheetTitle.textContent = "加入 iPhone 主畫面";
    sheetBody.innerHTML = `
      <ol>
        <li>請使用 <b>Safari</b> 開啟 NEUL。</li>
        <li>點 Safari 下方的 <b>分享</b> 按鈕。</li>
        <li>向下找到 <b>加入主畫面</b>。</li>
        <li>確認名稱後點 <b>加入</b>。</li>
      </ol>
      <p>完成後會以獨立 App 視窗啟動，首頁、收藏與場館 3D 都保留。</p>`;
  } else {
    sheetTitle.textContent = "安裝 NEUL";
    sheetBody.innerHTML = `
      <p>目前瀏覽器尚未提供一鍵安裝提示。你可以從瀏覽器選單選擇 <b>安裝應用程式</b> 或 <b>加入主畫面</b>。</p>
      <p>安裝後不需要 App Store，仍會自動取得網站的新版本。</p>`;
  }
  sheet.hidden = false;
  sheetBackdrop.hidden = false;
  requestAnimationFrame(() => sheet.classList.add("open"));
  document.body.classList.add("sheet-open");
}

function closeInstallSheet() {
  if (!sheet || !sheetBackdrop) return;
  sheet.classList.remove("open");
  sheetBackdrop.hidden = true;
  setTimeout(() => { sheet.hidden = true; }, 220);
  document.body.classList.remove("sheet-open");
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  if (installBtn && !isStandalone()) installBtn.hidden = false;
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  setInstalledUI();
  closeInstallSheet();
});

installBtn?.addEventListener("click", async () => {
  if (isStandalone()) return;
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    deferredPrompt = null;
    setInstalledUI();
    return;
  }
  openInstallSheet(isIOS() ? "ios" : "generic");
});
sheetClose?.addEventListener("click", closeInstallSheet);
sheetBackdrop?.addEventListener("click", closeInstallSheet);
window.addEventListener("keydown", event => { if (event.key === "Escape") closeInstallSheet(); });

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      registration.update().catch(() => {});
    } catch {
      if (status) status.textContent = "一般網頁模式";
    }
  });
}

if (isIOS() && !isSafari() && status && !isStandalone()) status.textContent = "用 Safari 可加入主畫面";
setInstalledUI();
