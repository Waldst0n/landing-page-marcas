import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { getProdutoInfo, getProdutoInstallments } from "../services/marketing";
import { toMediaURL } from "../services/marketing";

type Props = {
  open: boolean;
  onClose: () => void;
  produtoId: number | null;
  token: string | null;
  params?: Map<string, string>;
  onOpenConsorcioModal?: () => void;
  onOpenFinanciamentoModal?: () => void;
  whatsapp?: string;
  autoplayDelayMs?: number;
};

const isTrue = (v?: string | null) => String(v ?? "").toLowerCase() === "true";

const money = (v?: number | string | null) => {
  const n =
    typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n)
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "";
};

function normalizeMidias(info: any): string[] {
  const arr = info?.midias ?? info?.imagens ?? [];
  return (arr as any[])
    .map((m) => (typeof m === "string" ? m : m?.url))
    .filter(Boolean)
    .map((p: string) => toMediaURL(p));
}

function decodeAndSplitIframe(html?: string) {
  if (!html) return { textHtml: "", iframeHtml: "" };

  const decode = (s: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = s;
    return txt.value;
  };

  const decoded = decode(decode(html));
  const start = decoded.indexOf("<iframe");
  const end = decoded.indexOf("</iframe>");

  if (start !== -1 && end !== -1) {
    const iframeHtml = decoded.slice(start, end + "</iframe>".length);
    const textHtml = decoded.replace(iframeHtml, "");
    return { textHtml, iframeHtml };
  }
  return { textHtml: decoded, iframeHtml: "" };
}

const StaticHTML = memo(function StaticHTML({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html || "";
  }, [html]);
  return <div ref={ref} className={className} />;
});

export default function SaibaMaisModal({
  open,
  onClose,
  produtoId,
  token,
  params,
  onOpenConsorcioModal,
  onOpenFinanciamentoModal,
  whatsapp,
  autoplayDelayMs = 4000,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<any>(null);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const canPrice = isTrue(params?.get("is_show_price"));
  const canCons = isTrue(params?.get("is_consorcio"));
  const canFin = isTrue(params?.get("is_financiamento"));

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

  // Busca info + parcelas
  useEffect(() => {
    let alive = true;
    async function run() {
      if (!open || !produtoId || !token) return;
      setLoading(true);
      setErro(null);
      setIdx(0);
      try {
        const [i, inst] = await Promise.all([
          getProdutoInfo(produtoId, token),
          getProdutoInstallments(produtoId, token).catch(() => []),
        ]);
        if (!alive) return;
        setInfo(i);
        setParcelas(inst);
      } catch (e: any) {
        if (alive) setErro(e?.message ?? "Erro ao carregar detalhes.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [open, produtoId, token]);

  const imagens: string[] = useMemo(() => normalizeMidias(info), [info]);
  const { textHtml, iframeHtml } = useMemo(
    () => decodeAndSplitIframe(info?.descricao),
    [info?.descricao]
  );

  const timerRef = useRef<number | null>(null);
  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    clearTimer();
    if (!open || paused) return;
    if (imagens.length <= 1) return;

    timerRef.current = window.setInterval(() => {
      setIdx((i) => (i === imagens.length - 1 ? 0 : i + 1));
    }, Math.max(1500, autoplayDelayMs));

    return clearTimer;
  }, [open, paused, imagens.length, autoplayDelayMs]);

  // Navegação manual
  const goPrev = () => setIdx((i) => (i ? i - 1 : imagens.length - 1));
  const goNext = () => setIdx((i) => (i === imagens.length - 1 ? 0 : i + 1));
  const goTo = (i: number) => setIdx(i);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <h3 className="text-lg font-semibold">
              {loading ? "Carregando..." : info?.nome ?? "Detalhes"}
            </h3>
            <button
              className="p-2 rounded hover:bg-gray-100"
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="px-6 py-5 space-y-6 overflow-y-auto">
            {loading ? (
              <p className="text-gray-600">Carregando…</p>
            ) : erro ? (
              <p className="text-red-600">{erro}</p>
            ) : info ? (
              <>
                {imagens.length > 0 && (
                  <div
                    className="relative"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                  >
                    <div className="w-full aspect-[4/3]  rounded-xl overflow-hidden grid place-items-center bg-white">
                      <img
                        src={imagens[idx]}
                        alt={`Imagem ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {imagens.length > 1 && (
                      <>
                        <button
                          onClick={goPrev}
                          className="absolute left-3  top-1/2 -translate-y-1/2 bg-black/60 text-white w-10 h-10 rounded-full grid place-items-center"
                          aria-label="Anterior"
                        >
                          ‹
                        </button>
                        <button
                          onClick={goNext}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-10 h-10 rounded-full grid place-items-center"
                          aria-label="Próxima"
                        >
                          ›
                        </button>
                        <div className="mt-3 flex justify-center gap-2">
                          {imagens.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => goTo(i)}
                              className={`h-2.5 rounded-full transition-all ${
                                i === idx
                                  ? "w-6 bg-gray-800"
                                  : "w-2.5 bg-gray-300"
                              }`}
                              aria-label={`Ir para imagem ${i + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {canCons && (
                    <button
                      onClick={onOpenConsorcioModal}
                      className="flex-1 h-12 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                    >
                      Consórcio
                    </button>
                  )}
                  {canFin && (
                    <button
                      onClick={onOpenFinanciamentoModal}
                      className="flex-1 h-12 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                    >
                      Financiamento
                    </button>
                  )}
                  <a
                    href={whatsapp ? `https://wa.me/${whatsapp}` : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-12 rounded-lg bg-[#25D366] text-white font-bold grid place-items-center hover:brightness-95 transition"
                  >
                    WhatsApp
                  </a>
                </div>

                {canPrice && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-medium">Preço</span>
                    <span className="text-lg font-semibold">
                      {money(info?.preco)}
                    </span>
                  </div>
                )}

                {(textHtml || iframeHtml) && (
                  <>
                    {textHtml && (
                      <StaticHTML
                        html={textHtml}
                        className="prose max-w-none"
                      />
                    )}
                    {iframeHtml && (
                      <StaticHTML
                        html={iframeHtml}
                        className="mt-2 flex w-full items-center justify-center"
                      />
                    )}
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
