export const LEGACY_ICON_IDS = ["surface", "home", "bed", "bath", "temperature", "pool", "land", "view", "garage"];
export const HIGHLIGHTS = [
 ['land','Superficie de terreno','land','M3 6h18v12H3z M3 6l18 12 M21 6L3 18'],
 ['built','Superficie construida','surface','M4 20V8l8-5 8 5v12z M8 20v-7h8v7'],
 ['bed','Dormitorios','bed','M3 19v-8h18v8 M3 15h18 M6 11V7h5v4 M3 21v-2 M21 21v-2'],
 ['bath','Baños','bath','M4 13h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z M7 13V6a3 3 0 0 1 6 0'],
 ['floors','Plantas / pisos','home','M4 21h16V3H4z M4 9h16 M4 15h16 M9 3v18'],
 ['garage','Cocheras','garage','M3 21V8l9-5 9 5v13 M6 21v-9h12v9 M6 16h12'],
 ['suite','Dormitorios en suite','bed','M3 19v-7h12v7 M3 15h12 M6 12V8h6v4 M18 6h4v6h-4z'],
 ['pool','Piscina','pool','M2 17q3-3 6 0t6 0t6 0 M2 21q3-3 6 0t6 0t6 0 M7 16V5a3 3 0 0 1 6 0 M7 9h6'],
 ['bbq','Parrillero / barbacoa','temperature','M4 11h16l-2 6H6z M8 17l-2 5 M16 17l2 5 M8 3v5 M12 2v6 M16 3v5'],
 ['sea','Vista al mar','view','M2 18q3-3 6 0t6 0t6 0 M2 22q3-3 6 0t6 0t6 0 M7 10a5 5 0 0 1 10 0 M2 12h20'],
 ['green','Vista a zonas verdes / sierras','land','M2 20l7-13 5 8 3-5 5 10z M7 4h4'],
 ['front','Metros de frente','surface','M3 6v14 M21 6v14 M3 14h18 M3 14l4-4 M3 14l4 4 M21 14l-4-4 M21 14l-4 4'],
 ['orientation','Orientación','view','M12 2l4 10-4 10-4-10z M2 12h5 M17 12h5'],
 ['beach','Distancia al mar','view','M3 18h18 M12 3v15 M5 9q7-10 14 0H5z M3 22q3-3 6 0t6 0t6 0'],
 ['heating','Calefacción / estufa','temperature','M5 21V4h14v17z M8 17q-1-4 4-8q5 4 4 8z M3 22h18'],
 ['ac','Aire acondicionado','temperature','M4 4h16v8H4z M7 8h10 M7 15v6 M12 15v7 M17 15v6'],
 ['lift','Ascensor','home','M4 2h16v20H4z M12 2v20 M7 8l2-2 2 2 M13 16l2 2 2-2']
].map(([id,label,legacyIcon,path])=>({id,label,legacyIcon,icon:'stat-'+id,path}));
export const SUMMARY_ICON_IDS = [...LEGACY_ICON_IDS,...HIGHLIGHTS.map(h=>h.icon)];
