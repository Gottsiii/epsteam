import { useState } from "react";
import HomeScreen from "./components/shared/HomeScreen";
import UsersView from "./components/apitsmx/UsersView";
import CatalogoView from "./components/apitsmx/CatalogoView";
import RecordView from "./components/apitsmx/RecordView";
import MCPUsersView from "./components/mcp/UsersView";
import MCPCatalogoView from "./components/mcp/CatalogoView";
import MCPRecordView from "./components//mcp/RecordView";
import "../App.css";

type Vista = "inicio" | "usuarios" | "catalogo" | "estadisticas";
type Entorno = "API" | "MCP";

function App() {
  const [vista, setVista] = useState<Vista>("inicio");
  const [entorno, setEntorno] = useState<Entorno | null>(null);

  const puedeNavegar = entorno !== null;

  return (
    <div className="shell">
      <main className="content">
        {vista === "inicio" && (
          <HomeScreen
            entornoSeleccionado={entorno}
            onSeleccionarEntorno={setEntorno}
            onEntrar={() => setVista("usuarios")}
          />
        )}

        {vista === "usuarios" && (entorno === "MCP" ? <MCPUsersView /> : <UsersView />)}
        {vista === "catalogo" && (entorno === "MCP" ? <MCPCatalogoView /> : <CatalogoView />)}
        {vista === "estadisticas" && (entorno === "MCP" ? <MCPRecordView /> : <RecordView />)}
      </main>

      <nav className={`dock ${!puedeNavegar ? "dock-disabled" : ""}`}>
        <button className={vista === "inicio" ? "active" : ""} onClick={() => setVista("inicio")}>
          Inicio
        </button>
        <div className="dock-divider" />
        <button
          className={vista === "usuarios" ? "active" : ""}
          onClick={() => setVista("usuarios")}
          disabled={!puedeNavegar}
          title={!puedeNavegar ? "Selecciona API o MCP en Inicio" : ""}
        >
          Usuarios
        </button>
        <button
          className={vista === "catalogo" ? "active" : ""}
          onClick={() => setVista("catalogo")}
          disabled={!puedeNavegar}
          title={!puedeNavegar ? "Selecciona API o MCP en Inicio" : ""}
        >
          Módulos y funciones
        </button>
        <button
          className={vista === "estadisticas" ? "active" : ""}
          onClick={() => setVista("estadisticas")}
          disabled={!puedeNavegar}
          title={!puedeNavegar ? "Selecciona API o MCP en Inicio" : ""}
        >
          Estadísticas
        </button>
      </nav>
    </div>
  );
}

export default App;