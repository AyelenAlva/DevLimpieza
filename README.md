# Proyecto Limpieza (React + PHP + MySQL)

Este repositorio contiene el sistema de gestión "Limpieza", dividido en dos partes principales:
1. **Frontend (React)**: Interfaz de usuario SPA.
2. **Backend (PHP/API)**: Lógica de servidor y conexión a base de datos MySQL (hosteado en IONOS).

## Arquitectura del Backend (Modularizado)
A fin de mantener el código ordenado y escalable, el backend sigue el patrón de diseño **MVC (solo Controladores y Rutas)**.
El archivo principal es `api/index.php`, que actúa únicamente como un **Router (Enrutador)**.

Dependiendo del parámetro `?action=` o `?tabla=`, `index.php` delega la petición a un controlador específico ubicado en la carpeta `api/controllers/`:
- **`ClienteController.php`**: Contiene la lógica de Alta, Modificación y Baja de Clientes (transacciones entre `PERSONA` y `CLIENTE`).
- **`EmpleadoController.php`**: Lógica de gestión de Empleados.
- **`DistribuidoraController.php`**: Lógica de gestión de Distribuidoras.
- **`ParametricasController.php`**: Lógica de lectura de tablas paramétricas (Estados, Ciudades, etc.).

### Nota sobre Vistas y Procedimientos
Actualmente el CRUD se gestiona mediante transacciones en PHP ya que las vistas actuales (`VW_CLIENTE`) omiten las llaves primarias necesarias para la edición, y faltan los Stored Procedures para `UPDATE` y `DELETE`. Cuando se agreguen los SPs de modificación y baja en MySQL, la lógica de estos controladores se conectará directamente a ellos.

## Frontend (React)
- Carpeta: `/frontend`
- Ejecutar entorno de desarrollo local: `npm run dev`
- Compilar para producción (IONOS): `npm run build`. 
  - *Nota: En `vite.config.js` está configurado `base: './'` para que pueda servirse desde un subdirectorio en IONOS (ej. `/app/`).*

## Despliegue (Deploy) a IONOS
Existe un script `backend/upload.cjs` que utiliza SFTP para automatizar la subida de los archivos PHP de la API al servidor remoto. Para subir el Frontend, existe el script `backend/upload_frontend.cjs`.