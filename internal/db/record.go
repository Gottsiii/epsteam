package db

import (
	"database/sql"

	"epsteam/internal/models"
)

// GetUserStatsCurrentMonth devuelve todos los usuarios que tuvieron interacciones
// en el mes calendario actual, con el total de interacciones y el lastUpdate de la
// tabla users.
func GetUserStatsCurrentMonth(conn *sql.DB) ([]models.UserStat, error) {
	rows, err := conn.Query(`
		SELECT
			mr.idUser,
			COUNT(mr.idMonthRecord) AS total_interacciones,
			COALESCE(u.lastUpdate, '') AS last_update
		FROM monthRecord mr
		LEFT JOIN users u ON mr.idUser = u.idUser
		WHERE MONTH(mr.date) = MONTH(CURDATE())
		  AND YEAR(mr.date) = YEAR(CURDATE())
		GROUP BY mr.idUser, u.lastUpdate
		ORDER BY total_interacciones DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.UserStat
	for rows.Next() {
		var us models.UserStat
		if err := rows.Scan(&us.IDUser, &us.TotalInteracciones, &us.LastUpdate); err != nil {
			return nil, err
		}
		lista = append(lista, us)
	}
	return lista, rows.Err()
}

// GetTopFunctionsByUser devuelve las top 15 funciones más usadas por un usuario
// en el mes calendario actual.
func GetTopFunctionsByUser(conn *sql.DB, idUser int) ([]models.FunctionUsage, error) {
	rows, err := conn.Query(`
		SELECT
			mr.idFunct,
			m.name AS modulo,
			f.name AS funcion,
			COUNT(mr.idMonthRecord) AS usos
		FROM monthRecord mr
		INNER JOIN funct f ON mr.idFunct = f.idFunct
		INNER JOIN modulo m ON f.idModulo = m.idModulo
		WHERE mr.idUser = ?
		  AND MONTH(mr.date) = MONTH(CURDATE())
		  AND YEAR(mr.date) = YEAR(CURDATE())
		GROUP BY mr.idFunct, m.name, f.name
		ORDER BY usos DESC
		LIMIT 15`, idUser)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.FunctionUsage
	for rows.Next() {
		var fu models.FunctionUsage
		if err := rows.Scan(&fu.IDFunct, &fu.Modulo, &fu.Funcion, &fu.Usos); err != nil {
			return nil, err
		}
		lista = append(lista, fu)
	}
	return lista, rows.Err()
}

// GetRecordsByUserAndFunction devuelve los registros de monthRecord para un usuario
// y función específicos en el mes actual, con paginación.
func GetRecordsByUserAndFunction(conn *sql.DB, idUser, idFunct, pagina, porPagina int) (models.RecordPage, error) {
	offset := (pagina - 1) * porPagina

	var total int
	err := conn.QueryRow(`
		SELECT COUNT(*)
		FROM monthRecord
		WHERE idUser = ?
		  AND idFunct = ?
		  AND MONTH(date) = MONTH(CURDATE())
		  AND YEAR(date) = YEAR(CURDATE())`, idUser, idFunct).Scan(&total)
	if err != nil {
		return models.RecordPage{}, err
	}

	rows, err := conn.Query(`
		SELECT idMonthRecord, idUser, '' AS status, date
		FROM monthRecord
		WHERE idUser = ?
		  AND idFunct = ?
		  AND MONTH(date) = MONTH(CURDATE())
		  AND YEAR(date) = YEAR(CURDATE())
		ORDER BY date DESC
		LIMIT ? OFFSET ?`, idUser, idFunct, porPagina, offset)
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