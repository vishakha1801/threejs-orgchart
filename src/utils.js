export function darkenHex(hex, percent) {
  if (!hex) return '#000';
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);
  
  r = Math.floor(r * (1 - percent));
  g = Math.floor(g * (1 - percent));
  b = Math.floor(b * (1 - percent));
  
  return "#" + 
    r.toString(16).padStart(2, '0') + 
    g.toString(16).padStart(2, '0') + 
    b.toString(16).padStart(2, '0');
}
