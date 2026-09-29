import { useEffect, useMemo, useState } from "react";
import { MCPFunctionUsage, MCPInteractionRow, MCPUserStat } from "../../types";
import { mcpListarEstadisticasUsuarios, mcpListarFuncionesPorUsuario, mcpListarInteracciones } from "../../api";

const POR_PAGINA = 50;

export default function MCPRecordView() {
  const [usuarios, setUsuarios] = useState<MCPUserStat[]>([]);
  const [funciones, setFunciones] = useState<MCPFunctionUsage[]>([]);
  const [registros, setRegistros] = useState<MCPInteractionRow[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<MCPUserStat | null>(null);
  const [funcionSeleccionada, setFuncionSeleccionada] = useState<MCPFunctionUsage | null>(null);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    mcpListarEstadisticasUsuarios()
      .then(setUsuarios)
      .catch((err) => setError(String(err)));
  }, []);

  const totalInteracciones = useMemo(
    () => usuarios.reduce((acc, u) => acc + u.total_interacciones, 0),
    [usuarios]
  );

  const seleccionarUsuario = async (user: MCPUserStat) => {
    setUsuarioSeleccionado(user);
    setFuncionSeleccionada(null);
    setFunciones([]);
    setRegistros([]);
    setTotalRegistros(0);
    setPagina(1);
    try {
      const data = await mcpListarFuncionesPorUsuario(user.id_user);
      setFunciones(data ?? []);
    } catch (err) {
      setError(String(err));
    }
  };

  const cargarRegistros = async (funcion: MCPFunctionUsage, pag: number) => {
    if (!usuarioSeleccionado) return;
    setCargando(true);
    try {
      const { rows, total } = await mcpListarInteracciones(
        usuarioSeleccionado.id_user,
        funcion.id_funct,
        pag,
        POR_PAGINA
      );
      setRegistros(rows ?? []);
      setTotalRegistros(total ?? 0);
    } catch (err) {
      setError(String(err));
    } finally {
      setCargando(false);
    }
  };

  const seleccionarFuncion = (funcion: MCPFunctionUsage) => {
    setFuncionSeleccionada(funcion);
    setPagina(1);
    cargarRegistros(funcion, 1);
  };

  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA);

  return (
    <div className="record-view">
      <header className="view-header">
        <h1>Estadísticas MCP</h1>
        <p className="record-global-count">
          <strong>{totalInteracciones.toLocaleString()}</strong> interacciones totales
        </p>
      </header>

      {error && <div className="error-banner" onClick={() => setError(null)}>⚠ {error}</div>}

      <div className="record-slider">
        {usuarios.length === 0 && !error && <p className="hint">Sin interacciones registradas.</p>}
        {usuarios.map((u) => (
          <button
            key={u.id_user}
            className={`record-card ${usuarioSeleccionado?.id_user === u.id_user ? "active" : ""}`}
            onClick={() => seleccionarUsuario(u)}
          >
            <span className="record-card-modulo">{u.email}</span>
            <span className="record-card-total">{u.total_interacciones.toLocaleString()} interacciones</span>
            <span className="hint">
              {u.last_activity ? `Última actividad: ${u.last_activity}` : "Sin actividad"}
            </span>
          </button>
        ))}
      </div>

      {usuarioSeleccionado && (
        <>
          <h2>Funciones — {usuarioSeleccionado.email}</h2>
          <div className="record-slider">
            {funciones.length === 0 && <p className="hint">Sin funciones para este usuario.</p>}
            {funciones.map((f) => (
              <button
                key={f.id_funct}
                className={`record-card ${funcionSeleccionada?.id_funct === f.id_funct ? "active" : ""}`}
                onClick={() => seleccionarFuncion(f)}
              >
                <span className="record-card-modulo">{f.mcp}</span>
                <span className="record-card-funcion">{f.funcion}</span>
                <span className="record-card-total">{f.usos.toLocaleString()} usos</span>
              </button>
            ))}
          </div>
        </>
      )}

      {funcionSeleccionada && (
        <div className="record-modal">
          <h2>
            Interacciones — {funcionSeleccionada.mcp} / {funcionSeleccionada.funcion}
          </h2>

          {cargando ? (
            <p className="hint">Cargando...</p>
          ) : (
            <>
              <div className="record-table-wrap">
                <table className="record-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Output</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((r) => (
                      <tr key={r.id_interaction}>
                        <td>{r.id_user}</td>
                        <td>{r.output || "—"}</td>
                        <td>{r.date}</td>
                      </tr>
                    ))}
                    {registros.length === 0 && (
                      <tr>
                        <td colSpan={3} className="hint">
                          Sin resultados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPaginas > 1 && (
                <div className="record-pagination">
                  <button disabled={pagina <= 1} onClick={() => { setPagina(pagina - 1); cargarRegistros(funcionSeleccionada, pagina - 1); }}>
                    ‹ Anterior
                  </button>
                  <span>
                    Página {pagina} / {totalPaginas} ({totalRegistros.toLocaleString()} registros)
                  </span>
                  <button disabled={pagina >= totalPaginas} onClick={() => { setPagina(pagina + 1); cargarRegistros(funcionSeleccionada, pagina + 1); }}>
                    Siguiente ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}