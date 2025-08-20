import { Link, useLocation, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useMarcas } from "../contexts/MarcasContext";
import { useProdutosPorEmpresa } from "../hooks/useHooksPorEmpresa";
import CardProduct from "../components/CardProduct";
import SaibaMaisModal from "../components/SaibaMaisModal";

type LocationState = { loja?: { empresa_id: number } } | undefined;

export default function Produtos() {
  const params = useParams<{ empresaId?: string }>();
  const location = useLocation();
  const state = location.state as LocationState;
  const { empresaId: ctxEmpresaId } = useMarcas();

  const empresaId = useMemo(() => {
    if (params?.empresaId) return Number(params.empresaId);
    if (state?.loja?.empresa_id) return Number(state.loja.empresa_id);
    const fromLS = localStorage.getItem("empresa_id");
    if (fromLS) return Number(fromLS);
    if (ctxEmpresaId != null) return Number(ctxEmpresaId);
    return null;
  }, [params?.empresaId, state?.loja?.empresa_id, ctxEmpresaId]);

  const { produtos, loading, erro, token } = useProdutosPorEmpresa(empresaId);

  const [open, setOpen] = useState(false);
  const [produtoId, setProdutoId] = useState<number | null>(null);

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
        <p className="text-red-600 font-semibold mb-4">{erro}</p>
        <Link
          to="/"
          className="inline-block bg-red-500 hover:bg-red-600 transition-all px-4 py-2 rounded-full text-white font-bold"
        >
          Voltar à página inicial
        </Link>
      </div>
    );
  }

  return (
    <section className="max-w-8xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
      <div className="flex items-center justify-center gap-4">
        <h2 className="text-xl font-semibold"></h2>
        <Link
          to="/"
          className="bg-red-500 hover:bg-red-600 transition-all px-4 py-2 rounded-full text-white font-bold"
        >
          Voltar à página inicial
        </Link>
      </div>

      {produtos.length === 0 ? (
        <p className="mt-6 text-gray-600">Nenhum produto para esta loja.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {produtos.map((p) => (
            <CardProduct
              key={p.id}
              id={p.id}
              nome={p.nome}
              capa={p.capa}
              preco={p.preco}
              showPrice={false}
              onSaibaMaisClick={() => {
                setProdutoId(p.id);
                setOpen(true);
              }}
            />
          ))}
        </ul>
      )}

      <SaibaMaisModal
        open={open}
        onClose={() => setOpen(false)}
        produtoId={produtoId}
        token={token ?? null}
        autoplayDelayMs={2000}
        params={
          new Map([
            ["is_show_price", "true"],
            ["is_consorcio", "true"],
            ["is_financiamento", "true"],
          ])
        }
        whatsapp={"5581999999999"}
        onOpenConsorcioModal={() => console.log("consórcio")}
        onOpenFinanciamentoModal={() => console.log("financiamento")}
      />
    </section>
  );
}
