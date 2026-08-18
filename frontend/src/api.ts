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
} from "./types";

export const listarUsuarios = (filtro: string, columna: string, modo: string) =>
  Backend.ListarUsuarios(filtro, columna, modo) as unknown as Promise<User[]>;

export const listarUsuariosBaja = () =>
  Backend.ListarUsuariosBaja() as unknown as Promise<User[]>;

export const buscarUsuarios = (texto: string) =>
  Backend.BuscarUsuarios(texto) as unknown as Promise<User[]>;

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
