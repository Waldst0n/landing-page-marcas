// src/components/ContactModal.tsx
import React, { useState, useEffect, type FormEvent } from "react";
import { IoCloseSharp } from "react-icons/io5";
import type { CanalContato, Meta } from "../interfaces/interface";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** dados da oportunidade (token e, opcionalmente, anuncio_id) */
  meta?: Meta | null;
  /** vaga para customizar a mensagem que vai pro WhatsApp */
  mensagemPersonalizada?: (data: { nome: string; telefone: string }) => string;
  /** canal de WhatsApp do vendedor */
  whatsappContato?: CanalContato;
}

const formatTelefone = (value: string) => {
  value = value.replace(/\D/g, "");
  if (value.length <= 10) {
    return value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3").trim();
  }
  return value.replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3").trim();
};

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  meta,
  mensagemPersonalizada,
  whatsappContato,
}) => {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);

  // fecha com Esc
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1) Checa token
      if (!meta || !meta.access) {
        console.error("[ContactModal] meta ou meta.access inválido:", meta);
        alert("Erro interno: token de API não fornecido.");
        return;
      }

      // 2) Prepara payload
      const raw = telefone.replace(/\D/g, "");
      const ddd = raw.slice(0, 2);
      const numero = raw.slice(2);
      const dados: any = {
        nome,
        descricao: "Interesse em CONTATO",
        tipo_pessoa: "F",
        sexo: "O",
        telefones: [{ ddd: +ddd, numero: +numero }],
        // só adiciona anuncio_id se existir
        ...(meta.anuncio_id ? { anuncio_id: meta.anuncio_id } : {}),
      };

      console.log("[ContactModal] POST payload:", dados);

      // 3) Chama API
      const url = `https://api.playnee.com.br/v1/marketing/oportunidades?token=${meta.access}`;
      console.log("[ContactModal] POST url:", url);

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      console.log("[ContactModal] status da resposta:", resp.status);

      // 4) Se falhar, lê o corpo e avisa
      if (!resp.ok) {
        const errText = await resp.text();
        console.error("[ContactModal] corpo de erro:", errText);
        alert(`Erro ${resp.status} ao criar oportunidade:\n${errText}`);
        return;
      }

      // 5) Se der certo, abre WhatsApp
      const mensagem = mensagemPersonalizada
        ? mensagemPersonalizada({ nome, telefone })
        : `Olá! Meu nome é ${nome} e gostaria de mais informações.`;

      // pega número do vendedor
      const wa =
        whatsappContato?.identificador.replace(/\D/g, "") ||
        (meta.canais_contato ?? [])
          .find((c) => c.canal?.nome.toLowerCase().includes("whatsapp"))
          ?.identificador.replace(/\D/g, "");

      if (!wa) {
        alert("WhatsApp do vendedor não encontrado.");
        return;
      }

      window.open(
        `https://wa.me/${wa}?text=${encodeURIComponent(mensagem)}`,
        "_blank"
      );

      // 6) Limpa e fecha
      setNome("");
      setTelefone("");
      onClose();
    } catch (err) {
      console.error("[ContactModal] erro inesperado:", err);
      alert("Ocorreu um erro inesperado. Veja o console para detalhes.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-lg"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Fechar"
        >
          <IoCloseSharp size={24} />
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          Fale com um especialista
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="contact-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome
            </label>
            <input
              id="contact-name"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label
              htmlFor="contact-phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Telefone
            </label>
            <input
              id="contact-phone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(formatTelefone(e.target.value))}
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              placeholder="(00) 00000-0000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;
