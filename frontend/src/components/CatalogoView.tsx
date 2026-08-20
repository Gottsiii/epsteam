import { useEffect, useMemo, useState } from "react";
import { Modulo, ModuloFuncion } from "../types";
import {
  listarModulos,
  listarEstructuraModulos,
  crearModulo,
  modificarModulo,
  eliminarModulo,
  crearFuncion,
  modificarFuncion,
  eliminarFuncion,
} from "../api";
import ConfirmActionModal from "./ConfirmActionModal";

type AccionModal =
  | { tipo: "renombrarModulo"; idModulo: number; nombreActual: string }
  | { tipo: "desactivarModulo"; idModulo: number; nombre: string; funcionesActivas?: number }
  | { tipo: "renombrarFuncion"; idFunct: number; idModulo: number; nombreActual: string }
  | { tipo: "desactivarFuncion"; idFunct: number; nombre: string }
  | { tipo: "moverFuncion"; idFunct: number; idModuloDestino: number; nombreFuncion: string; nombreModuloDestino: string };

export default function CatalogoView() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [estructura, setEstructura] = useState<ModuloFuncion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [moduloSeleccionado, setModuloSeleccionado] = useState<number | null>(null);
  const [funcionSeleccionada, setFuncionSeleccionada] = useState<ModuloFuncion | null>(null);

  const [nuevoModulo, setNuevoModulo] = useState("");
  const [nuevaFuncion, setNuevaFuncion] = useState("");
  const [destinoMover, setDestinoMover] = useState<number | "">("");

  const [accion, setAccion] = useState<AccionModal | null>(null);

  const cargar = async () => {
    try {
      const [ms, est] = await Promise.all([listarModulos(), listarEstructuraModulos()]);
      setError(null);
      setModulos(ms);
      setEstructura(est);
    } catch (err) {
      setError(String(err));
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const funcionesDelModulo = useMemo(
    () => estructura.filter((f) => f.id_modulo === moduloSeleccionado && f.id_funct != null),
    [estructura, moduloSeleccionado]
  );

  const moduloActual = modulos.find((m) => m.id_modulo === moduloSeleccionado) ?? null;

  const handleCrearModulo = async () => {
    if (!nuevoModulo.trim()) return;
    try {
      await crearModulo(nuevoModulo.trim());
      setNuevoModulo("");
      cargar();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleCrearFuncion = async () => {
    if (!nuevaFuncion.trim() || moduloSeleccionado == null) return;
    try {
      await crearFuncion(moduloSeleccionado, nuevaFuncion.trim());
      setNuevaFuncion("");
      cargar();
    } catch (err) {
      setError(String(err));
    }
  };

  const cerrarModal = () => setAccion(null);

  const ejecutarAccion = async (valor?: string) => {
    if (!accion) return;
    try {
      switch (accion.tipo) {
        case "renombrarModulo":
          if (valor) await modificarModulo(accion.idModulo, valor);
          break;
        case "desactivarModulo":
          await eliminarModulo(accion.idModulo);
          if (moduloSeleccionado === accion.idModulo) {
            setModuloSeleccionado(null);
            setFuncionSeleccionada(null);
          }
          break;
        case "renombrarFuncion":
          if (valor) await modificarFuncion(accion.idFunct, accion.idModulo, valor);
          break;
        case "desactivarFuncion":
          await eliminarFuncion(accion.idFunct);
          setFuncionSeleccionada(null);
          break;
        case "moverFuncion": {
          const funcionActual = estructura.find((f) => f.id_funct === accion.idFunct);
          if (funcionActual?.funcion) {
            await modificarFuncion(accion.idFunct, accion.idModuloDestino, funcionActual.funcion);
          }
          setFuncionSeleccionada(null);
          setDestinoMover("");
          break;
        }
      }
      setAccion(null);
      cargar();
    } catch (err) {
      setError(String(err));
      setAccion(null);
    }
  };

  const handleDesactivarModulo = () => {
    if (!moduloActual) return;
    const funcionesActivas = funcionesDelModulo.length;
    
    if (funcionesActivas > 0) {
      setError(`No se puede desactivar: este módulo tiene ${funcionesActivas} función(es) activa(s). Desactívalas primero.`);
      return;
    }

    setAccion({
      tipo: "desactivarModulo",
      idModulo: moduloActual.id_modulo,
      nombre: moduloActual.name,
      funcionesActivas: funcionesActivas,
    });
  };

  return (
    <div className="catalogo-view">
      <header className="view-header">
        <h1>Módulos y funciones</h1>
      </header>

      {error && <div className="error-banner">⚠ {error}</div>}

      <div className="bracket">
        {/* Columna 1: módulos */}
        <div className="bracket-column">
          <h3>Módulos</h3>
          <div className="bracket-list">
            {modulos.map((m) => (
              <button
                key={m.id_modulo}
                className={`bracket-item ${m.id_modulo === moduloSeleccionado ? "selected" : ""}`}
                onClick={() => {
                  setModuloSeleccionado(m.id_modulo);
                  setFuncionSeleccionada(null);
                  setError(null);
                }}
              >
                <span className="bracket-id">{m.id_modulo}</span> — {m.name}
              </button>
            ))}
          </div>
          <div className="bracket-add">
            <input
              placeholder="Nuevo módulo..."
              value={nuevoModulo}
              onChange={(e) => setNuevoModulo(e.target.value)}
            />
            <button className="primary" onClick={handleCrearModulo}>
              +
            </button>
          </div>
        </div>

        {/* Columna 2: funciones del módulo seleccionado */}
        <div className="bracket-column">
          <h3>Funciones{moduloActual ? ` — ${moduloActual.name}` : ""}</h3>
          {!moduloActual && <p className="hint">Selecciona un módulo para ver sus funciones.</p>}
          {moduloActual && (
            <>
              <div className="bracket-module-actions">
                <button
                  onClick={() =>
                    setAccion({ tipo: "renombrarModulo", idModulo: moduloActual.id_modulo, nombreActual: moduloActual.name })
                  }
                >
                  Renombrar módulo
                </button>
                <button
                  className="danger"
                  onClick={handleDesactivarModulo}
                >
                  Desactivar módulo
                </button>
              </div>

              <div className="bracket-list">
                {funcionesDelModulo.map((f) => (
                  <button
                    key={f.id_funct}
                    className={`bracket-item ${f.id_funct === funcionSeleccionada?.id_funct ? "selected" : ""}`}
                    onClick={() => {
                      setFuncionSeleccionada(f);
                      setDestinoMover("");
                    }}
                  >
                    <span className="bracket-id">{f.id_funct}</span> — {f.funcion}
                  </button>
                ))}
                {funcionesDelModulo.length === 0 && <p className="hint">Sin funciones todavía.</p>}
              </div>

              <div className="bracket-add">
                <input
                  placeholder="Nueva función..."
                  value={nuevaFuncion}
                  onChange={(e) => setNuevaFuncion(e.target.value)}
                />
                <button className="primary" onClick={handleCrearFuncion}>
                  +
                </button>
              </div>
            </>
          )}
        </div>

        {/* Columna 3: edición de la función seleccionada */}
        <div className="bracket-column">
          <h3>Editar función</h3>
          {!funcionSeleccionada && <p className="hint">Selecciona una función para modificarla.</p>}
          {funcionSeleccionada && (
            <div className="function-editor">
              <div className="function-editor-title">
                <span className="bracket-id">{funcionSeleccionada.id_funct}</span> — {funcionSeleccionada.funcion}
              </div>

              <div className="function-editor-action">
                <label>Renombrar</label>
                <button
                  onClick={() =>
                    setAccion({
                      tipo: "renombrarFuncion",
                      idFunct: funcionSeleccionada.id_funct!,
                      idModulo: funcionSeleccionada.id_modulo,
                      nombreActual: funcionSeleccionada.funcion!,
                    })
                  }
                >
                  Cambiar nombre
                </button>
              </div>

              <div className="function-editor-action">
                <label>Mover a otro módulo</label>
                <div className="move-row">
                  <select value={destinoMover} onChange={(e) => setDestinoMover(Number(e.target.value))}>
                    <option value="">Selecciona un módulo...</option>
                    {modulos
                      .filter((m) => m.id_modulo !== funcionSeleccionada.id_modulo)
                      .map((m) => (
                        <option key={m.id_modulo} value={m.id_modulo}>
                          {m.id_modulo} — {m.name}
                        </option>
                      ))}
                  </select>
                  <button
                    disabled={destinoMover === ""}
                    onClick={() =>
                      destinoMover !== "" &&
                      setAccion({
                        tipo: "moverFuncion",
                        idFunct: funcionSeleccionada.id_funct!,
                        idModuloDestino: Number(destinoMover),
                        nombreFuncion: funcionSeleccionada.funcion!,
                        nombreModuloDestino: modulos.find((m) => m.id_modulo === destinoMover)?.name ?? "",
                      })
                    }
                  >
                    Mover
                  </button>
                </div>
              </div>

              <div className="function-editor-action">
                <label>Zona de peligro</label>
                <button
                  className="danger"
                  onClick={() =>
                    setAccion({ tipo: "desactivarFuncion", idFunct: funcionSeleccionada.id_funct!, nombre: funcionSeleccionada.funcion! })
                  }
                >
                  Desactivar función
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {accion?.tipo === "renombrarModulo" && (
        <ConfirmActionModal
          titulo="Renombrar módulo"
          mensaje="Escribe el nuevo nombre del módulo."
          campoInicial={accion.nombreActual}
          campoLabel="Nombre del módulo"
          confirmarLabel="Guardar"
          onCancelar={cerrarModal}
          onConfirmar={ejecutarAccion}
        />
      )}
      {accion?.tipo === "desactivarModulo" && (
        <ConfirmActionModal
          titulo="Desactivar módulo"
          mensaje={`¿Desactivar "${accion.nombre}"? Se ocultará del sistema pero se preservarán todos los registros históricos.`}
          confirmarLabel="Desactivar"
          peligro
          onCancelar={cerrarModal}
          onConfirmar={ejecutarAccion}
        />
      )}
      {accion?.tipo === "renombrarFuncion" && (
        <ConfirmActionModal
          titulo="Renombrar función"
          mensaje="Escribe el nuevo nombre de la función."
          campoInicial={accion.nombreActual}
          campoLabel="Nombre de la función"
          confirmarLabel="Guardar"
          onCancelar={cerrarModal}
          onConfirmar={ejecutarAccion}
        />
      )}
      {accion?.tipo === "desactivarFuncion" && (
        <ConfirmActionModal
          titulo="Desactivar función"
          mensaje={`¿Desactivar "${accion.nombre}"? Se ocultará del sistema pero se preservarán todos los registros de uso en la tabla 'record'.`}
          confirmarLabel="Desactivar"
          peligro
          onCancelar={cerrarModal}
          onConfirmar={ejecutarAccion}
        />
      )}
      {accion?.tipo === "moverFuncion" && (
        <ConfirmActionModal
          titulo="Mover función"
          mensaje={`¿Mover "${accion.nombreFuncion}" al módulo "${accion.nombreModuloDestino}"?`}
          confirmarLabel="Mover"
          onCancelar={cerrarModal}
          onConfirmar={ejecutarAccion}
        />
      )}
    </div>
  );
}
