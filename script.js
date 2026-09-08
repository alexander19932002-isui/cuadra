
"use strict";

// ============================================================
// CUADRA - APLICACIÓN DE CONTROL DE INVENTARIO
// Este archivo contiene la lógica principal de la aplicación.
// Busca los títulos de sección para ubicar cada funcionalidad.
// ============================================================

// 1. CARGA DE ESTILOS ESPECÍFICOS
const mobileStyles = document.createElement("link");
mobileStyles.rel = "stylesheet";
mobileStyles.href = "mobile.css";
document.head.appendChild(mobileStyles);
const scannerStyles = document.createElement("link");
scannerStyles.rel = "stylesheet";
scannerStyles.href = "scanner.css";
document.head.appendChild(scannerStyles);
const adminStyles = document.createElement("link");
adminStyles.rel = "stylesheet";
adminStyles.href = "admin.css";
document.head.appendChild(adminStyles);

// 2. DATOS DE EJEMPLO DE LA APLICACIÓN
// Aquí puedes cambiar los productos que aparecen al abrir la demostración.
const products = [
  {
    id: 1,
    name: "Coca-Cola original 350 ml",
    sku: "BEB-001",
    cost: 700,
    stock: 42,
    rev: 0,
    counts: [{ expected: 42, actual: 39, rev: 0 }],
  },
  {
    id: 2,
    name: "Arroz grado 1 · 1 kg",
    sku: "ABA-002",
    cost: 1100,
    stock: 30,
    rev: 0,
    counts: [{ expected: 30, actual: 30, rev: 0 }],
  },
  {
    id: 3,
    name: "Café instantáneo · 170 g",
    sku: "ABA-003",
    cost: 3800,
    stock: 18,
    rev: 0,
    counts: [
      { expected: 20, actual: 19, rev: -1 },
      { expected: 18, actual: 16, rev: 0 },
    ],
  },
  {
    id: 4,
    name: "Leche entera · 1 L",
    sku: "LAC-004",
    cost: 850,
    stock: 24,
    rev: 0,
    counts: [{ expected: 24, actual: 26, rev: 0 }],
  },
  {
    id: 5,
    name: "Detergente líquido · 3 L",
    sku: "LIM-005",
    cost: 4200,
    stock: 12,
    rev: 0,
    counts: [],
  },
  {
    id: 6,
    name: "Galletas de avena · 200 g",
    sku: "ABA-006",
    cost: 650,
    stock: 36,
    rev: 0,
    counts: [{ expected: 36, actual: 36, rev: 0 }],
  },
];
const activity = [
  {
    title: "Conteos de ejemplo cargados",
    detail: "6 productos · 5 conteos recientes · valores ficticios",
    time: "Datos de demostración",
  },
];
const $ = (s) => document.querySelector(s);
const money = (v) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function snapshot(p) {
  const c = p.counts.at(-1);
  return c
    ? { ...c, diff: c.actual - c.expected, stale: c.rev !== p.rev }
    : null;
}
function render() {
  const activeProducts = products.filter((p) => !p.inactive);
  let missing = 0,
    extra = 0,
    review = 0,
    counted = 0;
  for (const p of activeProducts) {
    const c = snapshot(p);
    if (c) {
      counted++;
      if (c.diff !== 0) {
        review++;
        if (c.diff < 0) missing -= c.diff * p.cost;
        else extra += c.diff * p.cost;
      }
    }
  }
  $("#metrics").innerHTML =
    `<div class="metric"><p>Productos con diferencias</p><strong>${review}<span style="font-size:16px;color:#748691;font-weight:400"> / ${activeProducts.length}</span></strong><small>Según el último conteo</small></div><div class="metric loss"><p>Faltantes a costo</p><strong>${money(missing)}</strong><small>Valor pendiente de revisión</small></div><div class="metric gain"><p>Sobrantes a costo</p><strong>${money(extra)}</strong><small>Separados de los faltantes</small></div><div class="metric"><p>Productos contados</p><strong>${counted}<span style="font-size:16px;color:#748691;font-weight:400"> / ${activeProducts.length}</span></strong><small>${activeProducts.length - counted} sin primer conteo</small></div>`;
  $("#product-total").textContent =
    activeProducts.length + " productos activos";
  $("#inventory").innerHTML = activeProducts
    .map((p) => {
      const c = snapshot(p);
      const state = !c
        ? "Sin conteo"
        : c.stale
          ? "Volver a contar"
          : c.diff < 0
            ? "Faltante"
            : c.diff > 0
              ? "Sobrante"
              : "Cuadra";
      return `<tr><td><strong>${esc(p.name)}</strong><small>${esc(p.sku)} · Costo ${money(p.cost)}</small><button class="mobile-register" data-product="${p.id}">Registrar movimiento o conteo</button></td><td>${p.stock} un.</td><td>${c ? c.actual + " un." : "—"}${c ? "<small>Esperado al contar: " + c.expected + "</small>" : ""}</td><td class="${c?.diff < 0 ? "negative" : c?.diff > 0 ? "positive" : ""}">${c ? (c.diff > 0 ? "+" : "") + c.diff + " un." : "—"}</td><td><span class="badge ${!c || c.stale ? "" : c.diff < 0 ? "bad" : c.diff > 0 ? "extra" : "good"}">${state}</span></td><td class="desktop-register"><button data-product="${p.id}">Registrar</button></td></tr>`;
    })
    .join("");
  const alerts = activeProducts
    .filter((p) => snapshot(p)?.diff)
    .sort(
      (a, b) =>
        Math.abs(snapshot(b).diff) * b.cost -
        Math.abs(snapshot(a).diff) * a.cost,
    );
  $("#alerts").innerHTML = alerts.length
    ? alerts
        .map((p) => {
          const c = snapshot(p),
            n = p.counts.filter((x) => x.actual !== x.expected).length;
          return `<div class="alert-row"><div><strong>${esc(p.name)}</strong><p>${n > 1 ? n + " conteos con diferencias" : "Primera diferencia registrada"}${c.stale ? " · Conteo anterior a movimientos recientes" : ""}</p></div><div class="amount ${c.diff < 0 ? "negative" : "positive"}"><strong>${c.diff < 0 ? "−" : "+"}${Math.abs(c.diff)} un.</strong><p>${money(Math.abs(c.diff) * p.cost)} a costo</p></div></div>`;
        })
        .join("")
    : "<p>No hay diferencias en los últimos conteos registrados.</p>";
  $("#history").innerHTML = activity
    .map(
      (a) =>
        `<li><strong>${esc(a.title)}</strong><small>${esc(a.detail)}</small><small>${esc(a.time)}</small></li>`,
    )
    .join("");
}
let active = null;
const dialog = $("#editor");
function openProduct(id) {
  active = products.find((p) => p.id === id);
  $("#dialog-title").textContent = active.name;
  $("#fields").innerHTML =
    `<p class="hint">Stock registrado: <strong>${active.stock} unidades</strong>. Un conteo compara las unidades; no ajusta automáticamente el inventario.</p><label for="kind">Tipo de registro</label><select id="kind"><option value="count">Conteo físico</option><option value="entry">Entrada de mercadería</option><option value="sale">Venta</option></select><label for="quantity">Unidades contadas</label><input id="quantity" type="number" min="0" max="1000000" step="1" required><label for="note">Observación (opcional)</label><input id="note" maxlength="160" placeholder="Ej.: revisar bodega o boletas pendientes">`;
  $("#kind").onchange = () => {
    const count = $("#kind").value === "count";
    document.querySelector('label[for="quantity"]').textContent = count
      ? "Unidades contadas"
      : "Cantidad de unidades";
    $("#quantity").min = count ? "0" : "1";
  };
  $("#form-error").textContent = "";
  dialog.showModal();
}
$("#inventory").onclick = (e) => {
  const b = e.target.closest("[data-product]");
  if (b) openProduct(Number(b.dataset.product));
};
$("#new-product").onclick = () => {
  active = null;
  $("#dialog-title").textContent = "Agregar producto";
  $("#fields").innerHTML =
    '<label for="name">Nombre del producto</label><input id="name" required maxlength="80" placeholder="Ej.: Aceite vegetal 1 L"><label for="sku">Código interno único</label><input id="sku" required maxlength="30" placeholder="Ej.: ABA-007"><label for="barcode">Código de barras (opcional)</label><input id="barcode" maxlength="32" inputmode="numeric" placeholder="Ej.: 7802800001934"><label for="cost">Costo unitario (pesos chilenos)</label><input id="cost" type="number" required min="0" max="100000000" step="1"><label for="initial">Stock inicial (unidades)</label><input id="initial" type="number" required min="0" max="1000000" step="1">';
  $("#form-error").textContent = "";
  dialog.showModal();
};
$("#close").onclick = $("#cancel").onclick = () => dialog.close();
function log(title, detail) {
  activity.unshift({ title, detail, time: new Date().toLocaleString("es-CL") });
}
$("#edit-form").onsubmit = (e) => {
  e.preventDefault();
  $("#form-error").textContent = "";
  try {
    if (!active) {
      const name = $("#name").value.trim(),
        sku = $("#sku").value.trim(),
        barcode = $("#barcode").value.trim(),
        cost = Number($("#cost").value),
        stock = Number($("#initial").value);
      if (!name || !sku) throw Error("Completa el nombre y el código.");
      if (products.some((p) => p.sku.toLowerCase() === sku.toLowerCase()))
        throw Error("Ese código interno ya existe. Usa uno diferente.");
      if (barcode && !/^[0-9A-Za-z._-]{4,32}$/.test(barcode))
        throw Error("Ingresa un código de barras válido.");
      if (barcode && linkedBarcodes.has(barcode))
        throw Error("Ese código de barras ya corresponde a otro producto.");
      if (
        !Number.isSafeInteger(cost) ||
        cost < 0 ||
        cost > 100000000 ||
        !Number.isSafeInteger(stock) ||
        stock < 0 ||
        stock > 1000000
      )
        throw Error(
          "Ingresa cantidades enteras dentro de los límites indicados.",
        );
      const product = {
        id: Math.max(0, ...products.map((p) => p.id)) + 1,
        name,
        sku,
        barcode,
        cost,
        stock,
        rev: 0,
        counts: [],
        inactive: false,
      };
      products.push(product);
      linkedBarcodes.set(sku, product.id);
      if (barcode) linkedBarcodes.set(barcode, product.id);
      log(
        "Producto agregado · " + name,
        stock + " unidades iniciales · Costo " + money(cost),
      );
    } else {
      const quantity = Number($("#quantity").value),
        kind = $("#kind").value,
        note = $("#note").value.trim();
      if (
        !Number.isSafeInteger(quantity) ||
        quantity < (kind === "count" ? 0 : 1) ||
        quantity > 1000000
      )
        throw Error("Ingresa una cantidad entera válida.");
      if (kind === "sale" && quantity > active.stock)
        throw Error("La venta supera el stock registrado disponible.");
      if (kind === "entry" && active.stock + quantity > 1000000)
        throw Error("El stock máximo de esta prueba es 1.000.000 de unidades.");
      if (kind === "count") {
        const expected = active.stock;
        active.counts.push({ expected, actual: quantity, rev: active.rev });
        log(
          "Conteo · " + active.name,
          "Registrado: " +
            expected +
            " · Contado: " +
            quantity +
            " · Diferencia: " +
            (quantity - expected) +
            (note ? " · " + note : ""),
        );
      } else {
        active.stock += kind === "entry" ? quantity : -quantity;
        active.rev++;
        log(
          (kind === "entry" ? "Entrada" : "Venta") + " · " + active.name,
          quantity +
            " unidades · Stock resultante: " +
            active.stock +
            (note ? " · " + note : ""),
        );
      }
    }
    dialog.close();
    render();
    $("#toast").textContent = "Registro guardado en esta sesión de prueba.";
    $("#toast").style.display = "block";
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(
      () => ($("#toast").style.display = "none"),
      3500,
    );
  } catch (err) {
    $("#form-error").textContent = err.message;
  }
};

// 3. CONTEO POR CÁMARA O LECTOR DE CÓDIGOS DE BARRAS
const headingActions = document.createElement("div");
headingActions.className = "heading-actions";
const addProductButton = $("#new-product");
addProductButton.parentNode.insertBefore(headingActions, addProductButton);
headingActions.appendChild(addProductButton);
const scanCountButton = document.createElement("button");
scanCountButton.type = "button";
scanCountButton.className = "primary";
scanCountButton.innerHTML = "▣ Conteo con cámara";
headingActions.insertBefore(scanCountButton, addProductButton);

const scannerDialog = document.createElement("dialog");
scannerDialog.id = "scanner-dialog";
scannerDialog.className = "scanner-dialog";
scannerDialog.innerHTML = `<div class="dialog-head"><div><p class="eyebrow">CONTEO DE BODEGA</p><h2>Escanear productos</h2></div><button type="button" class="icon" id="scanner-x" aria-label="Cerrar">×</button></div><p class="scanner-intro">Cada lectura suma una unidad. Si el código es nuevo, asócialo una sola vez con el producto correcto.</p><div class="scanner-grid"><section class="camera-panel"><div id="camera-reader"><div class="camera-placeholder"><strong>Cámara detenida</strong><span>Presiona “Activar cámara” y autoriza su uso.</span></div></div><div class="camera-actions"><button type="button" class="primary" id="start-camera">Activar cámara</button><button type="button" id="stop-camera" disabled>Detener</button></div><div class="manual-entry"><label for="barcode-input">Código manual o lector USB/Bluetooth</label><input id="barcode-input" autocomplete="off" inputmode="numeric" placeholder="Escanea o escribe el código"><button type="button" id="add-barcode">Sumar</button></div><p class="scan-message" id="scan-message">Todavía no se han escaneado productos.</p><div class="associate-box" id="associate-box" hidden><label for="associate-product">Código desconocido: <strong id="unknown-code"></strong></label><select id="associate-product"></select><div class="associate-actions"><button type="button" class="primary" id="confirm-association">Asociar y sumar</button><button type="button" id="cancel-association">Cancelar</button></div></div></section><section class="count-panel"><div class="count-head"><h3>Conteo actual</h3><span class="pill" id="scan-total">0 unidades</span></div><div class="session-counts" id="session-counts"><div class="count-empty">Los productos aparecerán aquí al escanearlos.</div></div></section></div><div class="scanner-footer"><button type="button" id="cancel-scan">Cancelar conteo</button><button type="button" class="primary" id="finish-scan" disabled>Finalizar y comparar</button></div>`;
document.body.appendChild(scannerDialog);

let scanner = null;
let cameraRunning = false;
let scannerLibraryPromise = null;
let pendingBarcode = "";
let lastBarcode = "";
let lastBarcodeAt = 0;
const linkedBarcodes = new Map();
products.forEach((product) => {
  linkedBarcodes.set(product.sku, product.id);
  if (product.barcode) linkedBarcodes.set(product.barcode, product.id);
});
const scannedProducts = new Map();

function scannerMessage(text, type = "") {
  const el = $("#scan-message");
  el.textContent = text;
  el.className = "scan-message " + type;
}

function loadScannerLibrary() {
  if (window.Html5Qrcode) return Promise.resolve();
  if (scannerLibraryPromise) return scannerLibraryPromise;
  scannerLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js";
    script.onload = () =>
      window.Html5Qrcode
        ? resolve()
        : reject(new Error("La herramienta de escaneo no se cargó."));
    script.onerror = () =>
      reject(new Error("No fue posible cargar el lector de códigos."));
    document.head.appendChild(script);
  });
  return scannerLibraryPromise;
}

function renderScanSession() {
  const rows = [...scannedProducts.entries()].map(([id, item]) => {
    const p = products.find((product) => product.id === id);
    const diff = item.qty - item.expected;
    return `<div class="scan-row"><div><strong>${esc(p.name)}</strong><small>Registrado: ${item.expected} · Diferencia: ${diff > 0 ? "+" : ""}${diff}</small></div><div class="quantity-control"><button type="button" data-scan-minus="${id}" aria-label="Restar una unidad de ${esc(p.name)}">−</button><output>${item.qty}</output><button type="button" data-scan-plus="${id}" aria-label="Sumar una unidad de ${esc(p.name)}">＋</button></div></div>`;
  });
  $("#session-counts").innerHTML = rows.length
    ? rows.join("")
    : '<div class="count-empty">Los productos aparecerán aquí al escanearlos.</div>';
  const total = [...scannedProducts.values()].reduce(
    (sum, item) => sum + item.qty,
    0,
  );
  $("#scan-total").textContent =
    total + " " + (total === 1 ? "unidad" : "unidades");
  $("#finish-scan").disabled = !rows.length;
}

function signalScan() {
  if (navigator.vibrate) navigator.vibrate(60);
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.07);
  } catch (error) {}
}

function addProductScan(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product || product.inactive) {
    scannerMessage(
      "Este producto está desactivado. Reactívalo desde el panel administrador.",
      "warning",
    );
    return;
  }
  const current = scannedProducts.get(productId) || {
    qty: 0,
    expected: product.stock,
    rev: product.rev,
  };
  current.qty += 1;
  scannedProducts.set(productId, current);
  signalScan();
  scannerMessage(
    product.name + " · unidad " + current.qty + " registrada.",
    "success",
  );
  renderScanSession();
}

function handleBarcode(rawCode) {
  const code = String(rawCode || "").trim();
  if (!code || pendingBarcode) return;
  const now = Date.now();
  if (code === lastBarcode && now - lastBarcodeAt < 900) return;
  lastBarcode = code;
  lastBarcodeAt = now;
  const productId = linkedBarcodes.get(code);
  if (productId) {
    addProductScan(productId);
    return;
  }
  pendingBarcode = code;
  $("#unknown-code").textContent = code;
  $("#associate-product").innerHTML = products
    .filter((p) => !p.inactive)
    .map(
      (p) => `<option value="${p.id}">${esc(p.name)} · ${esc(p.sku)}</option>`,
    )
    .join("");
  $("#associate-box").hidden = false;
  scannerMessage(
    "Este código todavía no está asociado a un producto.",
    "warning",
  );
}

async function startCamera() {
  const start = $("#start-camera");
  start.disabled = true;
  scannerMessage("Preparando la cámara…");
  try {
    await loadScannerLibrary();
    const format = window.Html5QrcodeSupportedFormats;
    const formatsToSupport = format
      ? [
          format.EAN_13,
          format.EAN_8,
          format.UPC_A,
          format.UPC_E,
          format.CODE_128,
        ]
      : undefined;
    let cameraConfig = { facingMode: "environment" };
    try {
      const cameras = await window.Html5Qrcode.getCameras();
      const rearCamera =
        cameras.find((camera) =>
          /back|rear|environment|trasera|posterior/i.test(camera.label),
        ) || cameras.at(-1);
      if (rearCamera) cameraConfig = rearCamera.id;
    } catch (error) {}
    scannerMessage("Permiso recibido. Iniciando la cámara trasera…");
    $("#camera-reader").innerHTML = "";
    scanner = new window.Html5Qrcode("camera-reader", {
      formatsToSupport,
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });
    await scanner.start(
      cameraConfig,
      {
        fps: 18,
        qrbox: (width, height) => ({
          width: Math.min(360, Math.floor(width * 0.9)),
          height: Math.min(140, Math.floor(height * 0.42)),
        }),
        aspectRatio: 1.333,
        disableFlip: true,
      },
      (text) => handleBarcode(text),
      () => {},
    );
    cameraRunning = true;
    start.textContent = "Cámara activa";
    $("#stop-camera").disabled = false;
    scannerMessage(
      "Cámara lista. Coloca todas las barras dentro del recuadro, con buena luz.",
    );
  } catch (error) {
    if (scanner) {
      try {
        scanner.clear();
      } catch (clearError) {}
    }
    scanner = null;
    cameraRunning = false;
    start.disabled = false;
    start.textContent = "Intentar nuevamente";
    $("#camera-reader").innerHTML =
      '<div class="camera-placeholder"><strong>No se pudo abrir la cámara</strong><span>Revisa el permiso de cámara. También puedes escribir el código o usar un lector externo.</span></div>';
    scannerMessage(error.message || "No se pudo activar la cámara.", "warning");
  }
}

async function stopCamera() {
  if (scanner && cameraRunning) {
    try {
      await scanner.stop();
      scanner.clear();
    } catch (error) {}
  }
  scanner = null;
  cameraRunning = false;
  $("#start-camera").disabled = false;
  $("#start-camera").textContent = "Activar cámara";
  $("#stop-camera").disabled = true;
  $("#camera-reader").innerHTML =
    '<div class="camera-placeholder"><strong>Cámara detenida</strong><span>Presiona “Activar cámara” para continuar.</span></div>';
}

async function closeScanner(force = false) {
  if (
    !force &&
    scannedProducts.size &&
    !window.confirm(
      "¿Cancelar este conteo? Las unidades escaneadas se perderán.",
    )
  )
    return;
  await stopCamera();
  scannedProducts.clear();
  pendingBarcode = "";
  $("#associate-box").hidden = true;
  renderScanSession();
  scannerDialog.close();
}

scanCountButton.onclick = () => {
  scannedProducts.clear();
  pendingBarcode = "";
  lastBarcode = "";
  lastBarcodeAt = 0;
  $("#associate-box").hidden = true;
  scannerMessage("Activa la cámara o ingresa un código manualmente.");
  renderScanSession();
  scannerDialog.showModal();
};
$("#start-camera").onclick = startCamera;
$("#stop-camera").onclick = stopCamera;
$("#scanner-x").onclick = $("#cancel-scan").onclick = () => closeScanner();
$("#add-barcode").onclick = () => {
  const input = $("#barcode-input");
  handleBarcode(input.value);
  input.value = "";
  input.focus();
};
$("#barcode-input").onkeydown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    $("#add-barcode").click();
  }
};
$("#confirm-association").onclick = () => {
  const id = Number($("#associate-product").value);
  const product = products.find((p) => p.id === id);
  if (product) {
    if (product.barcode && product.barcode !== pendingBarcode)
      linkedBarcodes.delete(product.barcode);
    product.barcode = pendingBarcode;
  }
  linkedBarcodes.set(pendingBarcode, id);
  const code = pendingBarcode;
  pendingBarcode = "";
  $("#associate-box").hidden = true;
  addProductScan(id);
  scannerMessage(
    "Código " +
      code +
      " asociado. Las próximas lecturas se sumarán automáticamente.",
    "success",
  );
};
$("#cancel-association").onclick = () => {
  pendingBarcode = "";
  $("#associate-box").hidden = true;
  scannerMessage("Código descartado. Continúa escaneando.");
};
$("#session-counts").onclick = (e) => {
  const plus = e.target.closest("[data-scan-plus]");
  const minus = e.target.closest("[data-scan-minus]");
  const id = Number(plus?.dataset.scanPlus || minus?.dataset.scanMinus);
  if (!id) return;
  const item = scannedProducts.get(id);
  if (plus) item.qty += 1;
  if (minus) item.qty -= 1;
  if (item.qty <= 0) scannedProducts.delete(id);
  renderScanSession();
};
$("#finish-scan").onclick = async () => {
  for (const [id, item] of scannedProducts) {
    const product = products.find((p) => p.id === id);
    product.counts.push({
      expected: item.expected,
      actual: item.qty,
      rev: item.rev,
    });
    log(
      "Conteo escaneado · " + product.name,
      "Registrado: " +
        item.expected +
        " · Escaneado: " +
        item.qty +
        " · Diferencia: " +
        (item.qty - item.expected),
    );
  }
  const productCount = scannedProducts.size;
  await closeScanner(true);
  render();
  $("#toast").textContent =
    "Conteo finalizado para " +
    productCount +
    " " +
    (productCount === 1 ? "producto." : "productos.");
  $("#toast").style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(
    () => ($("#toast").style.display = "none"),
    3500,
  );
};

// 4. PANEL ADMINISTRATIVO PARA COMPUTADOR
// Incluye el catálogo, los ajustes de inventario y el historial.
const adminButton = document.createElement("button");
adminButton.type = "button";
adminButton.textContent = "Panel administrador";
headingActions.appendChild(adminButton);

const adminDialog = document.createElement("dialog");
adminDialog.id = "admin-dialog";
adminDialog.className = "admin-dialog";
adminDialog.innerHTML = `<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>≋</span> cuadra</div><div class="admin-nav-item active">Inventario</div><div class="admin-nav-item">Catálogo</div><div class="admin-nav-item">Diferencias</div><div class="admin-nav-item">Historial</div><div class="admin-role"><strong>Administrador de prueba</strong><br>Acceso sin contraseña en esta versión.</div></aside><div class="admin-main"><div class="admin-top"><div><p class="eyebrow">SOFTWARE DE GESTIÓN</p><h2>Panel administrador</h2><p>Controla productos, ajustes y diferencias desde el computador.</p></div><button type="button" class="icon" id="close-admin" aria-label="Cerrar panel">×</button></div><div class="admin-notice"><strong>Versión de prueba:</strong> los cambios se reinician al recargar. La versión real tendrá usuarios, permisos y base de datos compartida.</div><section class="admin-summary" id="admin-summary"></section><section class="admin-card"><div class="admin-card-head"><div><h3>Catálogo de productos</h3><p>Importa productos con sus códigos de barras desde CSV o Excel.</p></div><div class="catalog-buttons"><button type="button" id="download-catalog-template">Descargar plantilla CSV</button><button type="button" class="primary" id="import-catalog">Importar catálogo</button><input type="file" id="catalog-file" accept=".csv,.xlsx,.xls" hidden></div></div><div class="catalog-guide">Columnas aceptadas: <code>codigo_barras</code>, <code>sku</code>, <code>nombre</code>, <code>marca</code>, <code>formato</code>, <code>categoria</code>, <code>costo</code> y <code>stock</code>. El código de barras y el nombre son obligatorios.</div><div class="catalog-preview" id="catalog-preview" hidden><div class="catalog-preview-summary"><div><strong id="catalog-preview-title"></strong><p id="catalog-preview-detail"></p></div><button type="button" class="primary" id="confirm-catalog-import">Confirmar importación</button></div><div class="admin-table-wrap"><table class="catalog-preview-table"><thead><tr><th>Código de barras</th><th>Producto</th><th>Marca / formato</th><th>Costo</th><th>Stock</th></tr></thead><tbody id="catalog-preview-rows"></tbody></table></div><p class="catalog-error" id="catalog-error" role="alert"></p></div></section><section class="admin-card"><div class="admin-card-head"><h3>Productos e inventario</h3><span class="pill" id="admin-product-count"></span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Producto</th><th>Stock</th><th>Último conteo</th><th>Estado</th><th>Administrar</th></tr></thead><tbody id="admin-products"></tbody></table></div><form id="admin-action-panel" class="admin-action-panel" hidden><div id="admin-action-content"></div><p class="admin-error" id="admin-error" role="alert"></p><div class="admin-action-buttons"><button type="button" id="cancel-admin-action">Cancelar</button><button type="submit" class="primary" id="save-admin-action">Guardar cambio</button></div></form></section><section class="admin-card"><div class="admin-card-head"><h3>Historial de cambios</h3><span class="pill">Trazabilidad</span></div><ol class="admin-audit" id="admin-audit"></ol></section></div></div>`;
document.body.appendChild(adminDialog);

let adminAction = "";
let adminProductId = null;
let pendingCatalogRows = [];
let catalogLibraryPromise = null;

const catalogAliases = {
  barcode: [
    "codigo_barras",
    "codigo_de_barras",
    "cod_barra",
    "barcode",
    "ean",
    "ean_13",
    "gtin",
  ],
  sku: ["sku", "codigo_interno", "cod_interno"],
  name: ["nombre", "producto", "nombre_producto", "descripcion"],
  brand: ["marca"],
  format: ["formato", "contenido", "tamano", "presentacion"],
  category: ["categoria", "rubro"],
  cost: ["costo", "precio_costo", "costo_unitario"],
  stock: ["stock", "cantidad", "existencia", "stock_inicial"],
};

function normalizeCatalogHeader(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsvMatrix(text) {
  const firstLine = String(text).split(/\r?\n/, 1)[0] || "";
  const delimiter =
    (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length
      ? ";"
      : ",";
  const matrix = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text).replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((value) => String(value).trim())) matrix.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => String(value).trim())) matrix.push(row);
  return matrix;
}

function catalogInteger(value, field, rowNumber) {
  const original = String(value ?? "").trim();
  if (!original) return 0;
  const cleaned = original.replace(/[$\s.]/g, "").replace(",", ".");
  const number = Number(cleaned);
  const maximum = field === "stock" ? 1000000 : 100000000;
  if (!Number.isSafeInteger(number) || number < 0 || number > maximum)
    throw Error(
      `Fila ${rowNumber}: ${field === "stock" ? "stock" : "costo"} inválido.`,
    );
  return number;
}

function catalogRowsFromMatrix(matrix) {
  if (!matrix.length) throw Error("El archivo está vacío.");
  const headers = matrix[0].map(normalizeCatalogHeader);
  const indexes = {};
  for (const [field, aliases] of Object.entries(catalogAliases))
    indexes[field] = headers.findIndex((header) => aliases.includes(header));
  if (indexes.barcode < 0 || indexes.name < 0)
    throw Error("Faltan las columnas obligatorias codigo_barras y nombre.");
  const rows = [];
  const seen = new Set();
  const seenSkus = new Set();
  matrix.slice(1).forEach((values, index) => {
    if (!values.some((value) => String(value ?? "").trim())) return;
    const rowNumber = index + 2;
    const read = (field) =>
      indexes[field] < 0 ? "" : String(values[indexes[field]] ?? "").trim();
    const barcode = read("barcode").replace(/\.0$/, "");
    const name = read("name");
    if (!barcode || !name)
      throw Error(
        `Fila ${rowNumber}: el código de barras y el nombre son obligatorios.`,
      );
    if (!/^[0-9A-Za-z._-]{4,32}$/.test(barcode))
      throw Error(`Fila ${rowNumber}: código de barras inválido.`);
    if (seen.has(barcode))
      throw Error(`El código ${barcode} está repetido en el archivo.`);
    const sku = read("sku");
    const normalizedSku = sku.toLowerCase();
    if (normalizedSku && seenSkus.has(normalizedSku))
      throw Error(`El SKU ${sku} está repetido en el archivo.`);
    seen.add(barcode);
    if (normalizedSku) seenSkus.add(normalizedSku);
    rows.push({
      barcode,
      sku,
      name,
      brand: read("brand"),
      format: read("format"),
      category: read("category"),
      cost: catalogInteger(read("cost"), "cost", rowNumber),
      stock: catalogInteger(read("stock"), "stock", rowNumber),
    });
  });
  if (!rows.length) throw Error("El archivo no contiene productos.");
  return rows;
}

function loadCatalogLibrary() {
  if (window.XLSX) return Promise.resolve();
  if (catalogLibraryPromise) return catalogLibraryPromise;
  catalogLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () =>
      window.XLSX
        ? resolve()
        : reject(new Error("La herramienta para leer Excel no se cargó."));
    script.onerror = () =>
      reject(
        new Error(
          "No fue posible cargar el lector de Excel. Prueba con la plantilla CSV.",
        ),
      );
    document.head.appendChild(script);
  });
  return catalogLibraryPromise;
}

async function readCatalogFile(file) {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "csv")
    return catalogRowsFromMatrix(parseCsvMatrix(await file.text()));
  if (extension === "xlsx" || extension === "xls") {
    await loadCatalogLibrary();
    const workbook = window.XLSX.read(await file.arrayBuffer(), {
      type: "array",
    });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw Error("El archivo Excel no tiene hojas con datos.");
    return catalogRowsFromMatrix(
      window.XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
        defval: "",
        raw: false,
      }),
    );
  }
  throw Error("Formato no compatible. Usa CSV, XLSX o XLS.");
}

function showCatalogPreview(rows, fileName) {
  pendingCatalogRows = rows;
  $("#catalog-preview").hidden = false;
  $("#catalog-error").textContent = "";
  $("#catalog-preview-title").textContent =
    rows.length +
    " " +
    (rows.length === 1 ? "producto listo" : "productos listos") +
    " para importar";
  $("#catalog-preview-detail").textContent =
    fileName + " · revisa la muestra antes de confirmar.";
  $("#catalog-preview-rows").innerHTML =
    rows
      .slice(0, 50)
      .map(
        (row) =>
          `<tr><td><strong>${esc(row.barcode)}</strong><small>${esc(row.sku || "Sin código interno")}</small></td><td>${esc(row.name)}<small>${esc(row.category || "Sin categoría")}</small></td><td>${esc([row.brand, row.format].filter(Boolean).join(" · ") || "—")}</td><td>${money(row.cost)}</td><td>${row.stock} un.</td></tr>`,
      )
      .join("") +
    (rows.length > 50
      ? `<tr><td colspan="5">Vista previa de los primeros 50 productos.</td></tr>`
      : "");
  $("#confirm-catalog-import").disabled = false;
}

function importCatalogRows(rows) {
  let created = 0;
  let updated = 0;
  for (const row of rows) {
    const barcodeMatch = linkedBarcodes.get(row.barcode);
    const skuMatch = row.sku
      ? products.find((p) => p.sku.toLowerCase() === row.sku.toLowerCase())?.id
      : null;
    if (barcodeMatch && skuMatch && barcodeMatch !== skuMatch)
      throw Error(
        `El código ${row.barcode} y el SKU ${row.sku} pertenecen a productos distintos.`,
      );
    let product = products.find((p) => p.id === (barcodeMatch || skuMatch));
    if (product) {
      if (product.barcode && product.barcode !== row.barcode)
        linkedBarcodes.delete(product.barcode);
      const oldSku = product.sku;
      product.name = row.name;
      product.barcode = row.barcode;
      product.brand = row.brand;
      product.format = row.format;
      product.category = row.category;
      product.cost = row.cost;
      product.stock = row.stock;
      product.inactive = false;
      product.rev++;
      if (row.sku && row.sku !== oldSku) {
        linkedBarcodes.delete(oldSku);
        product.sku = row.sku;
      }
      updated++;
    } else {
      const nextId = Math.max(0, ...products.map((p) => p.id)) + 1;
      let generatedSku = nextId;
      product = {
        id: nextId,
        name: row.name,
        sku: row.sku || "CAT-" + String(generatedSku).padStart(4, "0"),
        barcode: row.barcode,
        brand: row.brand,
        format: row.format,
        category: row.category,
        cost: row.cost,
        stock: row.stock,
        rev: 0,
        counts: [],
        inactive: false,
      };
      while (
        products.some((p) => p.sku.toLowerCase() === product.sku.toLowerCase())
      )
        product.sku = "CAT-" + String(++generatedSku).padStart(4, "0");
      products.push(product);
      created++;
    }
    linkedBarcodes.set(product.sku, product.id);
    linkedBarcodes.set(row.barcode, product.id);
  }
  return { created, updated };
}

$("#download-catalog-template").onclick = () => {
  const content =
    "codigo_barras,sku,nombre,marca,formato,categoria,costo,stock\r\n7802800001934,BEB-007,Jugo en polvo piña,Zuko,15 g,Bebidas,180,30\r\n";
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla-catalogo-cuadra.csv";
  link.click();
  URL.revokeObjectURL(url);
};
$("#import-catalog").onclick = () => $("#catalog-file").click();
$("#catalog-file").onchange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  $("#catalog-preview").hidden = false;
  $("#catalog-error").textContent = "Leyendo el archivo…";
  $("#confirm-catalog-import").disabled = true;
  $("#catalog-preview-rows").innerHTML = "";
  try {
    showCatalogPreview(await readCatalogFile(file), file.name);
  } catch (error) {
    pendingCatalogRows = [];
    $("#catalog-preview-title").textContent = "No se pudo preparar el catálogo";
    $("#catalog-preview-detail").textContent = file.name;
    $("#catalog-error").textContent = error.message;
  }
  event.target.value = "";
};
$("#confirm-catalog-import").onclick = () => {
  try {
    const result = importCatalogRows(pendingCatalogRows);
    log(
      "Catálogo importado",
      `${result.created} productos nuevos · ${result.updated} actualizados · Administrador de prueba`,
    );
    pendingCatalogRows = [];
    $("#catalog-preview").hidden = true;
    render();
    renderAdmin();
    $("#toast").textContent =
      `Catálogo importado: ${result.created} nuevos y ${result.updated} actualizados.`;
    $("#toast").style.display = "block";
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(
      () => ($("#toast").style.display = "none"),
      4500,
    );
  } catch (error) {
    $("#catalog-error").textContent = error.message;
  }
};

function adminStatus(product) {
  if (product.inactive)
    return { text: "Inactivo", className: "status-inactive" };
  const count = snapshot(product);
  if (!count) return { text: "Sin conteo", className: "" };
  if (count.stale) return { text: "Volver a contar", className: "" };
  if (count.diff < 0) return { text: "Faltante", className: "bad" };
  if (count.diff > 0) return { text: "Sobrante", className: "extra" };
  return { text: "Cuadra", className: "good" };
}

function renderAdmin() {
  const activeList = products.filter((p) => !p.inactive);
  const differences = activeList.filter((p) => {
    const c = snapshot(p);
    return c && !c.stale && c.diff !== 0;
  });
  const inventoryValue = activeList.reduce(
    (sum, p) => sum + p.stock * p.cost,
    0,
  );
  $("#admin-summary").innerHTML =
    `<div class="admin-summary-card"><span>Productos activos</span><strong>${activeList.length}</strong><small>${products.length - activeList.length} desactivados</small></div><div class="admin-summary-card"><span>Diferencias pendientes</span><strong>${differences.length}</strong><small>Requieren revisión</small></div><div class="admin-summary-card"><span>Inventario a costo</span><strong>${money(inventoryValue)}</strong><small>Según stock registrado</small></div>`;
  $("#admin-product-count").textContent = products.length + " productos";
  $("#admin-products").innerHTML = products
    .map((p) => {
      const c = snapshot(p);
      const status = adminStatus(p);
      const countText = !c
        ? "—"
        : c.actual +
          " un. " +
          (c.diff === 0 ? "" : `(${c.diff > 0 ? "+" : ""}${c.diff})`);
      const primaryAction =
        !p.inactive && c && !c.stale && c.diff !== 0
          ? `<button type="button" class="primary" data-admin-action="review" data-admin-id="${p.id}">Revisar diferencia</button>`
          : "";
      const stateAction = p.inactive
        ? `<button type="button" data-admin-action="reactivate" data-admin-id="${p.id}">Reactivar</button>`
        : `<button type="button" data-admin-action="deactivate" data-admin-id="${p.id}">Desactivar</button>`;
      const productMeta = [
        p.sku,
        p.barcode ? "Código " + p.barcode : "Sin código de barras",
        p.brand,
        p.format,
      ]
        .filter(Boolean)
        .join(" · ");
      return `<tr><td><strong>${esc(p.name)}</strong><small>${esc(productMeta)} · ${money(p.cost)}</small></td><td>${p.stock} un.</td><td>${countText}</td><td><span class="badge ${status.className}">${status.text}</span></td><td><div class="admin-actions">${primaryAction}<button type="button" data-admin-action="edit" data-admin-id="${p.id}">Editar</button><button type="button" data-admin-action="adjust" data-admin-id="${p.id}" ${p.inactive ? "disabled" : ""}>Ajustar stock</button>${stateAction}</div></td></tr>`;
    })
    .join("");
  $("#admin-audit").innerHTML = activity
    .slice(0, 10)
    .map(
      (a) =>
        `<li><strong>${esc(a.title)}</strong><small>${esc(a.detail)}</small><small>${esc(a.time)}</small></li>`,
    )
    .join("");
}

function openAdminAction(action, id) {
  adminAction = action;
  adminProductId = id;
  const product = products.find((p) => p.id === id);
  const count = snapshot(product);
  const panel = $("#admin-action-panel");
  const content = $("#admin-action-content");
  $("#admin-error").textContent = "";
  const titles = {
    review: "Revisar diferencia",
    edit: "Editar producto",
    adjust: "Ajustar stock",
    deactivate: "Desactivar producto",
    reactivate: "Reactivar producto",
  };
  if (action === "review") {
    content.innerHTML = `<h3>${titles[action]} · ${esc(product.name)}</h3><p class="hint">Stock registrado: <strong>${product.stock}</strong> · Conteo físico: <strong>${count.actual}</strong> · Diferencia: <strong>${count.diff > 0 ? "+" : ""}${count.diff}</strong>. Al aceptar, el stock registrado cambiará a ${count.actual}.</p><div class="admin-form-grid"><div class="full"><label for="admin-reason">Motivo del ajuste</label><select id="admin-reason" required><option value="">Seleccionar motivo</option><option>Error en una entrada anterior</option><option>Venta o devolución no registrada</option><option>Producto encontrado en bodega</option><option>Error durante el conteo</option><option>Merma, daño o pérdida</option><option>Otro motivo</option></select></div><div class="full"><label for="admin-note">Observación</label><input id="admin-note" maxlength="160" placeholder="Información adicional del ajuste"></div></div>`;
  } else if (action === "edit") {
    content.innerHTML = `<h3>${titles[action]} · ${esc(product.name)}</h3><div class="admin-form-grid"><div><label for="admin-name">Nombre</label><input id="admin-name" value="${esc(product.name)}" maxlength="80" required></div><div><label for="admin-sku">Código interno</label><input id="admin-sku" value="${esc(product.sku)}" maxlength="30" required></div><div><label for="admin-barcode">Código de barras</label><input id="admin-barcode" value="${esc(product.barcode || "")}" maxlength="32" inputmode="numeric"></div><div><label for="admin-brand">Marca</label><input id="admin-brand" value="${esc(product.brand || "")}" maxlength="60"></div><div><label for="admin-format">Formato</label><input id="admin-format" value="${esc(product.format || "")}" maxlength="60"></div><div><label for="admin-category">Categoría</label><input id="admin-category" value="${esc(product.category || "")}" maxlength="60"></div><div class="full"><label for="admin-cost">Costo unitario</label><input id="admin-cost" type="number" value="${product.cost}" min="0" max="100000000" step="1" required></div></div>`;
  } else if (action === "adjust") {
    content.innerHTML = `<h3>${titles[action]} · ${esc(product.name)}</h3><p class="hint">Stock actual: <strong>${product.stock} unidades</strong>. Este cambio quedará registrado en el historial.</p><div class="admin-form-grid"><div><label for="admin-new-stock">Nuevo stock</label><input id="admin-new-stock" type="number" value="${product.stock}" min="0" max="1000000" step="1" required></div><div><label for="admin-reason">Motivo</label><select id="admin-reason" required><option value="">Seleccionar motivo</option><option>Corrección administrativa</option><option>Entrada no registrada</option><option>Salida no registrada</option><option>Merma, daño o pérdida</option><option>Otro motivo</option></select></div><div class="full"><label for="admin-note">Observación</label><input id="admin-note" maxlength="160" placeholder="Explica brevemente el cambio"></div></div>`;
  } else {
    const verb = action === "deactivate" ? "desactivar" : "reactivar";
    content.innerHTML = `<h3>${titles[action]} · ${esc(product.name)}</h3><p class="hint">${action === "deactivate" ? "El producto dejará de aparecer en el inventario operativo, pero conservará su historial." : "El producto volverá a aparecer en el inventario y podrá contarse nuevamente."}</p><label for="admin-reason">Motivo para ${verb}</label><input id="admin-reason" maxlength="160" required placeholder="Escribe el motivo del cambio">`;
  }
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

$("#admin-products").onclick = (e) => {
  const button = e.target.closest("[data-admin-action]");
  if (button)
    openAdminAction(button.dataset.adminAction, Number(button.dataset.adminId));
};

$("#cancel-admin-action").onclick = () => {
  $("#admin-action-panel").hidden = true;
  adminAction = "";
  adminProductId = null;
};

$("#admin-action-panel").onsubmit = (e) => {
  e.preventDefault();
  const product = products.find((p) => p.id === adminProductId);
  const reason = $("#admin-reason")?.value.trim() || "";
  const note = $("#admin-note")?.value.trim() || "";
  $("#admin-error").textContent = "";
  try {
    if (adminAction === "edit") {
      const name = $("#admin-name").value.trim();
      const sku = $("#admin-sku").value.trim();
      const barcode = $("#admin-barcode").value.trim();
      const brand = $("#admin-brand").value.trim();
      const format = $("#admin-format").value.trim();
      const category = $("#admin-category").value.trim();
      const cost = Number($("#admin-cost").value);
      if (!name || !sku)
        throw Error("Completa el nombre y el código del producto.");
      if (
        products.some(
          (p) =>
            p.id !== product.id && p.sku.toLowerCase() === sku.toLowerCase(),
        )
      )
        throw Error("Ese código ya corresponde a otro producto.");
      if (barcode && !/^[0-9A-Za-z._-]{4,32}$/.test(barcode))
        throw Error("Ingresa un código de barras válido.");
      if (
        barcode &&
        linkedBarcodes.has(barcode) &&
        linkedBarcodes.get(barcode) !== product.id
      )
        throw Error("Ese código de barras ya corresponde a otro producto.");
      if (!Number.isSafeInteger(cost) || cost < 0 || cost > 100000000)
        throw Error("Ingresa un costo válido en pesos.");
      const previousSku = product.sku;
      const previous =
        product.name + " · " + product.sku + " · " + money(product.cost);
      if (product.barcode && product.barcode !== barcode)
        linkedBarcodes.delete(product.barcode);
      product.name = name;
      product.sku = sku;
      product.barcode = barcode;
      product.brand = brand;
      product.format = format;
      product.category = category;
      product.cost = cost;
      linkedBarcodes.delete(previousSku);
      linkedBarcodes.set(sku, product.id);
      if (barcode) linkedBarcodes.set(barcode, product.id);
      log(
        "Producto editado · " + name,
        "Anterior: " + previous + " · Administrador de prueba",
      );
    } else if (adminAction === "adjust") {
      const next = Number($("#admin-new-stock").value);
      if (!Number.isSafeInteger(next) || next < 0 || next > 1000000)
        throw Error("Ingresa una cantidad entera válida.");
      if (!reason) throw Error("Selecciona el motivo del ajuste.");
      const previous = product.stock;
      product.stock = next;
      product.rev++;
      log(
        "Ajuste de stock · " + product.name,
        previous +
          " → " +
          next +
          " unidades · " +
          reason +
          (note ? " · " + note : "") +
          " · Administrador de prueba",
      );
    } else if (adminAction === "review") {
      const count = snapshot(product);
      if (!count || count.stale || count.diff === 0)
        throw Error("Esta diferencia ya no está disponible para ajustar.");
      if (!reason) throw Error("Selecciona el motivo del ajuste.");
      const previous = product.stock;
      product.stock = count.actual;
      product.rev++;
      product.counts.push({
        expected: product.stock,
        actual: product.stock,
        rev: product.rev,
      });
      log(
        "Diferencia aprobada · " + product.name,
        previous +
          " → " +
          product.stock +
          " unidades · " +
          reason +
          (note ? " · " + note : "") +
          " · Administrador de prueba",
      );
    } else if (adminAction === "deactivate" || adminAction === "reactivate") {
      if (!reason) throw Error("Escribe el motivo del cambio.");
      product.inactive = adminAction === "deactivate";
      log(
        (product.inactive
          ? "Producto desactivado · "
          : "Producto reactivado · ") + product.name,
        reason + " · Administrador de prueba",
      );
    }
    $("#admin-action-panel").hidden = true;
    adminAction = "";
    adminProductId = null;
    render();
    renderAdmin();
    $("#toast").textContent = "Cambio administrativo guardado en esta sesión.";
    $("#toast").style.display = "block";
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(
      () => ($("#toast").style.display = "none"),
      3500,
    );
  } catch (error) {
    $("#admin-error").textContent = error.message;
  }
};

adminButton.onclick = () => {
  renderAdmin();
  $("#admin-action-panel").hidden = true;
  adminDialog.showModal();
};
$("#close-admin").onclick = () => adminDialog.close();
render();
