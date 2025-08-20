// Interface para o objeto 'site'
export interface Site {
  id: number;
  created_at: string;
  updated_at: string;
  link: string;
  tipo_modelo: string;
  params_map: string;
  default: boolean;
}

// Interface para o objeto 'canal' dentro de 'canais_contato'
export interface Canal {
  id: number;
  nome: string;
  url: string | null;
  created_at: string;
  updated_at: string;
  is_canal_contato: boolean;
  icon: string;
  color: string;
}

// Interface para cada item dentro de 'canais_contato'
export interface CanalContato {
  created_at: string;
  updated_at: string;
  user_id: number;
  canal_id: number;
  identificador: string;
  is_public: boolean;
  hash: string;
  canal: Canal;
}

// Interface para o objeto 'meta'
export interface Meta {
  user_id: number;
  empresa_id: number;
  anuncio_id: number;
  avatar_url: string;
  empresa_logo: string;
  access: string;
  canais_contato: CanalContato[];
  user: string;
  empresa: string;
}

export interface Param {
  id: number;
  created_at: string;
  updated_at: string;
  chave: string;
  valor: string;
  descricao: string;
  usuario_modelo_site_id: string | null;
  empresa_modelo_site_id: string | null;
}

// Interface para a resposta completa da API
export interface MetaProps {
  site?: Site;
  // params?: Param[]
  meta?: Meta;
}

export interface ProductProps {
  id: number;
  nome?: string;
  preco: string;
  capa?: string | undefined;
  onConsorcioClick?: () => void;
  onSaibaMaisClick?: () => void;
}

export interface MidiaProps {
  url: string;
  filename: string;
}

export interface PlanosDePagamentoProps {
  nome: string;
  descricao?: string;
  quantidade?: number;
  valor: string;
}
