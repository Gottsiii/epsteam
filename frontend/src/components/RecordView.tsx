import { useEffect, useMemo, useState } from "react";
import { UserStat, FunctionUsage, RecordRow } from "../types";
import {
  listarEstadisticasUsuarios,
  listarTop15FuncionesPorUsuario,
  listarRegistrosPorUsuarioYFuncion,
} from "../api";

const POR_PAGINA = 50;

export default function RecordView() {
  // Pantalla de carga inicial
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // Slider 1: Usuarios del mes
  const [usuarios, setUsuarios] = useState<UserStat[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [seleccionadoUsuario, setSeleccionadoUsuario] = useState<UserStat | null>(null);

  // Slider 2: Top 15 funciones del usuario seleccionado
  const [funciones, setFunciones] = useState<FunctionUsage[]>([]);
  const [cargandoFunciones, setCargandoFunciones] = useState(false);
  const [seleccionadaFuncion, setSeleccionadaFuncion] = useState<FunctionUsage | null>(null);

  // Tabla 3: Registros del usuario + función
  const [filas, setFilas] = useState<RecordRow[]>([]);
  const [totalFilas, setTotalFilas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);
  const [busquedaRegistros, setBusquedaRegistros] = useState("");

  const [error, setError] = useState<string | null>(null);

  // Cargar usuarios al montar
  useEffect(() => {
    listarEstadisticasUsuarios()
      .then((data) => setUsuarios(data ?? []))
      .catch((err) => setError(String(err)))
      .finally(() => setCargandoInicial(false));
  }, []);

  // Total de interacciones del mes
  const totalInteracciones = useMemo(
    () => usuarios.reduce((acc, u) => acc + u.total_interacciones, 0),
    [usuarios]
  );

  // Filtrar usuarios por búsqueda
  const usuariosFiltrados = useMemo(() => {
    const q = busquedaUsuario.toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => String(u.id_user).includes(q));
  }, [usuarios, busquedaUsuario]);

  // Al clickear un usuario: cargar top 15 funciones
  const cargarFunciones = async (usuario: UserStat) => {
    setSeleccionadoUsuario(usuario);
    setSeleccionadaFuncion(null);
    setFilas([]);
    setTotalFilas(0);
    setCargandoFunciones(true);
    try {
      const data = await listarTop15FuncionesPorUsuario(usuario.id_user);
      setFunciones(data ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setCargandoFunciones(false);
    }
  };

  // Al clickear una función: cargar registros de usuario + función
  const cargarRegistros = async (
    usuario: UserStat,
    funcion: FunctionUsage,
    pag: number
  ) => {
    setSeleccionadaFuncion(funcion);
    setPagina(pag);
    setBusquedaRegistros("");
    setCargandoRegistros(true);
    try {
      const { rows, total } = await listarRegistrosPorUsuarioYFuncion(
        usuario.id_user,
        funcion.id_funct,
        pag,
        POR_PAGINA
      );
      setFilas(rows ?? []);
      setTotalFilas(total);
    } catch (err) {
      setError(String(err));
    } finally {
      setCargandoRegistros(false);
    }
  };

  const cambiarPagina = (nueva: number) => {
    if (!seleccionadoUsuario || !seleccionadaFuncion) return;
    cargarRegistros(seleccionadoUsuario, seleccionadaFuncion, nueva);
  };

  // Filtrar filas en tabla
  const filasFiltradas = useMemo(() => {
    const q = busquedaRegistros.toLowerCase();
    if (!q) return filas;
    return filas.filter(
      (f) =>
        String(f.id_user).includes(q) ||
        f.status.toLowerCase().includes(q) ||
        f.date.toLowerCase().includes(q)
    );
  }, [filas, busquedaRegistros]);

  const totalPaginas = Math.ceil(totalFilas / POR_PAGINA);

  // Pantalla de carga inicial
  if (cargandoInicial) {
    return (
      <div className="record-view record-loading">
        <div className="loading-spinner" />
        <p>Cargando estadísticas del mes...</p>
      </div>
    );
  }

  return (
    <div className="record-view">
      <header className="view-header">
        <h1>Estadísticas de uso</h1>
        <p className="record-global-count">
          <strong>{totalInteracciones.toLocaleString()}</strong> interacciones en{" "}
          {new Date().toLocaleString("es-ES", { month: "long", year: "numeric" })}
        </p>
      </header>

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          ⚠ {error}
        </div>
      )}

      {/* SLIDER 1: USUARIOS DEL MES */}
      <div className="record-section">
        <h2>Usuarios del mes</h2>
        <div className="record-search-bar">
          <input
            placeholder="Buscar por ID de usuario..."
            value={busquedaUsuario}
            onChange={(e) => setBusquedaUsuario(e.target.value)}
          />
        </div>

        <div className="record-slider">
          {usuariosFiltrados.length === 0 && (
            <p className="hint">Sin datos para este mes.</p>
          )}
          {usuariosFiltrados.map((u) => (
            <button
              key={`user-${u.id_user}`}
              className={`record-card ${
                seleccionadoUsuario?.id_user === u.id_user ? "selected" : ""
              }`}
              onClick={() => cargarFunciones(u)}
            >
              <span className="record-card-modulo">Usuario {u.id_user}</span>
              <span className="record-card-total">
                {u.total_interacciones.toLocaleString()} interacciones
              </span>
              <span className="record-card-fecha">
                Última actividad: {u.last_update || "—"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SLIDER 2: TOP 15 FUNCIONES DEL USUARIO SELECCIONADO */}
      {seleccionadoUsuario && (
        <div className="record-section">
          <h2>Top 15 funciones — Usuario {seleccionadoUsuario.id_user}</h2>
          {cargandoFunciones ? (
            <p className="hint">Cargando funciones...</p>
          ) : (
            <div className="record-slider">
              {funciones.length === 0 && (
                <p className="hint">Sin funciones registradas este mes.</p>
              )}
              {funciones.map((f) => (
                <button
                  key={`funct-${f.id_funct}`}
                  className={`record-card ${
                    seleccionadaFuncion?.id_funct === f.id_funct ? "selected" : ""
                  }`}
                  onClick={() => cargarRegistros(seleccionadoUsuario, f, 1)}
                >
                  <span className="record-card-modulo">{f.modulo}</span>
                  <span className="record-card-funcion">{f.funcion}</span>
                  <span className="record-card-total">
                    {f.usos.toLocaleString()} usos
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TABLA 3: REGISTROS DETALLADOS */}
      {seleccionadoUsuario && seleccionadaFuncion && (
        <div className="record-section">
          <h2>
            Registros — Usuario {seleccionadoUsuario.id_user} /&nbsp;
            {seleccionadaFuncion.modulo} - {seleccionadaFuncion.funcion}
          </h2>

          <div className="record-search-bar">
            <input
              placeholder="Filtrar por usuario, status o fecha..."
              value={busquedaRegistros}
              onChange={(e) => setBusquedaRegistros(e.target.value)}
            />
          </div>

          {cargandoRegistros ? (
            <p className="hint">Cargando registros...</p>
          ) : (
            <>
              <div className="record-table-wrap">
                <table className="record-table">
                  <thead>
                    <tr>
                      <th>#ID</th>
                      <th>Usuario</th>
                      <th>Status</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasFiltradas.map((f) => (
                      <tr key={f.id_record}>
                        <td>{f.id_record}</td>
                        <td>{f.id_user}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              f.status === "success" ? "success" : "error"
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td>{f.date}</td>
                      </tr>
                    ))}
                    {filasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={4} className="hint">
                          Sin resultados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPaginas > 1 && !busquedaRegistros && (
                <div className="record-pagination">
                  <button
                    disabled={pagina <= 1}
                    onClick={() => cambiarPagina(pagina - 1)}
                  >
                    ‹ Anterior
                  </button>
                  <span>
                    Página {pagina} / {totalPaginas} ({totalFilas.toLocaleString()} registros)
                  </span>
                  <button
                    disabled={pagina >= totalPaginas}
                    onClick={() => cambiarPagina(pagina + 1)}
                  >
                    Siguiente ›
                  </button>
                </div>
              )}
              {busquedaRegistros && (
                <div className="record-pagination">
                  <span>
                    Mostrando {filasFiltradas.length} de {filas.length} registros en esta página
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
