// NOTE: This page intentionally has NO Firebase dependency — it runs fully
// offline. The global `qrcode` comes from the CDN script tag in qr.html.


// ===============================
// ELEMENTS
// ===============================

const baseUrlInput = document.getElementById("baseUrl");
const idInput      = document.getElementById("idInput");
const csvFileInput = document.getElementById("csvFile");
const loadCsvBtn   = document.getElementById("loadCsvBtn");
const generateBtn  = document.getElementById("generateBtn");
const messageEl    = document.getElementById("message");
const resultPanel  = document.getElementById("resultPanel");
const resultCount  = document.getElementById("resultCount");
const qrGrid       = document.getElementById("qrGrid");
const printBtn     = document.getElementById("printBtn");

const DEFAULT_BASE = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}verify.html`;
baseUrlInput.value = DEFAULT_BASE;


// ===============================
// CSV IMPORT
// ===============================

loadCsvBtn.addEventListener("click", () => csvFileInput.click());

csvFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const text = String(reader.result || "");

        // Strip a header row if the first cell is a label like "member_id".
        const lines = text.split(/\r?\n/);
        if (lines.length && /^\s*(?:member_?id|id)\s*[,;\t]/i.test(lines[0])) {
            lines.shift();
        }

        idInput.value = lines.join("\n");
    };
    reader.readAsText(file);
    csvFileInput.value = "";
});


// ===============================
// GENERATE
// ===============================

generateBtn.addEventListener("click", () => {
    messageEl.textContent = "";
    messageEl.className   = "message";

    const base = baseUrlInput.value.trim().replace(/[?#].*$/, "").replace(/\/+$/, "");
    if (!base) {
        setMessage("Provide the verification page URL.", "error");
        return;
    }

    const ids = extractIds(idInput.value);
    if (ids.length === 0) {
        setMessage("Enter at least one member ID to generate codes.", "error");
        return;
    }
    if (ids.length > 500) {
        setMessage(`Limit is 500 codes per batch (got ${ids.length}).`, "error");
        return;
    }

    qrGrid.innerHTML = "";
    const unique = new Set(ids);

    unique.forEach((id) => {
        const url = `${base}?id=${encodeURIComponent(id)}`;
        qrGrid.appendChild(makeCell(id, url));
    });

    resultCount.textContent = `${unique.size} QR code${unique.size === 1 ? "" : "s"} ready — each opens the verification page for that member.`;
    resultPanel.classList.remove("hidden");
    setMessage(`Generated ${unique.size} codes.`, "success");
});


function extractIds(text) {
    return String(text)
        .split(/[\r\n,;\t]+/)
        .map((part) => part.trim().toUpperCase())
        .filter((part) => part.length > 0 && !/^(?:valid|expired|name|status)$/i.test(part));
}


function makeCell(id, url) {
    const cell = document.createElement("div");
    cell.className = "qr-cell";

    const img = renderQr(url, 150);
    const idLabel = document.createElement("div");
    idLabel.className = "qr-id";
    idLabel.textContent = id;
    const urlLabel = document.createElement("div");
    urlLabel.className = "qr-url";
    urlLabel.textContent = url;

    const actions = document.createElement("div");
    actions.className = "qr-actions";
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "btn-ghost";
    downloadBtn.textContent = "PNG";
    downloadBtn.addEventListener("click", () => downloadPng(img, id));

    cell.appendChild(img);
    cell.appendChild(idLabel);
    cell.appendChild(urlLabel);

    // Actions are page-only, not part of the printed card.
    const printActions = document.createElement("div");
    printActions.className = "qr-actions print-hide";
    printActions.appendChild(downloadBtn);
    cell.appendChild(printActions);

    return cell;
}


function renderQr(text, size) {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();

    const count = qr.getModuleCount();
    const cell = size / count;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
            if (qr.isDark(row, col)) {
                ctx.fillRect(col * cell, row * cell, cell, cell);
            }
        }
    }

    const img = document.createElement("img");
    img.alt = text;
    img.width = size;
    img.height = size;
    img.src = canvas.toDataURL("image/png");
    return img;
}


function downloadPng(img, id) {
    const a = document.createElement("a");
    a.download = `member-${id}.png`;
    a.href = img.src;
    document.body.appendChild(a);
    a.click();
    a.remove();
}


printBtn.addEventListener("click", () => window.print());


function setMessage(text, kind) {
    messageEl.textContent = text;
    messageEl.className = `message ${kind}`;
}