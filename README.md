# SocialAsync Backend

Backend API de SocialAsync, una red social desarrollada como proyecto full stack de práctica enfocada en interacción entre usuarios mediante publicaciones, comentarios y relaciones de amistad.

La API fue desarrollada utilizando Node.js, Express, TypeScript y MongoDB, implementando autenticación JWT, paginación, rutas protegidas y documentación completa con Postman.

---

## Features

- Registro e inicio de sesión de usuarios
- Autenticación mediante JWT
- Sistema de amistades
- Solicitudes de amistad
- Publicaciones y comentarios
- Feed personalizado
- Búsqueda de usuarios
- Paginación
- Validación de datos
- Rutas protegidas
- Arquitectura REST
- Documentación completa de la API

---

## Stack Tecnológico

### Backend
- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcryptjs

### Frontend
- React
- Redux Toolkit
- RTK Query
- Formik
- Yup
- styled-components

---

## Documentación de la API

La documentación completa de la API se encuentra disponible en:

🔗 https://documenter.getpostman.com/view/45555457/2sBXqNkyDN#intro

---

## Deploy

### Backend
Deployado en Render utilizando variables de entorno.

### Base de Datos
MongoDB Atlas.

### Frontend
Frontend deployado en Vercel.

---

## Funcionalidades Principales

### Autenticación

La autenticación se maneja mediante JWT.

Las rutas protegidas requieren:

```txt
Authorization: Bearer <token>
```

Algunos endpoints reciben el token directamente dentro del body de la request.

---

### Sistema de Amistades

Los usuarios pueden:
- enviar solicitudes de amistad
- aceptar o rechazar solicitudes
- eliminar amigos
- acceder a contenido exclusivo para amigos

El sistema conserva la relación original entre emisor y receptor de cada solicitud.

---

### Feed y Paginación

El feed devuelve publicaciones:
- del usuario autenticado
- de sus amigos

Los resultados se ordenan desde los más recientes a los más antiguos.

La paginación se implementa utilizando:

```txt
?page=1
```

Cada página retorna hasta 15 publicaciones.

---

## Validaciones

Las validaciones se aplican tanto:
- en el frontend utilizando Yup
- en el backend dentro de los controllers

Esto permite proteger la API incluso cuando las requests se realizan fuera del frontend.

---

## Futuras Mejoras

Algunas mejoras planeadas a futuro incluyen:

- refactor de middlewares
- centralización de validaciones JWT
- frontend responsive
- mejora de arquitectura general
- abstracción de lógica repetida
- paginación para búsqueda de usuarios
- limpieza y optimización de controllers

---

## Instalación Local

Clonar el repositorio:

```bash
git clone <repository-url>
```

Instalar dependencias:

```bash
npm install
```

Crear un archivo `.env` con las variables de entorno necesarias.

Iniciar el servidor de desarrollo:

```bash
npm run build
npm run dev
```

---

## Notas

SocialAsync fue desarrollado como proyecto de práctica con foco en:
- diseño de APIs REST
- autenticación y autorización
- lógica de relaciones sociales
- integración frontend/backend
- manejo de estados
- documentación de APIs
- deploy de aplicaciones reales

---
# Repositorio Frontend 

Si deseas ver el repositorio del Frontend se encuentra en:

🔗 https://github.com/FxShin0/socialAsyncFrontend-React
