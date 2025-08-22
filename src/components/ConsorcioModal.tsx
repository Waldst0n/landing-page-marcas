import React, { useEffect, useMemo, useState } from "react";
// Se você já tem esses tipos no projeto, pode importar de onde preferir
export type PlanosDePagamentoProps = {
  nome: string; // nome do plano (ex: "Plano A")
  quantidade: number; // quantidade de parcelas
  valor: string; // valor da parcela (string numérica)
};
export type Meta = {
  empresa_id?: number;
  anuncio_id?: number | null;
  empresa_logo?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  planosDePagamento: PlanosDePagamentoProps[]; // vindo do back (ou calculado)
  produto: string;
  produtoId?: string | number;
  numberPhone?: string;
  meta?: Meta | null;
  onOpenWhatsapp?: () => void;
};

const money = (v: string | number) => {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n)
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "";
};

export default function ConsorcioModal({
  open,
  onClose,
  planosDePagamento,
  produto,
  produtoId,
  onOpenWhatsapp,
  numberPhone,
}: Props) {
  // Bloqueia scroll do body quando o modal está aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Fecha no ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Agrupa por nome do plano (igual ao seu projeto original)
  const grouped = useMemo(() => {
    const acc: Record<string, PlanosDePagamentoProps[]> = {};
    for (const p of planosDePagamento ?? []) {
      (acc[p.nome] ??= []).push(p);
    }
    // ordena internamente por quantidade
    Object.keys(acc).forEach((k) =>
      acc[k].sort((a, b) => a.quantidade - b.quantidade)
    );
    return acc;
  }, [planosDePagamento]);

  const planNames = Object.keys(grouped);

  // WhatsApp
  // const handleWhatsApp = () => {
  //   if (!numberPhone)
  //     return window.alert("Número de WhatsApp não configurado.");
  //   const msg = encodeURIComponent(
  //     `Olá! Tenho interesse no consórcio do produto *${produto}*${
  //       produtoId ? ` (ID: ${produtoId})` : ""
  //     }.`
  //   );
  //   const url = `https://wa.me/${numberPhone}?text=${msg}`;
  //   window.open(url, "_blank");
  // };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Wrapper centralizador */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
          {/* Header fixo */}
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <h3 className="text-lg font-semibold">Consórcio — {produto}</h3>
            <button
              className="p-2 rounded hover:bg-gray-100"
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          {/* Body rolável */}
          <div className="px-6 py-5 overflow-y-auto space-y-8">
            {planNames.length === 0 ? (
              <p className="text-gray-600">Nenhum plano disponível.</p>
            ) : (
              planNames.map((planName) => (
                <div key={planName} className="space-y-3">
                  <h4 className="text-base font-semibold text-gray-800">
                    {planName}
                  </h4>

                  {/* “Tabela” responsiva em Tailwind */}
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    {/* Cabeçalho */}
                    <div className="grid grid-cols-2 bg-gray-50 text-sm font-medium text-gray-700">
                      <div className="px-4 py-2 border-r border-gray-200">
                        Quantidade
                      </div>
                      <div className="px-4 py-2">Valor da parcela</div>
                    </div>
                    {/* Linhas */}
                    <div className="divide-y divide-gray-200">
                      {grouped[planName].map((plan, idx) => (
                        <div key={idx} className="grid grid-cols-2 text-sm">
                          <div className="px-4 py-2 border-r border-gray-100">
                            {plan.quantidade}x
                          </div>
                          <div className="px-4 py-2">{money(plan.valor)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3 sm:justify-between">
            <button
              className="w-full sm:w-auto h-11 px-4 rounded-lg bg-[#25D366] text-white font-semibold hover:brightness-95 transition"
              onClick={onOpenWhatsapp}
            >
              Falar com vendedor agora!
            </button>
            <button
              className="w-full sm:w-auto h-11 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
