import { useEffect, useMemo, useState } from "react";
import { User, FuncionPermiso, Plan } from "../types";
import { listarFuncionesPorUsuario, listarPlanes, guardarUsuario, darDeBajaUsuario, darDeAltaUsuario, generarPassword } from "../api";
import ConfirmBajaModal from "./ConfirmBajaModal";
import ConfirmActionModal from "./ConfirmActionModal";

interface Props {
  usuario: User;
  onClose: () => void;
  onGuardado: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PermisosTab = "todos" | "asignados";

export default function UserEditDrawer({ usuario, onClose, onGuardado }: Props) {
  const [form, setForm] = useState(usuario);
  const [funciones, setFunciones] = useState<FuncionPermiso[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [generandoPsw, setGenerandoPsw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busquedaFuncion, setBusquedaFuncion] = useState("");
  const [mostrarConfirmBaja, setMostrarConfirmBaja] = useState(false);
  const [mostrarConfirmAlta, setMostrarConfirmAlta] = useState(false);
  const [datosAbierto, setDatosAbierto] = useState(true);
  const [permisosAbierto, setPermisosAbierto] = useState(true);
  const [permisosTab, setPermisosTab] = useState<PermisosTab>("todos");

  const estaDadoDeBaja = usuario.detalle.includes("BAJA DE USUARIO");

  useEffect(() => {
    listarFuncionesPorUsuario(usuario.id_user).then(setFunciones);
    listarPlanes().then(setPlanes);
  }, [usuario.id_user]);

  const toggleFuncion = (idFunct: number) => {
    setFunciones((prev) => prev.map((f) => (f.id_funct === idFunct ? { ...f, autorizada: !f.autorizada } : f)));
  };

  const setModuloCompleto = (modulo: string, autorizada: boolean) => {
    setFunciones((prev) => prev.map((f) => (f.modulo === modulo ? { ...f, autorizada } : f)));
  };

  const filtro = busquedaFuncion.trim().toLowerCase();
  const funcionesFiltradas = useMemo(
    () =>
      filtro
        ? funciones.filter((f) => f.funcion.toLowerCase().includes(filtro) || f.modulo.toLowerCase().includes(filtro))
        : funciones,
    [funciones, filtro]
  );

  const grupos = funcionesFiltradas.reduce<Record<string, FuncionPermiso[]>>((acc, f) => {
    (acc[f.modulo] ??= []).push(f);
    return acc;
  }, {});

  const gruposAsignados = useMemo(() => {
    const asignadas = funciones.filter((f) => f.autorizada);
    return asignadas.reduce<Record<string, FuncionPermiso[]>>((acc, f) => {
      (acc[f.modulo] ??= []).push(f);
      return acc;
    }, {});
  }, [funciones]);

  const handleGenerarPassword = async () => {
    setGenerandoPsw(true);
    try {
      const nueva = await generarPassword();
      setForm((prev) => ({ ...prev, psw: nueva }));
    } finally {
      setGenerandoPsw(false);
    }
  };

  const handleGuardar = async () => {
    if (!EMAIL_RE.test(form.email.trim())) {
      setError("El correo no tiene un formato válido.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await guardarUsuario({
        id_user: form.id_user,
        username: form.username,
        psw: form.psw,
        name: form.name,
        zone: form.zone,
        email: form.email,
        id_plan: form.id_plan,
        detalle: form.detalle,
        permisos: funciones.map((f) => ({ id_funct: f.id_funct, autorizada: f.autorizada })),
      });
      onGuardado();
    } catch (err) {
      setError(String(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmarBaja = async (ctask: string) => {
    const nuevoDetalle = `${form.detalle} - BAJA DE USUARIO -> ${ctask}`;
    await darDeBajaUsuario(form.id_user, nuevoDetalle);
    setMostrarConfirmBaja(false);
    onGuardado();
  };

  const handleConfirmarAlta = async () => {
    await darDeAltaUsuario(form.id_user);
    setMostrarConfirmAlta(false);
    onGuardado();
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{usuario.username}</h2>
          <button className="close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="drawer-body">
          {error && <div className="error-banner">⚠ {error}</div>}

          {/* ── Sección 1: Datos del Usuario ── */}
          <button className="section-toggle" aria-expanded={datosAbierto} onClick={() => setDatosAbierto((v) => !v)}>
            <span className="section-toggle-icon">{datosAbierto ? "▼" : "▶"}</span>
            Datos del Usuario
          </button>
          {datosAbierto && (
            <div className="field-grid">
              <label>
                Usuario
                <input value={form.username} disabled title="El username no se edita después del alta" />
              </label>
              <label>
                Email
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label>
                Nombre
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                Zona
                <input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
              </label>
              <label>
                Plan
                <select
                  value={form.id_plan}
                  onChange={(e) => setForm({ ...form, id_plan: Number(e.target.value) })}
                >
                  {planes.map((p) => (
                    <option key={p.id_plan} value={p.id_plan}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="full">
                Detalle
                <input value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })} />
              </label>
              <label className="full">
                Contraseña
                <div className="password-row">
                  <code>{form.psw}</code>
                  <button onClick={handleGenerarPassword} disabled={generandoPsw}>
                    {generandoPsw ? "generando..." : "generar nueva contraseña"}
                  </button>
                </div>
              </label>
            </div>
          )}

          {/* ── Sección 2: Permisos de la API ── */}
          <button className="section-toggle" aria-expanded={permisosAbierto} onClick={() => setPermisosAbierto((v) => !v)}>
            <span className="section-toggle-icon">{permisosAbierto ? "▼" : "▶"}</span>
            Permisos de la API
          </button>
          {permisosAbierto && (
            <>
              {/* Pestañas */}
              <div className="permisos-tabs">
                <button
                  className={`tab-btn ${permisosTab === "todos" ? "active" : ""}`}
                  onClick={() => setPermisosTab("todos")}
                >
                  Todos
                </button>
                <button
                  className={`tab-btn ${permisosTab === "asignados" ? "active" : ""}`}
                  onClick={() => setPermisosTab("asignados")}
                >
                  Asignados ({funciones.filter((f) => f.autorizada).length})
                </button>
              </div>

              {permisosTab === "todos" && (
                <>
                  <input
                    className="permission-search"
                    placeholder="Buscar módulo o función..."
                    value={busquedaFuncion}
                    onChange={(e) => setBusquedaFuncion(e.target.value)}
                  />
                  <div className="permission-board">
                    {Object.entries(grupos).map(([modulo, items]) => {
                      const todasMarcadas = items.every((f) => f.autorizada);
                      return (
                        <div key={modulo} className="permission-module">
                          <div className="permission-module-header">
                            <h4>{modulo}</h4>
                            <div className="module-bulk-actions">
                              <button onClick={() => setModuloCompleto(modulo, true)} disabled={todasMarcadas}>
                                seleccionar todo
                              </button>
                              <button onClick={() => setModuloCompleto(modulo, false)} disabled={items.every((f) => !f.autorizada)}>
                                quitar todo
                              </button>
                            </div>
                          </div>
                          {items.map((f) => (
                            <label key={f.id_funct} className={`permission-switch ${f.autorizada ? "on" : ""}`}>
                              <input type="checkbox" checked={f.autorizada} onChange={() => toggleFuncion(f.id_funct)} />
                              {f.funcion}
                            </label>
                          ))}
                        </div>
                      );
                    })}
                    {Object.keys(grupos).length === 0 && <p className="hint">Sin coincidencias para "{busquedaFuncion}".</p>}
                  </div>
                </>
              )}

              {permisosTab === "asignados" && (
                <div className="permission-board">
                  {Object.keys(gruposAsignados).length === 0 ? (
                    <p className="hint">Este usuario no tiene funciones asignadas.</p>
                  ) : (
                    Object.entries(gruposAsignados).map(([modulo, items]) => (
                      <div key={modulo} className="permission-module">
                        <div className="permission-module-header">
                          <h4>{modulo}</h4>
                          <div className="module-bulk-actions">
                            <button onClick={() => setModuloCompleto(modulo, false)}>
                              revocar todo
                            </button>
                          </div>
                        </div>
                        {items.map((f) => (
                          <div key={f.id_funct} className="permission-switch on assigned-item">
                            <span className="assigned-check">✓</span>
                            {f.funcion}
                            <button
                              className="revoke-btn"
                              onClick={() => toggleFuncion(f.id_funct)}
                              title="Revocar permiso"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <footer>
          <button onClick={onClose}>← Regresar</button>
          <div className="footer-actions">
            {estaDadoDeBaja ? (
              <button className="primary" onClick={() => setMostrarConfirmAlta(true)}>
                Dar de alta
              </button>
            ) : (
              <button className="danger" onClick={() => setMostrarConfirmBaja(true)}>
                Dar de baja
              </button>
            )}
            <button className="primary" onClick={handleGuardar} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </footer>
      </div>
      </div>

      {mostrarConfirmBaja && (
        <ConfirmBajaModal
          username={form.username}
          onCancelar={() => setMostrarConfirmBaja(false)}
          onConfirmar={handleConfirmarBaja}
        />
      )}

      {mostrarConfirmAlta && (
        <ConfirmActionModal
          titulo="Reactivar usuario"
          mensaje={`¿Dar de alta a ${form.username}? Se quitará la marca de baja y el CTASK de la descripción. Plan y permisos quedan como están — ajústalos manualmente si hace falta.`}
          confirmarLabel="Dar de alta"
          onCancelar={() => setMostrarConfirmAlta(false)}
          onConfirmar={handleConfirmarAlta}
        />
      )}
    </>
  );
}
