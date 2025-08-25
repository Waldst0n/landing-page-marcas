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

  useEffect(() => {
    // mantém EMS atualizado caso o usuário navegue e mude querystring
    const handler = () => setCurrentEMSId(getEMSFromURL());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const ENDPOINT_MARCAS = "/v1/marcas";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      const ems = currentEMSId ?? getEMSFromURL();
      if (ems) params.EMS = ems;

      const res = await api.get<LojaOuMarca[]>(ENDPOINT_MARCAS, { params });
      setData(res.data || []);
    } catch (e: any) {
      setError(e?.message || "Falha ao carregar marcas/lojas.");
    } finally {
      setLoading(false);
    }
  }, [currentEMSId]);

  const reload = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Garante empresa selecionada válida
  useEffect(() => {
    if (!data.length) return;
    const exists = empresaId ? data.some(d => d.empresa_id === empresaId) : false;
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
    (id: number) => data.find(d => d.empresa_id === id),
    [data]
  );

  const getEMSIdByEmpresaId = useCallback(
    (id: number) => getByEmpresaId(id)?.empresa_modelo_site_id ?? null,
    [getByEmpresaId]
  );

  // anuncio_id VEM do item da FILIAL
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
      reload,
      empresaId,
      setEmpresaId,
      getByEmpresaId,
      currentEMSId,
      getEMSIdByEmpresaId,
      getAnuncioIdByEmpresaId,
      currentAnuncioId,
    }),
    [
      data,
      loading,
      error,
      reload,
      empresaId,
      getByEmpresaId,
      currentEMSId,
      getEMSIdByEmpresaId,
      getAnuncioIdByEmpresaId,
      currentAnuncioId,
    ]
  );

  return <MarcasContext.Provider value={value}>{children}</MarcasContext.Provider>;
}
