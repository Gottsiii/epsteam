package models

// User representa un registro de la tabla `users`, con el nombre del plan
// ya resuelto (join con `plan`) cuando aplica.
type User struct {
	IDUser   int    `json:"id_user"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Plan     string `json:"plan"`
	Zone     string `json:"zone"`
	Psw      string `json:"psw"`
	Detalle  string `json:"detalle"`
	IDPlan   int    `json:"id_plan"`
}

// NewUserInput son los datos que captura el administrador al dar de alta
// un usuario. Alias es solo la parte que el admin escribe (ej. "jose") —
// el username final se compone en el backend como "suptsmxAAAA" + Alias.
// No incluye contraseña: siempre se genera automáticamente.
type NewUserInput struct {
	Alias   string `json:"alias"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Zone    string `json:"zone"`
	Company string `json:"company"`
	Detalle string `json:"detalle"`
}

// CreatedUser es lo que regresa el alta: el username y password ya
// compuestos/generados, para que el admin los vea y se los dé al usuario.
type CreatedUser struct {
	IDUser   int    `json:"id_user"`
	Username string `json:"username"`
	Psw      string `json:"psw"`
}

// Plan representa un registro de la tabla `plan`. Name ya viene formateado
// como "Nombre (N requests)", igual que en el catálogo original.
type Plan struct {
	IDPlan int    `json:"id_plan"`
	Name   string `json:"name"`
}

// Modulo representa un registro de la tabla `modulo`.
type Modulo struct {
	IDModulo int    `json:"id_modulo"`
	Name     string `json:"name"`
}

// ModuloFuncion es una fila del árbol módulo -> función, usada para pintar
// el catálogo completo. IDFunct es nil cuando el módulo aún no tiene
// funciones (equivalente al LEFT JOIN original).
type ModuloFuncion struct {
	IDModulo int    `json:"id_modulo"`
	Modulo   string `json:"modulo"`
	IDFunct  *int   `json:"id_funct,omitempty"`
	Funcion  string `json:"funcion,omitempty"`
}

// FuncionPermiso es una función/endpoint junto con si el usuario consultado
// tiene acceso autorizado — esto pinta el checklist de permisos por usuario.
type FuncionPermiso struct {
	IDFunct    int    `json:"id_funct"`
	Modulo     string `json:"modulo"`
	Funcion    string `json:"funcion"`
	Autorizada bool   `json:"autorizada"`
}

// PermisoInput es el estado final (marcado/desmarcado) de una función que
// manda el frontend al guardar cambios de un usuario.
type PermisoInput struct {
	IDFunct    int  `json:"id_funct"`
	Autorizada bool `json:"autorizada"`
}

// RecordStat es el resultado del dashboard: cuántas veces se ejecutó cada
// función en los últimos 30 días.
type RecordStat struct {
	Modulo  string `json:"modulo"`
	Funcion string `json:"funcion"`
	Total   int    `json:"total"`
}

// UserStat resume interacciones del mes actual por usuario.
type UserStat struct {
	IDUser             int    `json:"id_user"`
	Username           string `json:"username"`
	TotalInteracciones int    `json:"total_interacciones"`
	LastUpdate         string `json:"last_update"`
}

// FunctionUsageByUser representa uso de funciones por usuario en el mes actual.
type FunctionUsageByUser struct {
	IDFunct int    `json:"id_funct"`
	Modulo  string `json:"modulo"`
	Funcion string `json:"funcion"`
	Usos    int    `json:"usos"`
}

// RecordRow es una fila de la tabla record para la vista de detalle de una
// función.
type RecordRow struct {
	IDRecord int    `json:"id_record"`
	IDUser   int    `json:"id_user"`
	Status   string `json:"status"`
	Date     string `json:"date"`
}

// RecordPage agrupa los resultados paginados de ListRegistrosFuncion.
type RecordPage struct {
	Rows  []RecordRow `json:"rows"`
	Total int         `json:"total"`
}