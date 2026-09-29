package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// DBConfig representa el bloque de conexión de una sola base de datos
// dentro de config.json (por ejemplo "api" o "mcp").
type DBConfig struct {
	DSN string `json:"dsn"`
}

// Config es la estructura completa de config.json. Se mantiene mínima:
// esta app solo administra conexiones MySQL, no llama ninguna API externa.
type Config struct {
	API DBConfig `json:"api"`
	MCP DBConfig `json:"mcp"`
}

// LoadFromExeDir carga config.json desde la misma carpeta donde vive el
// ejecutable compilado (.exe). Esto permite cambiar las conexiones sin
// necesidad de recompilar la aplicación.
func LoadFromExeDir() (*Config, error) {
	exePath, err := os.Executable()
	if err != nil {
		return nil, fmt.Errorf("no se pudo resolver ruta del ejecutable: %w", err)
	}

	exeDir := filepath.Dir(exePath)
	cfgPath := filepath.Join(exeDir, "config.json")

	return Load(cfgPath)
}

// Load lee y parsea config.json desde una ruta específica.
func Load(path string) (*Config, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("no se pudo leer config.json en %s: %w", path, err)
	}

	var cfg Config
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, fmt.Errorf("config.json inválido: %w", err)
	}

	return &cfg, nil
}