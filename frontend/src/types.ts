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
