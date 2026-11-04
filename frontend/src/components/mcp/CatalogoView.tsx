import { useEffect, useMemo, useState } from "react";
import { MCPCatalogItem } from "../../types";
import {
  mcpListarCatalogo,
  mcpCrearModulo,
  mcpModificarModulo,
  mcpEliminarModulo,
  mcpCrearFuncion,
  mcpModificarFuncion,
  mcpEliminarFuncion,
} from "../../api";
import ConfirmActionModal from "../shared/ConfirmActionModal";

type FuncionNode = {
  id_funct: number;
  funcion: string;
};

type ModuloNode = {
  id_mcp: number;
  mcp: string;
  funciones: FuncionNode[];
};

export default function CatalogoView() {
  const [items, setItems] = useState<MCPCatalogItem[]>([]);
  const [moduloSelId, setModuloSelId] = useState<number | null>(null);
  const [funcionSelId, setFuncionSelId] = useState<number | null>(null);

  const [nuevoModulo, setNuevoModulo] = useState("");
  const [nuevaFuncion, setNuevaFuncion] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [modal, setModal] = useState<null | {
    tipo:
      | "renombrarModulo"
      | "eliminarModulo"
      | "renombrarFuncion"
      | "eliminarFuncion";
  }>(null);

  const formatError = (err: unknown) => {
    if (err instanceof Error) return err.message;
    return String(err);
  };

  const cargar = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await mcpListarCatalogo();
      setItems(data ?? []);
    } catch (err) {
      setItems([]);
      setError(formatError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const modulos = useMemo<ModuloNode[]>(() => {
    const map = new Map<number, ModuloNode>();

    for (const item of items) {
      if (!map.has(item.id_mcp)) {
        map.set(item.id_mcp, {
          id_mcp: item.id_mcp,
          mcp: item.mcp,
          funciones: [],
        });
      }

      if (item.id_funct != null && item.funcion) {
        map.get(item.id_mcp)!.funciones.push({
          id_funct: item.id_funct,
          funcion: item.funcion,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.mcp.localeCompare(b.mcp));
  }, [items]);

  const moduloSeleccionado = useMemo(
    () => modulos.find((m) => m.id_mcp === moduloSelId) ?? null,
    [modulos, moduloSelId]
  );

  const funcionSeleccionada = useMemo(() => {
    if (!moduloSeleccionado || funcionSelId == null) return null;
    return (
      moduloSeleccionado.funciones.find((f) => f.id_funct === funcionSelId) ??
      null
    );
  }, [moduloSeleccionado, funcionSelId]);

  // Mantener selección válida tras recargar
  useEffect(() => {
    if (modulos.length === 0) {
      setModuloSelId(null);
      setFuncionSelId(null);
      return;
    }

    if (!moduloSelId || !modulos.some((m) => m.id_mcp === moduloSelId)) {
      setModuloSelId(modulos[0].id_mcp);
      setFuncionSelId(null);
      return;
    }

    if (
      funcionSelId &&
      moduloSeleccionado &&
      !moduloSeleccionado.funciones.some((f) => f.id_funct === funcionSelId)
    ) {
      setFuncionSelId(null);
    }
  }, [modulos, moduloSelId, funcionSelId, moduloSeleccionado]);

  const crearModulo = async () => {
    const nombre = nuevoModulo.trim();
    if (!nombre) return;
    try {
      setError(null);
      await mcpCrearModulo(nombre);
      setNuevoModulo("");
      await cargar();
    } catch (err) {
      setError(formatError(err));
    }
  };

  const crearFuncion = async () => {
    if (!moduloSeleccionado) return;
    const nombre = nuevaFuncion.trim();
    if (!nombre) return;
    try {
      setError(null);
      await mcpCrearFuncion(moduloSeleccionado.id_mcp, nombre);
      setNuevaFuncion("");
      await cargar();
    } catch (err) {
      setError(formatError(err));
    }
  };

  const renombrarModulo = async (nuevoNombre?: string) => {
    if (!moduloSeleccionado || !nuevoNombre?.trim()) return;
    try {
      setError(null);
      await mcpModificarModulo(moduloSeleccionado.id_mcp, nuevoNombre.trim());
      setModal(null);
      await cargar();
    } catch (err) {
      setError(formatError(err));
    }
  };

  const eliminarModulo = async () => {
    if (!moduloSeleccionado) return;
    try {
      setError(null);
      await mcpEliminarModulo(moduloSeleccionado.id_mcp);
      setModal(null);
      setFuncionSelId(null);
      await cargar();
    } catch (err) {
      setError(formatError(err));
    }
  };

  const renombrarFuncion = async (nuevoNombre?: string) => {
    if (!moduloSeleccionado || !funcionSeleccionada || !nuevoNombre?.trim())
      return;
    try {
      setError(null);
      await mcpModificarFuncion(
        funcionSeleccionada.id_funct,
        moduloSeleccionado.id_mcp,
        nuevoNombre.trim()
      );
      setModal(null);
      await cargar();
    } catch (err) {
      setError(formatError(err));
    }
  };

  const eliminarFuncion = async () => {
    if (!funcionSeleccionada) return;
    try {
      setError(null);
      await mcpEliminarFuncion(funcionSeleccionada.id_funct);
      setModal(null);
      await cargar();
    } catch (err) {
      setError(formatError(err));
    }
  };

  return (
    <div className="catalogo-view">
      <header className="view-header">
        <h1>Catálogo</h1>
      </header>

      {error && <div className="error-banner">⚠ {error}</div>}
      {cargando && <div className="info-banner">Cargando...</div>}

      <div className="bracket">
        {/* Columna: Módulos */}
        <section className="bracket-column">
          <h3>Módulos</h3>

          <div className="bracket-list">
            {modulos.map((m) => (
              <button
                key={m.id_mcp}
                className={`bracket-item ${
                  moduloSelId === m.id_mcp ? "selected" : ""
                }`}
                onClick={() => {
                  setModuloSelId(m.id_mcp);
                  setFuncionSelId(null);
                }}
              >
                <div>{m.mcp}</div>
                <div className="bracket-id">#{m.id_mcp}</div>
              </button>
            ))}

            {!cargando && modulos.length === 0 && (
              <p className="hint">Sin módulos registrados.</p>
            )}
          </div>

          <div className="bracket-add">
            <input
              value={nuevoModulo}
              onChange={(e) => setNuevoModulo(e.target.value)}
              placeholder="Nombre del módulo..."
              onKeyDown={(e) => e.key === "Enter" && crearModulo()}
            />
            <button className="primary" onClick={crearModulo}>
              Crear
            </button>
          </div>
        </section>

        {/* Columna: Funciones del módulo */}
        <section className="bracket-column">
          <h3>Funciones</h3>

          {moduloSeleccionado ? (
            <>
              <div className="bracket-list">
                {moduloSeleccionado.funciones.map((f) => (
                  <button
                    key={f.id_funct}
                    className={`bracket-item ${
                      funcionSelId === f.id_funct ? "selected" : ""
                    }`}
                    onClick={() => setFuncionSelId(f.id_funct)}
                  >
                    <div>{f.funcion}</div>
                    <div className="bracket-id">#{f.id_funct}</div>
                  </button>
                ))}

                {moduloSeleccionado.funciones.length === 0 && (
                  <p className="hint">Este módulo no tiene funciones.</p>
                )}
              </div>

              <div className="bracket-add">
                <input
                  value={nuevaFuncion}
                  onChange={(e) => setNuevaFuncion(e.target.value)}
                  placeholder="Nombre de la función..."
                  onKeyDown={(e) => e.key === "Enter" && crearFuncion()}
                />
                <button className="primary" onClick={crearFuncion}>
                  Crear
                </button>
              </div>
            </>
          ) : (
            <p className="hint">Selecciona un módulo.</p>
          )}
        </section>

        {/* Columna: Editor */}
        <section className="bracket-column">
          <h3>Editor</h3>

          {!moduloSeleccionado && (
            <p className="hint">Selecciona un módulo para editar.</p>
          )}

          {moduloSeleccionado && (
            <div className="function-editor">
              <div className="function-editor-title">
                <strong>Módulo:</strong> {moduloSeleccionado.mcp}
              </div>

              <div className="bracket-module-actions">
                <button
                  onClick={() => setModal({ tipo: "renombrarModulo" })}
                >
                  Renombrar módulo
                </button>
                <button
                  className="danger"
                  onClick={() => setModal({ tipo: "eliminarModulo" })}
                >
                  Eliminar módulo
                </button>
              </div>

              <hr style={{ borderColor: "var(--border)", opacity: 0.4 }} />

              {funcionSeleccionada ? (
                <div className="function-editor-action">
                  <div className="function-editor-title">
                    <strong>Función:</strong> {funcionSeleccionada.funcion}
                  </div>

                  <div className="bracket-module-actions">
                    <button
                      onClick={() => setModal({ tipo: "renombrarFuncion" })}
                    >
                      Renombrar función
                    </button>
                    <button
                      className="danger"
                      onClick={() => setModal({ tipo: "eliminarFuncion" })}
                    >
                      Eliminar función
                    </button>
                  </div>
                </div>
              ) : (
                <p className="hint">Selecciona una función para editarla.</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modales de confirmación */}
      {modal?.tipo === "renombrarModulo" && moduloSeleccionado && (
        <ConfirmActionModal
          titulo="Renombrar módulo"
          mensaje={`Escribe el nuevo nombre para "${moduloSeleccionado.mcp}".`}
          campoInicial={moduloSeleccionado.mcp}
          campoLabel="Nuevo nombre del módulo"
          confirmarLabel="Guardar"
          onCancelar={() => setModal(null)}
          onConfirmar={renombrarModulo}
        />
      )}

      {modal?.tipo === "eliminarModulo" && moduloSeleccionado && (
        <ConfirmActionModal
          titulo="Eliminar módulo"
          mensaje={`¿Seguro que deseas eliminar "${moduloSeleccionado.mcp}"? Esta acción no se puede deshacer.`}
          confirmarLabel="Eliminar"
          peligro
          onCancelar={() => setModal(null)}
          onConfirmar={() => {
            void eliminarModulo();
          }}
        />
      )}

      {modal?.tipo === "renombrarFuncion" && funcionSeleccionada && (
        <ConfirmActionModal
          titulo="Renombrar función"
          mensaje={`Escribe el nuevo nombre para "${funcionSeleccionada.funcion}".`}
          campoInicial={funcionSeleccionada.funcion}
          campoLabel="Nuevo nombre de la función"
          confirmarLabel="Guardar"
          onCancelar={() => setModal(null)}
          onConfirmar={renombrarFuncion}
        />
      )}

      {modal?.tipo === "eliminarFuncion" && funcionSeleccionada && (
        <ConfirmActionModal
          titulo="Eliminar función"
          mensaje={`¿Seguro que deseas eliminar "${funcionSeleccionada.funcion}"? Esta acción no se puede deshacer.`}
          confirmarLabel="Eliminar"
          peligro
          onCancelar={() => setModal(null)}
          onConfirmar={() => {
            void eliminarFuncion();
          }}
        />
      )}
    </div>
  );
}