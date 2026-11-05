# Mis Vencimientos

App móvil para llevar el control de vencimientos y suscripciones: cargás un
servicio, le definís el monto y la fecha, y la app te dice cuánto falta, te
avisa cuando se venció y guarda cada pago que hiciste.

Hecha con **Expo SDK 57**, **Expo Router**, **Zustand** y **TypeScript**. Corre
en Android, iOS y web.

## Funcionalidades

### 1. Persistir datos entre sesiones

Las cargas, los pagos y el tema quedan guardados en una base **SQLite**
(`expo-sqlite`). Al cerrar y reabrir la app, todo sigue ahí.

- Las lecturas son sincrónicas, así que la lista ya está disponible en el primer
  render (no hay parpadeo de pantalla vacía).
- Las migraciones se controlan con `PRAGMA user_version`.
- La preferencia de tema se guarda aparte con `expo-sqlite/kv-store`.
- En **web no hay persistencia**: `expo-sqlite` está en alpha y necesita wasm y
  cabeceras COOP/COEP, así que ahí la app funciona con los datos en memoria.
  Los módulos nativos están separados en `sqlite.ts` / `sqlite.web.ts` para no
  arrastrar ese worker al bundle web.

### 2. Estado global con Zustand

La lista, los pagos y las acciones viven en `src/store/bills.ts`. El store
reemplazó al antiguo `BillsProvider` de React Context.

- SQLite sigue siendo la fuente de verdad: cada acción escribe en la base y
  después actualiza el estado.
- El store expone `load`, `addBill`, `updateBill`, `payBill`, `deleteBill`,
  `getPayments` y `getAllPayments` (historial global para Resumen).
- `ThemeProvider` se mantiene para el tema claro/oscuro.

### 3. Traer los datos de ejemplo con fetch

La primera vez que se abre la app, si no hay cargas locales, se piden los datos
de ejemplo con `fetch` a `public/data/seed-bills.json`.

- En web se usa una ruta relativa; en nativo se usa el host del dev server que
  reporta `expo-constants`.
- El JSON manda `offsetDias` en vez de fechas absolutas, así la demo siempre
  muestra vencimientos relativos a hoy.
- Si el fetch falla (sin red, build de producción, etc.), se usan los seeds
  locales como fallback. La app nunca queda vacía por un error de red.
- Mientras carga se muestra un `ActivityIndicator`; si falla, un aviso con
  «Reintentar».

### 4. Editar un servicio

Se puede cambiar el nombre, la categoría, el monto y la fecha de una carga ya
cargada. El mismo formulario sirve para crear y para editar
(`src/components/BillForm.tsx`).

La fecha se elige con el **picker nativo**
(`@react-native-community/datetimepicker`) en vez de escribirla a mano. En web
cae a un campo de texto porque el picker no tiene soporte web.

### 5. Registrar un pago

Desde el detalle de una carga se puede registrar que ya se pagó.

- Si es un **servicio puntual** (luz, alquiler), la carga queda marcada como
  _Pagada_.
- Si es una **suscripción** (Netflix, Spotify), la próxima fecha de pago avanza
  automáticamente un mes.

### 6. Ver el historial de pagos

Cada carga guarda su propio historial: fecha y monto de cada pago, más el total
pagado. Al registrar un pago queda asentado en el historial.

En **Resumen** además hay un **historial global**: el total pagado entre todas
las cargas y los últimos 5 pagos con el nombre del servicio. Tocá un pago para
abrir el detalle de esa carga.

### 7. Navegar con tabs

La app tiene tres pestañas inferiores:

- **Inicio** — listado, buscador, filtros, orden, paginación y alta de servicios.
- **Resumen** — totales, reparto por categoría, historial global de pagos y
  pendientes ordenados por fecha. La tab muestra un **badge** con la cantidad
  de cargas pendientes.
- **Ajustes** — tema claro/oscuro, datos de la app y versión.

El detalle de una carga (`/bill/[id]`) sigue siendo una pantalla modal del Stack
raíz, con su botón «Volver».

### 8. Filtrar, buscar, ordenar y paginar

- **Buscador** por nombre, sin distinguir mayúsculas ni acentos
  («telefono» encuentra «Teléfono»).
- Filtro por categoría: Todas, Servicios, Vivienda y Entretenimiento.
- Filtro por estado: Todas, Pendientes y Pagadas.
- Filtro por mes: sólo los vencimientos del mes en curso.
- **Orden** por fecha, monto o nombre. Tocar el campo activo invierte la
  dirección (ascendente/descendente).
- Todos los filtros se combinan entre sí y con la paginación en memoria de 4
  cargas por página, con «Anterior / Siguiente» y «Página X de Y». Al cambiar
  cualquier filtro se vuelve a la primera página.
- Si nada coincide, hay un acceso directo para **limpiar los filtros**.

La lógica de búsqueda y orden vive en `src/lib/bill-filters.ts` como función
pura, separada de la pantalla y cubierta por tests.

### 9. Ver totales y resumen

Arriba de la lista se muestra:

- **Total pendiente** — suma de todo lo que todavía no se pagó.
- **Vence este mes** — sólo lo que vence dentro del mes en curso.
- **Aviso de vencidas** — cuántas cargas ya pasaron su fecha sin pagarse.
- **Reparto por categoría** — barras con el total de cada categoría
  (Servicios / Vivienda / Entretenimiento).

### 10. Imágenes con expo-image

El encabezado y los iconos de las tabs usan el componente `Image` de
`expo-image` con assets locales. No dependen de internet.

## Funcionalidades previas

- **Cargar un servicio** desde un catálogo de 17 servicios (luz, agua, gas,
  internet, celular, alquiler, expensas, Netflix, Spotify, Disney+, Max,
  YouTube Premium, Prime Video, Paramount+) o con un nombre propio.
- **Eliminar una carga**, con confirmación.
- **Tema claro/oscuro**, que sigue el esquema del sistema la primera vez y
  recuerda tu elección.

## Cómo correrla

```bash
npm install
npm run start
```

Escaneá el QR con **Expo Go**. Las dependencias nativas (`expo-sqlite` y
`@react-native-community/datetimepicker`) funcionan en Expo Go, así que no hace
falta compilar un dev build.

Plataformas puntuales:

```bash
npm run android
npm run ios
npm run web
```

## Scripts

| Comando              | Qué hace                      |
| -------------------- | ----------------------------- |
| `npm run start`      | Levanta el dev server de Expo |
| `npm run typecheck`  | `tsc --noEmit`                |
| `npm run lint`       | ESLint                        |
| `npm test`           | Corre los tests una vez       |
| `npm run test:watch` | Tests en modo watch           |

## Estructura

```
public/
└── data/
    └── seed-bills.json   # Datos de ejemplo que se piden con fetch

src/
├── app/                  # Rutas (expo-router)
│   ├── _layout.tsx       # ThemeProvider + Stack raíz + arranque del store
│   ├── (tabs)/
│   │   ├── _layout.tsx   # Tabs: Inicio / Resumen / Ajustes + badge
│   │   ├── index.tsx     # Lista con buscador, filtros, orden y paginación
│   │   ├── resumen.tsx   # Totales, historial global y pendientes
│   │   └── ajustes.tsx   # Tema y datos de la app
│   └── bill/[id].tsx     # Detalle: editar, pagar, historial
├── api/bills.ts          # fetch de los datos de ejemplo
├── components/           # AppHeader, BillCard, BillForm, DateField,
│                         # SummaryHeader, PaymentHistoryList
├── constants/theme.ts    # Tokens: paleta, spacing, tipografía
├── context/theme.tsx     # ThemeProvider (claro/oscuro)
├── data/                 # Catálogo de servicios y seeds
├── db/                   # Esquema, conexión, repositorio, ajustes
├── lib/                  # dates, money, bills, pagination, bill-filters
└── store/bills.ts        # Zustand: estado y acciones
```

## Integrantes

Luciano Agustin Cunningham Martinez

---

La lógica de negocio vive en `src/lib/` y `src/db/` como funciones puras,
separada de las pantallas: por eso se puede testear sin montar componentes.

## Notas

- Las fechas se guardan en ISO `YYYY-MM-DD` y se muestran como `DD/MM/AAAA`.
- Los montos se guardan como números, no como texto, para poder sumarlos.
- La primera vez que se abre la app se cargan datos de ejemplo con fechas
  relativas a hoy. Un flag en la base evita que vuelvan a aparecer si los borrás.
- El fetch de los seeds corre sólo si no hay datos locales; en producción usa el
  fallback local.
- El tema oscuro es una preferencia visual, no una funcionalidad.
