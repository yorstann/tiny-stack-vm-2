import {mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
// opcode -> immediate bytes | pops<<3 | pushes<<5; absent = unknown opcode (trap 5)
const M={0:0,1:33,2:36,3:8,4:72,5:80,6:112,7:120,16:48,17:48,18:48,19:48,20:48,21:48,22:48,23:40,24:48,25:48,26:48,27:40,28:48,29:48,30:48,32:48,33:48,34:48,48:2,49:10,50:10,51:2,52:0,64:40,65:16,80:8,81:8,82:32,83:8};
function run(P,N){
 const S=new Int32Array(256),C=new Int32Array(64),W=new Int32Array(256),U=new Uint8Array(65536);
 let s=0,c=0,pc=0,st=0,ip=0,ol=0;
 const n=P.length,R=(x)=>[x,U.subarray(0,ol)];
 for(;;){
  if(st===1000000)return R(10);
  if(pc<0||pc>=n)return R(9);
  const o=P[pc],m=M[o];
  if(m===undefined)return R(5);
  const im=m&7,po=m>>3&3,pu=m>>5;
  if(pc+im>=n)return R(9);
  st++;
  const nx=pc+1+im;
  if(s<po)return R(2);
  if(s-po+pu>256)return R(3);
  pc=nx;
  let a=0,b=0,r=0;
  switch(o){
   case 0:return R(0);
   case 1:S[s++]=P[nx-1]<<24>>24;break;
   case 2:S[s++]=P[nx-4]|P[nx-3]<<8|P[nx-2]<<16|P[nx-1]<<24;break;
   case 3:s--;break;
   case 4:S[s]=S[s-1];s++;break;
   case 5:r=S[s-1];S[s-1]=S[s-2];S[s-2]=r;break;
   case 6:S[s]=S[s-2];s++;break;
   case 7:a=S[s-3];S[s-3]=S[s-2];S[s-2]=S[s-1];S[s-1]=a;break;
   case 23:S[s-1]=-S[s-1]|0;break;
   case 27:S[s-1]=~S[s-1];break;
   case 16:case 17:case 18:case 19:case 20:case 21:case 22:case 24:case 25:case 26:case 28:case 29:case 30:case 32:case 33:case 34:
    b=S[s-1];a=S[s-2];
    if(!b&&o>=19&&o<=22)return R(4);
    if(o===16)r=a+b|0;
    else if(o===17)r=a-b|0;
    else if(o===18)r=Math.imul(a,b);
    else if(o===19)r=a===-2147483648&&b===-1?a:(a/b)|0;
    else if(o===20)r=b===-1?0:a%b|0;
    else if(o===21)r=Math.floor((a>>>0)/(b>>>0))|0;
    else if(o===22)r=(a>>>0)%(b>>>0)|0;
    else if(o===24)r=a&b;
    else if(o===25)r=a|b;
    else if(o===26)r=a^b;
    else if(o===28)r=a<<(b&31);
    else if(o===29)r=a>>(b&31);
    else if(o===30)r=(a>>>(b&31))|0;
    else if(o===32)r=a===b?1:0;
    else if(o===33)r=a<b?1:0;
    else r=(a>>>0)<(b>>>0)?1:0;
    s-=2;S[s++]=r;break;
   case 48:case 49:case 50:{
    const rel=(P[nx-2]|P[nx-1]<<8)<<16>>16;
    let go=o===48;
    if(o!==48){const v=S[--s];go=o===49?v===0:v!==0;}
    if(go)pc=nx+rel;
    break;}
   case 51:
    if(c===64)return R(7);
    C[c++]=nx;pc=P[nx-2]|P[nx-1]<<8;break;
   case 52:
    if(!c)return R(8);
    pc=C[--c];break;
   case 64:
    a=S[s-1];
    if(a<0||a>255)return R(6);
    S[s-1]=W[a];break;
   case 65:
    a=S[s-1];b=S[s-2];
    if(a<0||a>255)return R(6);
    s-=2;W[a]=b;break;
   case 80:{
    const d=Buffer.from(''+S[s-1]);
    if(ol+d.length>65536)return R(11);
    s--;U.set(d,ol);ol+=d.length;break;}
   case 81:
    if(ol+1>65536)return R(11);
    U[ol++]=S[--s]&255;break;
   case 82:S[s++]=ip<N.length?N[ip++]:-1;break;
   case 83:return R(S[--s]&255);
  }
 }
}
for(const id of readdirSync(I).sort()){
 const[ex,out]=run(readFileSync(I+'/'+id+'/program.bin'),readFileSync(I+'/'+id+'/input.bin'));
 mkdirSync(O+'/'+id,{recursive:true});
 writeFileSync(O+'/'+id+'/stdout.bin',out);
 writeFileSync(O+'/'+id+'/exit.txt',ex+'\n');
}
