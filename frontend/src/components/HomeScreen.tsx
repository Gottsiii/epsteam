interface Props {
  onEntrar: () => void;
}

// @ts-ignore
import logoAtom from './logoATOM.png';


// Logo propio en SVG (nada de imágenes externas con derechos de terceros):
// un grafo de nodos conectados representando el catálogo de módulos/funciones
// y sus permisos — el concepto central de esta app.
function Logo() {
  return (
    <img
      src={logoAtom} 
      alt= "Logo ATOM"
      width="150"
      height="120"
      className="home-logo-png"
      style={{ objectFit: 'contain' }}
    />

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
        <span className="home-version">IRON I</span>
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
