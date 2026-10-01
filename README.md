# Mis Vencimientos

App móvil para llevar el control de vencimientos y suscripciones: cargás un
servicio, le definís el monto y la fecha, y la app te dice cuánto falta, te
avisa cuando se venció y guarda cada pago que hiciste.

Hecha con **Expo SDK 57**, **Expo Router** y **TypeScript**. Corre en Android,
iOS y web.

## Funcionalidades

Estas son las funcionalidades implementadas. Cada una es una capacidad concreta
que el usuario puede realizar o consultar, no una pantalla.

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

### 2. Editar un servicio

Se puede cambiar el nombre, la categoría, el monto y la fecha de una carga ya
cargada. El mismo formulario sirve para crear y para editar
(`src/components/BillForm.tsx`).

La fecha se elige con el **picker nativo**
(`@react-native-community/datetimepicker`) en vez de escribirla a mano. En web
cae a un campo de texto porque el picker no tiene soporte web.

### 3. Registrar un pago

Desde el detalle de una carga se puede registrar que ya se pagó.

- Si es un **servicio puntual** (luz, alquiler), la carga queda marcada como
  *Pagada*.
- Si es una **suscripción** (Netflix, Spotify), la próxima fecha de pago avanza
  automáticamente un mes.

### 4. Ver el historial de pagos

Cada carga guarda su propio historial: fecha y monto de cada pago, más el total
pagado. Al registrar un pago queda asentado en el historial.

### 5. Ver totales y resumen

Arriba de la lista se muestra:

- **Total pendiente** — suma de todo lo que todavía no se pagó.
- **Vence este mes** — sólo lo que vence dentro del mes en curso.
- **Aviso de vencidas** — cuántas cargas ya pasaron su fecha sin pagarse.
- **Reparto por categoría** — barras con el total de cada categoría
  (Servicios / Vivienda / Entretenimiento).

## Funcionalidades previas

- **Cargar un servicio** desde un catálogo de 17 servicios (luz, agua, gas,
  internet, celular, alquiler, expensas, Netflix, Spotify, Disney+, Max,
  YouTube Premium, Prime Video, Paramount+) o con un nombre propio.
- **Filtrar por categoría** y por mes.
- **Eliminar una carga**, con confirmación.
- **Tema claro/oscuro**, que sigue el esquema del sistema la primera vez y
  recuerda tu elección.

## Cómo correrla

```bash
npm install
npm run start
```

Escaneá el QR con **Expo Go**. Las dos dependencias nativas nuevas
(`expo-sqlite` y `@react-native-community/datetimepicker`) funcionan en Expo Go,
así que no hace falta compilar un dev build.

Plataformas puntuales:

```bash
npm run android
npm run ios
npm run web
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run start` | Levanta el dev server de Expo |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Corre los tests una vez |
| `npm run test:watch` | Tests en modo watch |

## Tests

47 tests unitarios con `jest-expo` y `@testing-library/react-native`:

| Archivo | Qué cubre |
| --- | --- |
| `__tests__/lib/dates-test.ts` | Cálculo de días restantes, etiquetas de vencimiento, cambio de mes/año, años bisiestos |
| `__tests__/lib/money-test.ts` | Formato de pesos y parseo del monto que escribe el usuario |
| `__tests__/features/bills-reducer-test.ts` | Reducer de la lista y avance de fecha al pagar |
| `__tests__/components/BillCard-test.tsx` | Render de la tarjeta y su estado *Pagado* |

## Estructura

```
src/
├── app/                  # Rutas (expo-router)
│   ├── _layout.tsx       # Providers + Stack
│   ├── index.tsx         # Lista con filtros y resumen
│   └── bill/[id].tsx     # Detalle: editar, pagar, historial
├── components/           # BillCard, BillForm, DateField, SummaryHeader, PaymentHistoryList
├── constants/theme.ts    # Tokens: paleta, spacing, tipografía
├── context/              # BillsProvider y ThemeProvider
├── data/                 # Catálogo de servicios y datos de ejemplo
├── db/                   # Esquema, conexión, repositorio, ajustes
└── lib/                  # dates, money, reducer (lógica pura y testeable)
```

La lógica de negocio vive en `src/lib/` y `src/db/` como funciones puras,
separada de las pantallas: por eso se puede testear sin montar componentes.

## Notas

- Las fechas se guardan en ISO `YYYY-MM-DD` y se muestran como `DD/MM/AAAA`.
- Los montos se guardan como números, no como texto, para poder sumarlos.
- La primera vez que se abre la app se cargan datos de ejemplo con fechas
  relativas a hoy. Un flag en la base evita que vuelvan a aparecer si los borrás.
- El tema oscuro es una preferencia visual, no una funcionalidad.