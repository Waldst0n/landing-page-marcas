// src/contexts/MarcasContext.tsx
import {
  createContext, useContext, useState, useCallback, useEffect, useMemo,
} from "react";
import { api } from "../services/api";

type LojaOuMarca = {
  empresa_id: number;
  nome_empresa: string;
  logo_empresa?: string;

  marca_id?: number;
  nome_marca?: string;
  logo_marca?: string;
  logomarca_url?: string;

  empresa_modelo_site_id?: string;
  modelo_site_id?: number;
  status?: boolean;
  anuncio_id?: number | null; // <- vem do ems da FILIAL

  access?: string | null
};

type MarcasContextType = {
  data: LojaOuMarca[];
  loading: boolean;
  error: string | null;
  reload: () => void;

  empresaId: number | null;
  setEmpresaId: (id: number) => void;

  getByEmpresaId: (id: number) => LojaOuMarca | undefined;

  // EMS atual (da URL) e helpers
  currentEMSId: string | null;
  getEMSIdByEmpresaId: (id: number) => string | null;

  // anuncio_id da filial
  getAnuncioIdByEmpresaId: (id: number) => number | null;
  currentAnuncioId: number | null;
  fetchTokenAfiliado: (empresaId: number) => Promise<string | null>;

};

const MarcasContext = createContext({} as MarcasContextType);
export const useMarcas = () => useContext(MarcasContext);

function getEMSFromURL(): string | null {
  const sp = new URLSearchParams(window.location.search);
  const ems = sp.get("EMS") || sp.get("ems");
  return ems?.trim() || null;
}

export function MarcasProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<LojaOuMarca[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [empresaId, setEmpresaId] = useState<number | null>(() => {
    const saved = localStorage.getItem("empresa_id");
    return saved ? Number(saved) : null;
  });

  const [currentEMSId, setCurrentEMSId] = useState<string | null>(() => getEMSFromURL());
  const [currentAccess, setCurrentAccess] = useState<string | null>(
    () => localStorage.getItem("empresa_access") || null
  );

  useEffect(() => {
    const handler = () => setCurrentEMSId(getEMSFromURL());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // 1) Pega token da marca (via EMS)
  const fetchTokenMarca = useCallback(async (ems: string) => {
    const res = await api.get<{ empresa_id: number; nome_empresa: string; access: string | null }>(
      "/marketing/empresas/token?EMS=" + ems,
      { params: { ems } }
    );
    const token = res.data?.access ?? null;

    if (token) {
      setCurrentAccess(token);
      localStorage.setItem("empresa_access", token);
    }
    return token;
  }, []);

  // dentro do MarcasProvider
  const fetchTokenAfiliado = useCallback(
    async (empresaId: number) => {
      if (!currentAccess) throw new Error("Token da marca não carregado");

      const res = await api.get<{ empresa_id: number; nome_empresa: string; access: string | null }>(
        `/marketing/afiliados/${empresaId}/token`,
        {
          headers: { "X-Access-Token": currentAccess }
        }
      );

      const tokenAfiliado = res.data?.access ?? null;
      if (tokenAfiliado) {
        localStorage.setItem("empresa_afiliada_access", tokenAfiliado);
      }

      return tokenAfiliado;
    },
    [currentAccess]
  );


  // 2) Pega empresas afiliadas a partir do token da marca
  const fetchEmpresasAfiliadas = useCallback(async (token: string) => {
    const res = await api.get<LojaOuMarca[]>("/v1/afiliadas", {
      headers: {
        "X-Access-Token": token,
      },
    });

    // garante que logo_marca e nome_marca sejam repassados
    const dataComMarca = (res.data || []).map((a) => ({
      ...a,
      logo_marca: a.logo_marca ?? a.logo_empresa, // fallback se vier nulo
      nome_marca: a.nome_marca ?? a.nome_empresa, // fallback se vier nulo
    }));

    setData(dataComMarca);
  }, []);


  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ems = currentEMSId ?? getEMSFromURL();
      if (!ems) throw new Error("EMS não informado");

      // 1) busca token da marca
      const token = await fetchTokenMarca(ems);
      if (!token) throw new Error("Token da marca não encontrado");

      // 2) busca empresas afiliadas
      await fetchEmpresasAfiliadas(token);
    } catch (e: any) {
      setError(e?.message || "Falha ao carregar marcas/lojas.");
    } finally {
      setLoading(false);
    }
  }, [currentEMSId, fetchTokenMarca, fetchEmpresasAfiliadas]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // mantém empresaId válido
  useEffect(() => {
    if (!data.length) return;
    const exists = empresaId ? data.some((d) => d.empresa_id === empresaId) : false;
    if (!exists) {
      const firstId = data[0].empresa_id;
      setEmpresaId(firstId);
      localStorage.setItem("empresa_id", String(firstId));
    }
  }, [data, empresaId]);

  useEffect(() => {
    if (empresaId != null) localStorage.setItem("empresa_id", String(empresaId));
  }, [empresaId]);

  const getByEmpresaId = useCallback(
    (id: number) => data.find((d) => d.empresa_id === id),
    [data]
  );

  const getEMSIdByEmpresaId = useCallback(
    (id: number) => getByEmpresaId(id)?.empresa_modelo_site_id ?? null,
    [getByEmpresaId]
  );

  const getAnuncioIdByEmpresaId = useCallback(
    (id: number) => getByEmpresaId(id)?.anuncio_id ?? null,
    [getByEmpresaId]
  );

  const currentAnuncioId = useMemo(() => {
    if (empresaId == null) return null;
    return getAnuncioIdByEmpresaId(empresaId);
  }, [empresaId, getAnuncioIdByEmpresaId]);

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      reload: fetchAll,
      empresaId,
      setEmpresaId,
      getByEmpresaId,
      currentEMSId,
      getEMSIdByEmpresaId,
      getAnuncioIdByEmpresaId,
      currentAnuncioId,
      currentAccess,
      fetchTokenAfiliado
    }),
    [
      data,
      loading,
      error,
      fetchAll,
      empresaId,
      getByEmpresaId,
      currentEMSId,
      getEMSIdByEmpresaId,
      getAnuncioIdByEmpresaId,
      currentAnuncioId,
      currentAccess,
      fetchTokenAfiliado,
    ]
  );

  return <MarcasContext.Provider value={value}>{children}</MarcasContext.Provider>;
}


