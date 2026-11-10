package db

import (
	"database/sql"
	"fmt"
	"strings"
)

func MCPCreateModulo(conn *sql.DB, nombre string) error {
	nombre = strings.TrimSpace(nombre)
	if nombre == "" {
		return fmt.Errorf("nombre requerido")
	}
	_, err := conn.Exec(`INSERT INTO mcp (name) VALUES (?)`, nombre)
	return err
}

func MCPUpdateModulo(conn *sql.DB, idMCP int, nombre string) error {
	nombre = strings.TrimSpace(nombre)
	if idMCP <= 0 {
		return fmt.Errorf("idMCP inválido")
	}
	if nombre == "" {
		return fmt.Errorf("nombre requerido")
	}
	_, err := conn.Exec(`UPDATE mcp SET name = ? WHERE idMCP = ?`, nombre, idMCP)
	return err
}

// MCPDeleteModulo no borra un MCP que todavía tiene funciones.
func MCPDeleteModulo(conn *sql.DB, idMCP int) error {
	if idMCP <= 0 {
		return fmt.Errorf("idMCP inválido")
	}
	var total int
	if err := conn.QueryRow(`SELECT COUNT(*) FROM funct WHERE idMCP = ?`, idMCP).Scan(&total); err != nil {
		return err
	}
	if total > 0 {
		return fmt.Errorf("el MCP tiene %d función(es); elimínalas primero", total)
	}
	_, err := conn.Exec(`DELETE FROM mcp WHERE idMCP = ?`, idMCP)
	return err
}

func MCPCreateFuncion(conn *sql.DB, idMCP int, nombre string) error {
	nombre = strings.TrimSpace(nombre)
	if idMCP <= 0 {
		return fmt.Errorf("idMCP inválido")
	}
	if nombre == "" {
		return fmt.Errorf("nombre requerido")
	}
	_, err := conn.Exec(`INSERT INTO funct (idMCP, name) VALUES (?, ?)`, idMCP, nombre)
	return err
}

func MCPUpdateFuncion(conn *sql.DB, idFunct, idMCP int, nombre string) error {
	nombre = strings.TrimSpace(nombre)
	if idFunct <= 0 || idMCP <= 0 {
		return fmt.Errorf("identificador inválido")
	}
	if nombre == "" {
		return fmt.Errorf("nombre requerido")
	}
	_, err := conn.Exec(`UPDATE funct SET idMCP = ?, name = ? WHERE idFunct = ?`, idMCP, nombre, idFunct)
	return err
}

func MCPDeleteFuncion(conn *sql.DB, idFunct int) error {
	if idFunct <= 0 {
		return fmt.Errorf("idFunct inválido")
	}
	_, err := conn.Exec(`DELETE FROM funct WHERE idFunct = ?`, idFunct)
	return err
}
