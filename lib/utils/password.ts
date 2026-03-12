/**
 * Genereert een veilig, leesbaar tijdelijk wachtwoord.
 *
 * Formaat: XxxxXxxx-0000  (8 letters + dash + 4 cijfers)
 * Voorbeeld: BlueFrog-3847
 *
 * Makkelijk over te lezen/typen, maar sterk genoeg als tijdelijk wachtwoord.
 */

const ADJECTIVES = [
  "Blue", "Red", "Gold", "Fast", "Bold", "Cool", "Dark", "Deep",
  "Fair", "Fine", "Free", "Good", "Keen", "Kind", "Pure", "Rich",
  "Safe", "True", "Warm", "Wise", "Calm", "Soft", "Tall", "Wild",
];

const NOUNS = [
  "Bear", "Bird", "Deer", "Duck", "Frog", "Hawk", "Lion", "Lynx",
  "Pike", "Seal", "Swan", "Wolf", "Bolt", "Coin", "Drum", "Flag",
  "Gate", "Helm", "Jade", "Kite", "Leaf", "Moon", "Peak", "Star",
];

export function generateTempPassword(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = String(Math.floor(1000 + Math.random() * 9000)); // 4 digits
  return `${adj}${noun}-${num}`;
}
