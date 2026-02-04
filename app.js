const resultEl = document.getElementById("result");
const flashBtn = document.getElementById("flashBtn");
const copyBtn = document.getElementById("copyBtn");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

let html5QrCode;
let torchOn = false;

function onScanSuccess(decodedText) {
  resultEl.textContent = decodedText;

  // Vibrate on success
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }

  html5QrCode.stop();
}

function startScanner() {
  html5QrCode = new Html5Qrcode("reader");

  Html5Qrcode.getCameras().then(cameras => {
    const backCam = cameras.find(c => c.label.toLowerCase().includes("back")) || cameras[0];

    html5QrCode.start(
      backCam.id,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      onScanSuccess
    ).then(() => {
      html5QrCode.getRunningTrackCapabilities().then(cap => {
        if (cap.torch) flashBtn.classList.remove("hidden");
      });
    });
  });
}

// Flash toggle
flashBtn.onclick = () => {
  torchOn = !torchOn;
  html5QrCode.applyVideoConstraints({
    advanced: [{ torch: torchOn }]
  });
};

// Copy result
copyBtn.onclick = () => {
  navigator.clipboard.writeText(resultEl.textContent);
  alert("Copied");
};

// Upload image scan
fileInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  Html5Qrcode.scanFile(file, true)
    .then(onScanSuccess)
    .catch(err => alert("QR not detected"));
};

// Drag & Drop
dropZone.ondragover = e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
};

dropZone.ondragleave = () => {
  dropZone.classList.remove("dragover");
};

dropZone.ondrop = e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const file = e.dataTransfer.files[0];
  if (!file) return;

  Html5Qrcode.scanFile(file, true)
    .then(onScanSuccess)
    .catch(err => alert("QR not detected"));
};

startScanner();
