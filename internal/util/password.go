package util

import "math/rand"

// GenerarContrasena crea una contraseña aleatoria de la longitud pedida,
// garantizando al menos una mayúscula, una minúscula, un número y un
// símbolo. La usan CreateUser, el botón "generar nueva contraseña" en
// edición, y DeactivateUser (para inutilizar la cuenta).
func GenerarContrasena(longitud int) string {
	const mayusculas = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	const minusculas = "abcdefghijklmnopqrstuvwxyz"
	const numeros = "0123456789"
	const especiales = "!@#$%^&*()_+-=[]{}|;:,.<>?"
	todos := mayusculas + minusculas + numeros + especiales

	buf := make([]byte, 0, longitud)
	buf = append(buf, mayusculas[rand.Intn(len(mayusculas))])
	buf = append(buf, minusculas[rand.Intn(len(minusculas))])
	buf = append(buf, numeros[rand.Intn(len(numeros))])
	buf = append(buf, especiales[rand.Intn(len(especiales))])
	for len(buf) < longitud {
		buf = append(buf, todos[rand.Intn(len(todos))])
	}
	rand.Shuffle(len(buf), func(i, j int) { buf[i], buf[j] = buf[j], buf[i] })
	return string(buf)
}
