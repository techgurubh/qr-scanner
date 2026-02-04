const resultEl = document.getElementById("result");
const flashBtn = document.getElementById("flashBtn");
const copyBtn = document.getElementById("copyBtn");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

let html5QrCode;
let torchOn = false;

/* ======================
   SUCCESS HANDLER
====================== */
function onScanSuccess(decodedText) {
  resultEl.textContent = decodedText;

  // Vibrate on success
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }

  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
  }
}

/* ======================
   CAMERA SCANNER
====================== */
function startScanner() {
  html5QrCode = new Html5Qrcode("reader");

  Html5Qrcode.getCameras().then(cameras => {
    const backCam =
      cameras.find(c => c.label.toLowerCase().includes("back")) || cameras[0];

    html5QrCode
      .start(
        backCam.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess
      )
      .then(() => {
        html5QrCode.getRunningTrackCapabilities().then(cap => {
          if (cap.torch) flashBtn.classList.remove("hidden");
        });
      });
  });
}

/* ======================
   FLASH / TORCH
====================== */
flashBtn.onclick = () => {
  torchOn = !torchOn;
  html5QrCode.applyVideoConstraints({
    advanced: [{ torch: torchOn }]
  });
};

/* ======================
   COPY RESULT
====================== */
copyBtn.onclick = () => {
  if (!resultEl.textContent) return;
  navigator.clipboard.writeText(resultEl.textContent);
  alert("Copied");
};

/* ======================
   IMAGE FILE SCAN (jsQR)
====================== */
function scanImageFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const code = jsQR(
        imageData.data,
        imageData.width,
        imageData.height,
        { inversionAttempts: "attemptBoth" }
      );

      if (code) {
        onScanSuccess(code.data);
      } else {
        alert("No QR detected in image");
      }
    };
    img.src = reader.result;
  };

  reader.readAsDataURL(file);
}

/* ======================
   FILE UPLOAD
====================== */
fileInput.onchange = e => {
  const file = e.target.files[0];
  if (file) scanImageFile(file);
};

/* ======================
   DRAG & DROP
====================== */
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
  if (file) scanImageFile(file);
};

/* ======================
   START CAMERA
====================== */
startScanner();
