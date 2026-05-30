# クロネコギャラリーシステム 2.0

Aplicacion web Angular para `クロネコプロジェクト`, orientada a centralizar enlaces publicos, acceso VIP y gestion manual de solicitudes para una galeria exclusiva.

El sitio funciona como una entrada tipo LinkTree: el contenido gratuito vive en Pixiv y X, mientras que la galeria VIP queda reservada para usuarios que apoyan el proyecto mediante FANBOX o PayPal. El acceso VIP se realiza con `userCode` y `accessKey`, emitidos luego de una revision manual desde el panel de administracion.

## Flujo principal

```text
Usuario
  -> LinkTree
  -> Pixiv / X / FANBOX / PayPal / VIP Access Center
  -> Solicitud o login VIP
  -> Galeria exclusiva
  -> VIP Request Board
```

## Rutas

| Ruta | Descripcion |
| --- | --- |
| `/` | LinkTree principal |
| `/access` | Centro de acceso VIP |
| `/access/login` | Login con ID y clave VIP |
| `/access/request` | Formulario de solicitud VIP |
| `/access/status` | Consulta de estado de solicitud |
| `/gallery` | Galeria exclusiva protegida |
| `/vip-board` | Tablero VIP de sugerencias |
| `/admin` | Panel administrador oculto por ruta directa |
| `/**` | Pantalla 404 futurista |

## Funcionalidades principales

- LinkTree publico con enlaces oficiales del proyecto.
- Contador de visitas con control por sesion.
- Sistema de traducciones para japones, espanol, ingles, chino simplificado y chino tradicional.
- Centro VIP con solicitud, consulta de estado y login.
- Persistencia de sesion VIP en `sessionStorage`.
- Galeria exclusiva cargada solo con `userCode` y `accessKey` validos.
- Slideshow fullscreen con navegacion, zoom y pan.
- Tablero VIP para sugerir proximas ilustraciones.
- Panel admin para revisar solicitudes, aprobar, rechazar, pedir mas informacion, listar claves y extender/desactivar accesos.
- Pagina 404 personalizada.
- Estilos responsive con estetica oscura japonesa/cyberpunk.

## Tecnologias

- Angular 20
- TypeScript strict
- Angular standalone components
- Angular Router
- Angular Signals
- Zoneless change detection
- SCSS
- Google Apps Script
- Google Sheets
- GitHub Pages

## API y backend

El backend actual esta implementado con Google Apps Script conectado a Google Sheets.

Endpoint base:

```text
https://script.google.com/macros/s/AKfycbwgltvyDH_CcikA1_V54LNm1gEmaho_mtrDAaqnukfC3Ou6M3O05nbYzSHtvPG-G_P8/exec
```

Acciones publicas usadas por la app:

- `health`
- `counter=get`
- `counter=increment`
- `request_access`
- `check_request_status`
- `validate_access_key`
- `get_exclusive_gallery`
- `save_vip_illustration_request`
- `get_vip_illustration_requests`

Acciones administrativas usadas por `/admin`:

- `admin_get_access_requests`
- `admin_get_access_keys`
- `approve_access_request`
- `reject_access_request`
- `need_more_info_request`
- `disable_access_key`
- `extend_access_key`

Las credenciales administrativas no deben guardarse en el frontend, en archivos del proyecto, en Git ni en logs. El panel `/admin` las solicita en tiempo de uso y las mantiene solo durante la sesion actual.

## Seguridad y acceso

- La galeria no es publica.
- El acceso a `/gallery` y `/vip-board` requiere una sesion VIP valida.
- Las credenciales admin solo sirven para revisar/aprobar solicitudes y administrar claves.
- Las credenciales admin no otorgan acceso directo a la galeria.
- GitHub Pages sirve un frontend publico, por lo que ningun secreto debe quedar dentro del bundle.
- No se deben commitear `adminPassword`, claves reales de acceso, tokens ni datos privados.

## Desarrollo local

Instalar dependencias:

```bash
npm install
```

Iniciar servidor local:

```bash
npm start
```

Build de desarrollo:

```bash
ng build --configuration development
```

Typecheck de la app:

```bash
tsc --noEmit -p tsconfig.app.json
```

Typecheck de tests:

```bash
tsc --noEmit -p tsconfig.spec.json
```

Tests unitarios:

```bash
ng test --watch=false --browsers=ChromeHeadless
```

Si Chrome no esta disponible en el entorno local, configurar `CHROME_BIN` apuntando a un navegador compatible, por ejemplo Microsoft Edge en Windows.

## Deploy

Destino de publicacion:

```text
https://kuronekosystem.github.io/kuroneko2.0/
```

El proyecto debe compilarse con base href:

```text
/kuroneko2.0/
```

## Estado actual

El proyecto se encuentra en estado de prototipo avanzado y funcional:

- Flujo VIP implementado.
- Panel administrador implementado.
- API de Google Apps Script probada durante desarrollo.
- Tests unitarios basicos funcionando.
- Checklist manual E2E agregado en `docs/E2E_MANUAL_CHECKLIST.md`.
- No hay suite automatizada E2E con Playwright/Cypress por ahora.

## Pruebas E2E

Actualmente se usa Karma/Jasmine para pruebas unitarias. Para flujos completos se mantiene una guia manual en:

```text
docs/E2E_MANUAL_CHECKLIST.md
```

Una futura version estable puede incorporar Playwright o Cypress para automatizar:

- solicitud VIP,
- aprobacion admin,
- login VIP,
- carga de galeria exclusiva,
- tablero VIP,
- rutas protegidas,
- pagina 404.

## Enlaces oficiales

- Pixiv: https://www.pixiv.net/users/120751313
- FANBOX: https://neko-suiro-k.fanbox.cc/
- X: https://x.com/shinai_kuroneko
- Deploy: https://kuronekosystem.github.io/kuroneko2.0/

## Nota final

`クロネコギャラリーシステム 2.0` representa un nuevo comienzo para el proyecto: una entrada publica simple, una galeria exclusiva para quienes apoyan el trabajo creativo y una base tecnica preparada para seguir evolucionando con mas estabilidad.
