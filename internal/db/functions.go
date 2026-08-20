package db

import (
	"database/sql"
	"fmt"

	"epsteam/internal/models"
)

// ListFuncionesPorUsuario replica ObtenerFuncionesPorUsuario: todas las
// funciones, agrupadas por módulo, marcando si el usuario dado ya la tiene
// autorizada.
func ListFuncionesPorUsuario(conn *sql.DB, idUser int) ([]models.FuncionPermiso, error) {
	rows, err := conn.Query(`
		SELECT f.idFunct, m.name AS Modulo, f.name AS Funcion,
		       CASE WHEN a.loki = 1 THEN 1 ELSE 0 END AS TieneAcceso
		FROM funct f
		JOIN modulo m ON f.idModulo = m.idModulo
		LEFT JOIN accessapi a ON f.idFunct = a.idFunct AND a.idUser = ?
		WHERE m.activo = 1 AND f.activo = 1
		ORDER BY m.name, f.name`, idUser)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.FuncionPermiso
	for rows.Next() {
		var fp models.FuncionPermiso
		var tieneAcceso int
		if err := rows.Scan(&fp.IDFunct, &fp.Modulo, &fp.Funcion, &tieneAcceso); err != nil {
			return nil, err
		}
		fp.Autorizada = tieneAcceso == 1
		lista = append(lista, fp)
	}
	return lista, rows.Err()
}

func CreateFuncion(conn *sql.DB, idModulo int, nombre string) error {
	_, err := conn.Exec(`INSERT INTO funct (idModulo, name) VALUES (?, ?)`, idModulo, nombre)
	return err
}

func UpdateFuncion(conn *sql.DB, idFunct, idModulo int, nombre string) error {
	_, err := conn.Exec(`UPDATE funct SET idModulo = ?, name = ? WHERE idFunct = ?`, idModulo, nombre, idFunct)
	return err
}

func DeleteFuncion(conn *sql.DB, idFunct int) error {
	res, err := conn.Exec(`UPDATE funct SET activo = 0 WHERE idFunct = ? AND activo = 1`, idFunct)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("la función no existe o ya está desactivada")
	}

	return nil
}
