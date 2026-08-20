package db

import (
	"database/sql"
	"fmt"

	"epsteam/internal/models"
)

func ListModulos(conn *sql.DB) ([]models.Modulo, error) {
	rows, err := conn.Query(`SELECT idModulo, name FROM modulo WHERE activo = 1 ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var modulos []models.Modulo
	for rows.Next() {
		var m models.Modulo
		if err := rows.Scan(&m.IDModulo, &m.Name); err != nil {
			return nil, err
		}
		modulos = append(modulos, m)
	}
	return modulos, rows.Err()
}

func ListEstructuraModuloFunciones(conn *sql.DB) ([]models.ModuloFuncion, error) {
	rows, err := conn.Query(`
		SELECT m.idModulo, m.name AS Modulo, f.idFunct, f.name AS Funcion
		FROM modulo m
		LEFT JOIN funct f ON m.idModulo = f.idModulo AND f.activo = 1
		WHERE m.activo = 1
		ORDER BY m.name, f.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var estructura []models.ModuloFuncion
	for rows.Next() {
		var mf models.ModuloFuncion
		var idFunct sql.NullInt64
		var funcion sql.NullString
		if err := rows.Scan(&mf.IDModulo, &mf.Modulo, &idFunct, &funcion); err != nil {
			return nil, err
		}
		if idFunct.Valid {
			v := int(idFunct.Int64)
			mf.IDFunct = &v
		}
		mf.Funcion = funcion.String
		estructura = append(estructura, mf)
	}
	return estructura, rows.Err()
}

func CreateModulo(conn *sql.DB, nombre string) error {
	_, err := conn.Exec(`INSERT INTO modulo (name) VALUES (?)`, nombre)
	return err
}

func UpdateModulo(conn *sql.DB, idModulo int, nombre string) error {
	_, err := conn.Exec(`UPDATE modulo SET name = ? WHERE idModulo = ?`, nombre, idModulo)
	return err
}

func GetActiveFunctionCountByModulo(conn *sql.DB, idModulo int) (int, error) {
	var total int
	err := conn.QueryRow(`SELECT COUNT(*) FROM funct WHERE idModulo = ? AND activo = 1`, idModulo).Scan(&total)
	return total, err
}

func DeleteModulo(conn *sql.DB, idModulo int) error {
	total, err := GetActiveFunctionCountByModulo(conn, idModulo)
	if err != nil {
		return err
	}
	if total > 0 {
		return fmt.Errorf("este módulo tiene %d funciones activas, no se puede desactivar", total)
	}

	res, err := conn.Exec(`UPDATE modulo SET activo = 0 WHERE idModulo = ? AND activo = 1`, idModulo)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("el módulo no existe o ya está desactivado")
	}

	return nil
}
