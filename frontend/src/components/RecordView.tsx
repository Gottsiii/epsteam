import { useEffect, useMemo, useState } from "react";
import { RecordStat, RecordRow } from "../types";
import { listarEstadisticasFunciones, listarRegistrosFuncion } from "../api";

const POR_PAGINA = 50;

export default function RecordView() {
  const [stats, setStats] = useState<RecordStat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  // Modal de detalle
  const [seleccionada, setSeleccionada] = useState<RecordStat | null>(null);
  const [filas, setFilas] = useState<RecordRow[]>([]);
  const [totalFilas, setTotalFilas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargandoModal, setCargandoModal] = useState(false);
  const [busquedaModal, setBusquedaModal] = useState("");

  useEffect(() => {
    listarEstadisticasFunciones()
      .then((data) => setStats(data ?? []))
      .catch((err) => setError(String(err)));
  }, []);

  const totalEjecuciones = useMemo(
    () => stats.reduce((acc, s) => acc + s.total, 0),
    [stats]
  );

  const statsFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    if (!q) return stats;
    return stats.filter(
      (s) =>
        s.modulo.toLowerCase().includes(q) ||
        s.funcion.toLowerCase().includes(q)
    );
  }, [stats, busqueda]);

  const cargarDetalle = async (stat: RecordStat, pag: number) => {
    setCargandoModal(true);
    try {
      const { rows, total } = await listarRegistrosFuncion(
        stat.modulo,
        stat.funcion,
        pag,
        POR_PAGINA
      );
      setFilas(rows);
      setTotalFilas(total);
    } catch (err) {
      setError(String(err));
    } finally {
      setCargandoModal(false);
    }
  };

  const abrirModal = (stat: RecordStat) => {
    setSeleccionada(stat);
    setPagina(1);
    setBusquedaModal("");
    cargarDetalle(stat, 1);
  };

  const cerrarModal = () => {
    setSeleccionada(null);
    setFilas([]);
    setTotalFilas(0);
    setBusquedaModal("");
  };

  const cambiarPagina = (nueva: number) => {
    if (!seleccionada) return;
    setPagina(nueva);
    cargarDetalle(seleccionada, nueva);
  };

  const filasFiltradas = useMemo(() => {
    const q = busquedaModal.toLowerCase();
    if (!q) return filas;
    return filas.filter(
      (f) =>
        String(f.id_user).includes(q) ||
        f.status.toLowerCase().includes(q) ||
        f.date.toLowerCase().includes(q)
    );
  }, [filas, busquedaModal]);

  const totalPaginas = Math.ceil(totalFilas / POR_PAGINA);

  return (
    <div className="record-view">
      <header className="view-header">
        <h1>Estadísticas de uso</h1>
        <p className="record-global-count">
          <strong>{totalEjecuciones.toLocaleString()}</strong> ejecuciones en los últimos 30 días
        </p>
      </header>

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          ⚠ {error}
        </div>
      )}

      <div className="record-search-bar">
        <input
          placeholder="Buscar por módulo o función..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="record-slider">
        {statsFiltradas.length === 0 && (
          <p className="hint">Sin datos para los últimos 30 días.</p>
        )}
        {statsFiltradas.map((s) => (
          <button
            key={`${s.modulo}-${s.funcion}`}
            className="record-card"
            onClick={() => abrirModal(s)}
          >
            <span className="record-card-modulo">{s.modulo}</span>
            <span className="record-card-funcion">{s.funcion}</span>
            <span className="record-card-total">{s.total.toLocaleString()}</span>
          </button>
        ))}
      </div>

      {seleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div
            className="modal-panel record-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {seleccionada.modulo} — {seleccionada.funcion}
              </h2>
              <button className="modal-close" onClick={cerrarModal}>
                ✕
              </button>
            </div>

            <div className="record-modal-search">
              <input
                placeholder="Filtrar por usuario, status o fecha..."
                value={busquedaModal}
                onChange={(e) => setBusquedaModal(e.target.value)}
              />
            </div>

            {cargandoModal ? (
              <p className="hint">Cargando...</p>
            ) : (
              <>
                <div className="record-table-wrap">
                  <table className="record-table">
                    <thead>
                      <tr>
                        <th>#</th>
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

            {totalPaginas > 1 && !busquedaModal && (
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
            {busquedaModal && (
              <div className="record-pagination">
                <span>Mostrando {filasFiltradas.length} de {filas.length} registros en esta página</span>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}