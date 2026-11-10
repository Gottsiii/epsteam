package db

import (
	"database/sql"
	"fmt"
	"strings"

	"epsteam/internal/models"
)

const bajaMarker = "- BAJA DE USUARIO ->"

// parseMCPUserRow centraliza el scan de users MCP.
func parseMCPUserRow(rows *sql.Rows) (models.MCPUser, error) {
	var u models.MCPUser
	if err := rows.Scan(
		&u.IDUser,
		&u.Email,
		&u.Comment,
		&u.LastUpdate,
	); err != nil {
		return models.MCPUser{}, err
	}
	return u, nil
}

// MCPListUsersActive devuelve usuarios sin marca de baja en comment.
func MCPListUsersActive(conn *sql.DB) ([]models.MCPUser, error) {
	rows, err := conn.Query(`
		SELECT
			u.idUser,
			u.email,
			COALESCE(u.comment, '') AS comment,
			COALESCE(DATE_FORMAT(u.lastUpdate, '%Y-%m-%d %H:%i:%s'), '') AS lastUpdate
		FROM users u
		WHERE COALESCE(u.comment, '') NOT LIKE '%- BAJA DE USUARIO ->%'
		ORDER BY u.idUser DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.MCPUser
	for rows.Next() {
		u, err := parseMCPUserRow(rows)
		if err != nil {
			return nil, err
		}
		lista = append(lista, u)
	}
	return lista, rows.Err()
}

// MCPListUsersBaja devuelve usuarios con marca de baja lógica en comment.
func MCPListUsersBaja(conn *sql.DB) ([]models.MCPUser, error) {
	rows, err := conn.Query(`
		SELECT
			u.idUser,
			u.email,
			COALESCE(u.comment, '') AS comment,
			COALESCE(DATE_FORMAT(u.lastUpdate, '%Y-%m-%d %H:%i:%s'), '') AS lastUpdate
		FROM users u
		WHERE COALESCE(u.comment, '') LIKE '%- BAJA DE USUARIO ->%'
		ORDER BY u.idUser DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.MCPUser
	for rows.Next() {
		u, err := parseMCPUserRow(rows)
		if err != nil {
			return nil, err
		}
		lista = append(lista, u)
	}
	return lista, rows.Err()
}

// MCPSearchUsers busca por id, email o comment (en activos).
func MCPSearchUsers(conn *sql.DB, texto string) ([]models.MCPUser, error) {
	t := strings.TrimSpace(texto)
	if t == "" {
		return MCPListUsersActive(conn)
	}
	like := "%" + t + "%"

	rows, err := conn.Query(`
		SELECT
			u.idUser,
			u.email,
			COALESCE(u.comment, '') AS comment,
			COALESCE(DATE_FORMAT(u.lastUpdate, '%Y-%m-%d %H:%i:%s'), '') AS lastUpdate
		FROM users u
		WHERE COALESCE(u.comment, '') NOT LIKE '%- BAJA DE USUARIO ->%'
		  AND (
				CAST(u.idUser AS CHAR) LIKE ?
			 OR u.email LIKE ?
			 OR COALESCE(u.comment, '') LIKE ?
		  )
		ORDER BY u.idUser DESC`,
		like, like, like,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []models.MCPUser
	for rows.Next() {
		u, err := parseMCPUserRow(rows)
		if err != nil {
			return nil, err
		}
		lista = append(lista, u)
	}
	return lista, rows.Err()
}

// MCPCreateUser crea un usuario MCP básico.
func MCPCreateUser(conn *sql.DB, email, comment string) (models.MCPUser, error) {
	email = strings.TrimSpace(email)
	comment = strings.TrimSpace(comment)

	if email == "" {
		return models.MCPUser{}, fmt.Errorf("email requerido")
	}

	res, err := conn.Exec(`
		INSERT INTO users (email, comment, lastUpdate)
		VALUES (?, ?, NOW())`,
		email, comment,
	)
	if err != nil {
		return models.MCPUser{}, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return models.MCPUser{}, err
	}

	var u models.MCPUser
	if err := conn.QueryRow(`
		SELECT
			u.idUser,
			u.email,
			COALESCE(u.comment, '') AS comment,
			COALESCE(DATE_FORMAT(u.lastUpdate, '%Y-%m-%d %H:%i:%s'), '') AS lastUpdate
		FROM users u
		WHERE u.idUser = ?`, id).
		Scan(&u.IDUser, &u.Email, &u.Comment, &u.LastUpdate); err != nil {
		return models.MCPUser{}, err
	}

	return u, nil
}

// MCPSaveUser actualiza los datos y sincroniza los permisos recibidos.
// Si permisos es nil, conserva los permisos existentes.
func MCPSaveUser(
	conn *sql.DB,
	idUser int,
	email, comment string,
	permisos []models.PermisoInput,
) error {
	email = strings.TrimSpace(email)
	comment = strings.TrimSpace(comment)

	if idUser <= 0 {
		return fmt.Errorf("idUser inválido")
	}
	if email == "" {
		return fmt.Errorf("email requerido")
	}

	tx, err := conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`
		UPDATE users
		SET email = ?, comment = ?, lastUpdate = NOW()
		WHERE idUser = ?`,
		email, comment, idUser,
	); err != nil {
		return err
	}

	if permisos != nil {
		actuales := make(map[int]bool)

		rows, err := tx.Query(
			`SELECT idFunct FROM access WHERE idUser = ?`,
			idUser,
		)
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
		if err := rows.Err(); err != nil {
			rows.Close()
			return err
		}
		if err := rows.Close(); err != nil {
			return err
		}

		for _, permiso := range permisos {
			existe := actuales[permiso.IDFunct]

			switch {
			case permiso.Autorizada && !existe:
				if _, err := tx.Exec(
					`INSERT INTO access (idUser, idFunct) VALUES (?, ?)`,
					idUser, permiso.IDFunct,
				); err != nil {
					return err
				}

			case !permiso.Autorizada && existe:
				if _, err := tx.Exec(
					`DELETE FROM access WHERE idUser = ? AND idFunct = ?`,
					idUser, permiso.IDFunct,
				); err != nil {
					return err
				}
			}
		}
	}

	return tx.Commit()
}

// MCPDeactivateUser aplica baja lógica textual:
// " - BAJA DE USUARIO -> SCTASK000000"
// Si ya existe la marca, no la duplica.
func MCPDeactivateUser(conn *sql.DB, idUser int, sctask, motivo string) error {
	if idUser <= 0 {
		return fmt.Errorf("idUser inválido")
	}
	sctask = strings.TrimSpace(sctask)
	if sctask == "" {
		return fmt.Errorf("SCTASK requerido")
	}

	var current sql.NullString
	if err := conn.QueryRow(
		`SELECT comment FROM users WHERE idUser = ?`,
		idUser,
	).Scan(&current); err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("usuario %d no encontrado", idUser)
		}
		return err
	}

	comment := strings.TrimSpace(current.String)
	marker := fmt.Sprintf("%s %s", bajaMarker, sctask)

	if strings.Contains(comment, bajaMarker) {
		_, err := conn.Exec(
			`UPDATE users SET lastUpdate = NOW() WHERE idUser = ?`,
			idUser,
		)
		return err
	}

	extra := marker
	if m := strings.TrimSpace(motivo); m != "" {
		extra = extra + " | " + m
	}

	newComment := strings.TrimSpace(comment)
	if newComment == "" {
		newComment = extra
	} else {
		newComment = newComment + " " + extra
	}

	_, err := conn.Exec(`
		UPDATE users
		SET comment = ?, lastUpdate = NOW()
		WHERE idUser = ?`,
		newComment, idUser,
	)
	return err
}

// MCPReactivateUser quita la marca textual de baja y deja comment limpio.
func MCPReactivateUser(conn *sql.DB, idUser int) error {
	if idUser <= 0 {
		return fmt.Errorf("idUser inválido")
	}

	var current sql.NullString
	if err := conn.QueryRow(
		`SELECT comment FROM users WHERE idUser = ?`,
		idUser,
	).Scan(&current); err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("usuario %d no encontrado", idUser)
		}
		return err
	}

	comment := strings.TrimSpace(current.String)
	if comment == "" {
		_, err := conn.Exec(
			`UPDATE users SET lastUpdate = NOW() WHERE idUser = ?`,
			idUser,
		)
		return err
	}

	if idx := strings.Index(comment, bajaMarker); idx >= 0 {
		comment = strings.TrimSpace(comment[:idx])
	}

	_, err := conn.Exec(`
		UPDATE users
		SET comment = ?, lastUpdate = NOW()
		WHERE idUser = ?`,
		comment, idUser,
	)
	return err
}