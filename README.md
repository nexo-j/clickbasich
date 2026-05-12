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

---

## Normalización de vistas HTML `[BL-07]`

Alcance conservador: se alinearon diferencias innecesarias de markup entre las tres vistas sin extraer componentes ni cambiar arquitectura.

### Cambios aplicados

| Archivo | Cambio | Justificación |
|---|---|---|
| `marco/index.html` | Removido `style="display:block;"` del link `.size-guide-text` | Imagen y mosaico no tienen ese estilo inline |
| `marco/index.html` | `id='acrilics'` → `id="acrilics"` | Consistencia con imagen y mosaico |
| `marco/index.html` | `class='menu-picker'` → `class="menu-picker"` en los dos `ol` del formulario | Consistencia de quoting |
| Los tres archivos | `class='out-of-stock-form-frame'` y `class='out-of-stock-form-paspartu'` → comillas dobles | Consistencia; estos selectores son usados por `script.js` |
| `imagen/index.html`, `mosaico/index.html` | `class='menu-picker'` → `class="menu-picker"` en `ol` de marcos y paspartú | Consistencia |

### Diferencias legítimas conservadas

| Elemento | Motivo |
|---|---|
| Título "Diseña tu mosaico:" vs "tu cuadro:" | Copy diferente por producto — pendiente BL-09 |
| Modal sizepicker en imagen/mosaico | Flujo de tamaño diferente al de marco |
| Grid filas×columnas en mosaico | Exclusivo del producto mosaico |
| Sección Opcionales ausente en mosaico | Decisión de producto |
| Labels de precio distintos por vista | Copy diferente — pendiente BL-09 |
| `.description-thingy` con campos distintos | Marco no incluye impresión de imagen |

> **Mejora futura:** la extracción del formulario común a un archivo partial/template compartido queda documentada como tarea posterior a BL-09, una vez que los textos sean administrables y la estructura esté estabilizada.

---

### SimulatorTexts `[BL-03]`

Colección administrable que centraliza los textos visibles del simulador para que sean editables desde Kandinsky/Firebase sin modificar código.

#### Modelo de documento

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `key` | `string` | Igual al ID del documento. Clave única del texto | `"global.frame.description"` |
| `value` | `string` | Texto visible para el usuario | `"Te ofrecemos nuevas opciones..."` |
| `fallback` | `string` | Texto de respaldo si `value` está vacío o el doc no existe | `"Marco estandar:"` |
| `description` | `string` | Nota interna para el administrador | `"Descripción bajo el selector de marcos"` |
| `view` | `string` | Vista donde aplica. `global` = compartido entre marco, imagen y mosaico | `"global"`, `"marco"`, `"imagen"`, `"mosaico"` |
| `section` | `string` | Sección dentro de la vista | `"form.frame"`, `"form.paspartu"`, `"navigation"`, `"sizepicker"`, `"form.acrilic"`, `"form.optionals"`, `"form.cart"`, `"form.price"`, `"controls"` |
| `type` | `string` | Tipo de elemento | `"title"`, `"description"`, `"button"`, `"label"`, `"link"`, `"alert"` |
| `position` | `number` | Orden de aparición dentro de la sección | `1`, `2`, `3` |
| `active` | `boolean` | Si el texto está activo | `true`, `false` |
| `updatedAt` | `timestamp` | Fecha de última modificación (Firestore Timestamp) | |

> `view: "global"` indica textos compartidos entre las vistas `marco`, `imagen` y `mosaico`. El frontend debe buscar primero una clave específica de la vista (ej. `imagen.frame.description`) y si no existe, usar la global (`global.frame.description`). Esto corresponde a la implementación de **BL-09**.

#### Inventario inicial de textos — `view: global`

| ID documental (`key`) | `section` | `type` | `position` | Texto (`value` / `fallback`) |
|---|---|---|---|---|
| `global.frame.title` | `form.frame` | `title` | `1` | "Marco estandar:" |
| `global.frame.description` | `form.frame` | `description` | `2` | "Te ofrecemos nuevas opciones: Marcos en plástico o madera para mayor versatilidad." |
| `global.frame.width.title` | `form.frame` | `title` | `3` | "Ancho de frente:" |
| `global.paspartu.title` | `form.paspartu` | `title` | `1` | "Agrega Paspartú:" |
| `global.paspartu.description` | `form.paspartu` | `description` | `2` | "Borde que se deja entre el marco y tu obra para resaltarla aún más." |
| `global.acrilic.title` | `form.acrilic` | `title` | `1` | "Tipo de Acrílico:" |
| `global.acrilic.description` | `form.acrilic` | `description` | `2` | "En CLICK no usamos vidrio. Usamos acrílico 100% transparente que es más liviano y resistente." |
| `global.optionals.toggle` | `form.optionals` | `label` | `1` | "Opcionales +" |
| `global.optionals.hangStickers` | `form.optionals` | `label` | `2` | "Agrega Cintas 3M para colgar tus cuadros sin abrir huecos a las paredes." |
| `global.optionals.giftWrap` | `form.optionals` | `label` | `3` | "Envuelve tus cuadros en nuestro papel de regalo diseñado por Green Amarilla" |
| `global.cart.button` | `form.cart` | `button` | `1` | "Agregar al carrito" |
| `global.cart.delivery` | `form.cart` | `description` | `2` | "Selecciona el modo de entrega en el próximo paso" |
| `global.price.tax` | `form.price` | `label` | `1` | "IVA Incluido" |
| `global.stock.frame` | `form.stock` | `alert` | `1` | "Stock Agotado. Introduzca su email y le avisaremos cuando este disponible" |
| `global.navigation.backStore` | `navigation` | `link` | `1` | "Regresa a la tienda" |
| `global.navigation.sizeGuide` | `navigation` | `link` | `2` | "Guía de tamaños" |
| `global.navigation.changeSize` | `navigation` | `link` | `3` | "Cambia el tamaño" |
| `global.sizepicker.title` | `sizepicker` | `title` | `1` | "Elige el tamaño de tu imagen (ancho x alto)" |
| `global.sizepicker.recommended` | `sizepicker` | `description` | `2` | "Por la resolución de tu imagen, estos tamaños son ideales para impresión:" |
| `global.sizepicker.notRecommended` | `sizepicker` | `description` | `3` | "Los siguientes tamaños no se recomiendan debido a la resolución de la imagen:" |
| `global.sizepicker.tooSmall` | `sizepicker` | `alert` | `4` | "La resolución de la imagen es baja. Te recomendamos subir una imagen con mayor resolución." |

#### Inventario inicial de textos — específicos por vista

| ID documental (`key`) | `view` | `section` | `type` | `position` | Texto (`value` / `fallback`) |
|---|---|---|---|---|---|
| `marco.header.title` | `marco` | `form` | `title` | `1` | "Diseña tu cuadro:" |
| `imagen.header.title` | `imagen` | `form` | `title` | `1` | "Diseña tu cuadro:" |
| `imagen.controls.filter` | `imagen` | `controls` | `label` | `1` | "Filtro Blanco y Negro" |
| `imagen.controls.changeSize` | `imagen` | `controls` | `link` | `2` | "Cambia el tamaño" |
| `imagen.controls.upload` | `imagen` | `controls` | `link` | `3` | "Sube otra imagen" |
| `mosaico.header.title` | `mosaico` | `form` | `title` | `1` | "Diseña tu mosaico:" |
| `mosaico.price.label` | `mosaico` | `form.price` | `label` | `1` | "Precio de Photo Wall:" |

**Colección Firestore:** `SimulatorTexts` — ID de cada documento = valor del campo `key`.

**Endpoint:** `GET /inventory` → campo `simulatorTexts` (array de todos los documentos activos).

**Nota BL-09 (pendiente):** La implementación de lectura dinámica en el frontend — reemplazar los textos hardcodeados en `marco/index.html`, `imagen/index.html` y `mosaico/index.html` por los valores de esta colección — corresponde a **BL-09**, no a BL-03.

---

### Mejoras defensivas de lectura `[BL-04]`

Cambios aplicados en `db.js` y `server.js` para robustecer la lectura de datos sin alterar el contrato funcional del endpoint:

| Mejora | Archivo | Detalle |
|---|---|---|
| Valores por defecto | `db.js` | `FrameCategories: []` y `SimulatorTexts: []` inicializados como arrays vacíos antes del primer snapshot de Firestore |
| Ordenamiento | `server.js` | `FrameCategories` ordenado por `posicion` · `SimulatorTexts` ordenado por `position` |
| Filtrado de inactivos | `server.js` | Se excluyen documentos de `SimulatorTexts` con `active === false`. Si el campo no existe, el documento se conserva por compatibilidad |

> **BL-05:** Contrato defensivo implementado — ver sección siguiente.

---

## Contrato del endpoint `GET /inventory` `[BL-05]`

Respuesta JSON con los siguientes campos garantizados. Ningún campo devuelve `undefined`; todos tienen un valor por defecto en caso de que Firestore aún no haya respondido.

| Campo | Tipo | Valor por defecto | Fuente Firestore | Descripción |
|---|---|---|---|---|
| `frames` | `array` | `[]` | `Frames` | Marcos disponibles con variantes de ancho y precio |
| `paspartus` | `array` | `[]` | `Paspartus` | Opciones de paspartú con nombre y precio |
| `paspartuWidths` | `string` | `""` | `SimulatorVariables[0].paspartuWidths` | Anchos de paspartú separados por coma. Formato actual: `"0,3,5,7"`. Cualquier conversión a array debe realizarse en el frontend o en una mejora posterior |
| `acrilics` | `array` | `[]` | `Acrilics` | Tipos de acrílico disponibles |
| `backgrounds` | `array` | `[]` | `Backgrounds` | Fondos de pared para el simulador |
| `frameCategories` | `array` | `[]` | `FrameCategories` | Categorías de marcos ordenadas por `posicion` (BL-01) |
| `simulatorTexts` | `array` | `[]` | `SimulatorTexts` | Textos administrables con `active !== false`, ordenados por `position` (BL-03) |

**Compatibilidad:** todos los campos preexistentes (`frames`, `paspartus`, `paspartuWidths`, `acrilics`, `backgrounds`) mantienen el mismo formato de respuesta que tenían antes de BL-01.

---

## Render dinámico de categorías en frontend `[BL-06]`

Cambios aplicados en `public/script.js` y `public/css/main.css`.

### Lógica de agrupación (función `renderFrames`)

| Condición | Comportamiento |
|---|---|
| `frameCategories` vacío o no es array | Lista plana de todos los frames (comportamiento original) |
| Categorías activas presentes | Frames agrupados bajo su `categorySlug` |
| Frame sin `categorySlug` | Aparece en categoría fallback **"Más opciones"** al final |
| Categoría activa sin frames asociados | Se omite silenciosamente |
| Ningún frame visible tras agrupar | Regresa a lista plana como fallback final |

### Criterios de selección inicial

El primer frame seleccionable (no encabezado) recibe `trigger('click')` automáticamente al cargar, igual que antes.

### Estilo de encabezados de categoría

Se agregó `ol.menu-picker li.category-header` en `main.css`: etiqueta no interactiva, mayúsculas, gris, `pointer-events: none`.

### Dependencia con BL-02

BL-06 está completamente implementado con fallback defensivo. Sin embargo, **la agrupación por categorías solo funciona correctamente cuando los frames en Firestore tienen el campo `categorySlug` asignado** (migración manual de BL-02). Mientras esa migración no esté completa, todos los frames sin `categorySlug` aparecerán bajo "Más opciones".

| Frame | Categoría esperada | Requiere BL-02 en Firestore |
|---|---|---|
| Resina Negro | Marco Standard (`standard`) | ✅ Pendiente migración |
| Resina Blanco | Marco Standard (`standard`) | ✅ Pendiente migración |
| Madera Clara | Marco Premium (`premium`) | ✅ Pendiente migración |
