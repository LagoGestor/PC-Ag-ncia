"use client";

import { useEffect, useMemo, useState } from "react";
import { getWeekDays, toKey } from "@/lib/semana";
import { PostagensSemanaView, PostItem } from "./PostagensSemanaView";

// "Postagens da Semana" só pra ver (Executor): tudo que vai ao ar nas redes, de todos, sem responsável nem edição.
export function PostagensSemanaLeitura({ onBack }: { onBack: () => void }) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [posts, setPosts] = useState<PostItem[]>([]);

  useEffect(() => {
    fetch("/api/postagens-instagram?todas=1")
      .then((r) => (r.ok ? r.json() : []))
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, PostItem[]>();
    for (const p of posts) {
      if (!p.entrega) continue;
      map.set(p.entrega, [...(map.get(p.entrega) ?? []), p]);
    }
    for (const arr of map.values()) arr.sort((a, b) => (a.horarioPublicacao || "99:99").localeCompare(b.horarioPublicacao || "99:99"));
    return map;
  }, [posts]);

  const dias = getWeekDays(anchor);
  const shift = (n: number) => setAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));

  return (
    <PostagensSemanaView
      days={dias}
      byDay={byDay}
      label={`${dias[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${dias[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`}
      toKey={toKey}
      somenteLeitura
      onBack={onBack}
      onPrev={() => shift(-7)}
      onNext={() => shift(7)}
      onToday={() => setAnchor(new Date())}
    />
  );
}
