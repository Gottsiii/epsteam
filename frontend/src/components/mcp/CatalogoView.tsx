import { useEffect, useMemo, useState } from "react";
import { MCPCatalogItem } from "../types";
import { mcpListarCatalogo } from "../api";

export default function MCPCatalogoView() {
  const [items, setItems] = useState<MCPCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mcpListarCatalogo()
      .then(setItems)
      .catch((err) => setError(String(err)));
  }, []);

  const agrupado = useMemo(() => {
    const map = new Map<number, { mcp: string; funciones: string[] }>();
    for (const item of items) {
      if (!map.has(item.id_mcp)) {
        map.set(item.id_mcp, { mcp: item.mcp, funciones: [] });
      }
      if (item.funcion) {
        map.get(item.id_mcp)!.funciones.push(item.funcion);
      }
    }
    return Array.from(map.values());
  }, [items]);

  return (
    <div className="catalogo-view">
      <header className="view-header">
        <h1>Catálogo MCP</h1>
      </header>

      {error && <div className="error-banner">⚠ {error}</div>}

      <div className="module-grid">
        {agrupado.map((g) => (
          <div key={g.mcp} className="module-card">
            <div className="module-card-header">
              <h3>{g.mcp}</h3>
            </div>
            <ul>
              {g.funciones.length === 0 && <li className="hint">Sin funciones registradas.</li>}
              {g.funciones.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
        {agrupado.length === 0 && !error && <p className="hint">Sin MCPs registrados.</p>}
      </div>
    </div>
  );
}