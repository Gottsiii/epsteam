package db

import (
	"database/sql"
	"fmt"
	"strings"

	"epsteam/internal/models"
)

// ============================
// LECTURA CATÁLOGO / STATS MCP
// ============================

// ListMCPCatalog devuelve el árbol mcp -> función (solo activos).
func ListMCPCatalog(conn *sql.DB) ([]models.MCPCatalogItem, error) {
	rows, err := conn.Query(`
		SELECT
			m.idMCP,
			m.name AS mcp,
			f.idFunct,
			f.name AS funcion
		FROM mcp m
		LEFT JOIN funct f
			ON f.idMCP = m.idMCP
			AND f.active = 1
		WHERE m.active = 1
		ORDER BY m.name, f.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.MCPCatalogItem
	for rows.Next() {
		var item models.MCPCatalogItem
		var idFunct sql.NullInt64
		var funcion sql.NullString
		if err := rows.Scan(&item.IDMCP, &item.MCP, &idFunct, &funcion); err != nil {
			return nil, err
		}
		if idFunct.Valid {
			v := int(idFunct.Int64)
			item.IDFunct = &v
		}
		if funcion.Valid {
			item.Funcion = funcion.String
		}
		lista = append(lista, item)
	}
	return lista, rows.Err()
}

// ListMCPUserStats resume interacciones y última actividad por usuario.
// Es histórico, por eso no filtra por active.
func ListMCPUserStats(conn *sql.DB) ([]models.MCPUserStat, error) {
	rows, err := conn.Query(`
		SELECT
			i.idUser,
			u.email,
			COUNT(i.idInteraction) AS total,
			COALESCE(DATE_FORMAT(MAX(i.date), '%Y-%m-%d %H:%i:%s'), '') AS last_activity
		FROM interaction i
		INNER JOIN users u ON u.idUser = i.idUser
		GROUP BY i.idUser, u.email
		ORDER BY total DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.MCPUserStat
	for rows.Next() {
		var us models.MCPUserStat
		if err := rows.Scan(&us.IDUser, &us.Email, &us.TotalInteracciones, &us.LastActivity); err != nil {
			return nil, err
		}
		lista = append(lista, us)
	}
	return lista, rows.Err()
}

// ListMCPFunctionsByUser devuelve las funciones usadas por un usuario.
// No filtra por active a propósito: una función dada de baja debe seguir
// apareciendo en el historial de uso.
func ListMCPFunctionsByUser(conn *sql.DB, idUser int) ([]models.MCPFunctionUsage, error) {
	rows, err := conn.Query(`
		SELECT
			f.idFunct,
			m.name AS mcp,
			f.name AS funcion,
			COUNT(i.idInteraction) AS usos
		FROM interaction i
		INNER JOIN funct f ON f.idFunct = i.idFunct
		INNER JOIN mcp m ON m.idMCP = f.idMCP
		WHERE i.idUser = ?
		GROUP BY f.idFunct, m.name, f.name
		ORDER BY usos DESC`, idUser)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.MCPFunctionUsage
	for rows.Next() {
		var fu models.MCPFunctionUsage
		if err := rows.Scan(&fu.IDFunct, &fu.MCP, &fu.Funcion, &fu.Usos); err != nil {
			return nil, err
		}
		lista = append(lista, fu)
	}
	return lista, rows.Err()
}

// GetMCPInteractionsByUserAndFunction devuelve interacciones paginadas de
// un usuario para una función específica.
func GetMCPInteractionsByUserAndFunction(conn *sql.DB, idUser, idFunct, pagina, porPagina int) (models.MCPInteractionPage, error) {
	offset := (pagina - 1) * porPagina

	var total int
	if err := conn.QueryRow(`
		SELECT COUNT(idInteraction)
		FROM interaction
		WHERE idUser = ? AND idFunct = ?`, idUser, idFunct).Scan(&total); err != nil {
		return models.MCPInteractionPage{}, err
	}

	rows, err := conn.Query(`
		SELECT
			idInteraction,
			idUser,
			COALESCE(output, ''),
			COALESCE(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s'), '')
		FROM interaction
		WHERE idUser = ? AND idFunct = ?
		ORDER BY date DESC
		LIMIT ? OFFSET ?`, idUser, idFunct, porPagina, offset)
	if err != nil {
		return models.MCPInteractionPage{}, err
	}
	defer rows.Close()

	var lista []models.MCPInteractionRow
	for rows.Next() {
		var ir models.MCPInteractionRow
		if err := rows.Scan(&ir.IDInteraction, &ir.IDUser, &ir.Output, &ir.Date); err != nil {
			return models.MCPInteractionPage{}, err
		}
		lista = append(lista, ir)
	}
	if err := rows.Err(); err != nil {
		return models.MCPInteractionPage{}, err
	}
	return models.MCPInteractionPage{Rows: lista, Total: total}, nil
}

// ============================
// CRUD CATÁLOGO MCP (baja lógica con active)
// ============================

func MCPCreateModulo(conn *sql.DB, nombre string) error {
	nombre = strings.TrimSpace(nombre)
	if nombre == "" {
		return fmt.Errorf("nombre requerido")
	}

	// ¿Ya existe activo?
	var idActivo int
	err := conn.QueryRow(`
		SELECT idMCP
		FROM mcp
		WHERE LOWER(name) = LOWER(?) AND active = 1
		LIMIT 1`, nombre).Scan(&idActivo)

	if err == nil {
		return fmt.Errorf("ya existe un módulo activo con ese nombre")
	}
	// Eliminamos 'err != nil &&' porque aquí ya sabemos que err nunca es nil
	if err != sql.ErrNoRows {
		return err
	}

	// ¿Existe inactivo? -> reactivar
	var idInactivo int
	err = conn.QueryRow(`
		SELECT idMCP
		FROM mcp
		WHERE LOWER(name) = LOWER(?) AND active = 0
		LIMIT 1`, nombre).Scan(&idInactivo)

	if err == nil {
		_, err = conn.Exec(`UPDATE mcp SET active = 1 WHERE idMCP = ?`, idInactivo)
		return err
	}
	// Eliminamos 'err != nil &&' también aquí
	if err != sql.ErrNoRows {
		return err
	}

	// Crear nuevo
	_, err = conn.Exec(`INSERT INTO mcp (name, active) VALUES (?, 1)`, nombre)
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
	_, err := conn.Exec(`UPDATE mcp SET name = ? WHERE idMCP = ? AND active = 1`, nombre, idMCP)
	return err
}

// MCPDeleteModulo da de baja el módulo y sus funciones en una transacción.
func MCPDeleteModulo(conn *sql.DB, idMCP int) error {
	if idMCP <= 0 {
		return fmt.Errorf("idMCP inválido")
	}

	tx, err := conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`UPDATE funct SET active = 0 WHERE idMCP = ?`, idMCP); err != nil {
		return err
	}
	if _, err := tx.Exec(`UPDATE mcp SET active = 0 WHERE idMCP = ?`, idMCP); err != nil {
		return err
	}
	return tx.Commit()
}

func MCPCreateFuncion(conn *sql.DB, idMCP int, nombre string) error {
	nombre = strings.TrimSpace(nombre)
	if idMCP <= 0 {
		return fmt.Errorf("idMCP inválido")
	}
	if nombre == "" {
		return fmt.Errorf("nombre requerido")
	}

	// ¿Existe activa en ese módulo?
	var idActiva int
	err := conn.QueryRow(`
		SELECT idFunct
		FROM funct
		WHERE idMCP = ? AND LOWER(name) = LOWER(?) AND active = 1
		LIMIT 1`, idMCP, nombre).Scan(&idActiva)

	if err == nil {
		return fmt.Errorf("ya existe una función activa con ese nombre en este módulo")
	}
	// Ya sabemos que err != nil, solo filtramos si es un error real de la base de datos
	if err != sql.ErrNoRows {
		return err
	}

	// ¿Existe inactiva en ese módulo? -> reactivar
	var idInactiva int
	err = conn.QueryRow(`
		SELECT idFunct
		FROM funct
		WHERE idMCP = ? AND LOWER(name) = LOWER(?) AND active = 0
		LIMIT 1`, idMCP, nombre).Scan(&idInactiva)

	if err == nil {
		_, err = conn.Exec(`UPDATE funct SET active = 1 WHERE idFunct = ?`, idInactiva)
		return err
	}
	// Quitamos la redundancia también aquí
	if err != sql.ErrNoRows {
		return err
	}

	// Crear nueva
	_, err = conn.Exec(`INSERT INTO funct (idMCP, name, active) VALUES (?, ?, 1)`, idMCP, nombre)
	return err
}


func MCPUpdateFuncion(conn *sql.DB, idFunct, idMCP int, nombre string) error {
	nombre = strings.TrimSpace(nombre)
	if idFunct <= 0 {
		return fmt.Errorf("idFunct inválido")
	}
	if idMCP <= 0 {
		return fmt.Errorf("idMCP inválido")
	}
	if nombre == "" {
		return fmt.Errorf("nombre requerido")
	}
	_, err := conn.Exec(
		`UPDATE funct SET idMCP = ?, name = ? WHERE idFunct = ? AND active = 1`,
		idMCP, nombre, idFunct,
	)
	return err
}

func MCPDeleteFuncion(conn *sql.DB, idFunct int) error {
	if idFunct <= 0 {
		return fmt.Errorf("idFunct inválido")
	}
	_, err := conn.Exec(`UPDATE funct SET active = 0 WHERE idFunct = ?`, idFunct)
	return err
}