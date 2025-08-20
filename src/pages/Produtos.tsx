import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useMarcas } from "../contexts/MarcasContext";
import { useProdutosPorEmpresa } from "../hooks/useHooksPorEmpresa";
import { toMediaURL } from "../services/marketing";

type LocationState = { loja?: { empresa_id: number } } | undefined;

export default function Produtos() {
  const params = useParams<{ empresaId?: string }>();
  const location = useLocation();
  const state = location.state as LocationState;

  const { empresaId: ctxEmpresaId } = useMarcas();

  // Escolhe a melhor fonte para o empresaId
  const empresaId = useMemo(() => {
    if (params?.empresaId) return Number(params.empresaId);
    if (state?.loja?.empresa_id) return Number(state.loja.empresa_id);
    const fromLS = localStorage.getItem("empresa_id");
    if (fromLS) return Number(fromLS);
    if (ctxEmpresaId != null) return Number(ctxEmpresaId);
    return null;
  }, [params?.empresaId, state?.loja?.empresa_id, ctxEmpresaId]);

  const { produtos, loading, erro } = useProdutosPorEmpresa(empresaId);

  if (empresaId == null) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-red-600">empresaId inválido ou ausente.</p>
        <Link to="/" className="text-blue-600 underline">
          voltar e escolher a loja
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-2xl font-bold">Carregando produtos…</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-red-600 font-semibold">{erro}</p>
        <Link to="/" className="text-blue-600 underline">
          trocar loja
        </Link>
      </div>
    );
  }

  return (
    <section className="max-w-8xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{}</h2>
        <Link to="/" className="text-sm text-blue-600 underline">
          trocar loja
        </Link>
      </div>

      {produtos.length === 0 ? (
        <p className="mt-6 text-gray-600">Nenhum produto para esta loja.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {produtos.map((p) => (
            <li
              key={p.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col p-6"
            >
              {/* Título com altura reservada (2 linhas) */}
              <h3 className="text-lg font-semibold text-gray-800 text-center leading-6 mb-3 line-clamp-2 min-h-[3rem]">
                {p.nome}
              </h3>

              {/* Vitrine da imagem com proporção fixa (4:3) */}
              <div className="relative w-full aspect-[4/3] mb-4">
                <img
                  src={toMediaURL(p.capa)}
                  alt={p.nome}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>

              {/* {p.preco ? (
                <p className="text-base font-bold text-gray-700 text-center mb-4 min-h-[1.5rem]">
                  {`A partir de ${Number(p.preco).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}`}
                </p>
              ) : (
                <div className="mb-4 min-h-[1.5rem]" />
              )} */}

              {/* Botões sempre no rodapé do card */}
              <div className="mt-auto space-y-3">
                <button className="w-full py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition">
                  Saiba mais
                </button>
                <button className="w-full py-3 rounded-full border border-red-600 text-red-600 font-semibold hover:bg-red-50 transition">
                  Consórcio
                </button>
                <button className="w-full py-3 rounded-full border border-red-600 text-red-600 font-semibold hover:bg-red-50 transition">
                  Financiamento
                </button>
                <button className="w-full py-3 rounded-full border border-red-600 text-red-600 font-semibold hover:bg-red-50 transition">
                  Falar com o Vendedor
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
