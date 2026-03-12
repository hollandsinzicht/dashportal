import CryptoJS from "crypto-js";

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "[encryption] ENCRYPTION_KEY env var is niet ingesteld. " +
      "Stel deze in via .env.local of Vercel environment variables."
    );
  }
  return key;
}

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, getEncryptionKey()).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getEncryptionKey());
  return bytes.toString(CryptoJS.enc.Utf8);
}
