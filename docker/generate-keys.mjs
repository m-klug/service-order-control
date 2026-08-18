// Gera JWT_SECRET + ANON_KEY + SERVICE_ROLE_KEY pro self-host (docker/.env).
// Mesmo formato de token usado pelo Supabase (role "anon"/"service_role").
// Uso: node docker/generate-keys.mjs
import crypto from 'node:crypto';

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

const jwtSecret = crypto.randomBytes(32).toString('hex');
const now = Math.floor(Date.now() / 1000);
const tenYears = 10 * 365 * 24 * 60 * 60;

const anonKey = signJWT(
  { role: 'anon', iss: 'supabase', iat: now, exp: now + tenYears },
  jwtSecret,
);
const serviceRoleKey = signJWT(
  { role: 'service_role', iss: 'supabase', iat: now, exp: now + tenYears },
  jwtSecret,
);

console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ANON_KEY=${anonKey}`);
console.log(`SERVICE_ROLE_KEY=${serviceRoleKey}`);
