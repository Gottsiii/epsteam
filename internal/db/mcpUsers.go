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

// MCPSaveUser actualiza email/comment y refresca lastUpdate.
func MCPSaveUser(conn *sql.DB, idUser int, email, comment string) error {
	email = strings.TrimSpace(email)
	comment = strings.TrimSpace(comment)

	if idUser <= 0 {
		return fmt.Errorf("idUser inválido")
	}
	if email == "" {
		return fmt.Errorf("email requerido")
	}

	_, err := conn.Exec(`
		UPDATE users
		SET email = ?, comment = ?, lastUpdate = NOW()
		WHERE idUser = ?`,
		email, comment, idUser,
	)
	return err
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
	if err := conn.QueryRow(`SELECT comment FROM users WHERE idUser = ?`, idUser).Scan(&current); err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("usuario %d no encontrado", idUser)
		}
		return err
	}

	comment := strings.TrimSpace(current.String)
	marker := fmt.Sprintf("%s %s", bajaMarker, sctask)

	if strings.Contains(comment, bajaMarker) {
		// ya está dado de baja; opcionalmente actualizamos lastUpdate
		_, err := conn.Exec(`UPDATE users SET lastUpdate = NOW() WHERE idUser = ?`, idUser)
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
	if err := conn.QueryRow(`SELECT comment FROM users WHERE idUser = ?`, idUser).Scan(&current); err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("usuario %d no encontrado", idUser)
		}
		return err
	}

	comment := strings.TrimSpace(current.String)
	if comment == "" {
		_, err := conn.Exec(`UPDATE users SET lastUpdate = NOW() WHERE idUser = ?`, idUser)
		return err
	}

	// Quita desde el marker hasta el final del string.
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