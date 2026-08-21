import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import UsersView from "./components/UsersView";
import CatalogoView from "./components/CatalogoView";
import RecordView from "./components/RecordView";
import "./App.css";

type Vista = "inicio" | "usuarios" | "catalogo" | "estadisticas";

function App() {
  const [vista, setVista] = useState<Vista>("inicio");

  return (
    <div className="shell">
      <main className="content">
        {vista === "inicio" && <HomeScreen onEntrar={() => setVista("usuarios")} />}
        {vista === "usuarios" && <UsersView />}
        {vista === "catalogo" && <CatalogoView />}
        {vista === "estadisticas" && <RecordView />}
      </main>

      <nav className="dock">
        <button className={vista === "inicio" ? "active" : ""} onClick={() => setVista("inicio")}>
          Inicio
        </button>
        <div className="dock-divider" />
        <button className={vista === "usuarios" ? "active" : ""} onClick={() => setVista("usuarios")}>
          Usuarios
        </button>
        <button className={vista === "catalogo" ? "active" : ""} onClick={() => setVista("catalogo")}>
          Módulos y funciones
        </button>
        <button className={vista === "estadisticas" ? "active" : ""} onClick={() => setVista("estadisticas")}>
          Estadísticas
        </button>
      </nav>
    </div>
  );
}

export default App;
