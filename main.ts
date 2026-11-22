import {mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
const E=new TextEncoder();
// opcode -> [immediate bytes, pops, pushes]; absent = unknown opcode (trap 5)
const M:Record<number,[number,number,number]>={0:[0,0,0],1:[1,0,1],2:[4,0,1],3:[0,1,0],4:[0,1,2],5:[0,2,2],6:[0,2,3],7:[0,3,3],16:[0,2,1],17:[0,2,1],18:[0,2,1],19:[0,2,1],20:[0,2,1],21:[0,2,1],22:[0,2,1],23:[0,1,1],24:[0,2,1],25:[0,2,1],26:[0,2,1],27:[0,1,1],28:[0,2,1],29:[0,2,1],30:[0,2,1],32:[0,2,1],33:[0,2,1],34:[0,2,1],48:[2,0,0],49:[2,1,0],50:[2,1,0],51:[2,0,0],52:[0,0,0],64:[0,1,1],65:[0,2,0],80:[0,1,0],81:[0,1,0],82:[0,0,1],83:[0,1,0]};
function run(P:Uint8Array,N:Uint8Array){
 const S=new Int32Array(256),C=new Int32Array(64),W=new Int32Array(256),U=new Uint8Array(65536);
 let s=0,c=0,pc=0,st=0,ip=0,ol=0;
 const n=P.length;
 for(;;){
  if(st===1000000)return[10,U.subarray(0,ol)];
  if(pc<0||pc>=n)return[9,U.subarray(0,ol)];
  const o=P[pc],m=M[o];
  if(!m)return[5,U.subarray(0,ol)];
  const[im,po,pu]=m;
  if(pc+im>=n)return[9,U.subarray(0,ol)];
  st++;
  const nx=pc+1+im;
  if(s<po)return[2,U.subarray(0,ol)];
  if(s-po+pu>256)return[3,U.subarray(0,ol)];
  pc=nx;
  let a=0,b=0,r=0;
  switch(o){
   case 0:return[0,U.subarray(0,ol)];
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
    if(o===16)r=a+b|0;
    else if(o===17)r=a-b|0;
    else if(o===18)r=Math.imul(a,b);
    else if(o===19){if(!b)return[4,U.subarray(0,ol)];r=a===-2147483648&&b===-1?a:(a/b)|0;}
    else if(o===20){if(!b)return[4,U.subarray(0,ol)];r=b===-1?0:a%b|0;}
    else if(o===21){if(!b)return[4,U.subarray(0,ol)];r=Math.floor((a>>>0)/(b>>>0))|0;}
    else if(o===22){if(!b)return[4,U.subarray(0,ol)];r=(a>>>0)%(b>>>0)|0;}
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
    if(c===64)return[7,U.subarray(0,ol)];
    C[c++]=nx;pc=P[nx-2]|P[nx-1]<<8;break;
   case 52:
    if(!c)return[8,U.subarray(0,ol)];
    pc=C[--c];break;
   case 64:
    a=S[s-1];
    if(a<0||a>255)return[6,U.subarray(0,ol)];
    S[s-1]=W[a];break;
   case 65:
    a=S[s-1];b=S[s-2];
    if(a<0||a>255)return[6,U.subarray(0,ol)];
    s-=2;W[a]=b;break;
   case 80:{
    const d=E.encode(''+S[s-1]);
    if(ol+d.length>65536)return[11,U.subarray(0,ol)];
    s--;U.set(d,ol);ol+=d.length;break;}
   case 81:
    if(ol+1>65536)return[11,U.subarray(0,ol)];
    U[ol++]=S[--s]&255;break;
   case 82:S[s++]=ip<N.length?N[ip++]:-1;break;
   case 83:return[S[--s]&255,U.subarray(0,ol)];
  }
 }
}
for(const id of readdirSync(I).sort()){
 const[ex,out]=run(readFileSync(join(I,id,'program.bin')),readFileSync(join(I,id,'input.bin')));
 mkdirSync(join(O,id),{recursive:true});
 writeFileSync(join(O,id,'stdout.bin'),out);
 writeFileSync(join(O,id,'exit.txt'),ex+'\n');
}
