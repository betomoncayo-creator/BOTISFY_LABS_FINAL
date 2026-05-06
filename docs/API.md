# 📚 API DOCUMENTATION - BOTISFY LABS

**Base URL:** `http://localhost:3000/api`  
**Formato:** JSON  
**Autenticación:** Supabase Admin

---

## 🔌 ENDPOINTS USUARIOS

### 1. GET /users - Listar Usuarios

**Descripción:** Obtiene la lista de todos los usuarios registrados.

**Método:** `GET`  
**URL:** `/api/users`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "estudiante",
      "avatar_url": "https://...",
      "created_at": "2026-05-06T10:30:00Z",
      "updated_at": "2026-05-06T10:30:00Z"
    }
  ]
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "Mensaje de error"
}
```

---

### 2. POST /users - Crear Usuario

**Descripción:** Crea un nuevo usuario con autenticación en Supabase.

**Método:** `POST`  
**URL:** `/api/users`  
**Content-Type:** `application/json`

**Body:**
```json
{
  "full_name": "Carlos López",
  "email": "carlos@example.com",
  "password": "SecurePass123",
  "role": "estudiante",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Validaciones:**
- `full_name`: 3-100 caracteres (requerido)
- `email`: Email válido, único (requerido)
- `password`: 6+ caracteres (requerido)
- `role`: "admin" o "estudiante" (requerido)
- `avatar_url`: URL válida (opcional)

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": "uuid",
    "full_name": "Carlos López",
    "email": "carlos@example.com",
    "role": "estudiante"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "El nombre debe tener al menos 3 caracteres"
}
```

---

### 3. PUT /users - Editar Usuario

**Descripción:** Actualiza los datos de un usuario existente.

**Método:** `PUT`  
**URL:** `/api/users?id={usuario_id}`  
**Content-Type:** `application/json`

**Parámetros:**
- `id` (query): UUID del usuario a editar (requerido)

**Body:**
```json
{
  "full_name": "Carlos López Updated",
  "email": "carlos.updated@example.com",
  "role": "admin",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": "uuid",
    "full_name": "Carlos López Updated",
    "email": "carlos.updated@example.com",
    "role": "admin",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "updated_at": "2026-05-06T11:00:00Z"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Email inválido"
}
```

---

### 4. DELETE /users - Eliminar Usuario

**Descripción:** Elimina un usuario completamente (Auth + BD).

**Método:** `DELETE`  
**URL:** `/api/users?id={usuario_id}`

**Parámetros:**
- `id` (query): UUID del usuario a eliminar (requerido)

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "ID de usuario requerido"
}
```

---

## 🧪 EJEMPLOS CON CURL

### Listar usuarios
```bash
curl -X GET http://localhost:3000/api/users
```

### Crear usuario
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "estudiante"
  }'
```

### Editar usuario
```bash
curl -X PUT http://localhost:3000/api/users?id=abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Name",
    "email": "updated@example.com",
    "role": "admin"
  }'
```

### Eliminar usuario
```bash
curl -X DELETE http://localhost:3000/api/users?id=abc123
```

---

## 📊 CÓDIGOS DE ESTADO

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 200 | OK - Operación exitosa | GET, PUT, DELETE |
| 201 | Created - Recurso creado | POST |
| 400 | Bad Request - Datos inválidos | Validación Zod |
| 404 | Not Found - Recurso no existe | ID inválido |
| 500 | Server Error | Error en Supabase |

---

## 🔐 SEGURIDAD

✅ Validaciones Zod en todas las peticiones  
✅ Contraseñas hasheadas por Supabase  
✅ Eliminación en cascada (Auth + BD)  
✅ Control de errores completo  

---

## 📝 NOTAS

- Todas las respuestas incluyen `success` boolean
- Los errores nunca incluyen datos sensibles
- Las peticiones se validan ANTES de procesarse
- Los timestamps están en ISO 8601