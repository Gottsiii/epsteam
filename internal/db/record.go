package db

import (
	"database/sql"

	"epsteam/internal/models"
)

// ListEstadisticasFunciones devuelve el conteo de ejecuciones por función
// en los últimos 30 días, ordenado de mayor a menor.
func ListEstadisticasFunciones(conn *sql.DB) ([]models.RecordStat, error) {
	rows, err := conn.Query(`
		SELECT
			m.name AS modulo,
			f.name AS funcion,
			COUNT(r.idRecord) AS total_ejecuciones
		FROM record r
		INNER JOIN funct f ON r.idFunct = f.idFunct
		INNER JOIN modulo m ON f.idModulo = m.idModulo
		WHERE r.date >= NOW() - INTERVAL 30 DAY
		GROUP BY m.name, f.name
		ORDER BY total_ejecuciones DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.RecordStat
	for rows.Next() {
		var rs models.RecordStat
		if err := rows.Scan(&rs.Modulo, &rs.Funcion, &rs.Total); err != nil {
			return nil, err
		}
		lista = append(lista, rs)
	}
	return lista, rows.Err()
}

// ListRegistrosFuncion devuelve todos los registros de la tabla record para
// una función específica (por nombre de módulo y función), con paginación.
func ListRegistrosFuncion(conn *sql.DB, modulo, funcion string, pagina, porPagina int) (models.RecordPage, error) {
	offset := (pagina - 1) * porPagina

	var total int
	err := conn.QueryRow(`
		SELECT COUNT(r.idRecord)
		FROM record r
		INNER JOIN funct f ON r.idFunct = f.idFunct
		INNER JOIN modulo m ON f.idModulo = m.idModulo
		WHERE m.name = ? AND f.name = ?`, modulo, funcion).Scan(&total)
	if err != nil {
		return models.RecordPage{}, err
	}

	rows, err := conn.Query(`
		SELECT r.idRecord, r.idUser, r.status, r.date
		FROM record r
		INNER JOIN funct f ON r.idFunct = f.idFunct
		INNER JOIN modulo m ON f.idModulo = m.idModulo
		WHERE m.name = ? AND f.name = ?
		ORDER BY r.date DESC
		LIMIT ? OFFSET ?`, modulo, funcion, porPagina, offset)
	if err != nil {
		return models.RecordPage{}, err
	}
	defer rows.Close()

	var lista []models.RecordRow
	for rows.Next() {
		var rr models.RecordRow
		if err := rows.Scan(&rr.IDRecord, &rr.IDUser, &rr.Status, &rr.Date); err != nil {
			return models.RecordPage{}, err
		}
		lista = append(lista, rr)
	}
	if err := rows.Err(); err != nil {
		return models.RecordPage{}, err
	}
	return models.RecordPage{Rows: lista, Total: total}, nil
}
