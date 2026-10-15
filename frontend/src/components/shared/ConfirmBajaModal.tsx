import { useState } from "react";

interface Props {
  username: string;
  onCancelar: () => void;
  onConfirmar: (sctask: string, motivo: string) => void;
}

const SCTASK_RE = /^sctask\d+$/i;

// La baja NO es un delete — revoca acceso/permisos, y siempre debe venir
// respaldada por un SCTASK de ServiceNow. Ese número ES la verificación: sin
// un SCTASK con formato válido, el botón de confirmar queda deshabilitado.
export default function ConfirmBajaModal({ username, onCancelar, onConfirmar }: Props) {
  const [sctask, setSctask] = useState("");
  const [motivo, setMotivo] = useState("");
  const valido = SCTASK_RE.test(sctask.trim());

  return (
    <div className="drawer-overlay" onClick={onCancelar}>
      <div className="modal danger-modal" onClick={(e) => e.stopPropagation()}>
        <h2>⚠ Confirmar baja de usuario</h2>
        <p className="hint">
          Esta acción marca a <strong>{username}</strong> como dado de baja. No se elimina el
          registro, solo se anota la baja en el comentario.
        </p>
        <p className="hint">
          La baja debe estar respaldada por un SCTASK de ServiceNow — ingrésalo para continuar:
        </p>
        <input
          className="phrase-input"
          value={sctask}
          onChange={(e) => setSctask(e.target.value)}
          placeholder="ej. SCTASK0012345"
          autoFocus
        />
        <label className="full" style={{ marginTop: 10 }}>
          Motivo (opcional)
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Detalle adicional de la baja"
            rows={3}
          />
        </label>
        <footer>
          <button onClick={onCancelar}>Cancelar</button>
          <button
            className="danger"
            disabled={!valido}
            onClick={() => onConfirmar(sctask.trim(), motivo.trim())}
          >
            Confirmar baja
          </button>
        </footer>
      </div>
    </div>
  );
}