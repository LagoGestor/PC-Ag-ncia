"use client";

import { FOTOS_RESPONSAVEL } from "@/types";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface Props {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 18 }: Props) {
  const foto = FOTOS_RESPONSAVEL[name];
  const style = { width: size, height: size, fontSize: Math.max(7, Math.round(size * 0.42)) };

  if (!foto) {
    return (
      <span className="avatar-badge" style={style}>
        {initials(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="avatar-badge avatar-badge-photo"
      style={style}
      src={foto}
      alt={name}
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        el.outerHTML = `<span class="avatar-badge" style="width:${size}px;height:${size}px;font-size:${style.fontSize}px">${initials(
          name
        )}</span>`;
      }}
    />
  );
}
