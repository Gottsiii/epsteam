import { useCallback, useEffect, useState } from "react";
import { MCPUser } from "../../types";
import {
  mcpBuscarUsuarios,
  mcpCrearUsuario,
  mcpDarDeAltaUsuario,
  mcpDarDeBajaUsuario,
  mcpListarUsuariosActivos,
  mcpListarUsuariosBaja,
} from "../../api";

type ModoUsuarios = "activos" | "baja";

export default function MCPUsersView() {
  const [usuarios, setUsuarios] = useState<MCPUser[]>([]);
  const [modo, setModo] = useState<ModoUsuarios>("activos");
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const texto = busqueda.trim();

      if (texto) {
        const resultado = await mcpBuscarUsuarios(texto);

        if (modo === "baja") {
          setUsuarios(
            resultado.filter((usuario) =>
              usuario.comment.includes("- BAJA DE USUARIO ->")
            )
          );
        } else {
          setUsuarios(
            resultado.filter(
              (usuario) =>
                !usuario.comment.includes("- BAJA DE USUARIO ->")
            )
          );
        }
      } else {
        const resultado =
          modo === "activos"
            ? await mcpListarUsuariosActivos()
            : await mcpListarUsuariosBaja();

        setUsuarios(resultado);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setUsuarios([]);
    } finally {
      setCargando(false);
    }
  }, [busqueda, modo]);

  useEffect(() => {
    void cargarUsuarios();
  }, [cargarUsuarios]);

  const crearUsuario = async () => {
    const emailLimpio = email.trim();

    if (!emailLimpio) {
      setError("El email es obligatorio.");
      return;
    }

    try {
      setCargando(true);
      setError(null);

      await mcpCrearUsuario(emailLimpio, comment.trim());

      setEmail("");
      setComment("");
      setMostrarNuevo(false);

      await cargarUsuarios();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCargando(false);
    }
  };

  const darDeBaja = async (usuario: MCPUser) => {
    const sctask = window.prompt(
      `Introduce el SCTASK para dar de baja a:\n${usuario.email}`
    );

    if (!sctask?.trim()) {
      return;
    }

    const motivo = window.prompt("Motivo adicional de la baja:") ?? "";

    try {
      setCargando(true);
      setError(null);

      await mcpDarDeBajaUsuario(
        usuario.id_user,
        sctask.trim(),
        motivo.trim()
      );

      await cargarUsuarios();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCargando(false);
    }
  };

  const darDeAlta = async (usuario: MCPUser) => {
    const confirmar = window.confirm(
      `¿Quieres reactivar al usuario ${usuario.email}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setCargando(true);
      setError(null);

      await mcpDarDeAltaUsuario(usuario.id_user);

      await cargarUsuarios();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="users-view">
      <header className="view-header">
        <div>
          <h1>Usuarios MCP</h1>
          <p className="hint">
            {modo === "activos"
              ? "Usuarios activos de mcpaccess."
              : "Usuarios con baja lógica."}
          </p>
        </div>

        <button
          className="primary"
          onClick={() => setMostrarNuevo((actual) => !actual)}
        >
          {mostrarNuevo ? "Cancelar" : "+ Nuevo usuario"}
        </button>
      </header>

      {mostrarNuevo && (
        <section className="panel-form">
          <h2>Nuevo usuario MCP</h2>

          <label>
            Email
            <input
              type="email"
              value={email}
              placeholder="usuario@empresa.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Comentario
            <textarea
              value={comment}
              placeholder="Comentario opcional"
              onChange={(event) => setComment(event.target.value)}
            />
          </label>

          <button className="primary" onClick={crearUsuario} disabled={cargando}>
            {cargando ? "Guardando..." : "Crear usuario"}
          </button>
        </section>
      )}

      <div className="users-toolbar">
        <input
          type="search"
          value={busqueda}
          placeholder="Buscar por ID, email o comentario..."
          onChange={(event) => setBusqueda(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void cargarUsuarios();
            }
          }}
        />

        <button onClick={() => void cargarUsuarios()} disabled={cargando}>
          Buscar
        </button>

        <button
          className={modo === "activos" ? "active" : ""}
          onClick={() => setModo("activos")}
        >
          Activos
        </button>

        <button
          className={modo === "baja" ? "active" : ""}
          onClick={() => setModo("baja")}
        >
          Dados de baja
        </button>
      </div>

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          ⚠ {error}
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Comentario</th>
              <th>Última actualización</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id_user}>
                <td>{usuario.id_user}</td>
                <td>{usuario.email}</td>
                <td>{usuario.comment || "—"}</td>
                <td>{usuario.last_update || "—"}</td>
                <td>
                  {modo === "activos" ? (
                    <button
                      className="danger"
                      onClick={() => void darDeBaja(usuario)}
                      disabled={cargando}
                    >
                      Dar de baja
                    </button>
                  ) : (
                    <button
                      className="primary"
                      onClick={() => void darDeAlta(usuario)}
                      disabled={cargando}
                    >
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {usuarios.length === 0 && !cargando && (
              <tr>
                <td colSpan={5} className="empty">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            )}

            {cargando && (
              <tr>
                <td colSpan={5} className="empty">
                  Cargando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}