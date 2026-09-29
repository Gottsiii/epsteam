package main

import (
	"context"
	"database/sql"
	"fmt"

	"epsteam/internal/config"
	"epsteam/internal/db"
	"epsteam/internal/logger"
	"epsteam/internal/models"
	"epsteam/internal/util"
)

type App struct {
	ctx context.Context

	// Conexión principal (API / core DB — TSMX)
	conn *sql.DB
	// Conexión para la base MCP (mcpaccess)
	mcpConn *sql.DB

	loadErr error
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	cfg, err := config.LoadFromExeDir()
	if err != nil {
		a.loadErr = err
		fmt.Println("error cargando la configuración:", err)
		return
	}

	if cfg.API.DSN == "" {
		a.loadErr = fmt.Errorf("config inválido: api.dsn vacío")
		fmt.Println(a.loadErr)
		return
	}
	conn, err := db.Connect(cfg.API.DSN)
	if err != nil {
		a.loadErr = err
		fmt.Println("error conectando a MySQL (API):", err)
		return
	}
	a.conn = conn

	if cfg.MCP.DSN == "" {
		a.loadErr = fmt.Errorf("config inválido: mcp.dsn vacío")
		fmt.Println(a.loadErr)
		return
	}
	mcpConn, err := db.Connect(cfg.MCP.DSN)
	if err != nil {
		a.loadErr = err
		fmt.Println("error conectando a MySQL (MCP):", err)
		return
	}
	a.mcpConn = mcpConn
}

func (a *App) check() error {
	if a.loadErr != nil {
		return a.loadErr
	}
	return db.Healthy(a.conn)
}

func (a *App) checkMCP() error {
	if a.loadErr != nil {
		return a.loadErr
	}
	if a.mcpConn == nil {
		return fmt.Errorf("conexión MCP no inicializada")
	}
	return db.Healthy(a.mcpConn)
}

// ---- Usuarios (API / TSMX) ----

func (a *App) ListarUsuarios(filtro, columna, modo string) ([]models.User, error) {
	if err := a.check(); err != nil {
		return nil, err
	}
	return db.ListActive(a.conn, filtro, columna, modo)
}

func (a *App) ListarUsuariosBaja() ([]models.User, error) {
	if err := a.check(); err != nil {
		return nil, err
	}
	return db.ListBaja(a.conn)
}

func (a *App) BuscarUsuarios(texto string) ([]models.User, error) {
	if err := a.check(); err != nil {
		return nil, err
	}
	return db.SearchGlobal(a.conn, texto)
}

func (a *App) CrearUsuario(input models.NewUserInput) (models.CreatedUser, error) {
	if err := a.check(); err != nil {
		return models.CreatedUser{}, err
	}
	creado, err := db.CreateUser(a.conn, input)
	if err != nil {
		return models.CreatedUser{}, err
	}
	logger.Registrar("CREAR_USUARIO", fmt.Sprintf("idUser=%d username=%s", creado.IDUser, creado.Username))
	return creado, nil
}

func (a *App) GenerarPassword() string {
	return util.GenerarContrasena(12)
}

type GuardarUsuarioInput struct {
	IDUser   int                   `json:"id_user"`
	Username string                `json:"username"`
	Psw      string                `json:"psw"`
	Name     string                `json:"name"`
	Zone     string                `json:"zone"`
	Email    string                `json:"email"`
	IDPlan   int                   `json:"id_plan"`
	Detalle  string                `json:"detalle"`
	Permisos []models.PermisoInput `json:"permisos"`
}

func (a *App) GuardarUsuario(input GuardarUsuarioInput) error {
	if err := a.check(); err != nil {
		return err
	}
	if err := db.SaveUserChanges(a.conn, input.IDUser, input.Username, input.Psw, input.Name, input.Zone, input.Email, input.IDPlan, input.Detalle, input.Permisos); err != nil {
		return err
	}
	logger.Registrar("GUARDAR_USUARIO", fmt.Sprintf("idUser=%d", input.IDUser))
	return nil
}

func (a *App) DarDeBajaUsuario(idUser int, nuevoDetalle string) error {
	if err := a.check(); err != nil {
		return err
	}
	if err := db.DeactivateUser(a.conn, idUser, nuevoDetalle); err != nil {
		return err
	}
	logger.Registrar("BAJA_USUARIO", fmt.Sprintf("idUser=%d", idUser))
	return nil
}

func (a *App) DarDeAltaUsuario(idUser int) error {
	if err := a.check(); err != nil {
		return err
	}
	if err := db.ReactivateUser(a.conn, idUser); err != nil {
		return err
	}
	logger.Registrar("ALTA_USUARIO", fmt.Sprintf("idUser=%d", idUser))
	return nil
}

// ---- Planes ----

func (a *App) ListarPlanes() ([]models.Plan, error) {
	if err := a.check(); err != nil {
		return nil, err
	}
	return db.ListPlanes(a.conn)
}

// ---- Permisos ----

func (a *App) ListarFuncionesPorUsuario(idUser int) ([]models.FuncionPermiso, error) {
	if err := a.check(); err != nil {
		return nil, err
	}
	return db.ListFuncionesPorUsuario(a.conn, idUser)
}

// ---- Módulos y funciones (catálogo API) ----

func (a *App) ListarModulos() ([]models.Modulo, error) {
	if err := a.check(); err != nil {
		return nil, err
	}
	return db.ListModulos(a.conn)
}

func (a *App) ListarEstructuraModulos() ([]models.ModuloFuncion, error) {
	if err := a.check(); err != nil {
		return nil, err
	}
	return db.ListEstructuraModuloFunciones(a.conn)
}

func (a *App) CrearModulo(nombre string) error {
	if err := a.check(); err != nil {
		return err
	}
	return db.CreateModulo(a.conn, nombre)
}

func (a *App) ModificarModulo(idModulo int, nombre string) error {
	if err := a.check(); err != nil {
		return err
	}
	return db.UpdateModulo(a.conn, idModulo, nombre)
}

func (a *App) EliminarModulo(idModulo int) error {
	if err := a.check(); err != nil {
		return err
	}
	return db.DeleteModulo(a.conn, idModulo)
}

func (a *App) CrearFuncion(idModulo int, nombre string) error {
	if err := a.check(); err != nil {
		return err
	}
	return db.CreateFuncion(a.conn, idModulo, nombre)
}

func (a *App) ModificarFuncion(idFunct, idModulo int, nombre string) error {
	if err := a.check(); err != nil {
		return err
	}
	return db.UpdateFuncion(a.conn, idFunct, idModulo, nombre)
}

func (a *App) EliminarFuncion(idFunct int) error {
	if err := a.check(); err != nil {
		return err
	}
	return db.DeleteFuncion(a.conn, idFunct)
}

// ---- Estadísticas (API) ----

func (a *App) ListarEstadisticasFunciones() ([]models.RecordStat, error) {
	if err := a.check(); err != nil {
		return nil, err
	}
	return db.ListEstadisticasFunciones(a.conn)
}

func (a *App) ListarRegistrosFuncion(modulo, funcion string, pagina, porPagina int) (models.RecordPage, error) {
	if err := a.check(); err != nil {
		return models.RecordPage{}, err
	}
	if pagina < 1 {
		pagina = 1
	}
	if porPagina < 1 {
		porPagina = 50
	}
	return db.ListRegistrosFuncion(a.conn, modulo, funcion, pagina, porPagina)
}

func (a *App) ListarEstadisticasUsuarios() ([]models.UserStat, error) {
	if err := a.check(); err != nil {
		return nil, err
	}
	return db.GetUserStatsCurrentMonth(a.conn)
}

func (a *App) ListarTop15FuncionesPorUsuario(idUser int) ([]models.FunctionUsageByUser, error) {
	if err := a.check(); err != nil {
		return nil, err
	}
	return db.GetTopFunctionsByUser(a.conn, idUser)
}

func (a *App) ListarRegistrosPorUsuarioYFuncion(idUser, idFunct, pagina, porPagina int) (models.RecordPage, error) {
	if err := a.check(); err != nil {
		return models.RecordPage{}, err
	}
	if pagina < 1 {
		pagina = 1
	}
	if porPagina < 1 {
		porPagina = 50
	}
	return db.GetRecordsByUserAndFunction(a.conn, idUser, idFunct, pagina, porPagina)
}

// ==== MCP (mcpaccess) ====
// Los métodos MCP* pegan a a.mcpConn, nunca a a.conn — son la contraparte
// exacta de los de arriba pero sobre la base mcpaccess.

func (a *App) MCPListarUsuarios() ([]models.MCPUser, error) {
	if err := a.checkMCP(); err != nil {
		return nil, err
	}
	return db.ListMCPUsers(a.mcpConn)
}

func (a *App) MCPListarCatalogo() ([]models.MCPCatalogItem, error) {
	if err := a.checkMCP(); err != nil {
		return nil, err
	}
	return db.ListMCPCatalog(a.mcpConn)
}

func (a *App) MCPListarEstadisticasUsuarios() ([]models.MCPUserStat, error) {
	if err := a.checkMCP(); err != nil {
		return nil, err
	}
	return db.ListMCPUserStats(a.mcpConn)
}

func (a *App) MCPListarFuncionesPorUsuario(idUser int) ([]models.MCPFunctionUsage, error) {
	if err := a.checkMCP(); err != nil {
		return nil, err
	}
	return db.ListMCPFunctionsByUser(a.mcpConn, idUser)
}

func (a *App) MCPListarInteracciones(idUser, idFunct, pagina, porPagina int) (models.MCPInteractionPage, error) {
	if err := a.checkMCP(); err != nil {
		return models.MCPInteractionPage{}, err
	}
	if pagina < 1 {
		pagina = 1
	}
	if porPagina < 1 {
		porPagina = 50
	}
	return db.GetMCPInteractionsByUserAndFunction(a.mcpConn, idUser, idFunct, pagina, porPagina)
}