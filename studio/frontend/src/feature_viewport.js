// Standalone ES module: schematic CAD feature selection.
// Framework-neutral: no ComfyUI imports and no network dependency.
// Shows overlapping primitive wireframes, NOT a computed CSG final solid.
const NS = "http://www.w3.org/2000/svg";
function svgElement(tag, attributes = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}
const valid = n => typeof n === "number" && Number.isFinite(n);
const vec = v => Array.isArray(v) && v.length === 3 && v.every(valid);
const project = ([x,y,z]) => [x-y*.72, (x+y)*.34-z*1.05];
const COLORS = {base:"#7599b9", add:"#2bb3a2", cut:"#ee9d62"};
function boxWire(position, size) {
  if (!vec(position) || !vec(size) || size.some(n=>n<=0)) return null;
  const [x,y,z]=position, [w,d,h]=size;
  return {vertices:[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],
    [x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],
    edges:[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]]};
}
function cylinderWire(position, radius, height) {
  if (!vec(position) || !valid(radius) || !valid(height) ||
      radius<=0 || height<=0) return null;
  const vertices=[],edges=[];
  for (const z of [position[2],position[2]+height]) {
    for(let i=0;i<24;i++) {
      const a=2*Math.PI*i/24;
      vertices.push([position[0]+radius*Math.cos(a),position[1]+radius*Math.sin(a),z]);
    }
  }
  for(let i=0;i<24;i++) {
    edges.push([i,(i+1)%24],[i+24,(i+1)%24+24]);
    if(i%6===0) edges.push([i,i+24]);
  }
  return {vertices,edges};
}
function primitive(f) {
  if(f?.shape==="box") return boxWire(f.position,f.size);
  if(f?.shape==="cylinder") return cylinderWire(f.position,f.radius,f.height);
  return null;
}
export function createFeatureViewport({container,onSelect,language="es"}) {
  if(!container?.replaceChildren) throw new TypeError("A DOM container is required");
  const canvas=svgElement("svg",{viewBox:"0 0 450 270",width:"100%",
    role:"group","aria-label":language==="es"?"Esquema CAD 3D":"3D CAD schematic",
    style:"display:block;background:#18232e;border-radius:6px;"});
  const legend=document.createElement("div"),note=document.createElement("div");
  legend.style.cssText="font-size:11px;opacity:.85;margin:3px 0 5px;";
  note.style.cssText="font-size:11px;opacity:.65;margin-bottom:4px;";
  note.textContent=language==="es"
    ?"Esquema de operaciones; el sólido final se comprueba en Preview3D."
    :"Operations schematic; inspect the final solid in Preview3D.";
  container.replaceChildren(canvas,legend,note);
  let model={width:100,depth:60,height:12,operations:[]},selected=-1;
  function render(){
    canvas.replaceChildren();
    const parts=[{wire:boxWire([0,0,0],[model.width,model.depth,model.height]),
      index:-1,op:"base"}];
    (model.operations||[]).forEach((feature,index)=>{
      parts.push({wire:primitive(feature),index,op:feature.op});
    });
    const all=parts.flatMap(p=>p.wire?.vertices||[]).map(project);
    if(!all.length)return;
    const minX=Math.min(...all.map(p=>p[0])), maxX=Math.max(...all.map(p=>p[0]));
    const minY=Math.min(...all.map(p=>p[1])), maxY=Math.max(...all.map(p=>p[1]));
    const scale=Math.min(390/Math.max(1,maxX-minX),215/Math.max(1,maxY-minY),10);
    const map=point=>{
      const p=project(point);
      return [225+(p[0]-(maxX+minX)/2)*scale,
        135+(p[1]-(maxY+minY)/2)*scale];
    };
    for(const item of parts){
      if(!item.wire)continue;
      const active=item.index===selected;
      const color=COLORS[item.op]||COLORS.base;
      const group=svgElement("g",{"data-feature-index":item.index,
        role:item.index<0?"img":"button",tabindex:item.index<0?"-1":"0",
        "aria-label":item.index<0?"Base":String(item.index+1),
        style:item.index<0?"pointer-events:none":"cursor:pointer"});
      const mapped=item.wire.vertices.map(map);
      for(const [a,b] of item.wire.edges) {
        group.append(svgElement("line",{x1:mapped[a][0],y1:mapped[a][1],
          x2:mapped[b][0],y2:mapped[b][1],stroke:color,
          "stroke-width":active?3.2:1.8,opacity:active?1:.78}));
      }
      if(item.index>=0){
        const xs=mapped.map(p=>p[0]),ys=mapped.map(p=>p[1]);
        group.append(svgElement("rect",{x:Math.min(...xs)-5,y:Math.min(...ys)-5,
          width:Math.max(...xs)-Math.min(...xs)+10,
          height:Math.max(...ys)-Math.min(...ys)+10,
          fill:color,"fill-opacity":".013"}));
        const choose=()=>{selected=item.index;onSelect?.(selected);render();};
        group.addEventListener("click",choose);
        group.addEventListener("keydown",e=>{
          if(e.key==="Enter"||e.key===" "){e.preventDefault();choose();}
        });
      }
      canvas.append(group);
    }
    legend.textContent=language==="es"
      ?"Azul: base · Verde: añadir · Naranja: restar · Grueso: seleccionado"
      :"Blue: base · Green: add · Orange: cut · Thick: selected";
  }
  function update(next,selectedIndex=selected){
    if(next&&typeof next==="object")model=next;
    selected=Number.isInteger(selectedIndex)&&selectedIndex>=0&&
      selectedIndex<(model.operations?.length||0)?selectedIndex:-1;
    render();
  }
  update(model);
  return {update,select:index=>update(model,index),element:canvas};
}
