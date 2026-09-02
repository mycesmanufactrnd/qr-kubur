import { createWorker } from "tesseract.js";

// Loads an image File into an <img>, draws it to a canvas with grayscale +
// contrast-stretch preprocessing (same technique used for IC capture in
// DeathCharityUserPayment.jsx) — this consistently improves Tesseract's
// accuracy on photographed documents versus feeding it the raw photo.
const preprocessImageFile = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = imgData.data;
      for (let i = 0; i < px.length; i += 4) {
        const gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
        px[i] = px[i + 1] = px[i + 2] = enhanced;
      }
      ctx.putImageData(imgData, 0, 0);

      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

// Runs OCR on a document photo (death confirmation letter / police report)
// and returns the raw recognized text.
export async function recognizeDocumentText(file) {
  const canvas = await preprocessImageFile(file);
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(canvas);
    return data.text || "";
  } finally {
    await worker.terminate();
  }
}

const LABEL_PATTERNS = {
  name: /(?:nama(?:\s+penuh)?|full\s*name|name)\s*[:\-]?\s*([^\n]+)/i,
  icnumber:
    /(?:no\.?\s*k\/?p|no\.?\s*ic|ic\s*(?:no\.?|number)|kad\s*pengenalan)\s*[:\-]?\s*([0-9][0-9\s\-]{9,20})/i,
  dateofbirth:
    /(?:tarikh\s*lahir|date\s*of\s*birth|d\.?o\.?b\.?)\s*[:\-]?\s*([0-9]{1,2}[\/\-. ][0-9]{1,2}[\/\-. ][0-9]{2,4})/i,
  dateofdeath:
    /(?:tarikh\s*(?:ke)?matian|date\s*of\s*death)\s*[:\-]?\s*([0-9]{1,2}[\/\-. ][0-9]{1,2}[\/\-. ][0-9]{2,4})/i,
  causeofdeath:
    /(?:punca\s*kematian|sebab\s*kematian|cause\s*of\s*death)\s*[:\-]?\s*([^\n]+)/i,
  gravelot:
    /(?:lot\s*kubur|no\.?\s*lot(?:\s*kubur)?|grave\s*lot)\s*[:\-]?\s*([^\n]+)/i,
};

const cleanCapturedLine = (value) =>
  value
    .trim()
    .replace(/[.,;:]+$/, "")
    .trim();

const toIsoDate = (raw) => {
  if (!raw) return null;
  const match = raw
    .trim()
    .match(/^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{2,4})/);
  if (!match) return null;

  let [, day, month, year] = match;
  if (year.length === 2) year = `20${year}`;

  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().split("T")[0];
};

// Best-effort extraction of DeadPerson fields from OCR'd document text.
// Labels may appear in Malay, English, or mixed — the user always reviews
// and can edit every field before saving, so false negatives are fine;
// this only needs to catch the common cases.
export function extractDeadPersonFields(rawText) {
  const text = (rawText || "").replace(/\r/g, "");
  const result = {};

  const nameMatch = text.match(LABEL_PATTERNS.name);
  if (nameMatch) result.name = cleanCapturedLine(nameMatch[1]);

  const icMatch = text.match(LABEL_PATTERNS.icnumber);
  if (icMatch) {
    const digits = icMatch[1].replace(/\D/g, "");
    if (digits.length === 12) result.icnumber = digits;
  }

  const dobMatch = text.match(LABEL_PATTERNS.dateofbirth);
  const dob = dobMatch && toIsoDate(dobMatch[1]);
  if (dob) result.dateofbirth = dob;

  const dodMatch = text.match(LABEL_PATTERNS.dateofdeath);
  const dod = dodMatch && toIsoDate(dodMatch[1]);
  if (dod) result.dateofdeath = dod;

  const causeMatch = text.match(LABEL_PATTERNS.causeofdeath);
  if (causeMatch) result.causeofdeath = cleanCapturedLine(causeMatch[1]);

  const lotMatch = text.match(LABEL_PATTERNS.gravelot);
  if (lotMatch) result.gravelot = cleanCapturedLine(lotMatch[1]);

  return result;
}
