interface Props {
  onEntrar: () => void;
  onSeleccionarEntorno: (entorno: "API" | "MCP") => void;
  entornoSeleccionado: "API" | "MCP" | null;
}

// @ts-ignore
import logoAtom from "./logoATOM.png";

function Logo() {
  return (
    <img
      src={logoAtom}
      alt="Logo ATOM"
      width="150"
      height="120"
      className="home-logo-png"
      style={{ objectFit: "contain" }}
    />
  );
}

export default function HomeScreen({ onEntrar, onSeleccionarEntorno, entornoSeleccionado }: Props) {
  const puedeEntrar = entornoSeleccionado !== null;

  return (
    <div className="home-screen">
      {/* 1) Logo + título + subtítulo */}
      <Logo />
      <h1 className="home-title">
        EPS<span className="accent">team</span> Manager
        <span className="home-version">IRON I</span>
      </h1>
      <p className="home-subtitle">Administrador de usuarios y permisos de acceso a la API TSMX</p>

      {/* 2) Entorno de trabajo */}
      <section className="home-env-selector">
        <h2>Entorno de trabajo</h2>
        <p>Selecciona el modo actual. Puedes cambiarlo en cualquier momento desde esta pantalla.</p>

        <div className="home-env-buttons">
          <button
            className={`home-env-btn api ${entornoSeleccionado === "API" ? "selected" : ""}`}
            onClick={() => onSeleccionarEntorno("API")}
          >
            SUPPORTTSMXAPI
          </button>

          <button
            className={`home-env-btn mcp ${entornoSeleccionado === "MCP" ? "selected" : ""}`}
            onClick={() => onSeleccionarEntorno("MCP")}
          >
            MCP
          </button>
        </div>

        <div className="home-env-current">
          {entornoSeleccionado ? (
            <>Modo actual: <strong>{entornoSeleccionado}</strong></>
          ) : (
            <>Selecciona un modo para continuar</>
          )}
        </div>
      </section>

      {/* 3) Botón abajo */}
      <button className="primary home-cta" onClick={onEntrar} disabled={!puedeEntrar}>
        {puedeEntrar ? "Entrar →" : "Selecciona API o MCP"}
      </button>
    </div>
  );
}