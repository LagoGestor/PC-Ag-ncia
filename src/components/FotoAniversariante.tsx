interface Props {
  foto: string;
  nome: string;
  size?: number;
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

// Foto redonda do aniversariante; sem foto, círculo com as iniciais.
export function FotoAniversariante({ foto, nome, size = 36 }: Props) {
  const estilo = { width: size, height: size };
  return foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={foto} alt="" className="aniv-foto" style={estilo} />
  ) : (
    <span className="aniv-foto aniv-foto-ini" style={{ ...estilo, fontSize: Math.round(size * 0.38) }}>
      {iniciais(nome)}
    </span>
  );
}
