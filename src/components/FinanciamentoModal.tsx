// src/components/FinanciamentoModal.tsx
import React, { useEffect, useRef, useState } from "react";
import { postOportunidade, digits } from "../services/marketing";
import { useMarcas } from "../contexts/MarcasContext";

type Meta = { access?: string; anuncio_id?: number | null };
type Props = {
  open: boolean;
  onClose: () => void;
  produto: string;
  produtoId: number | string;
  meta?: Meta | null;
  tokenAccess?: string; // fallback se não vier via meta
};

const AUTO_CLOSE_MS = 2200;

export default function FinanciamentoModal({
  open,
  onClose,
  produto,
  produtoId,
  meta,
  tokenAccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // refs para scroll
  const contentRef = useRef<HTMLDivElement>(null); // container com overflow
  const messageRef = useRef<HTMLDivElement>(null); // bloco dos alertas

  const { currentAnuncioId, getAnuncioIdByEmpresaId, empresaId } = useMarcas();

  // prioridade: meta.anuncio_id -> contexto atual -> (opcional) buscar por empresa selecionada
  const anuncioId =
    meta?.anuncio_id ??
    currentAnuncioId ??
    (empresaId ? getAnuncioIdByEmpresaId(empresaId) : null);

  const [form, setForm] = useState({
    valorEntrada: "",
    dataNascimento: "",
    cpf: "",
    nomeCompleto: "",
    possuiCnh: "",
    ddd: "",
    telefone: "",
    autorizoTratamentoDados: false,
  });

  // trava scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = prev);
  }, [open]);

  // fecha com ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // ao abrir, garante scroll no topo do conteúdo
  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [open]);

  // helpers de formatação
  const formatCurrency = (v: string) => {
    const n = Number(v.replace(/\D/g, "")) / 100;
    if (!isFinite(n)) return "";
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };
  const formatCPF = (v: string) =>
    v
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  const formatDDD = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 2)
      .replace(/^(\d{0,2})$/, (_, a) => (a ? `(${a}` : ""))
      .replace(/^\((\d{2})$/, "($1)");
  const formatTelefone = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 9)
      .replace(/(\d{5})(\d{0,4})$/, (_, a, b) => (b ? `${a}-${b}` : a));

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, type } = e.target;
    let value: string | boolean = (e.target as HTMLInputElement).value;

    if (name === "valorEntrada") value = formatCurrency(String(value));
    else if (name === "cpf") value = formatCPF(String(value));
    else if (name === "ddd") value = formatDDD(String(value));
    else if (name === "telefone") value = formatTelefone(String(value));
    else if (type === "checkbox")
      value = (e.target as HTMLInputElement).checked;

    setForm((s) => ({ ...s, [name]: value }));
  };

  // rola o container até a mensagem
  const scrollToMessage = () => {
    requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
      // fallback/ajuste fino: garante foco visual no bloco de alerta
      messageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const token = (meta?.access ?? tokenAccess ?? "").trim();
    if (!token) {
      setErro("Token de acesso não encontrado.");
      scrollToMessage();
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        cpf_cnpj: form.cpf,
        estagio_id: 1,
        anuncio_id: anuncioId ?? undefined,
        nome: form.nomeCompleto,
        tipo_pessoa: "F" as const,
        sexo: "O" as const,
        descricao: `Interesse em FINANCIAMENTO. Entrada: ${form.valorEntrada}. Data de nascimento: ${form.dataNascimento}. Possui CNH? ${form.possuiCnh}.`,
        telefones: [
          {
            ddd: Number(digits(form.ddd)),
            numero: Number(digits(form.telefone)),
          },
        ],
        produtos: [{ id: Number(produtoId), quantidade: 1 }],
        origem: "financiamento",
      };

      await postOportunidade(token, payload);

      setSucesso(
        "Pronto! Recebemos seus dados. Um vendedor entrará em contato em breve."
      );
      scrollToMessage();

      // limpa
      setForm({
        valorEntrada: "",
        dataNascimento: "",
        cpf: "",
        nomeCompleto: "",
        possuiCnh: "",
        ddd: "",
        telefone: "",
        autorizoTratamentoDados: false,
      });

      // fecha
      setTimeout(() => {
        setSucesso(null);
        onClose();
      }, AUTO_CLOSE_MS);
    } catch (err: any) {
      console.error(err);
      setErro("Erro ao enviar seus dados. Tente novamente.");
      scrollToMessage();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const disabled = submitting || !!sucesso;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <h3 className="text-lg font-semibold">Financiamento — {produto}</h3>
            <button
              className="p-2 rounded hover:bg-gray-100"
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div
            ref={contentRef}
            className="px-6 py-5 overflow-y-auto"
          >
            {/* bloco das mensagens */}
            <div ref={messageRef}>
              {erro && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                  {erro}
                </div>
              )}
              {sucesso && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">
                  {sucesso}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Valor de Entrada
                </label>
                <input
                  type="text"
                  name="valorEntrada"
                  value={form.valorEntrada}
                  onChange={onChange}
                  placeholder="R$ 0,00"
                  required
                  disabled={disabled}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={form.dataNascimento}
                  onChange={onChange}
                  required
                  disabled={disabled}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={form.cpf}
                  onChange={onChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  disabled={disabled}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="nomeCompleto"
                  value={form.nomeCompleto}
                  onChange={onChange}
                  placeholder="Digite seu nome completo"
                  required
                  disabled={disabled}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Possui CNH?
                </label>
                <select
                  name="possuiCnh"
                  value={form.possuiCnh}
                  onChange={onChange}
                  required
                  disabled={disabled}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    DDD
                  </label>
                  <input
                    type="tel"
                    name="ddd"
                    value={form.ddd}
                    onChange={onChange}
                    placeholder="(00)"
                    maxLength={4}
                    required
                    disabled={disabled}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Celular
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={form.telefone}
                    onChange={onChange}
                    placeholder="00000-0000"
                    maxLength={10}
                    required
                    disabled={disabled}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="autorizoTratamentoDados"
                  checked={form.autorizoTratamentoDados}
                  onChange={onChange}
                  required
                  disabled={disabled}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-60"
                />
                <span className="text-gray-700">
                  Declaro que autorizo o tratamento dos meus dados pessoais para
                  fins de contato e marketing.
                </span>
              </label>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={disabled}
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={disabled}
                  className="h-11 px-5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Enviando..." : sucesso ? "Enviado" : "Enviar para o Vendedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
