const FOTO_MAX_BYTES = 1024 * 1024; // a imagem já chega pequena do navegador; 1MB é só folga

// Só aceita imagem em data URL e dentro do limite; qualquer outra coisa vira "sem foto".
export function fotoValida(v: unknown): string {
  return typeof v === "string" && v.startsWith("data:image/") && v.length <= FOTO_MAX_BYTES ? v : "";
}
