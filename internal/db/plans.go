package db

import (
	"database/sql"

	"epsteam/internal/models"
)

func ListPlanes(conn *sql.DB) ([]models.Plan, error) {
	rows, err := conn.Query(`
		SELECT idPlan, CONCAT(name, ' (', requests, ' requests)') AS name FROM plan`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var planes []models.Plan
	for rows.Next() {
		var p models.Plan
		if err := rows.Scan(&p.IDPlan, &p.Name); err != nil {
			return nil, err
		}
		planes = append(planes, p)
	}
	return planes, rows.Err()
}
