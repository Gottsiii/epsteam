package db

import (
	"database/sql"
	"fmt"
)

type Manager struct {
	API *sql.DB
	MCP *sql.DB
}

func NewManager(apiDSN, mcpDSN string) (*Manager, error) {
	apiConn, err := Connect(apiDSN)
	if err != nil {
		return nil, fmt.Errorf("error conectando API DB: %w", err)
	}

	mcpConn, err := Connect(mcpDSN)
	if err != nil {
		_ = apiConn.Close()
		return nil, fmt.Errorf("error conectando MCP DB: %w", err)
	}

	return &Manager{
		API: apiConn,
		MCP: mcpConn,
	}, nil
}

func (m *Manager) Close() error {
	var firstErr error
	if m.API != nil {
		if err := m.API.Close(); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	if m.MCP != nil {
		if err := m.MCP.Close(); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}