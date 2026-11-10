import { useState } from "react";
import { MCPUser } from "../../types";
import { mcpCrearUsuario } from "../../api";

interface Props {
  onClose: () => void;
  onCreado: () => void;
}

const EMAIL_RE = /^[^@]+@[^@]+\.[^@]+$/;

export default function NewUserModal({ onClose, onCreado }: Props) {
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<MCPUser | null>(null);

  const handleCrear = async () => {
    const emailLimpio = email.trim();
    if (!EMAIL_RE.test(emailLimpio)) {
      setError("El correo no tiene un formato válido.");
      return;
    }

    setError(null);
    setCreando(true);
    try {
      setCreado(await mcpCrearUsuario(emailLimpio, comment.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreando(false);
    }
  };

  if (creado) {
    return (
      <div className="drawer-overlay" onClick={onCreado}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>Usuario MCP creado</h2>
          <p className="hint">El usuario ya está disponible en la lista de usuarios activos.</p>
          <div className="credential-box">
            <div>
              <label>ID</label>
              <div className="credential-value">
                <code>{creado.id_user}</code>
              </div>
            </div>
            <div>
              <label>Email</label>
              <div className="credential-value">
                <code>{creado.email}</code>
              </div>
            </div>
          </div>
          <footer>
            <button className="primary" onClick={onCreado}>
              Listo
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nuevo usuario MCP</h2>
        <p className="hint">Indica el email del usuario y, si hace falta, un comentario.</p>

        <div className="field-grid">
          <label className="full">
            Email
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creando) void handleCrear();
              }}
            />
          </label>
          <label className="full">
            Comentario
            <input value={comment} onChange={(e) => setComment(e.target.value)} />
          </label>
        </div>

        {error && <div className="error-banner">⚠ {error}</div>}

        <footer>
          <button onClick={onClose}>Cancelar</button>
          <button className="primary" onClick={handleCrear} disabled={creando}>
            {creando ? "Creando..." : "Crear usuario"}
          </button>
        </footer>
      </div>
    </div>
  );
}