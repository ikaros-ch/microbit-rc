// UI strings. Add a language by adding a column here and an <option> in index.html.
const STR = {
  connect: ['Connect', 'Σύνδεση'],
  disconnect: ['Disconnect', 'Αποσύνδεση'],
  notConnected: ['Not connected', 'Αποσυνδεδεμένο'],
  edit: ['Edit', 'Επεξεργασία'],
  done: ['Done', 'Τέλος'],
  add: ['+ Add…', '+ Προσθήκη…'],
  button: ['Button', 'Κουμπί'],
  toggle: ['Toggle switch', 'Διακόπτης'],
  slider: ['Slider (linear pot)', 'Ρυθμιστής (ποτενσιόμετρο)'],
  axis: ['Single-axis stick', 'Μοχλός ενός άξονα'],
  joystick: ['Joystick', 'Joystick'],
  display: ['Display', 'Οθόνη'],
  export: ['Export', 'Εξαγωγή'],
  import: ['Import', 'Εισαγωγή'],
  reset: ['Reset', 'Επαναφορά'],
  rotate: ['Rotate 90°', 'Περιστροφή 90°'],
  fullscreen: ['Fullscreen', 'Πλήρης οθόνη'],
  channel: ['Channel (name used in gamepad.show)', 'Κανάλι (όνομα στο gamepad.show)'],
  showAs: ['Show as', 'Εμφάνιση ως'],
  text: ['text', 'κείμενο'],
  bar: ['bar', 'μπάρα'],
  graph: ['graph', 'γράφημα'],
  lamp: ['lamp', 'λυχνία'],
  min: ['Min', 'Ελάχιστο'],
  max: ['Max', 'Μέγιστο'],
  unit: ['Unit suffix', 'Μονάδα'],
  id: ['ID (name used in MakeCode blocks)', 'ID (όνομα στα μπλοκ MakeCode)'],
  label: ['Label', 'Ετικέτα'],
  color: ['Color', 'Χρώμα'],
  speed: ['Key/pad speed (% per second)', 'Ταχύτητα πλήκτρων/χειριστηρίου (% ανά δευτερόλεπτο)'],
  bindings: ['Bindings', 'Αντιστοιχίσεις'],
  up: ['Bind up', 'Αντιστοίχιση: πάνω'],
  down: ['Bind down', 'Αντιστοίχιση: κάτω'],
  left: ['Bind left', 'Αντιστοίχιση: αριστερά'],
  right: ['Bind right', 'Αντιστοίχιση: δεξιά'],
  pos: ['Bind + (up / right)', 'Αντιστοίχιση: + (πάνω / δεξιά)'],
  neg: ['Bind − (down / left)', 'Αντιστοίχιση: − (κάτω / αριστερά)'],
  spring: ['Spring back to center', 'Επιστροφή στο κέντρο'],
  bind: ['+ Bind', '+ Αντιστοίχιση'],
  listening: ['Press a key or pad input… (Esc)', 'Πάτησε πλήκτρο ή χειριστήριο… (Esc)'],
  delete: ['Delete widget', 'Διαγραφή'],
  resetConfirm: ['Replace your layout with the default one?', 'Να αντικατασταθεί η διάταξη με την προεπιλεγμένη;'],
  importFail: ['Could not import layout: ', 'Αποτυχία εισαγωγής διάταξης: '],
  noBt: ['This browser has no Web Bluetooth. Use Chrome or Edge (desktop or Android).', 'Αυτός ο browser δεν υποστηρίζει Web Bluetooth. Χρησιμοποίησε Chrome ή Edge (υπολογιστή ή Android).'],
  connectFail: ['Could not connect: ', 'Αποτυχία σύνδεσης: '],
  // default layout labels
  lights: ['Lights', 'Φώτα'],
  status: ['Status', 'Κατάσταση'],
  speedLbl: ['Speed', 'Ταχύτητα'],
  temp: ['Temp', 'Θερμ.'],
  throttle: ['Throttle', 'Γκάζι'],
};
const LANGS = ['en', 'el'];

const pick = () => {
  try { const s = localStorage.getItem('rcpad.lang'); if (LANGS.includes(s)) return s; } catch {}
  return navigator.language?.startsWith('el') ? 'el' : 'en';
};
export let lang = pick();
export const t = k => STR[k]?.[LANGS.indexOf(lang)] ?? STR[k]?.[0] ?? k;
export function setLang(l) {
  lang = l;
  try { localStorage.setItem('rcpad.lang', l); } catch {}
}
// Fill static markup: data-i18n sets text, data-i18n-title sets the tooltip.
export function applyStatic() {
  document.documentElement.lang = lang;
  for (const e of document.querySelectorAll('[data-i18n]')) e.textContent = t(e.dataset.i18n);
  for (const e of document.querySelectorAll('[data-i18n-title]')) e.title = e.ariaLabel = t(e.dataset.i18nTitle);
}
