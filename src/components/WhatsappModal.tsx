// src/components/WhatsappModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { postOportunidade, digits as onlyDigits } from "../services/marketing";

type CanalContato = {
  identificador?: string; // número como string (pode vir com símbolos)
  canal?: { nome?: string };
};

type Meta = {
  access?: string;
  anuncio_id?: number | null;
  canais_contato?: CanalContato[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  produto?: string;
  produtoId?: number | string;
  tipoInteresse: "consorcio" | "locacao" | "financiamento" | "Página de Vendas";
  meta?: Meta | null;

  mensagemPersonalizada?: (form: {
    nome: string;
    telefone: string; // +55 (DD) 9XXXX-XXXX
    produto?: string;
    tipoInteresse: Props["tipoInteresse"];
  }) => string;

  whatsappContato?: CanalContato;

  tokenAccess?: string;
};

// máscara de telefone (celular e fixo)
const formatTelefone = (v: string) => {
  let s = v.replace(/\D/g, "");
  if (s.length <= 10) {
    // (11) 2345-6789
    s = s.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) =>
      [a && `(${a}`, a && ")", b && ` ${b}`, c && `-${c}`]
        .filter(Boolean)
        .join("")
    );
  } else {
    // (11) 91234-5678
    s = s.replace(/^(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_, a, b, c) =>
      [a && `(${a}`, a && ")", b && ` ${b}`, c && `-${c}`]
        .filter(Boolean)
        .join("")
    );
  }
  return s.trim();
};

export default function WhatsappModal({
  open,
  onClose,
  produto,
  produtoId,
  tipoInteresse,
  meta,
  mensagemPersonalizada,
  whatsappContato,
  tokenAccess,
}: Props) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = prev);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const vendedorWhatsDigits = useMemo(() => {
    const fromProp = whatsappContato?.identificador?.replace(/\D/g, "");
    if (fromProp) return fromProp;

    // fallback: meta.canais_contato -> canal que contenha "whatsapp"
    const found = meta?.canais_contato?.find((c) =>
      (c.canal?.nome ?? "").toLowerCase().includes("whatsapp")
    );
    const fromMeta = found?.identificador?.replace(/\D/g, "");
    if (fromMeta) return fromMeta;

    return ""; // vazio: sem número do vendedor
  }, [whatsappContato, meta?.canais_contato]);

  const token = (meta?.access ?? tokenAccess ?? "").trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!token) {
      setErro("Token de acesso não encontrado.");
      return;
    }

    const telDigits = telefone.replace(/\D/g, "");
    if (telDigits.length < 10) {
      setErro("Informe um WhatsApp válido (ex: (99) 99999-9999).");
      return;
    }

    const ddd = Number(onlyDigits(telDigits.slice(0, 2)));
    const numero = Number(onlyDigits(telDigits.slice(2)));

    const descricaoBase = `Interesse em ${tipoInteresse.toUpperCase()}`;
    const descricao = produto
      ? `${descricaoBase} - Produto: ${produto}`
      : descricaoBase;

    const payload: any = {
      nome,
      descricao,
      tipo_pessoa: "F",
      sexo: "O",
      telefones: [{ ddd, numero }],
      origem: "whatsapp-modal",
    };

    if (meta?.anuncio_id != null) payload.anuncio_id = meta.anuncio_id;
    if (produtoId != null && !isNaN(Number(produtoId))) {
      payload.produtos = [{ id: Number(produtoId), quantidade: 1 }];
    }

    try {
      setSubmitting(true);
      await postOportunidade(token, payload);

      const mensagem =
        mensagemPersonalizada?.({
          nome,
          telefone: `+55 (${telDigits.slice(0, 2)}) ${
            telDigits.length > 10
              ? `${telDigits.slice(2, 7)}-${telDigits.slice(7)}`
              : `${telDigits.slice(2, 6)}-${telDigits.slice(6)}`
          }`,
          produto,
          tipoInteresse,
        }) ??
        `Olá! Meu nome é ${nome} e acabei de preencher o formulário com interesse em ${tipoInteresse}${
          produto ? ` (produto: ${produto})` : ""
        }. Podemos conversar?`;

      if (!vendedorWhatsDigits) {
        setErro("Número de WhatsApp do vendedor não encontrado.");
        return;
      }

      // const url = `https://wa.me/${vendedorWhatsDigits}?text=${encodeURIComponent(
      //   mensagem
      // )}`;
      // window.open(url, "_blank");

      // limpa e fecha
      setNome("");
      setTelefone("");
      onClose();
    } catch (err: any) {
      console.error(err);
      setErro("Erro ao enviar seus dados. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Fale com um especialista</h3>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          {/* body */}
          <div className="px-6 py-5">
            {erro && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nome
                </label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="telefone"
                  className="block text-sm font-medium text-gray-700"
                >
                  WhatsApp
                </label>
                <input
                  id="telefone"
                  type="tel"
                  placeholder="Ex: (99) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 px-5 rounded-lg bg-[#25D366] text-white font-semibold hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
