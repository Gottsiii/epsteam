import { useState } from "react";

interface Props {
  titulo: string;
  mensaje: string;
  /** Si se pasa, pide escribir/editar un valor (ej. renombrar) antes de confirmar. */
  campoInicial?: string;
  campoLabel?: string;
  confirmarLabel?: string;
  peligro?: boolean;
  onCancelar: () => void;
  onConfirmar: (valor?: string) => void;
}

// Reemplazo genérico de window.confirm/prompt — nada de diálogos nativos del
// navegador ("Wails dice que..."). Se usa para renombrar/eliminar/mover
// módulos y funciones, siempre de uno en uno.
export default function ConfirmActionModal({
  titulo,
  mensaje,
  campoInicial,
  campoLabel,
  confirmarLabel = "Confirmar",
  peligro = false,
  onCancelar,
  onConfirmar,
}: Props) {
  const [valor, setValor] = useState(campoInicial ?? "");
  const tieneCampo = campoInicial !== undefined;
  const deshabilitado = tieneCampo && valor.trim() === "";

  return (
    <div className="drawer-overlay" onClick={onCancelar}>
      <div className={`modal ${peligro ? "danger-modal" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h2>{peligro && "⚠ "}{titulo}</h2>
        <p className="hint">{mensaje}</p>

        {tieneCampo && (
          <input
            className="phrase-input"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={campoLabel}
            autoFocus
          />
        )}

        <footer>
          <button onClick={onCancelar}>Cancelar</button>
          <button
            className={peligro ? "danger" : "primary"}
            disabled={deshabilitado}
            onClick={() => onConfirmar(tieneCampo ? valor.trim() : undefined)}
          >
            {confirmarLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
