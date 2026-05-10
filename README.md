# Agenda Cobranza — Hadad & Asociados

Aplicación de escritorio para gestión y seguimiento de deudores en cobranza.

---

## Requisitos previos

- **Node.js** v18 o superior → https://nodejs.org (descargar versión LTS)

---

## Instalación (primera vez)

```bash
# 1. Abrir terminal en esta carpeta
cd cobranza-app

# 2. Instalar dependencias
npm install
```

---

## Uso diario

```bash
npm start
```

La app se abre como ventana de escritorio. Los datos se guardan automáticamente en:
- **Windows:** `C:\Users\TuUsuario\AppData\Roaming\agenda-cobranza\cobranza-data.json`
- **Mac:**     `~/Library/Application Support/agenda-cobranza/cobranza-data.json`

---

## Funcionalidades

### Calendario
- Navegá mes a mes con las flechas
- Cada día muestra los IDs de deudores agendados con un color según su último estado
- Hacé clic en cualquier día para ver y gestionar los deudores de ese día
- Buscá directamente por ID en la barra superior (Ctrl+F)

### Vista del día
- Lista de deudores agendados para ese día
- Click en un deudor → abre su ficha completa
- `×` → quita el deudor de ese día (sin borrar su historial)
- `+ Agregar ID` → agendá un nuevo deudor a ese día

### Ficha del deudor
- Nombre, RUT, deuda total, saldo pendiente, estado
- Historial completo de gestiones (más reciente primero)
- Próximas fechas en que está agendado
- Alerta si tiene promesas vencidas sin pago registrado

### Nueva gestión
Tipos disponibles:
| Tipo              | Descripción                              |
|-------------------|------------------------------------------|
| Llamada respondida| El deudor atendió la llamada             |
| No contestó       | Sin respuesta                            |
| WhatsApp          | Contacto por WhatsApp                    |
| Email enviado     | Se envió correo                          |
| Promesa de pago   | El deudor prometió pagar → se agenda automáticamente en esa fecha |
| Pago recibido     | Pago total → descuenta del saldo         |
| Abono recibido    | Pago parcial → descuenta del saldo       |
| Acuerdo firmado   | Se formalizó un acuerdo                  |
| Acuerdo caído     | El deudor no cumplió el acuerdo          |
| Negativa de pago  | El deudor se negó a pagar                |
| Otra gestión      | Cualquier otra acción                    |

### Exportar datos
- **Menú → Archivo → Exportar a CSV** → para abrir en Excel
- **Menú → Archivo → Exportar backup (JSON)** → copia de seguridad completa
- **Menú → Archivo → Importar backup (JSON)** → restaurar desde backup

---

## Estructura del proyecto

```
cobranza-app/
├── main.js          # Proceso principal de Electron (ventana, menú, archivos)
├── preload.js       # Puente seguro entre Electron y la UI
├── package.json
├── README.md
└── src/
    ├── index.html   # Shell HTML de la app
    ├── app.js       # Punto de entrada del renderer
    ├── store.js     # Estado global de la aplicación
    ├── router.js    # Gestión de vistas y navegación
    ├── styles/
    │   ├── variables.css   # Tokens de diseño (colores, tipografía, espaciado)
    │   ├── base.css        # Reset y estilos base
    │   ├── layout.css      # Shell, toolbar, panel principal
    │   ├── calendar.css    # Grilla del calendario
    │   └── components.css  # Botones, badges, formularios, timeline
    ├── utils/
    │   ├── constants.js    # Tipos de gestión, estados, listas
    │   ├── date.js         # Utilidades de fechas
    │   ├── format.js       # Formato de dinero, IDs, escape HTML, CSV
    │   └── storage.js      # Abstracción de persistencia (Electron / browser)
    ├── views/
    │   ├── CalendarView.js # Vista del calendario mensual
    │   ├── DayView.js      # Vista de un día específico
    │   └── DebtorView.js   # Ficha del deudor con historial
    └── components/
        ├── Toolbar.js      # Breadcrumb y búsqueda global
        ├── Badge.js        # Badges de estado
        ├── Timeline.js     # Timeline de gestiones
        └── Forms.js        # Formularios reutilizables
```

---

## Para generar el instalador (.exe / .app)

```bash
# Primero instalar electron-packager si no está instalado
npm install

# Windows
npm run build:win

# Mac
npm run build:mac
```

El ejecutable queda en la carpeta `dist/`.

---

## Atajos de teclado

| Atajo      | Acción                        |
|------------|-------------------------------|
| Ctrl+F     | Enfocar búsqueda por ID       |
| Enter      | Confirmar búsqueda            |
| Ctrl+R     | Recargar la app               |
| Alt+F4     | Cerrar                        |
