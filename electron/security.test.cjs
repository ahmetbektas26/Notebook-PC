const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");
const {
  ENCRYPTION_MAGIC,
  decryptBuffer,
  deriveKey,
  encryptBuffer,
  isEncryptedBuffer,
  normalizeAutoLockMinutes
} = require("./security.cjs");

test("AES-256-GCM metin ve ikili dosyaları kayıpsız şifreler", () => {
  const salt = crypto.randomBytes(16);
  const key = deriveKey("uzun-ve-güvenli-şifre", salt);
  const source = Buffer.concat([
    Buffer.from("Türkçe not içeriği\n"),
    crypto.randomBytes(256)
  ]);
  const encrypted = encryptBuffer(source, key);

  assert.equal(isEncryptedBuffer(encrypted), true);
  assert.equal(encrypted.subarray(0, 8).equals(ENCRYPTION_MAGIC), true);
  assert.equal(encrypted.equals(source), false);
  assert.deepEqual(decryptBuffer(encrypted, key), source);
});

test("yanlış şifre şifreli veriyi açamaz", () => {
  const salt = crypto.randomBytes(16);
  const encrypted = encryptBuffer(
    Buffer.from('{"version":4}'),
    deriveKey("doğru-şifre", salt)
  );

  assert.throws(() =>
    decryptBuffer(encrypted, deriveKey("yanlış-şifre", salt))
  );
});

test("şifrelenmemiş eski dosyalar geriye uyumlu biçimde okunur", () => {
  const source = Buffer.from("eski düz dosya");
  const key = crypto.randomBytes(32);

  assert.equal(isEncryptedBuffer(source), false);
  assert.deepEqual(decryptBuffer(source, key), source);
});

test("eksik şifreli dosya sessizce kabul edilmez", () => {
  const truncated = Buffer.concat([ENCRYPTION_MAGIC, Buffer.alloc(5)]);
  assert.throws(
    () => decryptBuffer(truncated, crypto.randomBytes(32)),
    /eksik veya bozuk/
  );
});

test("otomatik kilit süresi sonlu ve güvenli aralıkta tutulur", () => {
  assert.equal(normalizeAutoLockMinutes(-5), 0);
  assert.equal(normalizeAutoLockMinutes("15"), 15);
  assert.equal(normalizeAutoLockMinutes(99999), 1440);
  assert.equal(normalizeAutoLockMinutes(Number.NaN), 0);
});
