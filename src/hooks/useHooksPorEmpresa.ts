// src/hooks/useProdutosPorEmpresa.ts
import { useEffect, useMemo, useState } from "react";
import { useMarcas } from "../contexts/MarcasContext";
import { getDetalhesPagina, getPsCatalog, type ProdutoCatalogo } from "../services/marketing";

type CanalContato = {
  identificador?: string;
  canal?: { nome?: string };
};

export function useProdutosPorEmpresa(empresaId: number | null) {
  const { getEMSIdByEmpresaId } = useMarcas();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);

  // NOVOS estados expostos
  const [token, setToken] = useState<string | null>(null);
  const [params, setParams] = useState<Map<string, string>>(new Map());
  const [metaEmpresaId, setMetaEmpresaId] = useState<number | null>(null);

  // 🔥 novos: anuncioId + canaisContato + meta bruto (se quiser repassar)
  const [anuncioId, setAnuncioId] = useState<number | null>(null);
  const [canaisContato, setCanaisContato] = useState<CanalContato[]>([]);
  const [meta, setMeta] = useState<any>(null);

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

        const metaResp = detalhes?.meta ?? {};
        const access = metaResp?.access as string | undefined;
        const tokenEmpresaId = Number(metaResp?.empresa_id);

        // ⬇️ capturar anuncio_id + canais_contato
        const anuncioFromMeta = Number(metaResp?.anuncio_id);
        const anuncioOk = Number.isFinite(anuncioFromMeta) ? anuncioFromMeta : null;
        const canais = Array.isArray(metaResp?.canais_contato) ? metaResp.canais_contato : [];

        // transforma params[] -> Map
        const paramsMap = new Map<string, string>(
          (detalhes.params ?? []).map((p: any) => [String(p.chave), String(p.valor ?? "")])
        );

        if (!ativo) return;

        setMeta(metaResp);
        setToken(access ?? null);
        setParams(paramsMap);
        setMetaEmpresaId(Number.isFinite(tokenEmpresaId) ? tokenEmpresaId : null);
        setAnuncioId(anuncioOk);
        setCanaisContato(canais);

        // ⚠️ se não tiver token, evita chamar catálogo
        let catalogo: ProdutoCatalogo[] = [];
        if (access) {
          catalogo = await getPsCatalog(access);
        }

        const alvoId = Number.isFinite(tokenEmpresaId) ? tokenEmpresaId : Number(empresaId);
        const filtrados = catalogo.filter((p) => Number(p.empresa_id) === alvoId);
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
  }, [empresaId, emsId]);

  // agora o hook expõe token/params/metaEmpresaId + anuncioId/canaisContato/meta
  return { produtos, loading, erro, emsId, token, params, metaEmpresaId, anuncioId, canaisContato, meta };
}

// evita duplicados por id
function dedup(itens: ProdutoCatalogo[]) {
  const m = new Map<number, ProdutoCatalogo>();
  for (const p of itens) m.set(Number(p.id), p);
  return [...m.values()];
}
