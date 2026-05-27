#!/usr/bin/env node
// scripts/generate-vapid.mjs — Sprint 14 K3.1
// Generates a VAPID ECDSA P-256 keypair for Web Push (RFC 8291 / RFC 8292).
//
// Usage:  node scripts/generate-vapid.mjs
//   or:   npm run vapid
//
// Output:
//   VAPID_PUBLIC_KEY=<base64url uncompressed P-256 point, 87 chars>
//   VAPID_PRIVATE_KEY=<base64url private scalar, 43 chars>
//
// What to do with the output:
//   1. Copy VAPID_PUBLIC_KEY value into index.njk + cheatsheet-signage-rotterdam-2026/index.njk
//      (replace the placeholder string in the push opt-in <script> blocks).
//   2. Set VAPID_PRIVATE_KEY as a CF Pages secret:
//      CF Dashboard -> Pages -> alfareclame-pages -> Settings ->
//      Environment variables -> Production -> Add variable.
//   3. Optionally set ADMIN_TOKEN the same way for the push-send admin endpoint.
//   4. Do NOT commit the private key anywhere.

import { generateKeyPairSync } from 'node:crypto';
import { Buffer } from 'node:buffer';

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });

// Export public key as uncompressed point (X9.62 section 4.3.6): 0x04 || X || Y
const publicJwk = publicKey.export({ format: 'jwk' });
const xy = Buffer.concat([
  Buffer.from(publicJwk.x, 'base64url'),
  Buffer.from(publicJwk.y, 'base64url'),
]);
const publicB64 = Buffer.concat([Buffer.from([0x04]), xy]).toString('base64url');

// Export private key scalar d
const privateJwk = privateKey.export({ format: 'jwk' });
const privateB64 = Buffer.from(privateJwk.d, 'base64url').toString('base64url');

console.log('VAPID_PUBLIC_KEY=' + publicB64);
console.log('VAPID_PRIVATE_KEY=' + privateB64);
console.log('');
console.log('# --- INSTRUCTIONS ---');
console.log('# 1. Embed VAPID_PUBLIC_KEY in index.njk and cheatsheet-signage-rotterdam-2026/index.njk');
console.log('#    (replace the VAPID_PUBLIC constant value in the push opt-in <script> block).');
console.log('# 2. Set VAPID_PRIVATE_KEY as CF Pages secret (see outreach/push-setup-stappen.md).');
console.log('# 3. Do NOT commit VAPID_PRIVATE_KEY to git.');
