/**
 * constants.js — App-wide constants: gestión types, debtor states, labels.
 */

export const TIPOS_GESTION = {
  llamada_si: { label: 'Llamada respondida', dot: '#378ADD', category: 'contacto' },
  llamada_no: { label: 'No contestó',         dot: '#888780', category: 'contacto' },
  whatsapp:   { label: 'WhatsApp',             dot: '#1D9E75', category: 'contacto' },
  email:      { label: 'Email enviado',        dot: '#7F77DD', category: 'contacto' },
  promesa:    { label: 'Promesa de pago',      dot: '#EF9F27', category: 'pago' },
  pago:       { label: 'Pago recibido',        dot: '#639922', category: 'pago' },
  abono:      { label: 'Abono recibido',       dot: '#97C459', category: 'pago' },
  acuerdo:    { label: 'Acuerdo firmado',      dot: '#7F77DD', category: 'pago' },
  caido:      { label: 'Acuerdo caído',        dot: '#E24B4A', category: 'negativo' },
  negativa:   { label: 'Negativa de pago',     dot: '#D85A30', category: 'negativo' },
  otro:       { label: 'Otra gestión',         dot: '#888780', category: 'otro' },
};

export const ESTADOS_DEUDOR = [
  { value: 'activo',         label: 'Activo' },
  { value: 'acuerdo_activo', label: 'Acuerdo activo' },
  { value: 'pagado_parcial', label: 'Pagado parcial' },
  { value: 'pagado_total',   label: 'Pagado total' },
  { value: 'sin_contacto',   label: 'Sin contacto' },
  { value: 'caido',          label: 'Caído' },
  { value: 'en_juridico',    label: 'En jurídico' },
];

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
