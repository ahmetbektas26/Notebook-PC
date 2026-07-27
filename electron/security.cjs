const crypto = require("node:crypto");

const ENCRYPTION_MAGIC = Buffer.from("NBPCENC1");
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function deriveKey(passcode, salt) {
  return crypto.scryptSync(String(passcode), salt, KEY_LENGTH);
}

function isEncryptedBuffer(bytes) {
  return (
    Buffer.isBuffer(bytes) &&
    bytes.length >= ENCRYPTION_MAGIC.length &&
    bytes.subarray(0, ENCRYPTION_MAGIC.length).equals(ENCRYPTION_MAGIC)
  );
}

function encryptBuffer(bytes, key) {
  const source = Buffer.from(bytes);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(source), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([ENCRYPTION_MAGIC, iv, tag, encrypted]);
}

function decryptBuffer(bytes, key) {
  const source = Buffer.from(bytes);
  if (!isEncryptedBuffer(source)) return source;

  const minimumLength = ENCRYPTION_MAGIC.length + IV_LENGTH + TAG_LENGTH;
  if (source.length < minimumLength) {
    throw new Error("Şifreli dosya eksik veya bozuk.");
  }

  const ivStart = ENCRYPTION_MAGIC.length;
  const tagStart = ivStart + IV_LENGTH;
  const contentStart = tagStart + TAG_LENGTH;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    source.subarray(ivStart, tagStart)
  );
  decipher.setAuthTag(source.subarray(tagStart, contentStart));
  return Buffer.concat([
    decipher.update(source.subarray(contentStart)),
    decipher.final()
  ]);
}

module.exports = {
  ENCRYPTION_MAGIC,
  decryptBuffer,
  deriveKey,
  encryptBuffer,
  isEncryptedBuffer
};
