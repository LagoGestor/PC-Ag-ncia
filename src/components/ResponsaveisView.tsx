"use client";

import Link from "next/link";
import { RESPONSAVEIS, slugify } from "@/types";
import { Avatar } from "./Avatar";

export function ResponsaveisView() {
  return (
    <div>
      <div className="fixas-header">
        <div>
          <h2 className="fixas-title">Responsáveis</h2>
          <p className="fixas-subtitle">Toque em uma pessoa para abrir a lista de tarefas exclusiva dela.</p>
        </div>
      </div>

      <div className="resp-grid">
        {RESPONSAVEIS.map((r) => (
          <Link key={r} href={`/mobile/${slugify(r)}`} className="resp-card">
            <Avatar name={r} size={96} />
            <span className="resp-card-name">{r}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
