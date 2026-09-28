package main

import (
	"embed"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"epsteam/internal/config"
	"epsteam/internal/db"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// 1) Cargar config.json desde la misma carpeta del ejecutable
	cfg, err := config.LoadFromExeDir()
	if err != nil {
		log.Fatal(err)
	}

	if cfg.API.DSN == "" {
		log.Fatal("config inválido: api.dsn está vacío")
	}
	if cfg.MCP.DSN == "" {
		log.Fatal("config inválido: mcp.dsn está vacío")
	}

	// 2) Crear conexiones separadas (API + MCP)
	apiConn, err := db.Connect(cfg.API.DSN)
	if err != nil {
		log.Fatalf("no se pudo conectar a API DB: %v", err)
	}
	defer apiConn.Close()

	mcpConn, err := db.Connect(cfg.MCP.DSN)
	if err != nil {
		log.Fatalf("no se pudo conectar a MCP DB: %v", err)
	}
	defer mcpConn.Close()

	// 3) Crear app inyectando ambas conexiones
	app := NewApp(apiConn, mcpConn)

	// 4) Run Wails
	err = wails.Run(&options.App{
		Title:  "epsteam",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})
	if err != nil {
		log.Println("Error:", err)
	}
}

// (Opcional) utilidad por si quieres depurar ruta de config en runtime.
func configPathNearExe() string {
	exe, err := os.Executable()
	if err != nil {
		return "config.json"
	}
	return filepath.Join(filepath.Dir(exe), "config.json")
}

func debugConfigPath() {
	fmt.Println("Buscando config en:", configPathNearExe())
}