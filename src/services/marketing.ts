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
    canais_contato: any;
    empresa_id: number;
    anuncio_id: number | null;
    empresa_logo?: string | null;
    access: string;
  };
};

export type Telefone = { ddd: number; numero: number };
export type OportunidadeProduto = { id: number; quantidade: number };

export type OportunidadePayload = {
  cpf_cnpj?: string;
  anuncio_id?: number | null;
  nome?: string;
  email?: string;
  tipo_pessoa?: "F" | "J";
  sexo?: "M" | "F" | "O";
  descricao?: string;
  telefones?: Telefone[];
  produtos?: OportunidadeProduto[];
  origem?: string; // opcional: "site", "ps-catalog", etc.
  extra?: Record<string, any>; // qualquer dado adicional
};

export type ProdutoInfo = {
  id: number;
  nome: string;
  descricao?: string | null;
  preco?: string | number | null;
  midias?: Array<string | { url: string }>;
};

export type Parcela = {
  quantidade: number;
  valor: number;
  juros?: number | null;
};

export type ParcelaAPI = {
  nome: string;
  descricao?: string | null;
  quantidade: number;
  valor: string;
};

export type ProdutoCatalogo = {
  id: number;
  nome: string;
  preco: string;
  capa: string;
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
    `/marketing/modelos-sites/${empresaModeloSiteId}/detalhes-pagina-vendas`
  );
  return data;
}

export async function getPsCatalog(token: string) {
  const { data } = await api.get<ProdutoCatalogo[]>(
    `/v1/marketing/ps-catalog`,
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

export async function getProdutoInfo(produtoId: number, token: string) {
  const { data } = await api.get(`/v1/marketing/p/${produtoId}/info`, {
    params: { token: token?.trim() },
  });
  return data;
}

export async function getProdutoInstallments(produtoId: number, token: string) {
  const { data } = await api.get<ParcelaAPI[]>(`/v1/common/installments`, {
    params: { token, produto_id: produtoId },
  });
  return data;
}

export const digits = (v?: string) => (v ?? "").replace(/\D/g, "");

export async function postOportunidade(token: string, payload: OportunidadePayload) {
  const t = (token ?? "").trim();
  if (!t) throw new Error("TOKEN ausente para postOportunidade().");

  try {
    const { data } = await api.post(`/v1/marketing/oportunidades`, payload, {
      params: { token: t },
      headers: { "Content-Type": "application/json" },
    });
    return data;
  } catch (err: any) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    console.error("[postOportunidade] 400/erro", { status, body, payloadSent: payload, tokenUsed: t });
    throw err;
  }
}

