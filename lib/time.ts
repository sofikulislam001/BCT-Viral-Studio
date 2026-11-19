// Dhaka is UTC+6 with no DST, so a fixed offset is exact.
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

// Start of the current calendar day in Asia/Dhaka, as a UTC Date.
export function dhakaDayStart(now: Date = new Date()) {
  const shifted = new Date(now.getTime() + DHAKA_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - DHAKA_OFFSET_MS);
}
