export interface User {
  id_user: number;
  username: string;
  email: string;
  name: string;
  plan: string;
  zone: string;
  psw: string;
  detalle: string;
  id_plan: number;
}

export interface NewUserInput {
  alias: string;
  email: string;
  name: string;
  zone: string;
  company: string;
  detalle: string;
}

export interface CreatedUser {
  id_user: number;
  username: string;
  psw: string;
}

export interface Plan {
  id_plan: number;
  name: string;
}

export interface Modulo {
  id_modulo: number;
  name: string;
}

export interface ModuloFuncion {
  id_modulo: number;
  modulo: string;
  id_funct?: number;
  funcion?: string;
}

export interface FuncionPermiso {
  id_funct: number;
  modulo: string;
  funcion: string;
  autorizada: boolean;
}

export interface GuardarUsuarioInput {
  id_user: number;
  username: string;
  psw: string;
  name: string;
  zone: string;
  email: string;
  id_plan: number;
  detalle: string;
  permisos: { id_funct: number; autorizada: boolean }[];
}

export interface RecordStat {
  modulo: string;
  funcion: string;
  total: number;
}

export interface UserStat {
  id_user: number;
  username: string;
  total_interacciones: number;
  last_update: string;
}

export interface FunctionUsageByUser {
  id_funct: number;
  modulo: string;
  funcion: string;
  usos: number;
}

export interface RecordRow {
  id_record: number;
  id_user: number;
  status: string;
  date: string;
}

// ==== MCP ====

export interface MCPUser {
  id_user: number;
  email: string;
  comment: string;
  last_update: string;
}

export interface MCPCatalogItem {
  id_mcp: number;
  mcp: string;
  id_funct?: number;
  funcion?: string;
}

export interface MCPUserStat {
  id_user: number;
  email: string;
  total_interacciones: number;
  last_activity: string;
}

export interface MCPFunctionUsage {
  id_funct: number;
  mcp: string;
  funcion: string;
  usos: number;
}

export interface MCPInteractionRow {
  id_interaction: number;
  id_user: number;
  output: string;
  date: string;
}