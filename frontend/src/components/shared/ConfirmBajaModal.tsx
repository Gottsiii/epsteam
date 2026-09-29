import { useState } from "react";

interface Props {
  username: string;
  onCancelar: () => void;
  onConfirmar: (ctask: string) => void;
}

const CTASK_RE = /^ctask\d+$/i;

// La baja NO es un delete — revoca todos los permisos, y siempre debe venir
// respaldada por un CTASK de ServiceNow. Ese número ES la verificación: sin
// un CTASK con formato válido, el botón de confirmar queda deshabilitado.
export default function ConfirmBajaModal({ username, onCancelar, onConfirmar }: Props) {
  const [ctask, setCtask] = useState("");
  const valido = CTASK_RE.test(ctask.trim());

  return (
    <div className="drawer-overlay" onClick={onCancelar}>
      <div className="modal danger-modal" onClick={(e) => e.stopPropagation()}>
        <h2>⚠ Confirmar baja de usuario</h2>
        <p className="hint">
          Esta acción revoca <strong>todos</strong> los permisos de <strong>{username}</strong>, lo mueve al plan más
          bajo y le genera una contraseña inutilizable.
        </p>
        <p className="hint">
          La baja debe estar respaldada por un CTASK de ServiceNow — ingrésalo para continuar:
        </p>
        <input
          className="phrase-input"
          value={ctask}
          onChange={(e) => setCtask(e.target.value)}
          placeholder="ej. CTASK0012345"
          autoFocus
        />
        <footer>
          <button onClick={onCancelar}>Cancelar</button>
          <button className="danger" disabled={!valido} onClick={() => onConfirmar(ctask.trim())}>
            Confirmar baja
          </button>
        </footer>
      </div>
    </div>
  );
}
