import { useMemo, useState } from "react";
import { MCPUser } from "../../types";
import {
  mcpDarDeAltaUsuario,
  mcpDarDeBajaUsuario,
  mcpGuardarUsuario,
} from "../../api";
import ConfirmActionModal from "../shared/ConfirmActionModal";
import ConfirmBajaModal from "../shared/ConfirmBajaModal";

interface Props {
  usuario: MCPUser;
  onClose: () => void;
  onGuardado: () => void;
}

const BAJA_MARKER = "- BAJA DE USUARIO ->";

export default function UserEditDrawer({
  usuario,
  onClose,
  onGuardado,
}: Props) {
  const [email, setEmail] = useState(usuario.email ?? "");
  const [comment, setComment] = useState(usuario.comment ?? "");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mostrarConfirmarGuardado, setMostrarConfirmarGuardado] =
    useState(false);
  const [mostrarConfirmarBaja, setMostrarConfirmarBaja] = useState(false);
  const [mostrarConfirmarAlta, setMostrarConfirmarAlta] = useState(false);

  const esBaja = useMemo(
    () => (usuario.comment ?? "").includes(BAJA_MARKER),
    [usuario.comment]
  );

  const hayCambios =
    email.trim() !== (usuario.email ?? "").trim() ||
    comment.trim() !== (usuario.comment ?? "").trim();

  const formatError = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }

    return String(err);
  };

  const guardar = async () => {
    try {
      setGuardando(true);
      setError(null);

      await mcpGuardarUsuario(
        usuario.id_user,
        email.trim(),
        comment.trim()
      );

      setMostrarConfirmarGuardado(false);
      onGuardado();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setGuardando(false);
    }
  };

  const darDeBaja = async (sctask: string, motivo: string) => {
    try {
      setGuardando(true);
      setError(null);

      await mcpDarDeBajaUsuario(
        usuario.id_user,
        sctask,
        motivo
      );

      setMostrarConfirmarBaja(false);
      onGuardado();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setGuardando(false);
    }
  };

  const darDeAlta = async () => {
    try {
      setGuardando(true);
      setError(null);

      await mcpDarDeAltaUsuario(usuario.id_user);

      setMostrarConfirmarAlta(false);
      onGuardado();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}>
        <aside className="drawer" onClick={(event) => event.stopPropagation()}>
          <header>
            <h2>Editar usuario</h2>

            <button
              className="close"
              type="button"
              onClick={onClose}
              disabled={guardando}
              aria-label="Cerrar"
            >
              ×
            </button>
          </header>

          <div className="drawer-body">
            {error && (
              <div className="error-banner">
                ⚠ {error}
              </div>
            )}

            <div className="field-grid">
              <label className="full">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@empresa.com"
                  disabled={guardando}
                />
              </label>

              <label className="full">
                Comentario
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Comentario del usuario"
                  rows={5}
                  disabled={guardando}
                />
              </label>

              <label>
                ID usuario
                <input
                  value={String(usuario.id_user)}
                  readOnly
                  disabled
                />
              </label>

              <label>
                Última actualización
                <input
                  value={usuario.last_update || "—"}
                  readOnly
                  disabled
                />
              </label>
            </div>

            {esBaja && (
              <div className="phrase-box">
                Este usuario está dado de baja.
              </div>
            )}
          </div>

          <footer>
            <div className="footer-nav">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
              >
                Cerrar
              </button>
            </div>

            <div className="footer-actions">
              {esBaja ? (
                <button
                  className="primary"
                  type="button"
                  onClick={() => setMostrarConfirmarAlta(true)}
                  disabled={guardando}
                >
                  Reactivar
                </button>
              ) : (
                <button
                  className="danger"
                  type="button"
                  onClick={() => setMostrarConfirmarBaja(true)}
                  disabled={guardando}
                >
                  Dar de baja
                </button>
              )}

              <button
                className="primary"
                type="button"
                onClick={() => setMostrarConfirmarGuardado(true)}
                disabled={guardando || !hayCambios || !email.trim()}
              >
                Guardar
              </button>
            </div>
          </footer>
        </aside>
      </div>

      {mostrarConfirmarGuardado && (
        <ConfirmActionModal
          titulo="Confirmar guardado"
          mensaje="¿Deseas guardar los cambios de este usuario?"
          confirmarLabel={guardando ? "Guardando..." : "Guardar"}
          onCancelar={() => setMostrarConfirmarGuardado(false)}
          onConfirmar={() => {
            void guardar();
          }}
        />
      )}

      {mostrarConfirmarAlta && (
        <ConfirmActionModal
          titulo="Confirmar reactivación"
          mensaje="¿Deseas reactivar este usuario?"
          confirmarLabel={guardando ? "Reactivando..." : "Reactivar"}
          onCancelar={() => setMostrarConfirmarAlta(false)}
          onConfirmar={() => {
            void darDeAlta();
          }}
        />
      )}

      {mostrarConfirmarBaja && (
        <ConfirmBajaModal
          username={usuario.email}
          onCancelar={() => setMostrarConfirmarBaja(false)}
          onConfirmar={(sctask, motivo) => {
            void darDeBaja(sctask, motivo);
          }}
        />
      )}
    </>
  );
}