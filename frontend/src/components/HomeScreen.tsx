interface Props {
  onEntrar: () => void;
}

// Logo propio en SVG (nada de imágenes externas con derechos de terceros):
// un grafo de nodos conectados representando el catálogo de módulos/funciones
// y sus permisos — el concepto central de esta app.
function Logo() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" stroke="#e3007a" strokeWidth="2" opacity="0.35" />
      <line x1="60" y1="60" x2="30" y2="30" stroke="#e3007a" strokeWidth="1.5" opacity="0.6" />
      <line x1="60" y1="60" x2="90" y2="30" stroke="#e3007a" strokeWidth="1.5" opacity="0.6" />
      <line x1="60" y1="60" x2="30" y2="90" stroke="#e3007a" strokeWidth="1.5" opacity="0.6" />
      <line x1="60" y1="60" x2="90" y2="90" stroke="#e3007a" strokeWidth="1.5" opacity="0.6" />
      <line x1="60" y1="60" x2="60" y2="18" stroke="#e3007a" strokeWidth="1.5" opacity="0.6" />
      <circle cx="60" cy="60" r="14" fill="#e3007a" />
      <circle cx="30" cy="30" r="6" fill="#e7e8ee" />
      <circle cx="90" cy="30" r="6" fill="#e7e8ee" />
      <circle cx="30" cy="90" r="6" fill="#e7e8ee" />
      <circle cx="90" cy="90" r="6" fill="#e7e8ee" />
      <circle cx="60" cy="18" r="6" fill="#e7e8ee" />
    </svg>
  );
}

const CAPACIDADES = [
  { titulo: "Usuarios", detalle: "Alta con username y contraseña generados automáticamente, búsqueda en tiempo real, edición completa y baja lógica con confirmación consciente." },
  { titulo: "Permisos por función", detalle: "Matriz de acceso a la API por módulo, con buscador y selección masiva por módulo." },
  { titulo: "Catálogo", detalle: "Administración de módulos y funciones de la API: crear, renombrar, mover y eliminar, siempre de uno en uno y con verificación." },
  { titulo: "Planes", detalle: "Cada usuario queda asociado a un plan con su límite de requests, visible en todo momento." },
];

export default function HomeScreen({ onEntrar }: Props) {
  return (
    <div className="home-screen">
      <Logo />
      <h1 className="home-title">
        EPS<span className="accent">team</span> Manager
        <span className="home-version">IRON IV</span>
      </h1>
      <p className="home-subtitle">Administrador de usuarios y permisos de acceso a la API TSMX</p>

      <div className="home-cards">
        {CAPACIDADES.map((c) => (
          <div key={c.titulo} className="home-card">
            <h3>{c.titulo}</h3>
            <p>{c.detalle}</p>
          </div>
        ))}
      </div>

      <button className="primary home-cta" onClick={onEntrar}>
        Entrar →
      </button>
    </div>
  );
}
