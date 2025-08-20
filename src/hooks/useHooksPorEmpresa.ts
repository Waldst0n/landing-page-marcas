// src/hooks/useProdutosPorEmpresa.ts
import { useEffect, useMemo, useState } from "react";
import { useMarcas } from "../contexts/MarcasContext";
import {
  getDetalhesPagina,
  getPsCatalog,
  type ProdutoCatalogo,
} from "../services/marketing";

export function useProdutosPorEmpresa(empresaId: number | null) {
  const { getEMSIdByEmpresaId } = useMarcas();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);

  const emsId = useMemo(
    () => (empresaId ? getEMSIdByEmpresaId(empresaId) : null),
    [empresaId, getEMSIdByEmpresaId]
  );

  useEffect(() => {
    let ativo = true;
    async function run() {
      if (!empresaId || !emsId) return;
      setLoading(true);
      setErro(null);
      try {
        const detalhes = await getDetalhesPagina(emsId.trim());
        const token = detalhes.meta.access;
        const tokenEmpresaId = Number(detalhes.meta.empresa_id); // <- ID do token

        const catalogo = await getPsCatalog(token);

        // alvo: prioriza o ID do token; se não vier, usa o da rota
        const alvoId = Number.isFinite(tokenEmpresaId)
          ? tokenEmpresaId
          : Number(empresaId);

        // normaliza e filtra
        const filtrados = catalogo.filter(
          (p) => Number(p.empresa_id) === alvoId
        );

        // fallback: se o filtro zerar mas o catálogo tem itens, mostra todos
        const listaFinal = filtrados.length ? filtrados : catalogo;

        if (ativo) {
          setProdutos(dedup(listaFinal));
          // Debug opcional:
          console.debug("[Produtos]", {
            empresaIdRota: empresaId,
            tokenEmpresaId,
            totalCatalogo: catalogo.length,
            aposFiltro: filtrados.length,
          });
        }
      } catch (e: any) {
        if (ativo) setErro(e?.message ?? "Falha ao carregar produtos.");
      } finally {
        if (ativo) setLoading(false);
      }
    }
    run();
    return () => {
      ativo = false;
    };
  }, [empresaId, emsId]);

  return { produtos, loading, erro, emsId };
}

// evita duplicados por id
function dedup(itens: ProdutoCatalogo[]) {
  const m = new Map<number, ProdutoCatalogo>();
  for (const p of itens) m.set(Number(p.id), p);
  return [...m.values()];
}
