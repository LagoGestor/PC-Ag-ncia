// Prazo = data de entrega + horário (se não tiver horário, vale até o fim do dia). Sempre no fuso de Brasília,
// pra servidor (Vercel, UTC) e navegador concordarem.
export function agoraBRT(): { data: string; hora: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value])
  );
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

export function isOverdue(entrega: string, horario = ""): boolean {
  if (!entrega) return false;
  const { data, hora } = agoraBRT();
  return entrega < data || (entrega === data && !!horario && horario < hora);
}
