/**
 * Generador de contraseñas temporales legibles.
 *
 * Se usa cuando un AA crea una cuenta o restablece una contraseña. El
 * resultado siempre cumple la política mínima: 10+ caracteres, al menos una
 * letra y un número. Se muestra una sola vez y nunca se guarda en claro.
 */
const WORDS = [
  "Sendero",
  "Cumbre",
  "Pionero",
  "Fogon",
  "Bosque",
  "Camino",
  "Montana",
  "Estrella",
  "Luna",
  "Rio",
  "Valle",
  "Nieve",
  "Anil",
  "Roca",
  "Cielo",
  "Bruma",
] as const;

function randomInt(max: number) {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] % max;
}

function pickWord(exclude?: string) {
  let word: string = WORDS[randomInt(WORDS.length)];
  let guard = 0;
  while (word === exclude && guard < 10) {
    word = WORDS[randomInt(WORDS.length)];
    guard += 1;
  }
  return word;
}

export function generateTemporaryPassword() {
  const first = pickWord();
  const second = pickWord(first);
  const digits = 1000 + randomInt(9000);
  return `${first}${second}${digits}!`;
}

export const PASSWORD_RULES_HINT =
  "Mínimo 10 caracteres, con al menos una letra y un número.";
