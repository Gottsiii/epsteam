// Estos imports los genera Wails automáticamente en wailsjs/go/main/App
// a partir de los métodos públicos de App en app.go — no se escriben a mano.
import * as Backend from "../wailsjs/go/main/App";
// Clases generadas por Wails para los structs que van como parámetro — hay
// que envolver los objetos planos con .createFrom() antes de mandarlos,
// porque el .d.ts generado exige la instancia real (con su convertValues),
// no solo un objeto con la misma forma.
import { main, models } from "../wailsjs/go/models";
import {
  User,
  NewUserInput,
  CreatedUser,
  Plan,
  FuncionPermiso,
  Modulo,
  ModuloFuncion,
  GuardarUsuarioInput,
  RecordStat,
  RecordRow,
  UserStat,
  FunctionUsageByUser,
  MCPUser,
  MCPCatalogItem,
  MCPUserStat,
  MCPFunctionUsage,
  MCPInteractionRow,
} from "./types";

const ensureArrayResponse = <T>(value: unknown, metodo: string): T[] => {
  if (value == null) {
    throw new Error(`${metodo}: respuesta vacía del backend`);
  }
  if (!Array.isArray(value)) {
    if (typeof value === "object" && value && "error" in value) {
      throw new Error(String((value as { error: unknown }).error));
    }
    throw new Error(`${metodo}: formato de respuesta inválido`);
  }
  return value as T[];
};

// ==== API (TSMX) ====

export const listarUsuarios = async (filtro: string, columna: string, modo: string): Promise<User[]> =>
  ensureArrayResponse<User>(await Backend.ListarUsuarios(filtro, columna, modo), "ListarUsuarios");

export const listarUsuariosBaja = async (): Promise<User[]> =>
  ensureArrayResponse<User>(await Backend.ListarUsuariosBaja(), "ListarUsuariosBaja");

export const buscarUsuarios = async (texto: string): Promise<User[]> =>
  ensureArrayResponse<User>(await Backend.BuscarUsuarios(texto), "BuscarUsuarios");

export const crearUsuario = (input: NewUserInput) =>
  Backend.CrearUsuario(models.NewUserInput.createFrom(input)) as unknown as Promise<CreatedUser>;

export const generarPassword = () => Backend.GenerarPassword() as unknown as Promise<string>;

export const guardarUsuario = (input: GuardarUsuarioInput) =>
  Backend.GuardarUsuario(main.GuardarUsuarioInput.createFrom(input)) as unknown as Promise<void>;

export const darDeBajaUsuario = (idUser: number, nuevoDetalle: string) =>
  Backend.DarDeBajaUsuario(idUser, nuevoDetalle) as unknown as Promise<void>;

export const darDeAltaUsuario = (idUser: number) =>
  Backend.DarDeAltaUsuario(idUser) as unknown as Promise<void>;

export const listarPlanes = () =>
  Backend.ListarPlanes() as unknown as Promise<Plan[]>;

export const listarFuncionesPorUsuario = (idUser: number) =>
  Backend.ListarFuncionesPorUsuario(idUser) as unknown as Promise<FuncionPermiso[]>;

export const listarModulos = () =>
  Backend.ListarModulos() as unknown as Promise<Modulo[]>;

export const listarEstructuraModulos = () =>
  Backend.ListarEstructuraModulos() as unknown as Promise<ModuloFuncion[]>;

export const crearModulo = (nombre: string) =>
  Backend.CrearModulo(nombre) as unknown as Promise<void>;

export const modificarModulo = (idModulo: number, nombre: string) =>
  Backend.ModificarModulo(idModulo, nombre) as unknown as Promise<void>;

export const eliminarModulo = (idModulo: number) =>
  Backend.EliminarModulo(idModulo) as unknown as Promise<void>;

export const crearFuncion = (idModulo: number, nombre: string) =>
  Backend.CrearFuncion(idModulo, nombre) as unknown as Promise<void>;

export const modificarFuncion = (idFunct: number, idModulo: number, nombre: string) =>
  Backend.ModificarFuncion(idFunct, idModulo, nombre) as unknown as Promise<void>;

export const eliminarFuncion = (idFunct: number) =>
  Backend.EliminarFuncion(idFunct) as unknown as Promise<void>;

export const listarEstadisticasFunciones = () =>
  Backend.ListarEstadisticasFunciones() as unknown as Promise<RecordStat[]>;

export const listarRegistrosFuncion = (modulo: string, funcion: string, pagina: number, porPagina: number) =>
  Backend.ListarRegistrosFuncion(modulo, funcion, pagina, porPagina) as unknown as Promise<{ rows: RecordRow[]; total: number }>;

export const listarEstadisticasUsuarios = () =>
  Backend.ListarEstadisticasUsuarios() as unknown as Promise<UserStat[]>;

export const listarTop15FuncionesPorUsuario = (idUser: number) =>
  Backend.ListarTop15FuncionesPorUsuario(idUser) as unknown as Promise<FunctionUsageByUser[]>;

export const listarRegistrosPorUsuarioYFuncion = (idUser: number, idFunct: number, pagina: number, porPagina: number) =>
  Backend.ListarRegistrosPorUsuarioYFuncion(idUser, idFunct, pagina, porPagina) as unknown as Promise<{ rows: RecordRow[]; total: number }>;

// ==== MCP ====

export const mcpListarUsuariosActivos = async (): Promise<MCPUser[]> =>
  ensureArrayResponse<MCPUser>(
    await Backend.MCPListarUsuariosActivos(),
    "MCPListarUsuariosActivos"
  );

export const mcpListarUsuariosBaja = async (): Promise<MCPUser[]> =>
  ensureArrayResponse<MCPUser>(
    await Backend.MCPListarUsuariosBaja(),
    "MCPListarUsuariosBaja"
  );

export const mcpBuscarUsuarios = async (texto: string): Promise<MCPUser[]> =>
  ensureArrayResponse<MCPUser>(
    await Backend.MCPBuscarUsuarios(texto),
    "MCPBuscarUsuarios"
  );

export const mcpCrearUsuario = (email: string, comment: string) =>
  Backend.MCPCrearUsuario(
    main.MCPCrearUsuarioInput.createFrom({
      email,
      comment,
    })
  ) as unknown as Promise<MCPUser>;

export const mcpGuardarUsuario = (
  idUser: number,
  email: string,
  comment: string
) =>
  Backend.MCPGuardarUsuario(
    main.MCPGuardarUsuarioInput.createFrom({
      id_user: idUser,
      email,
      comment,
    })
  ) as unknown as Promise<void>;

export const mcpDarDeBajaUsuario = (
  idUser: number,
  sctask: string,
  motivo = ""
) =>
  Backend.MCPDarDeBajaUsuario(
    main.MCPBajaUsuarioInput.createFrom({
      id_user: idUser,
      sctask,
      motivo,
    })
  ) as unknown as Promise<void>;

export const mcpDarDeAltaUsuario = (idUser: number) =>
  Backend.MCPDarDeAltaUsuario(idUser) as unknown as Promise<void>;

// ==== MCP: catálogo y estadísticas ====

export const mcpListarCatalogo = async (): Promise<MCPCatalogItem[]> =>
  ensureArrayResponse<MCPCatalogItem>(
    await Backend.MCPListarCatalogo(),
    "MCPListarCatalogo"
  );

export const mcpListarEstadisticasUsuarios = async (): Promise<MCPUserStat[]> =>
  ensureArrayResponse<MCPUserStat>(
    await Backend.MCPListarEstadisticasUsuarios(),
    "MCPListarEstadisticasUsuarios"
  );

export const mcpListarFuncionesPorUsuario = async (
  idUser: number
): Promise<MCPFunctionUsage[]> =>
  ensureArrayResponse<MCPFunctionUsage>(
    await Backend.MCPListarFuncionesPorUsuario(idUser),
    "MCPListarFuncionesPorUsuario"
  );

export const mcpListarInteracciones = async (
  idUser: number,
  idFunct: number,
  pagina: number,
  porPagina: number
): Promise<{ rows: MCPInteractionRow[]; total: number }> => {
  const response = await Backend.MCPListarInteracciones(
    idUser,
    idFunct,
    pagina,
    porPagina
  );

  return {
    rows: response?.rows ?? [],
    total: response?.total ?? 0,
  };
};