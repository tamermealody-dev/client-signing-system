// Generates identifiers in the CL-XXXXXXX shape used throughout the SRS
// (section 3 and section 8). Uses a non-sequential random token so the
// public URL never leaks how many clients exist or which record is next
// (SRS section 8 / 11: no /sign?id=123, no predictable tokens).

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I ambiguity

function randomSegment(length) {
  let out = "";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function generateClientToken() {
  return `CL-${randomSegment(7)}`;
}
