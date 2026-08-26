import { useEffect, useMemo, useState } from "react";
import { FunctionUsageByUser, RecordRow, UserStat } from "../types";
import {
  listarEstadisticasUsuarios,
  listarRegistrosPorUsuarioYFuncion,
  listarTop15FuncionesPorUsuario,
} from "../api";

const POR_PAGINA = 50;

export default function RecordView() {
  const [usuarios, setUsuarios] = useState<UserStat[]>([]);
  const [funciones, setFunciones] = useState<FunctionUsageByUser[]>([]);
  const [registros, setRegistros] = useState<RecordRow[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("");
  const [busquedaTabla, setBusquedaTabla] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UserStat | null>(null);
  const [funcionSeleccionada, setFuncionSeleccionada] = useState<FunctionUsageByUser | null>(null);
  const [pagina, setPagina] = useState(1);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);

  useEffect(() => {
    listarEstadisticasUsuarios()
      .then((data) => setUsuarios(data ?? []))
      .catch((err) => setError(String(err)));
  }, []);

  const totalInteracciones = useMemo(() => usuarios.reduce((acc, u) => acc + u.total_interacciones, 0), [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const q = busquedaUsuarios.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => String(u.id_user).includes(q) || u.username.toLowerCase().includes(q));
  }, [usuarios, busquedaUsuarios]);

  const cargarFuncionesUsuario = async (user: UserStat) => {
    setUsuarioSeleccionado(user);
    setFuncionSeleccionada(null);
    setFunciones([]);
    setRegistros([]);
    setTotalRegistros(0);
    setPagina(1);
    setBusquedaTabla("");
    try {
      const data = await listarTop15FuncionesPorUsuario(user.id_user);
      setFunciones(data ?? []);
    } catch (err) {
      setError(String(err));
    }
  };

  const cargarRegistros = async (funcion: FunctionUsageByUser, pag: number) => {
    if (!usuarioSeleccionado) return;
    setCargandoRegistros(true);
    try {
      const { rows, total } = await listarRegistrosPorUsuarioYFuncion(
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
      setCargandoRegistros(false);
    }
  };

  const seleccionarFuncion = (funcion: FunctionUsageByUser) => {
    setFuncionSeleccionada(funcion);
    setPagina(1);
    cargarRegistros(funcion, 1);
  };

  const cambiarPagina = (nueva: number) => {
    if (!funcionSeleccionada) return;
    setPagina(nueva);
    cargarRegistros(funcionSeleccionada, nueva);
  };

  const registrosFiltrados = useMemo(() => {
    const q = busquedaTabla.trim().toLowerCase();
    if (!q) return registros;
    return registros.filter(
      (r) =>
        String(r.id_user).includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q)
    );
  }, [registros, busquedaTabla]);

  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA);

  return (
    <div className="record-view">
      <header className="view-header">
        <h1>Estadísticas de uso</h1>
        <p className="record-global-count">
          <strong>{totalInteracciones.toLocaleString()}</strong> interacciones en el mes actual
        </p>
      </header>

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          ⚠ {error}
        </div>
      )}

      <div className="record-search-bar">
        <input
          placeholder="Buscar usuario por ID o username..."
          value={busquedaUsuarios}
          onChange={(e) => setBusquedaUsuarios(e.target.value)}
        />
      </div>

      <div className="record-slider">
        {usuariosFiltrados.length === 0 && (
          <p className="hint">Sin datos para el mes actual.</p>
        )}
        {usuariosFiltrados.map((u) => (
          <button
            key={u.id_user}
            className={`record-card ${usuarioSeleccionado?.id_user === u.id_user ? "active" : ""}`}
            onClick={() => cargarFuncionesUsuario(u)}
          >
            <span className="record-card-modulo">{u.username}</span>
            <span className="record-card-funcion">{u.id_user}</span>
            <span className="record-card-total">{u.total_interacciones.toLocaleString()} interacciones</span>
            <span className="hint">{u.last_update ? `Última actividad: ${u.last_update}` : "Sin lastUpdate"}</span>
          </button>
        ))}
      </div>

      {usuarioSeleccionado && (
        <>
          <h2>
            Top 15 funciones — {usuarioSeleccionado.username} ({usuarioSeleccionado.id_user})
          </h2>
          <div className="record-slider">
            {funciones.length === 0 && <p className="hint">Sin funciones para este usuario en el mes actual.</p>}
            {funciones.map((f) => (
              <button
                key={f.id_funct}
                className={`record-card ${funcionSeleccionada?.id_funct === f.id_funct ? "active" : ""}`}
                onClick={() => seleccionarFuncion(f)}
              >
                <span className="record-card-modulo">{f.modulo}</span>
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
            Registros — {funcionSeleccionada.modulo} / {funcionSeleccionada.funcion}
          </h2>
          <div className="record-modal-search">
            <input
              placeholder="Filtrar por usuario, status o fecha..."
              value={busquedaTabla}
              onChange={(e) => setBusquedaTabla(e.target.value)}
            />
          </div>

          {cargandoRegistros ? (
            <p className="hint">Cargando...</p>
          ) : (
            <>
              <div className="record-table-wrap">
                <table className="record-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Status</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((r) => (
                      <tr key={r.id_record}>
                        <td>{r.id_user}</td>
                        <td>
                          <span
                            className={`status-badge ${r.status === "success" ? "success" : "error"}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td>{r.date}</td>
                      </tr>
                    ))}
                    {registrosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={3} className="hint">
                          Sin resultados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPaginas > 1 && !busquedaTabla && (
                <div className="record-pagination">
                  <button disabled={pagina <= 1} onClick={() => cambiarPagina(pagina - 1)}>
                    ‹ Anterior
                  </button>
                  <span>
                    Página {pagina} / {totalPaginas} ({totalRegistros.toLocaleString()} registros)
                  </span>
                  <button disabled={pagina >= totalPaginas} onClick={() => cambiarPagina(pagina + 1)}>
                    Siguiente ›
                  </button>
                </div>
              )}
              {busquedaTabla && (
                <div className="record-pagination">
                  <span>
                    Mostrando {registrosFiltrados.length} de {registros.length} registros en esta página
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}