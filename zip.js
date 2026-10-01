const T=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=b=>{let c=-1;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return(c^-1)>>>0};
export function makeZip(files){
 const e=new TextEncoder(),parts=[],cd=[];let off=0,cs=0;
 for(const f of files){
  const n=e.encode(f.path),d=f.data,c=crc(d),h=new DataView(new ArrayBuffer(30));
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint32(14,c,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,n.length,true);
  parts.push(h.buffer,n,d);
  const g=new DataView(new ArrayBuffer(46));
  g.setUint32(0,0x02014b50,true);g.setUint16(4,20,true);g.setUint16(6,20,true);g.setUint16(8,0x800,true);g.setUint32(16,c,true);g.setUint32(20,d.length,true);g.setUint32(24,d.length,true);g.setUint16(28,n.length,true);g.setUint32(42,off,true);
  cd.push(g.buffer,n);off+=30+n.length+d.length;cs+=46+n.length}
 const z=new DataView(new ArrayBuffer(22));
 z.setUint32(0,0x06054b50,true);z.setUint16(8,files.length,true);z.setUint16(10,files.length,true);z.setUint32(12,cs,true);z.setUint32(16,off,true);
 return new Blob([...parts,...cd,z.buffer],{type:'application/zip'})}
export async function readZip(buf){
 const v=new DataView(buf),u=new Uint8Array(buf),d=new TextDecoder(),out=[];
 let i=buf.byteLength-22;while(i>=0&&v.getUint32(i,true)!==0x06054b50)i--;
 if(i<0)throw new Error('zip');
 const n=v.getUint16(i+10,true);let p=v.getUint32(i+16,true);
 for(let k=0;k<n;k++){
  if(v.getUint32(p,true)!==0x02014b50)throw new Error('zip');
  const m=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),nl=v.getUint16(p+28,true),xl=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),lo=v.getUint32(p+42,true),name=d.decode(u.subarray(p+46,p+46+nl));
  p+=46+nl+xl+cl;if(name.endsWith('/'))continue;
  const s=lo+30+v.getUint16(lo+26,true)+v.getUint16(lo+28,true);let data=u.subarray(s,s+cs);
  if(m===8)data=new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  else if(m!==0)continue;
  out.push({path:name,data})}
 return out}
