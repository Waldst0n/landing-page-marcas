// src/services/marketing.ts
import { api } from "./api";

export type DetalhesPagina = {
  site: {
    id: string;
    modelo_site_id: number;
    link: string;
    tipo_modelo: string;
  };
  params: Array<{
    id: number;
    chave: string;
    valor: string;
    empresa_modelo_site_id: string;
  }>;
  meta: {
    empresa_id: number;
    anuncio_id: number | null;
    empresa_logo?: string | null;
    access: string;
  };
};

export type ProdutoCatalogo = {
  id: number;
  nome: string;
  preco: string; // se quiser number: parseFloat no consumo
  capa: string; // caminho relativo; pode vir http também
  empresa_id: string | number;
};

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      font-family="sans-serif" font-size="20" fill="#6b7280">
      sem imagem
    </text>
  </svg>`);

export async function getDetalhesPagina(empresaModeloSiteId: string) {
  const { data } = await api.get<DetalhesPagina>(
    `/api/marketing/modelos-sites/${empresaModeloSiteId}/detalhes-pagina-vendas`
  );
  return data;
}

export async function getPsCatalog(token: string) {
  const { data } = await api.get<ProdutoCatalogo[]>(
    `/api/v1/marketing/ps-catalog`,
    {
      params: { token },
    }
  );
  return data;
}

export const toMediaURL = (caminho?: string | null) => {
  if (!caminho || typeof caminho !== "string") return PLACEHOLDER;
  const trimmed = caminho.trim();
  if (!trimmed) return PLACEHOLDER;
  return trimmed.startsWith("http")
    ? trimmed
    : `https://playnee.s3.us-east-005.backblazeb2.com/prod/${trimmed}`;
};
