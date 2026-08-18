import { useState } from "react";
import { NewUserInput, CreatedUser } from "../types";
import { crearUsuario } from "../api";

interface Props {
  onClose: () => void;
  onCreado: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ANIO_ACTUAL = new Date().getFullYear();

const vacio: NewUserInput = { alias: "", email: "", name: "", zone: "", company: "", detalle: "" };

export default function NewUserModal({ onClose, onCreado }: Props) {
  const [form, setForm] = useState<NewUserInput>(vacio);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<CreatedUser | null>(null);

  const aliasLimpio = form.alias.trim().toLowerCase().replace(/\s+/g, "");
  const usernamePreview = `suptsmx${ANIO_ACTUAL}${aliasLimpio || "..."}`;
  const emailValido = form.email.trim() === "" || EMAIL_RE.test(form.email.trim());

  const handleCrear = async () => {
    if (!aliasLimpio) {
      setError("El alias no puede estar vacío.");
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError("El correo no tiene un formato válido.");
      return;
    }
    setError(null);
    setCreando(true);
    try {
      const resultado = await crearUsuario({ ...form, alias: aliasLimpio });
      setCreado(resultado);
    } catch (err) {
      setError(String(err));
    } finally {
      setCreando(false);
    }
  };

  const copiar = (texto: string) => navigator.clipboard?.writeText(texto);

  if (creado) {
    return (
      <div className="drawer-overlay" onClick={onCreado}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>Usuario creado</h2>
          <p className="hint">Guarda estas credenciales — la contraseña no se puede volver a mostrar después.</p>
          <div className="credential-box">
            <div>
              <label>Usuario</label>
              <div className="credential-value">
                <code>{creado.username}</code>
                <button onClick={() => copiar(creado.username)}>copiar</button>
              </div>
            </div>
            <div>
              <label>Contraseña</label>
              <div className="credential-value">
                <code>{creado.psw}</code>
                <button onClick={() => copiar(creado.psw)}>copiar</button>
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
        <h2>Nuevo usuario</h2>
        <p className="hint">
          Se crea con el plan más bajo disponible y la función base autorizada (user / profile). El usuario y la
          contraseña se generan automáticamente.
        </p>

        <div className="field-grid">
          <label className="full">
            Alias
            <input
              value={form.alias}
              placeholder="ej. jose"
              onChange={(e) => setForm({ ...form, alias: e.target.value })}
            />
            <span className="preview">Se creará como: {usernamePreview}</span>
          </label>
          <label>
            Email
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={!emailValido ? "invalid" : ""}
            />
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
            Compañía
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </label>
          <label className="full">
            Detalle
            <input value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })} />
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
