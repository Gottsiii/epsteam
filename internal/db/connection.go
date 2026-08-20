package db

import (
	"fmt"
	"database/sql"

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

func Healthy(conn *sql.DB) error{
	if conn == nil{
		return fmt.Errorf("Conexion a la base de datos no inicializada")
	}
	if err := conn.Ping(); err != nil{
		return fmt.Errorf("la base de datos no responde: %w", err)
	}
	return nil
}
