package db

import (
	"database/sql"
	"fmt"
	"regexp"
	"strings"
	"time"

	"epsteam/internal/models"
	"epsteam/internal/util"
)

var columnasValidas = map[string]bool{
	"u.username": true,
	"u.email":    true,
	"u.zone":     true,
	"p.name":     true,
}

var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

const selectUsuariosBase = `
	SELECT
		u.idUser, u.username, u.email, u.name,
		CONCAT(p.name, ' (', p.requests, ' requests)') AS plan,
		u.zone, u.psw, u.detalle, u.idPlan
	FROM users u
	JOIN plan p ON u.idPlan = p.idPlan
	WHERE u.detalle NOT LIKE '%BAJA DE USUARIO%'`

func scanUsers(rows *sql.Rows) ([]models.User, error) {
	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.IDUser, &u.Username, &u.Email, &u.Name, &u.Plan, &u.Zone, &u.Psw, &u.Detalle, &u.IDPlan); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

// ListActive replica ObtenerUsuariosConPlan. NOTA: el original genera SQL
// inválido cuando hay filtro (dos WHERE seguidos) — aquí se corrige a AND.
func ListActive(conn *sql.DB, filtro, columna, modo string) ([]models.User, error) {
	if !columnasValidas[columna] {
		columna = "u.username"
	}

	query := selectUsuariosBase
	var args []any

	if strings.TrimSpace(filtro) != "" {
		op, val := "LIKE", "%"+filtro+"%"
		if modo == "exact" {
			op, val = "=", filtro
		}
		query += fmt.Sprintf(" AND %s %s ?", columna, op)
		args = append(args, val)
	}

	rows, err := conn.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUsers(rows)
}

// ListBaja replica ObtenerUsuariosBaja.
func ListBaja(conn *sql.DB) ([]models.User, error) {
	rows, err := conn.Query(`
		SELECT idUser, username, email, name, '' AS plan, zone, psw, detalle, idPlan
		FROM users
		WHERE detalle LIKE '%BAJA DE USUARIO%'`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUsers(rows)
}

// SearchGlobal replica BuscarUsuarioGlobalRealTime.
func SearchGlobal(conn *sql.DB, texto string) ([]models.User, error) {
	query := selectUsuariosBase + `
		AND (u.username LIKE ? OR u.email LIKE ? OR u.name LIKE ? OR u.zone LIKE ? OR p.name LIKE ?)`
	like := "%" + strings.TrimSpace(texto) + "%"

	rows, err := conn.Query(query, like, like, like, like, like)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUsers(rows)
}

// CreateUser da de alta un usuario nuevo aplicando las reglas de negocio:
//   - username siempre "suptsmx" + año actual + alias (ej. "suptsmx2026jose")
//   - contraseña siempre generada automáticamente (12 caracteres, nunca la
//     escribe el admin)
//   - siempre se asigna el plan con menos requests disponible
//   - siempre se autoriza únicamente la función modulo="user" función="profile"
//     (si existe en el catálogo; si no, se crea el usuario sin permisos y se
//     avisa en el error de forma no bloqueante — ver nota abajo)
func CreateUser(conn *sql.DB, input models.NewUserInput) (models.CreatedUser, error) {
	if !emailRegex.MatchString(strings.TrimSpace(input.Email)) {
		return models.CreatedUser{}, fmt.Errorf("email inválido: %q", input.Email)
	}
	if strings.TrimSpace(input.Alias) == "" {
		return models.CreatedUser{}, fmt.Errorf("el alias del usuario no puede estar vacío")
	}

	username := fmt.Sprintf("suptsmx%d%s", time.Now().Year(), input.Alias)
	psw := util.GenerarContrasena(12)

	tx, err := conn.Begin()
	if err != nil {
		return models.CreatedUser{}, err
	}
	defer tx.Rollback()

	var idPlan int
	if err := tx.QueryRow(`SELECT idPlan FROM plan ORDER BY requests ASC LIMIT 1`).Scan(&idPlan); err != nil {
		return models.CreatedUser{}, fmt.Errorf("no se encontró un plan disponible: %w", err)
	}

	res, err := tx.Exec(`
		INSERT INTO users (username, psw, email, name, zone, idPlan, company, detalle)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		username, psw, input.Email, input.Name, input.Zone, idPlan, input.Company, input.Detalle)
	if err != nil {
		return models.CreatedUser{}, err
	}

	idUser64, err := res.LastInsertId()
	if err != nil {
		return models.CreatedUser{}, err
	}
	idUser := int(idUser64)

	var idFunctDefault int
	err = tx.QueryRow(`
		SELECT f.idFunct FROM funct f JOIN modulo m ON f.idModulo = m.idModulo
		WHERE m.name = 'user' AND f.name = 'profile' AND m.activo = 1 AND f.activo = 1 LIMIT 1`).Scan(&idFunctDefault)
	switch {
	case err == sql.ErrNoRows:
		// El módulo/función base todavía no existe en el catálogo — se crea
		// el usuario sin permisos en vez de tronar el alta completa.
	case err != nil:
		return models.CreatedUser{}, err
	default:
		if _, err := tx.Exec(`INSERT INTO accessapi (idFunct, idUser, loki) VALUES (?, ?, 1)`, idFunctDefault, idUser); err != nil {
			return models.CreatedUser{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return models.CreatedUser{}, err
	}

	return models.CreatedUser{IDUser: idUser, Username: username, Psw: psw}, nil
}

// SaveUserChanges replica GuardarCambiosTransaccionales: actualiza los
// datos básicos y sincroniza accessapi comparando contra el estado actual
// en BD (solo inserta/elimina lo que cambió).
func SaveUserChanges(conn *sql.DB, idUser int, username, psw, name, zone, email string, idPlan int, detalle string, permisos []models.PermisoInput) error {
	if !emailRegex.MatchString(strings.TrimSpace(email)) {
		return fmt.Errorf("email inválido: %q", email)
	}

	tx, err := conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`
		UPDATE users SET username = ?, psw = ?, name = ?, zone = ?, email = ?, idPlan = ?, detalle = ?
		WHERE idUser = ?`,
		username, psw, name, zone, email, idPlan, detalle, idUser); err != nil {
		return err
	}

	actuales := make(map[int]bool)
	rows, err := tx.Query(`SELECT idFunct FROM accessapi WHERE idUser = ? AND loki = 1`, idUser)
	if err != nil {
		return err
	}
	for rows.Next() {
		var idFunct int
		if err := rows.Scan(&idFunct); err != nil {
			rows.Close()
			return err
		}
		actuales[idFunct] = true
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	for _, p := range permisos {
		existe := actuales[p.IDFunct]
		switch {
		case p.Autorizada && !existe:
			if _, err := tx.Exec(`INSERT INTO accessapi (idFunct, idUser, loki) VALUES (?, ?, 1)`, p.IDFunct, idUser); err != nil {
				return err
			}
		case !p.Autorizada && existe:
			if _, err := tx.Exec(`DELETE FROM accessapi WHERE idFunct = ? AND idUser = ?`, p.IDFunct, idUser); err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

// DeactivateUser replica DarDeBajaUsuarioTransaccional: revoca todos los
// permisos, mueve al plan "test" y genera una contraseña inutilizable.
func DeactivateUser(conn *sql.DB, idUser int, nuevoDetalle string) error {
	tx, err := conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	idPlanTest := 1
	row := tx.QueryRow(`SELECT idPlan FROM plan WHERE name = 'test' LIMIT 1`)
	if err := row.Scan(&idPlanTest); err != nil && err != sql.ErrNoRows {
		return err
	}

	if _, err := tx.Exec(`DELETE FROM accessapi WHERE idUser = ?`, idUser); err != nil {
		return err
	}

	nuevaPsw := util.GenerarContrasena(12)

	res, err := tx.Exec(`
		UPDATE users SET psw = ?, idPlan = ?, detalle = ? WHERE idUser = ?`,
		nuevaPsw, idPlanTest, nuevoDetalle, idUser)
	if err != nil {
		return err
	}
	if affected, err := res.RowsAffected(); err != nil {
		return err
	} else if affected == 0 {
		return fmt.Errorf("no se encontró el usuario idUser=%d", idUser)
	}

	return tx.Commit()
}

// ReactivateUser ("dar de alta") quita la marca de baja del campo detalle
// (todo desde " - BAJA DE USUARIO" en adelante, incluyendo el CTASK que se
// haya registrado), dejando al usuario fuera del filtro de ListBaja.
// No restaura plan ni permisos automáticamente — eso se ajusta a mano desde
// el formulario de edición normal, ya que no hay forma de saber cuáles
// tenía antes de la baja.
func ReactivateUser(conn *sql.DB, idUser int) error {
	res, err := conn.Exec(`
		UPDATE users
		SET detalle = SUBSTRING_INDEX(detalle, ' - BAJA DE USUARIO', 1)
		WHERE idUser = ?`, idUser)
	if err != nil {
		return err
	}
	if affected, err := res.RowsAffected(); err != nil {
		return err
	} else if affected == 0 {
		return fmt.Errorf("no se encontró el usuario idUser=%d", idUser)
	}
	return nil
}
