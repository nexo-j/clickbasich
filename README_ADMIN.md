# Plan técnico: Click Admin v2

Documento de arquitectura para reconstruir el panel administrativo sin modificar el simulador ni la estructura de datos en Firestore. El contrato se deriva del código productivo en **clickbasich** (`db.js`, `server.js`, `public/script.js`, `pricecalc.js`, `README.md`).

**Estado:** planificación — sin implementación de código admin todavía.  
**Última actualización:** mayo 2026.

---

## 1. Principios de diseño

| Principio | Implicación |
|---|---|
| El simulador es la fuente de verdad del contrato | El admin valida y escribe exactamente lo que `/inventory` y `pricecalc` esperan |
| Sin cambios en clickbasich (fase admin) | No tocar `public/script.js`, `server.js` ni vistas del simulador para adaptar el admin |
| Datos aditivos | `categorySlug`, `material`, `FrameCategories`, `SimulatorTexts` son extensiones opcionales |
| Colecciones con nombre fijo | `Acrilics`, `Backgrounds`, `Paspartus`, `Frames`, etc. — sin renombrar |
| Proyecto separado | Nuevo repo/carpeta `click-admin-v2`, desplegado en Firebase Hosting del proyecto `click-1554562120566` |

### Flujo de datos (sin tocar el simulador)

```
Click Admin v2 SPA  --write-->  Firestore  --onSnapshot-->  clickbasich (db.js)
                                                      |
                                                      +--> GET /inventory --> Simulador (script.js)
```

- El simulador **no** lee Firestore desde el browser.
- El admin **no** debe depender de modificar el simulador.
- Comparten el mismo proyecto Firebase / Firestore.

### Contexto descubierto en clickbasich

- No hay referencias a `https://click-1554562120566.web.app/` en este repo.
- Conexión Firebase en `db.js`: proyecto `click-1554562120566`, Realtime Database legacy + Firestore.
- El panel admin actual (Hosting) no tiene fuente en este repositorio.

---

## 2. Contrato de datos por colección

**Leyenda:**

- **Origen:** `Productivo` = ya usado hoy · `Extensión` = compatible, añadido en backlog (BL-01, BL-02, BL-03)
- **Simulador:** consumo en frontend (`script.js`) y/o backend (`pricecalc.js`, `server.js`)

---

### 2.1 `Frames` — Productivo (+ extensiones)

| Campo | Tipo | Formato | Obligatorio | Simulador | Admin | Origen | Observaciones |
|---|---|---|---|---|---|---|---|
| `name` | string | Texto único; se usa como `id` del `<input>` | Sí | Sí (UI, precio, carrito) | Sí | Productivo | **No renombrar** sin migración: rompe referencias y pedidos históricos |
| `position` | number | Entero; orden ascendente | Sí | Sí (`sort`) | Sí | Productivo | Controla orden en selector |
| `thumbnail` | string | URL absoluta | Sí | Sí | Sí | Productivo | Miniatura en picker |
| `border_image` | string | URL (CSS `border-image-source`) | Sí | Sí | Sí | Productivo | Sin comillas en HTML generado |
| `example_image` | string | URL | Sí | Sí | Sí | Productivo | Imagen de ejemplo al seleccionar marco |
| `gallery_images` | string | URLs separadas por **coma**, sin espacios extra | Sí | Sí (`split(',')`) | Sí | Productivo | **Mantener string**, no array. Admin: editor multi-URL → string al guardar |
| `variants` | array | Ver subtabla | Sí (≥1) | Sí | Sí | Productivo | Precio y ancho de frente |
| `categorySlug` | string | Igual a `FrameCategories.identificador` / `slug` | No | Sí (agrupación BL-06) | Sí | **Extensión** | Si falta → categoría "Más opciones" |
| `material` | string | ej. `resina`, `madera` | No | No directo* | Sí | **Extensión** | *El simulador envía `material: $('#acabado').text()` (nombre del marco), no este campo. Útil para operaciones/futuro |

#### Subcontrato `variants[]` (objeto)

| Campo | Tipo | Formato | Obligatorio | Simulador | Admin |
|---|---|---|---|---|---|
| `width` | number | cm (ej. 1.8, 5) | Sí | Sí (valor radio, `pricecalc`) | Sí |
| `price` | number | Precio unitario moldura | Sí | Sí (`pricecalc`) | Sí |
| `name` | string | Etiqueta visible (ej. "1.8cm") | Sí | Sí (`id`/`for` del radio) | Sí |
| `code` | string | Código SKU/producción | Sí | Sí (`data-code` → carrito) | Sí |
| `stock` | boolean o string | `"true"` / `true` para disponible | Sí | Sí (alerta stock agotado) | Sí |

**Compatibilidad crítica:**

- `gallery_images`: `"url1,url2,url3"` — validar URLs y `trim()` al guardar.
- `variants[].width` debe coincidir exactamente con lo que el usuario selecciona (comparación numérica en `pricecalc.js`).

---

### 2.2 `Paspartus` — Productivo

| Campo | Tipo | Formato | Obligatorio | Simulador | Admin | Observaciones |
|---|---|---|---|---|---|---|
| `name` | string | ej. "Blanco", "Gris", "Transparente" | Sí | Sí | Sí | `Transparente` oculto en `/marco/` y `/mosaico/` |
| `color` | string | Hex o token (`#fff`, `Transparente`) | Sí | Sí (`value`, lógica precio) | Sí | Debe alinear con `pricecalc` / `paspartuTipo` |
| `image` | string | URL | Sí | Sí | Sí | Thumbnail |
| `price` | number | Precio por área | Sí | Sí (`pricecalc`) | Sí | |
| `position` | number | Orden | Sí | Sí | Sí | |
| `stock` | boolean | Disponibilidad | Sí | Sí | Sí | Controla formulario out-of-stock |

---

### 2.3 `Acrilics` — Productivo (nombre exacto)

| Campo | Tipo | Formato | Obligatorio | Simulador | Admin | Observaciones |
|---|---|---|---|---|---|---|
| `name` | string | ej. "Estándar", "UV" | Sí | Sí (`id` radio) | Sí | **No usar** colección `Acrylics` |
| `price` | number | Multiplicador × área marco | Sí | Sí (`pricecalc`) | Sí | |
| `position` | number | Orden | Sí | Sí | Sí | In-stock primero, luego disabled |
| `stock` | boolean | Disponibilidad | Sí | Sí | Sí | |

---

### 2.4 `Backgrounds` — Productivo (nombre exacto)

| Campo | Tipo | Formato | Obligatorio | Simulador | Admin | Observaciones |
|---|---|---|---|---|---|---|
| `name` | string | Identificador en DOM | Sí | Sí | Sí | |
| `image` | string | URL fondo pared | Sí | Sí | Sí | |
| `position` | number | Orden | Sí | Sí | Sí | |

---

### 2.5 `SimulatorVariables` — Productivo (documento único efectivo)

El backend usa **`db.SimulatorVariables[0]`** únicamente. Si hay varios documentos, solo el primero en el array del snapshot cuenta (orden no garantizado).

| Campo | Tipo | Formato | Obligatorio | Simulador / Backend | Admin | Observaciones |
|---|---|---|---|---|---|---|
| `paspartuWidths` | **string** | `"0,3,5,7"` | Sí | Sí (FE split + BE default) | Sí | **No convertir a array en Firestore** |
| `IVA` | number | ej. 0.19 | Sí | Sí (`pricecalc`) | Sí | |
| `margen_produccion` | number | | Sí | Sí | Sí | |
| `impresion_cm2` | number | | Sí | Sí | Sí | |
| `fondo` | number | | Sí | Sí | Sí | |
| `fondo_grande` | number | | Sí | Sí | Sí | |
| `area_marco_grande` | number | | Sí | Sí | Sí | |
| `C_FIJO_DE_VENTA` | number | | Sí | Sí | Sí | |
| `C_FIJO_DE_VENTA_MARCO_GRANDE` | number | | Sí | Sí | Sí | |
| `photoWallDiscount` | number | | Sí | Sí | Sí | |
| `debug` | boolean | | No | Sí | Sí | |
| Otros campos legacy | mixed | `MARGEN`, `C_FIJO_DE_PRODUCCION`, etc. | No | Posible | Solo lectura / merge | **Estrategia: merge al guardar**, no borrar campos desconocidos |

**Recomendación admin:** una sola pantalla "Variables globales" que edita **un documento fijo** (ID conocido, ej. `default` o el ID productivo actual).

---

### 2.6 `FrameCategories` — Extensión compatible (BL-01)

| Campo | Tipo | Formato | Obligatorio | Simulador | Admin | Observaciones |
|---|---|---|---|---|---|---|
| `nombre` | string | Título UI | Sí* | Sí (`nombre \|\| name`) | Sí | Escribir también `name` si se quiere redundancia |
| `name` | string | Alias inglés | No | Sí (fallback) | Opcional | |
| `identificador` | string | Slug (`standard`, `premium`) | Sí | Sí (`\|\| slug`) | Sí | Debe coincidir con `Frames.categorySlug` |
| `slug` | string | Alias | No | Sí (fallback) | Opcional | |
| `posicion` | number | Orden | Sí | Sí (`server.js` ordena por `posicion`) | Sí | **Campo canónico para orden** |
| `position` | number | Alias | No | No en server hoy | Opcional | Mejora aditiva: escribir ambos igual |
| `activo` | boolean | Visible si ≠ false | Sí | Sí (`activo !== false && active !== false`) | Sí | |
| `active` | boolean | Alias | No | Sí (fallback) | Opcional | |
| `descripcion` | string | Texto bajo título | No | Sí | Sí | |
| `description` | string | Alias | No | Sí (fallback) | Opcional | |

**ID documento sugerido:** igual a `identificador` (`standard`, `premium`) para evitar slugs huérfanos.

---

### 2.7 `SimulatorTexts` — Extensión compatible (BL-03 / BL-09)

| Campo | Tipo | Formato | Obligatorio | Simulador | Admin | Observaciones |
|---|---|---|---|---|---|---|
| `key` | string | Clave única | Sí | Sí | Sí | **ID documento = `key`** |
| `value` | string | Texto publicado | Sí* | Sí (si no vacío) | Sí | Vacío → HTML fallback |
| `fallback` | string | Respaldo documentado | No | No en FE hoy | Sí | Referencia para operadores |
| `description` | string | Nota interna | No | No | Sí | |
| `view` | string | `global`, `marco`, `imagen`, `mosaico` | Sí | Sí (filtro futuro) | Sí | |
| `section` | string | Agrupación UI | Sí | No | Sí | |
| `type` | string | `title`, `description`, etc. | Sí | No | Sí | |
| `position` | number | Orden en `/inventory` | Sí | Sí (orden BE) | Sí | |
| `active` | boolean | `false` excluye | No | Sí | Sí | Ausente = activo |
| `updatedAt` | timestamp | Firestore Timestamp | No | No | Sí (auto) | |

---

### 2.8 Contrato indirecto: `GET /inventory` (solo lectura para validación)

El admin **no debe depender** de modificar el simulador; puede usar `/inventory` del entorno staging/prod solo como **preview de compatibilidad** (opcional, fase 2).

| Campo respuesta | Fuente Firestore |
|---|---|
| `frames` | `Frames` |
| `paspartus` | `Paspartus` |
| `paspartuWidths` | `SimulatorVariables[0].paspartuWidths` (string) |
| `acrilics` | `Acrilics` |
| `backgrounds` | `Backgrounds` |
| `frameCategories` | `FrameCategories` (orden `posicion`) |
| `simulatorTexts` | `SimulatorTexts` (filtro `active !== false`, orden `position`) |

---

## 3. Arquitectura propuesta: Click Admin v2

### 3.1 Stack recomendado

| Capa | Tecnología | Motivo |
|---|---|---|
| UI | **React 18 + TypeScript + Vite** | Mantenible, formularios complejos (`variants`, galería) |
| Datos | **Firebase JS SDK v10** (Firestore + Auth) | Mismo proyecto que producción |
| Validación | **Zod** schemas por colección | Escritura compatible antes de `setDoc` |
| Estilos | CSS modules o Tailwind (decisión fase implementación) | Panel interno |
| Hosting | Firebase Hosting (site separado o rewrite `/app/**`) | Reemplaza admin en `click-1554562120566.web.app` |

### 3.2 Separación de responsabilidades

```
click-admin-v2/
├── src/
│   ├── app/                 # Router, layout, auth guard
│   ├── firebase/            # init, auth, firestore helpers
│   ├── schemas/             # Zod: Frames, Paspartus, ...
│   ├── services/            # CRUD por colección (merge-safe)
│   ├── features/
│   │   ├── frames/
│   │   ├── frame-categories/
│   │   ├── paspartus/
│   │   ├── acrilics/
│   │   ├── backgrounds/
│   │   ├── simulator-variables/
│   │   └── simulator-texts/
│   ├── components/          # DataTable, ImageUrlList, VariantEditor, ...
│   └── utils/               # comma-string gallery, position reorder
├── firestore.rules          # Solo admins autenticados
├── firebase.json            # hosting + rewrites SPA
└── .env.example             # VITE_FIREBASE_* (sin service account en browser)
```

**No incluir** `firebase-admin` en el browser; credenciales de servicio solo en clickbasich (backend simulador).

---

## 4. Estructura de carpetas (detalle funcional)

| Módulo | Pantallas |
|---|---|
| `features/frames` | Lista, crear/editar marco, editor `variants`, preview galería |
| `features/frame-categories` | CRUD categorías, validación slug ↔ frames |
| `features/paspartus` | CRUD + orden |
| `features/acrilics` | CRUD + stock |
| `features/backgrounds` | CRUD + preview imagen |
| `features/simulator-variables` | Formulario único + campo `paspartuWidths` como texto |
| `features/simulator-texts` | Lista filtrable por `view`/`section`, editor clave-valor |
| `features/dashboard` | Resumen: conteos, frames sin `categorySlug`, textos inactivos |

---

## 5. Componentes necesarios

| Componente | Uso |
|---|---|
| `AppShell` / `SidebarNav` | Navegación por colección |
| `ProtectedRoute` | Rutas tras login |
| `CollectionList` | Tabla genérica con sort por `position`/`posicion` |
| `ReorderControls` | Subir/bajar posición (batch update) |
| `ImageUrlField` | URL + preview |
| `GalleryImagesEditor` | Lista URLs → serializa a string comma-separated |
| `VariantListEditor` | Array `variants`: add/remove/reorder rows |
| `SlugSelect` | `categorySlug` desde `FrameCategories` activas |
| `CommaNumberListInput` | `paspartuWidths` con validación numérica |
| `SimulatorTextForm` | key (readonly en edit), value, active, metadata |
| `SaveMergeBanner` | Aviso si hay campos desconocidos preservados (SimulatorVariables) |
| `CompatibilityPreview` | (Fase 2) iframe o link a staging `/inventory` |

---

## 6. Flujo de autenticación

1. **Firebase Authentication** (Email/Password + opcional Google Workspace).
2. **Custom claim** `admin: true` o lista blanca de emails en Firestore Rules:
   - `request.auth != null && request.auth.token.admin == true`
3. Pantalla `/login` → redirect a `/dashboard`.
4. **Sin** service account en frontend.
5. Rotación de accesos vía Firebase Console / Functions (asignar claim).

**Reglas Firestore (borrador conceptual):**

- `Frames`, `Paspartus`, etc.: read/write solo autenticados admin.
- Simulador público **no** lee Firestore directamente (solo clickbasich backend con Admin SDK) → las reglas pueden denegar lectura pública sin afectar el simulador actual.

---

## 7. Estrategia CRUD por colección

| Colección | Listar | Crear | Editar | Eliminar | Orden | Notas |
|---|---|---|---|---|---|---|
| `Frames` | Por `position` | Form completo | Merge doc | Soft-delete opcional* | Drag o +/- position | Validar Zod antes de write |
| `Paspartus` | `position` | Form | Merge | Hard delete con confirmación | Sí | |
| `Acrilics` | `position` | Form | Merge | Hard delete | Sí | Nombre colección validado en código |
| `Backgrounds` | `position` | Form | Merge | Hard delete | Sí | |
| `SimulatorVariables` | 1 doc | No crear múltiples | **Merge** obligatorio | No | N/A | Bloquear "añadir documento" |
| `FrameCategories` | `posicion` | ID = slug | Merge | Solo si sin frames referenciando | Sí | Pre-check `categorySlug` |
| `SimulatorTexts` | `position`, filtro view | ID = `key` | Merge | Delete | Sí | `key` inmutable en edit |

\*Eliminar frames en producción es riesgoso; preferir archivo fuera de colección con backup. El simulador **no** filtra frames inactivos hoy.

**Patrón de escritura:**

```
read doc → merge campos editados + preservar unknown keys → validate(schema) → setDoc/updateDoc
```

---

## 8. Estrategia `variants` en Frames

1. **UI tipo tabla editable:** filas con `width`, `price`, `name`, `code`, `stock`.
2. **Validaciones:**
   - `width` numéricos únicos por marco.
   - `price` > 0.
   - `name` único por marco (evita `id` duplicados en DOM).
3. **Orden:** guardar array ordenado por `width` ascendente (el simulador reordena con `sort` al renderizar).
4. **Preview:** al seleccionar fila, mostrar etiqueta que verá el usuario ("1.8cm").
5. **Import/export opcional (fase 2):** JSON temporal para migraciones masivas — siempre persistir como **array nativo Firestore**, no string JSON.
6. **Stock:** checkbox por variante; refleja `stock` en atributo HTML.

---

## 9. Estrategia `categorySlug` + `FrameCategories`

1. Pantalla **Categorías** define slugs canónicos (`standard`, `premium`).
2. En formulario **Frame**, `categorySlug` = `<select>` poblado desde categorías con `activo !== false`.
3. Validación al guardar:
   - Si `categorySlug` tiene valor → debe existir categoría activa con ese `identificador`/`slug`.
   - Si vacío → permitido (frame irá a "Más opciones" en simulador).
4. Vista **inconsistencias:** frames con `categorySlug` huérfano o categorías activas sin frames.
5. **Duplicar campos bilingües al guardar categoría (aditivo):** escribir `nombre` + `name`, `descripcion` + `description`, `activo` + `active`, `posicion` + `position` con mismos valores → máxima compatibilidad con `renderFrames` y futuro server.

**Mapeo productivo conocido (referencia operativa):**

| Frame (prod) | `categorySlug` | `material` |
|---|---|---|
| Plástico Blanco / Negro | `standard` | `resina` |
| Dorado, Negro, Blanco, Flormorado | `premium` | `madera` |

---

## 10. Estrategia de despliegue (Firebase Hosting)

| Opción | Descripción |
|---|---|
| **A (recomendada)** | Nuevo site en mismo proyecto Firebase: `admin-v2.web.app` o custom domain |
| **B** | Mismo site `click-1554562120566.web.app` con rewrite: `/app/**` → `index.html` del admin |

**Pasos:**

1. Crear proyecto carpeta `click-admin-v2` con `firebase.json`:
   - `public: dist`
   - SPA rewrite `** → /index.html`
2. `firebase use click-1554562120566` (mismo proyecto del simulador).
3. CI: `npm run build` → `firebase deploy --only hosting:admin-v2`.
4. Variables en build: `VITE_FIREBASE_API_KEY`, `authDomain`, `projectId`, etc. (config web pública, no Admin SDK).
5. **Staging:** segundo site o channel preview antes de reemplazar URL del admin viejo.

**Coexistencia:** el simulador sigue en su hosting actual (Heroku/otro); solo comparten **Firestore**, no Hosting.

---

## 11. Fases de implementación sugeridas

| Fase | Entregable | Sin tocar simulador |
|---|---|---|
| **0** | Schemas Zod + reglas Firestore + login | ✓ |
| **1** | CRUD: Paspartus, Acrilics, Backgrounds, SimulatorVariables | ✓ |
| **2** | CRUD: Frames + variants + gallery_images | ✓ |
| **3** | FrameCategories + asignación categorySlug | ✓ |
| **4** | SimulatorTexts + filtros | ✓ |
| **5** | Deploy Hosting + capacitación + checklist QA contra `/inventory` | ✓ |

### Checklist QA de compatibilidad

- [ ] `paspartuWidths` sigue siendo string en Firestore.
- [ ] `gallery_images` con 3+ URLs se ve en carrusel imagen.
- [ ] Precio cambia al cambiar variante de ancho.
- [ ] Categorías agrupan si `frameCategories` + `categorySlug` poblados.
- [ ] `SimulatorTexts` vacío no rompe vistas (fallback HTML).

---

## 12. Riesgos técnicos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Múltiples docs en `SimulatorVariables` | Solo `[0]` usado; datos ignorados | Admin edita un solo doc ID fijo; documentar en UI |
| Renombrar `Frames.name` | Rompe DOM, precio, pedidos | Campo inmutable en UI; flujo "duplicar + deprecar" |
| `gallery_images` con espacios/comas mal formadas | Carrusel roto | Normalizar `trim` + validar URL; preview en admin |
| `split(',')` sin trim en simulador | URLs con espacio fallan | Admin guarda sin espacios; no cambiar simulador ahora |
| Orden `FrameCategories` solo por `posicion` | `position` ignorado en server | Admin escribe `posicion` como canónico |
| Campos legacy en `SimulatorVariables` | Borrado accidental | Merge on save; UI "campos adicionales" read-only |
| Reglas Firestore mal configuradas | Admin no escribe o exposición pública | Rules restrictivas + solo Auth admin |
| Admin y simulador en proyectos Firebase distintos | Editar datos que no lee prod | Validar `projectId` en `.env` con checklist deploy |
| Eliminar categoría con frames asignados | Frames huérfanos → "Más opciones" | Bloqueo o warning en admin |
| `material` en Frames no usado por FE | Expectativa incorrecta del operador | Ayuda contextual en admin |
| Pérdida de admin viejo sin export | Datos incompletos en reconstrucción | Export Firestore actual antes de migrar operaciones |

---

## 13. Decisiones abiertas (para revisión)

1. **¿Repo nuevo** (`click-admin-v2`) o carpeta monorepo junto a clickbasich? → Recomendación: **repo separado**.
2. **¿URL final?** `click-1554562120566.web.app/app` vs subdominio `admin.clickmarqueteria.com`.
3. **¿Soft-delete frames?** Requiere cambio en simulador → **no** en v2 inicial.
4. **¿Asignar custom claims** manual (Console) o Cloud Function al primer login autorizado?

---

## 14. Resumen ejecutivo

- **No hay referencias** a `click-1554562120566.web.app` en clickbasich; el admin v2 es un **SPA nuevo** que escribe directo a Firestore con las mismas colecciones.
- El contrato de datos está **anclado al simulador actual**; extensiones BL-01/02/03 son aditivas.
- La pieza más delicada es **`Frames`** (`variants` + `gallery_images` string + `name` como ID).
- **`SimulatorVariables`** debe tratarse como **documento único** con merge seguro.
- El simulador **no se modifica** en la fase admin; la validación final es comportamiento idéntico tras editar desde admin.

---

## 15. Referencias en clickbasich

| Archivo | Rol |
|---|---|
| `db.js` | Suscripción Firestore a las 7 colecciones |
| `server.js` | `GET /inventory` — contrato de lectura |
| `public/script.js` | Consumo FE: frames, paspartú, acrílico, textos, galería |
| `pricecalc.js` | Precios desde `Frames`, `Paspartus`, `Acrilics`, `SimulatorVariables` |
| `README.md` | BL-01 a BL-09, modelos FrameCategories y SimulatorTexts |

**Próximo paso al retomar admin:** Fase 0 — bootstrap del proyecto, schemas Zod y reglas Firestore.

**Mientras tanto:** continuar ajustes de UI/UX en el simulador (`staging-v01`).
