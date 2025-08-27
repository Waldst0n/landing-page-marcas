// src/hooks/useProdutosPorEmpresa.ts
import { useEffect, useState } from "react";
import { useMarcas } from "../contexts/MarcasContext";
import {
  getDetalhesPagina,
  getPsCatalog,
  type ProdutoCatalogo,
} from "../services/marketing";

type CanalContato = {
  identificador?: string;
  canal?: { nome?: string };
};

export function useProdutosPorEmpresa(empresaId: number | null) {
  const { fetchTokenAfiliado } = useMarcas();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);

  // Estados expostos
  const [token, setToken] = useState<string | null>(null);
  const [params, setParams] = useState<Map<string, string>>(new Map());
  const [metaEmpresaId, setMetaEmpresaId] = useState<number | null>(null);
  const [anuncioId, setAnuncioId] = useState<number | null>(null);
  const [canaisContato, setCanaisContato] = useState<CanalContato[]>([]);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    let ativo = true;

    async function run() {
      if (!empresaId) return;
      setLoading(true);
      setErro(null);

      try {
        // 1) Busca token da filial
        const tokenAfiliado = await fetchTokenAfiliado(empresaId);
        if (!tokenAfiliado) throw new Error("Token da filial não encontrado");

        // 2) Busca detalhes com empresaId + token da filial
        const detalhes = await getDetalhesPagina(empresaId, tokenAfiliado);

        const metaResp = detalhes?.meta ?? {};
        const access = tokenAfiliado;
        const tokenEmpresaId = Number(metaResp?.empresa_id);

        // anuncio_id + canais_contato
        const anuncioFromMeta = Number(metaResp?.anuncio_id);
        const anuncioOk = Number.isFinite(anuncioFromMeta)
          ? anuncioFromMeta
          : null;
        const canais = Array.isArray(metaResp?.canais_contato)
          ? metaResp.canais_contato
          : [];

        // transforma params[] -> Map
        const paramsMap = new Map<string, string>(
          (detalhes.params ?? []).map((p: any) => [
            String(p.chave),
            String(p.valor ?? ""),
          ])
        );

        if (!ativo) return;

        setMeta(metaResp);
        setToken(access ?? null);
        setParams(paramsMap);
        setMetaEmpresaId(
          Number.isFinite(tokenEmpresaId) ? tokenEmpresaId : null
        );
        setAnuncioId(anuncioOk);
        setCanaisContato(canais);

        // 3) Busca catálogo de produtos
        let catalogo: ProdutoCatalogo[] = [];
        if (access) {
          catalogo = await getPsCatalog(access);
        }

        const alvoId = Number.isFinite(tokenEmpresaId)
          ? tokenEmpresaId
          : Number(empresaId);
        const filtrados = catalogo.filter(
          (p) => Number(p.empresa_id) === alvoId
        );
        const listaFinal = filtrados.length ? filtrados : catalogo;

        setProdutos(dedup(listaFinal));

        console.debug("[Produtos]", {
          empresaIdRota: empresaId,
          tokenEmpresaId,
          anuncioId: anuncioOk,
          totalCatalogo: catalogo.length,
          aposFiltro: filtrados.length,
        });
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
  }, [empresaId, fetchTokenAfiliado]);

  return {
    produtos,
    loading,
    erro,
    token,
    params,
    metaEmpresaId,
    anuncioId,
    canaisContato,
    meta,
  };
}

// evita duplicados por id
function dedup(itens: ProdutoCatalogo[]) {
  const m = new Map<number, ProdutoCatalogo>();
  for (const p of itens) m.set(Number(p.id), p);
  return [...m.values()];
}
