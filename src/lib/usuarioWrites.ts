import { prisma } from "./prisma";

// Em ambiente serverless, uma leitura logo após gravar a senha às vezes não enxerga o
// valor novo ainda (a escrita "não pegou" na primeira tentativa). Confere lendo de volta
// e regrava se for o caso, antes de responder ao cliente.
export async function confirmarSenhaGravada(id: string, senhaHashEsperado: string): Promise<void> {
  const confere = await prisma.usuario.findUnique({ where: { id }, select: { senhaHash: true } });
  if (confere?.senhaHash !== senhaHashEsperado) {
    await prisma.usuario.update({ where: { id }, data: { senhaHash: senhaHashEsperado } });
  }
}
