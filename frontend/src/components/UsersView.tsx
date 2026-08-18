import { useEffect, useState } from "react";
import { User } from "../types";
import { listarUsuarios, listarUsuariosBaja, buscarUsuarios } from "../api";
import UserEditDrawer from "./UserEditDrawer";
import NewUserModal from "./NewUserModal";

export default function UsersView() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [verBajas, setVerBajas] = useState(false);
  const [seleccionado, setSeleccionado] = useState<User | null>(null);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      setError(null);
      if (verBajas) {
        setUsuarios(await listarUsuariosBaja());
      } else if (busqueda.trim()) {
        setUsuarios(await buscarUsuarios(busqueda));
      } else {
        setUsuarios(await listarUsuarios("", "u.username", "like"));
      }
    } catch (err) {
      // Antes esto fallaba en silencio y la tabla se quedaba vacía sin
      // ninguna pista. Ahora el error real (conexión a MySQL, credenciales,
      // lo que sea) se ve directo en la pantalla.
      setError(String(err));
      setUsuarios([]);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verBajas]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  return (
    <div className="users-view">
      <header className="view-header">
        <h1>Usuarios</h1>
        <div className="actions">
          <input
            placeholder="Buscar por usuario, email, zona o plan..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            disabled={verBajas}
          />
          <label className="toggle">
            <input type="checkbox" checked={verBajas} onChange={(e) => setVerBajas(e.target.checked)} />
            Ver dados de baja
          </label>
          <button className="primary" onClick={() => setMostrarNuevo(true)}>
            + Nuevo usuario
          </button>
        </div>
      </header>

      {error && <div className="error-banner">⚠ {error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Zona</th>
            <th>Plan</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id_user} onClick={() => setSeleccionado(u)}>
              <td>{u.username}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.zone}</td>
              <td>{u.plan}</td>
            </tr>
          ))}
          {usuarios.length === 0 && (
            <tr>
              <td colSpan={5} className="empty">
                Sin resultados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {seleccionado && (
        <UserEditDrawer
          usuario={seleccionado}
          onClose={() => setSeleccionado(null)}
          onGuardado={() => {
            setSeleccionado(null);
            cargar();
          }}
        />
      )}

      {mostrarNuevo && (
        <NewUserModal
          onClose={() => setMostrarNuevo(false)}
          onCreado={() => {
            setMostrarNuevo(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}
