"use client";

import { AppTopbar } from "./AppTopbar";
import { ViewTabs } from "./ViewTabs";

// Topo completo da ferramenta (topbar + abas) pras páginas avulsas, pra não perderem o menu da página principal.
export function AppHeader({ ativo }: { ativo?: "aniversariantes" | "performance" }) {
  return (
    <>
      <AppTopbar />
      <div id="view-nav">
        <div className="view-tabs">
          <ViewTabs view={null} ativo={ativo} />
        </div>
      </div>
    </>
  );
}
