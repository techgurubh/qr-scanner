const qrTypeEl = document.getElementById("qrType");
const resultEl = document.getElementById("result");
const flashBtn = document.getElementById("flashBtn");
const copyBtn = document.getElementById("copyBtn");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

let html5QrCode;
let torchOn = false;

/* ======================
   HELPER FUNCTION 
====================== */
function detectQrType(rawText) {
  // Try JSON-based detection
  try {
    const obj = JSON.parse(rawText);

    if (obj.pan || obj.PAN) return "PAN Card QR";
    if (obj.epic || obj.EPIC || obj.epic_no) return "Voter ID QR";

    return "JSON QR";
  } catch (e) {
    // Not JSON
  }

  // Aadhaar Secure QR (encrypted, long base64)
  const aadhaarPattern = /^[A-Za-z0-9+/=]{100,}$/;
  if (aadhaarPattern.test(rawText)) {
    return "Aadhaar Secure QR (Encrypted)";
  }

  // URL QR
  if (rawText.startsWith("http://") || rawText.startsWith("https://")) {
    return "URL QR";
  }

  return "Generic QR";
}

/* ======================
   SUCCESS HANDLER
====================== */
function onScanSuccess(decodedText) {
  let output = decodedText;

  // Detect QR type
  const detectedType = detectQrType(decodedText);
  qrTypeEl.textContent = "Detected Type: " + detectedType;

  // JSON formatter
  try {
    const parsed = JSON.parse(decodedText);
    output = JSON.stringify(parsed, null, 2);
  } catch (e) {
    // Not JSON
  }

  resultEl.textContent = output;

  // Vibrate
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }

  // Stop camera
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
