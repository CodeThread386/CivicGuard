/**
 * Secure key storage - keys encrypted with user-provided secret
 * Unlock requires WebAuthn (biometric) - secret derived from WebAuthn or stored encrypted
 */

import { get, set, del } from "idb-keyval";

const KEYS_PREFIX = "civicguard_keys_";
const LOCKED_KEY = "civicguard_locked";

export async function isLocked(): Promise<boolean> {
  try {
    const locked = await get(LOCKED_KEY);
    return locked === true;
  } catch {
    return true;
  }
}

export async function storeEncryptedKeys(
  encryptedData: string,
  userId: string,
): Promise<void> {
  await set(`${KEYS_PREFIX}${userId}`, encryptedData);
  await set(LOCKED_KEY, false);
}

export async function getEncryptedKeys(userId: string): Promise<string | null> {
  return (await get(`${KEYS_PREFIX}${userId}`)) ?? null;
}

export async function clearKeys(userId: string): Promise<void> {
  await del(`${KEYS_PREFIX}${userId}`);
  await set(LOCKED_KEY, true);
}

export async function lock(): Promise<void> {
  await set(LOCKED_KEY, true);
}

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    } as any,
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptWithKey(
  key: CryptoKey,
  data: string,
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data),
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptWithKey(
  key: CryptoKey,
  ciphertext: string,
  iv: string,
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: Uint8Array.from(atob(iv), (c) => c.charCodeAt(0)),
    },
    key,
    Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0)),
  );
  return new TextDecoder().decode(decrypted);
}
