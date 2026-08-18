package config

import (
	"encoding/json"
	"fmt"
	"os"
)

// Config es deliberadamente mínimo: esta app solo administra MySQL, no
// llama ninguna API. Si en el futuro se necesita el bearer token de
// apisupporttsmx, se agrega aquí como un campo más.
type Config struct {
	DSN string `json:"dsn"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return parse(data)
}

// LoadHybrid intenta leer el archivo externo (path) primero — así en
// producción se puede seguir cambiando el DSN sin recompilar. Si no lo
// encuentra, cae al respaldo embebido en el binario (fallback, los bytes
// que va:embed metió en el .exe con //go:embed en app.go).
//
// NOTA de seguridad: si usas el respaldo embebido, el DSN (con el password
// de MySQL) queda dentro del .exe compilado y es extraíble con `strings`
// sobre el binario. Está bien para esta herramienta interna, pero tenlo
// presente si el .exe llega a salir de la red de la empresa.
func LoadHybrid(path string, embebido []byte) (*Config, error) {
	if data, err := os.ReadFile(path); err == nil {
		return parse(data)
	}

	if len(embebido) == 0 {
		return nil, fmt.Errorf("no se encontró %q y no hay configuración embebida de respaldo", path)
	}
	return parse(embebido)
}

func parse(data []byte) (*Config, error) {
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}