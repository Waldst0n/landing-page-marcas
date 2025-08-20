import React from "react";
import noImage from "../assets/cb300.webp";
import { type ProductProps } from "../../interfaces/interfaces";

interface CardProductProps extends ProductProps {
  onConsorcioClick?: () => void;
  onSaibaMaisClick?: () => void;
  onFinanciamentoClick?: () => void;
  onFaleComigoClick?: () => void;
  params: Map<string, string>;
}

// const STORAGE_BASE = "https://playnee.s3.us-east-005.backblazeb2.com/prod";

// util: bool seguro p/ Map<string,string>
const isTrue = (v: string | undefined | null) =>
  String(v).toLowerCase() === "true";

function formatarReal(preco: number | string | undefined) {
  if (preco === undefined || preco === null) return "";
  const n = typeof preco === "string" ? parseFloat(preco) : preco;
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CardProduct: React.FC<CardProductProps> = ({
  capa,
  nome,
  preco,
  onConsorcioClick,
  onSaibaMaisClick,
  onFinanciamentoClick,
  onFaleComigoClick,
  params,
}) => {
  const src = noImage;

  const showPrice = isTrue(params.get("is_show_price"));
  const showConsorcio = isTrue(params.get("is_consorcio"));
  const showFinanciamento = isTrue(params.get("is_financiamento"));
  const showTalkToSeller = isTrue(params.get("is_talk_to_seller"));

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-gray-100 p-5">
      {/* Título */}
      <h4 className="text-gray-800 font-semibold text-lg leading-snug text-center">
        {nome}
      </h4>

      {/* Imagem */}
      <div className="mt-4 mb-5 h-44 sm:h-52 w-full bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
        <img
          src={src}
          alt="capa do produto"
          className="h-full w-full object-contain"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.onerror = null;
            img.src = noImage;
          }}
        />
      </div>

      {/* Preço (opcional) */}
      {showPrice && (
        <p className="text-center text-gray-700 text-sm mb-3">
          {preco
            ? `A partir de ${formatarReal(preco)}`
            : "Preço não disponível"}
        </p>
      )}

      {/* Botões */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onSaibaMaisClick}
          className="w-full py-3 rounded-full bg-red-600 text-white font-semibold shadow-sm hover:bg-red-700 transition-colors"
        >
          Saiba mais
        </button>

        {showConsorcio && (
          <button
            type="button"
            onClick={onConsorcioClick}
            className="w-full py-3 rounded-full border border-red-500 text-red-600 bg-white font-medium hover:bg-red-50  transition-colors"
          >
            Consórcio
          </button>
        )}

        {showFinanciamento && (
          <button
            type="button"
            onClick={onFinanciamentoClick}
            className="w-full py-3 rounded-full border border-red-500 text-red-600 bg-white font-medium hover:bg-red-50  transition-colors"
          >
            Financiamento
          </button>
        )}

        {showTalkToSeller && (
          <button
            type="button"
            onClick={onFaleComigoClick}
            className="w-full py-3 rounded-full border border-red-500 text-red-600 bg-white font-medium hover:bg-red-50  transition-colors"
          >
            Falar com o Vendedor
          </button>
        )}
      </div>
    </div>
  );
};

export default CardProduct;
