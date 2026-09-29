package db

import (
	"database/sql"

	"epsteam/internal/models"
)

// ListMCPUsers devuelve todos los usuarios registrados en la base MCP.
func ListMCPUsers(conn *sql.DB) ([]models.MCPUser, error) {
	rows, err := conn.Query(`
		SELECT
			idUser,
			email,
			COALESCE(comment, ''),
			COALESCE(DATE_FORMAT(lastUpdate, '%Y-%m-%d %H:%i:%s'), '')
		FROM users
		ORDER BY idUser`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.MCPUser
	for rows.Next() {
		var u models.MCPUser
		if err := rows.Scan(&u.IDUser, &u.Email, &u.Comment, &u.LastUpdate); err != nil {
			return nil, err
		}
		lista = append(lista, u)
	}
	return lista, rows.Err()
}

// ListMCPCatalog devuelve el árbol mcp -> función (para la vista de
// catálogo de MCPs, análogo a módulos y funciones de la API).
func ListMCPCatalog(conn *sql.DB) ([]models.MCPCatalogItem, error) {
	rows, err := conn.Query(`
		SELECT
			m.idMCP,
			m.name AS mcp,
			f.idFunct,
			f.name AS funcion
		FROM mcp m
		LEFT JOIN funct f ON f.idMCP = m.idMCP
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

// ListMCPUserStats resume el total de interacciones y la última actividad
// real (MAX(interaction.date)) por usuario, sin límite de mes — la base MCP
// es reciente, así que se toma histórico completo.
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

// ListMCPFunctionsByUser devuelve las funciones usadas por un usuario, con
// su conteo de interacciones, ordenadas de mayor a menor uso.
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