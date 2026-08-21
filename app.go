package main

import (
	"context"
	"database/sql"
	_ "embed"
	"fmt"

	"epsteam/internal/config"
	"epsteam/internal/db"
	"epsteam/internal/logger"
	"epsteam/internal/models"
	"epsteam/internal/util"
)

// Respaldo embebido de config.json dentro del propio .exe — si el archivo
// externo no está junto al ejecutable (o no se pudo leer), se usa este.
// El comentario //go:embed DEBE ir pegado al var, sin línea en blanco.
//
//go:embed config.json
var configBytes []byte

type App struct {
	ctx     context.Context
	conn    *sql.DB
	loadErr error
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Intenta config.json externo primero (para poder cambiar el DSN sin
	// recompilar); si no lo encuentra, cae al respaldo embebido en el .exe.
	cfg, err := config.LoadHybrid("config.json", configBytes)
	if err != nil {
		a.loadErr = err
		fmt.Println("error cargando la configuración:", err)
		return
	}

	conn, err := db.Connect(cfg.DSN)
	if err != nil {
		a.loadErr = err
		fmt.Println("error conectando a MySQL:", err)
		return
	}
	a.conn = conn
}

func (a *App) check() error {
	if a.loadErr != nil {
		return a.loadErr
	}
	return db.Healthy(a.conn)
}

// ---- Usuarios ----

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

// GenerarPassword regresa una contraseña aleatoria nueva (12 caracteres,
// mayúsculas/minúsculas/números/símbolos) — la usa el botón "generar nueva
// contraseña" tanto en alta como en edición.
func (a *App) GenerarPassword() string {
	return util.GenerarContrasena(12)
}

// GuardarUsuarioInput agrupa los datos editables de un usuario más el
// estado final de su checklist de permisos.
type GuardarUsuarioInput struct {
	IDUser   int                    `json:"id_user"`
	Username string                 `json:"username"`
	Psw      string                 `json:"psw"`
	Name     string                 `json:"name"`
	Zone     string                 `json:"zone"`
	Email    string                 `json:"email"`
	IDPlan   int                    `json:"id_plan"`
	Detalle  string                 `json:"detalle"`
	Permisos []models.PermisoInput  `json:"permisos"`
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

// DarDeAltaUsuario reactiva a un usuario previamente dado de baja: quita la
// marca "BAJA DE USUARIO" (y el CTASK asociado) de su detalle.
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

// ---- Módulos y funciones (catálogo) ----

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

// ---- Estadísticas (record) ----

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
