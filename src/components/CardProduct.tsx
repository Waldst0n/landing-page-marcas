import React from "react";
import { toMediaURL } from "../services/marketing";

type Props = {
  id: number;
  nome: string;
  capa?: string | null;
  preco?: string | number | null;

  showPrice?: boolean; // padrão: false
  onSaibaMaisClick?: (id: number) => void;
  onConsorcioClick?: (id: number) => void;
  onFinanciamentoClick?: (id: number) => void;
  onFaleComigoClick?: (id: number) => void;

  className?: string; // opcional para customizações
};

const toBRL = (v: string | number | null | undefined) => {
  const n =
    typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n)
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "";
};

export default function CardProduct({
  id,
  nome,
  capa,
  preco,
  showPrice = false,
  onSaibaMaisClick,
  onConsorcioClick,
  onFinanciamentoClick,
  onFaleComigoClick,
  className = "",
}: Props) {
  const src = capa ? toMediaURL(capa) : "";

  return (
    <li
      className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col p-6 ${className}`}
    >
      {/* título com altura reservada */}
      <h3 className="text-lg font-semibold text-gray-800 text-center leading-6 mb-3 line-clamp-2 min-h-[3rem]">
        {nome}
      </h3>

      {/* vitrine padronizada */}
      <div className="relative w-full aspect-[4/3] mb-4">
        <img
          src={src}
          alt={nome}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              "data:image/svg+xml;utf8," +
              encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
                   <rect width='100%' height='100%' fill='#f3f4f6'/>
                   <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
                         font-family='sans-serif' font-size='16' fill='#9ca3af'>sem imagem</text>
                 </svg>`
              );
          }}
        />
      </div>

      {/* preço (opcional) mantendo altura */}
      {showPrice ? (
        <p className="text-base font-bold text-gray-700 text-center mb-4 min-h-[1.5rem]">
          {preco ? `A partir de ${toBRL(preco)}` : "Preço não disponível"}
        </p>
      ) : (
        <div className="mb-4 min-h-[1.5rem]" />
      )}

      {/* botões */}
      <div className="mt-auto space-y-3">
        <button
          className="w-full py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          onClick={() => onSaibaMaisClick?.(id)}
        >
          Saiba mais
        </button>
        <button
          className="w-full py-3 rounded-full border border-red-600 text-red-600 font-semibold hover:bg-red-50 transition"
          onClick={() => onConsorcioClick?.(id)}
        >
          Consórcio
        </button>
        <button
          className="w-full py-3 rounded-full border border-red-600 text-red-600 font-semibold hover:bg-red-50 transition"
          onClick={() => onFinanciamentoClick?.(id)}
        >
          Financiamento
        </button>
        <button
          className="w-full py-3 rounded-full border border-red-600 text-red-600 font-semibold hover:bg-red-50 transition"
          onClick={() => onFaleComigoClick?.(id)}
        >
          Falar com o Vendedor
        </button>
      </div>
    </li>
  );
}
