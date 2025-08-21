// src/contexts/MarcasContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
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
  anuncio_id?: number | null;
};

type MarcasContextType = {
  data: LojaOuMarca[];
  loading: boolean;
  error: string | null;
  reload: () => void;

  empresaId: number | null;
  setEmpresaId: (id: number) => void;

  getByEmpresaId: (id: number) => LojaOuMarca | undefined;

  getEMSIdByEmpresaId: (id: number) => string | null;
  currentEMSId: string | null;

  // 🔹 novos helpers para anúncio
  getAnuncioIdByEmpresaId: (id: number) => number | null;
  currentAnuncioId: number | null;
};

const MarcasContext = createContext({} as MarcasContextType);
export const useMarcas = () => useContext(MarcasContext);

export function MarcasProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<LojaOuMarca[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<number | null>(() => {
    const saved = localStorage.getItem("empresa_id");
    return saved ? Number(saved) : null;
  });

  const ENDPOINT_MARCAS = "/v1/marcas";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<LojaOuMarca[]>(ENDPOINT_MARCAS, {
        headers: {
          empresa_id: 496, // empresaId,
        },
      });
      setData(res.data || []);
    } catch (e: any) {
      setError(e?.message || "Falha ao carregar marcas/lojas.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const exists = empresaId
      ? data.some((d) => d.empresa_id === empresaId)
      : false;
    if (!exists) {
      const firstId = data[0].empresa_id;
      setEmpresaId(firstId);
      localStorage.setItem("empresa_id", String(firstId));
    }
  }, [data, empresaId]);

  useEffect(() => {
    if (empresaId != null)
      localStorage.setItem("empresa_id", String(empresaId));
  }, [empresaId]);

  const getByEmpresaId = useCallback(
    (id: number) => data.find((d) => d.empresa_id === id),
    [data]
  );

  const getEMSIdByEmpresaId = useCallback(
    (id: number) => getByEmpresaId(id)?.empresa_modelo_site_id ?? null,
    [getByEmpresaId]
  );

  // 🔹 anuncio_id por empresa
  const getAnuncioIdByEmpresaId = useCallback(
    (id: number) => getByEmpresaId(id)?.anuncio_id ?? null,
    [getByEmpresaId]
  );

  // 🔹 anuncio_id da empresa atualmente selecionada
  const currentAnuncioId = useMemo(() => {
    if (empresaId == null) return null;
    return getAnuncioIdByEmpresaId(empresaId);
  }, [empresaId, getAnuncioIdByEmpresaId]);

  const currentEMSId = useMemo(() => {
    if (empresaId == null) return null;
    return getEMSIdByEmpresaId(empresaId);
  }, [empresaId, getEMSIdByEmpresaId]);

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      reload,
      empresaId,
      setEmpresaId,
      getByEmpresaId,
      getEMSIdByEmpresaId,
      currentEMSId,
      getAnuncioIdByEmpresaId, // 🔹 exposto
      currentAnuncioId, // 🔹 exposto
    }),
    [
      data,
      loading,
      error,
      reload,
      empresaId,
      getByEmpresaId,
      getEMSIdByEmpresaId,
      currentEMSId,
      getAnuncioIdByEmpresaId,
      currentAnuncioId,
    ]
  );

  return (
    <MarcasContext.Provider value={value}>{children}</MarcasContext.Provider>
  );
}
