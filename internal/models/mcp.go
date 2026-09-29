package models

// MCPUser representa un registro de la tabla `users` de la base MCP
// (mcpaccess.users) — es una tabla distinta a la de usuarios de la API.
type MCPUser struct {
	IDUser     int    `json:"id_user"`
	Email      string `json:"email"`
	Comment    string `json:"comment"`
	LastUpdate string `json:"last_update"`
}

// MCPCatalogItem es una fila del árbol mcp -> función, análogo a
// ModuloFuncion pero para el catálogo de MCPs.
type MCPCatalogItem struct {
	IDMCP   int    `json:"id_mcp"`
	MCP     string `json:"mcp"`
	IDFunct *int   `json:"id_funct,omitempty"`
	Funcion string `json:"funcion,omitempty"`
}

// MCPUserStat resume interacciones por usuario en la base MCP.
type MCPUserStat struct {
	IDUser             int    `json:"id_user"`
	Email              string `json:"email"`
	TotalInteracciones int    `json:"total_interacciones"`
	LastActivity       string `json:"last_activity"`
}

// MCPFunctionUsage representa uso de una función MCP por un usuario.
type MCPFunctionUsage struct {
	IDFunct int    `json:"id_funct"`
	MCP     string `json:"mcp"`
	Funcion string `json:"funcion"`
	Usos    int    `json:"usos"`
}

// MCPInteractionRow es una fila de la tabla `interaction`.
type MCPInteractionRow struct {
	IDInteraction int    `json:"id_interaction"`
	IDUser        int    `json:"id_user"`
	Output        string `json:"output"`
	Date          string `json:"date"`
}

// MCPInteractionPage agrupa resultados paginados de interacciones.
type MCPInteractionPage struct {
	Rows  []MCPInteractionRow `json:"rows"`
	Total int                 `json:"total"`
}