"use client";

import { useState } from "react";
import { Qr } from "@/components/qr";
import { COLORS, TemplateEditor } from "@/components/template-editor";
import { BORDER, Button, Card, PageTitle, SectionTitle, Skeleton } from "@/components/ui";
import { buildPlan, encodePlan } from "@/lib/plan";
import { uid, useApp, useExercises, useHydrated } from "@/lib/store";
import type { Template } from "@/lib/types";

const field =
  "w-full rounded-sm border border-line bg-iron px-3 py-2.5 outline-none transition placeholder:text-chalk-dim focus:border-plate-yellow";

// Modo personal: monta as fichas do aluno e manda por link, WhatsApp ou QR Code.
export default function Personal() {
  const hydrated = useHydrated();
  const draft = useApp((s) => s.draft);
  const mine = useApp((s) => s.templates);
  const custom = useApp((s) => s.customExercises);
  const { setDraft, saveDraftTemplate, removeDraftTemplate, newStudent } = useApp.getState();
  const exercises = useExercises();
  const [editing, setEditing] = useState<Template | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!hydrated) return <Skeleton />;

  const blank = (): Template => ({
    id: uid(),
    name: `Treino ${String.fromCharCode(65 + draft.templates.length)}`,
    color: COLORS[draft.templates.length % COLORS.length],
    items: [],
  });

  const ready = draft.templates.length > 0 && draft.student.trim().length > 0;
  const url = ready ? `${location.origin}/aluno#${encodePlan(buildPlan(draft, custom))}` : "";
  const message = `Fala, ${draft.student.trim()}! Montei suas fichas no Frango Fit 💪 Abre o link e toca em "Adicionar":\n${url}`;

  return (
    <div>
      <PageTitle eyebrow="Modo personal" title="Ficha pro aluno">
        <Button onClick={() => confirm("Começar um aluno novo? As fichas deste rascunho somem daqui (quem já recebeu o link continua com elas).") && newStudent()}>
          Novo aluno
        </Button>
      </PageTitle>

      <p className="-mt-4 mb-8 max-w-2xl text-sm text-chalk-soft">
        Monte as fichas com carga inicial e observações e mande o link. O aluno abre no celular e adiciona tudo no Frango Fit com um toque. Mudou
        alguma coisa? Mande o link de novo: as fichas são atualizadas, sem duplicar.
      </p>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-pixel text-[9px] uppercase text-chalk-dim">Seu nome</span>
            <input value={draft.coach} onChange={(e) => setDraft({ coach: e.target.value.slice(0, 40) })} placeholder="Como o aluno te chama" className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block font-pixel text-[9px] uppercase text-chalk-dim">Nome do aluno</span>
            <input value={draft.student} onChange={(e) => setDraft({ student: e.target.value.slice(0, 40) })} placeholder="Pra quem é a ficha" className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block font-pixel text-[9px] uppercase text-chalk-dim">Recado (opcional)</span>
            <textarea
              value={draft.note}
              onChange={(e) => setDraft({ note: e.target.value.slice(0, 400) })}
              rows={2}
              placeholder="Ex.: 4x por semana, alterna A e B. Aquece 10 min na esteira antes."
              className={`${field} resize-none`}
            />
          </label>
        </div>
      </Card>

      <div className="mt-8">
        <SectionTitle
          aside={
            !editing && (
              <div className="flex flex-wrap justify-end gap-2">
                {mine.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      const t = mine.find((x) => x.id === e.target.value);
                      if (t) saveDraftTemplate({ ...t, id: uid(), coach: undefined });
                    }}
                    aria-label="Copiar uma das minhas fichas"
                    className="rounded-sm border border-line bg-iron px-2 py-2 font-pixel text-[10px] uppercase text-chalk outline-none focus:border-plate-yellow"
                  >
                    <option value="">Copiar das minhas</option>
                    {mine.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
                <Button variant="red" className="py-2" onClick={() => setEditing(blank())}>
                  + Nova ficha
                </Button>
              </div>
            )
          }
        >
          Fichas{draft.student.trim() ? ` de ${draft.student.trim()}` : ""}
        </SectionTitle>

        {editing ? (
          <TemplateEditor key={editing.id} initial={editing} onSave={saveDraftTemplate} onClose={() => setEditing(null)} saveLabel="Salvar na ficha do aluno" />
        ) : draft.templates.length === 0 ? (
          <Card>
            <p className="text-sm text-chalk-soft">Nenhuma ficha ainda. Crie do zero ou copie uma das suas e ajuste pro aluno.</p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {draft.templates.map((t) => (
              <Card key={t.id} className={`border-l-4 ${BORDER[t.color]}`}>
                <p className="font-display text-2xl uppercase leading-tight">{t.name}</p>
                <ul className="mt-3 space-y-1.5">
                  {t.items.map((it, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="truncate text-chalk-soft">{exercises.find((e) => e.id === it.exerciseId)?.name ?? "?"}</span>
                        <span className="shrink-0 font-pixel text-[9px] uppercase text-chalk-dim">
                          {it.sets}×{it.reps}
                          {it.kg ? ` · ${it.kg} kg` : ""} · {it.rest}s
                        </span>
                      </div>
                      {it.note && <p className="text-xs text-plate-yellow">✎ {it.note}</p>}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1 py-2" onClick={() => setEditing(t)}>
                    Editar
                  </Button>
                  <Button variant="danger" className="py-2" onClick={() => removeDraftTemplate(t.id)}>
                    Tirar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {!editing && (
        <div className="mt-8">
          <SectionTitle>Mandar pro aluno</SectionTitle>
          <Card className="border-plate-yellow/40">
            {!ready ? (
              <p className="text-sm text-chalk-soft">Coloque o nome do aluno e pelo menos uma ficha para gerar o link.</p>
            ) : (
              <div className="grid items-start gap-6 md:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-sm bg-plate-green px-4 py-3.5 font-pixel text-[11px] uppercase text-iron shadow-[0_4px_0_#23784a] transition active:translate-y-1 active:shadow-none"
                  >
                    Mandar no WhatsApp
                  </a>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      await navigator.clipboard.writeText(url).catch(() => {});
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    }}
                  >
                    {copied ? "Link copiado!" : "Copiar link"}
                  </Button>
                  <Button className="w-full" onClick={() => setShowQr((v) => !v)} aria-pressed={showQr}>
                    {showQr ? "Esconder QR Code" : "Mostrar QR Code (aluno do lado)"}
                  </Button>
                  <p className="text-xs text-chalk-dim">
                    {draft.templates.length === 1 ? "O link leva a ficha inteira" : `O link leva as ${draft.templates.length} fichas inteiras`}, sem cadastro e sem
                    servidor no meio.
                  </p>
                </div>
                {showQr && (
                  <div className="anim-pop mx-auto rounded-sm bg-white p-2">
                    <Qr text={url} className="h-64 w-64 sm:h-72 sm:w-72" />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
