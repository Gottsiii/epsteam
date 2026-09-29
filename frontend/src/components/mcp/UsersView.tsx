import { useEffect, useState } from "react";
import { MCPUser } from "../types";
import { mcpListarUsuarios } from "../api";

export default function MCPUsersView() {
  const [usuarios, setUsuarios] = useState<MCPUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mcpListarUsuarios()
      .then(setUsuarios)
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <div className="users-view">
      <header className="view-header">
        <h1>Usuarios MCP</h1>
      </header>

      {error && <div className="error-banner">⚠ {error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Comentario</th>
            <th>Último update</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id_user}>
              <td>{u.id_user}</td>
              <td>{u.email}</td>
              <td>{u.comment}</td>
              <td>{u.last_update}</td>
            </tr>
          ))}
          {usuarios.length === 0 && !error && (
            <tr>
              <td colSpan={4} className="empty">
                Sin usuarios MCP registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}