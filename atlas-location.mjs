export function readAtlasLocation(hash) {
  const match = /^#(stop|place|world)=([a-z0-9-]+)$/.exec(hash);
  return match ? { type: match[1], id: match[2] } : undefined;
}

export function writeAtlasLocation(type, id) {
  return '#' + type + '=' + id;
}
