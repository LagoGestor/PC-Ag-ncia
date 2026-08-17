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
        <Link href="/mobile" className="resp-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="avatar-badge avatar-badge-photo" style={{ width: 96, height: 96 }} src="/img/perfil_agencia.jpg" alt="Geral" />
          <span className="resp-card-name">Geral</span>
        </Link>
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
