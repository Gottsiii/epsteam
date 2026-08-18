package db

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

func Connect(dsn string) (*sql.DB, error) {
	conn, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	if err := conn.Ping(); err != nil {
		return nil, err
	}
	return conn, nil
}

// Healthy verifica que la conexión a la base de datos sigue viva mediante un
// Ping(). Esto detecta desconexiones TCP silenciosas que ocurren entre queries,
// especialmente en builds de producción donde la serialización JSON no
// propaga errores de conexión tan transparentemente como en dev (WebSockets).
func Healthy(conn *sql.DB) error {
	if conn == nil {
		return fmt.Errorf("conexión a la base de datos no inicializada")
	}
	if err := conn.Ping(); err != nil {
		return fmt.Errorf("la base de datos no responde: %w", err)
	}
	return nil
}
