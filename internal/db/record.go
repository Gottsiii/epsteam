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

// GetUserStatsCurrentMonth devuelve usuarios con interacciones en el mes actual.
func GetUserStatsCurrentMonth(conn *sql.DB) ([]models.UserStat, error) {
	rows, err := conn.Query(`
		SELECT
			r.idUser,
			u.username,
			COUNT(r.idMonthRecord) AS total,
			COALESCE(DATE_FORMAT(MAX(u.lastUpdate), '%Y-%m-%d %H:%i:%s'), '') AS lastUpdate
		FROM monthRecord r
		INNER JOIN users u ON r.idUser = u.idUser
		WHERE r.date >= DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY)
		  AND r.date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY), INTERVAL 1 MONTH)
		GROUP BY r.idUser, u.username
		ORDER BY total DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.UserStat
	for rows.Next() {
		var us models.UserStat
		if err := rows.Scan(&us.IDUser, &us.Username, &us.TotalInteracciones, &us.LastUpdate); err != nil {
			return nil, err
		}
		lista = append(lista, us)
	}
	return lista, rows.Err()
}

// GetTopFunctionsByUser devuelve top 15 funciones usadas por un usuario en el mes actual.
func GetTopFunctionsByUser(conn *sql.DB, idUser int) ([]models.FunctionUsageByUser, error) {
	rows, err := conn.Query(`
		SELECT
			f.idFunct,
			m.name AS modulo,
			f.name AS funcion,
			COUNT(r.idMonthRecord) AS usos
		FROM monthRecord r
		INNER JOIN funct f ON r.idFunct = f.idFunct
		INNER JOIN modulo m ON f.idModulo = m.idModulo
		WHERE r.idUser = ?
		  AND r.date >= DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY)
		  AND r.date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY), INTERVAL 1 MONTH)
		GROUP BY f.idFunct, m.name, f.name
		ORDER BY usos DESC
		LIMIT 15`, idUser)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.FunctionUsageByUser
	for rows.Next() {
		var fu models.FunctionUsageByUser
		if err := rows.Scan(&fu.IDFunct, &fu.Modulo, &fu.Funcion, &fu.Usos); err != nil {
			return nil, err
		}
		lista = append(lista, fu)
	}
	return lista, rows.Err()
}

// GetRecordsByUserAndFunction devuelve registros paginados por usuario/función del mes actual.
func GetRecordsByUserAndFunction(conn *sql.DB, idUser, idFunct, pagina, porPagina int) (models.RecordPage, error) {
	offset := (pagina - 1) * porPagina

	var total int
	if err := conn.QueryRow(`
		SELECT COUNT(idMonthRecord)
		FROM monthRecord
		WHERE idUser = ? AND idFunct = ?
		  AND date >= DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY)
		  AND date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY), INTERVAL 1 MONTH)`,
		idUser, idFunct).Scan(&total); err != nil {
		return models.RecordPage{}, err
	}

	rows, err := conn.Query(`
		SELECT
			idMonthRecord AS idRecord,
			idUser,
			status,
			COALESCE(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s'), '') AS date
		FROM monthRecord
		WHERE idUser = ? AND idFunct = ?
		  AND date >= DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY)
		  AND date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY), INTERVAL 1 MONTH)
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
