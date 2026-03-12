/**
 * UUID validatie utilities.
 *
 * Wordt gebruikt om Azure Tenant ID en Client ID te valideren
 * voordat ze naar de Microsoft token endpoint worden gestuurd.
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check of een waarde een geldig UUID v4 formaat heeft.
 * Accepteert zowel lowercase als uppercase hex.
 */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

/**
 * Valideer een UUID veld en geef een foutmelding terug.
 * @returns Foutmelding string als ongeldig, null als geldig of leeg.
 */
export function validateUUID(
  value: string,
  fieldName: string
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null; // Leeg is geen UUID-fout — dat is een "required" check
  if (!isValidUUID(trimmed)) {
    return `${fieldName} moet een geldig UUID formaat hebben (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)`;
  }
  return null;
}
