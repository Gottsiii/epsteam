package logger

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// Registrar escribe una línea en logs/historial.log — igual que
// RegistrarLogFisico del proyecto original: un rastro simple de qué
// operación se hizo y cuándo, que nunca debe tumbar la app si falla.
func Registrar(accion, detalle string) {
	defer func() { recover() }()

	dir := "logs"
	_ = os.MkdirAll(dir, 0o755)

	f, err := os.OpenFile(filepath.Join(dir, "historial.log"), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return
	}
	defer f.Close()

	linea := fmt.Sprintf("[%s] ACCION: %s | DETALLE: %s\n", time.Now().Format("02/01/2006 15:04:05"), accion, detalle)
	_, _ = f.WriteString(linea)
}
