###
Run with `npm start`
Lint with `npm run lint`

---

## Modelos de datos — Firestore

### FrameCategories `[BL-01]`

Colección administrable que define las categorías de marcos disponibles en el simulador.

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `nombre` | `string` | Nombre visible para el usuario | `"Plástico"`, `"Madera"` |
| `identificador` | `string` | Slug único para uso interno | `"plastico"`, `"madera"` |
| `posicion` | `number` | Orden de aparición en el simulador | `1`, `2` |
| `activo` | `boolean` | Indica si la categoría es visible | `true`, `false` |
| `descripcion` | `string` | Texto descriptivo opcional | `"Marcos de plástico estándar"` |

**Endpoint:** `GET /inventory` → campo `frameCategories` (array de documentos ordenado por `posicion`).

---

### Frames `[BL-02]`

Colección existente de marcos, extendida con campos de categoría y material.

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `name` | `string` | Nombre del marco | `"Resina Negro"` |
| `categorySlug` | `string` | Referencia al `identificador` de `FrameCategories` | `"standard"`, `"premium"` |
| `material` | `string` | Material físico del marco | `"resina"`, `"madera"` |
| `variants` | `array` | Variantes de ancho y precio | `[{ width: 3, price: 45000 }]` |

**Mapeo inicial de marcos:**

| Marco | `categorySlug` | `material` |
|---|---|---|
| Resina Negro | `standard` | `resina` |
| Resina Blanco | `standard` | `resina` |
| Madera Clara | `premium` | `madera` |

**Migración:** los campos `categorySlug` y `material` se agregan manualmente en Firebase Console. No requiere cambios en backend ni frontend (BL-06 manejará el render dinámico por categoría).

**Endpoint:** `GET /inventory` → campo `frames` (incluye los nuevos campos automáticamente vía `onSnapshot`).
