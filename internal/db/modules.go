package db

import (
	"database/sql"

	"epsteam/internal/models"
)

func ListModulos(conn *sql.DB) ([]models.Modulo, error) {
	rows, err := conn.Query(`SELECT idModulo, name FROM modulo ORDER BY name`)
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
		LEFT JOIN funct f ON m.idModulo = f.idModulo
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

func DeleteModulo(conn *sql.DB, idModulo int) error {
	_, err := conn.Exec(`DELETE FROM modulo WHERE idModulo = ?`, idModulo)
	return err
}
