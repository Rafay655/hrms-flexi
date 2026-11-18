import { unzipSync, strFromU8 } from 'fflate';
function xml(bytes:Uint8Array|undefined):Document {
  if(!bytes)throw new Error('The workbook is missing its Data sheet metadata.');
  const doc=new DOMParser().parseFromString(strFromU8(bytes),'application/xml');
  if(doc.getElementsByTagName('parsererror').length)throw new Error('The workbook contains invalid XML.');
  return doc;
}
export function parseImportCsvHeader(text:string):string[] {
  const result:string[]=[];let value='',quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(char==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
    else if(!quoted&&(char===','||char==='\n'||char==='\r')){result.push(value.trim());value='';if(char!==',')return result;}
    else value+=char;
  }
  if(quoted)throw new Error('The CSV header contains an unclosed quote.');
  result.push(value.trim());return result;
}
export async function importWorkbookHeaders(file:File):Promise<string[]> {
  if(!file.size||file.size>10*1024*1024)throw new Error('Choose a non-empty CSV or XLSX file up to 10 MB.');
  let headers:string[];
  if(file.name.toLowerCase().endsWith('.csv')) headers=parseImportCsvHeader(await file.text());
  else if(file.name.toLowerCase().endsWith('.xlsx')){
    let total=0;
    const entries=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:entry=>{
      const include=/^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/sheet[^/]+\.xml)$/.test(entry.name);
      if(include){total+=entry.originalSize;if(total>32*1024*1024)throw new Error('Workbook data is too large. Split it into smaller files.');}
      return include;
    }});
    const workbook=xml(entries['xl/workbook.xml']);
    const sheet=Array.from(workbook.getElementsByTagName('sheet')).find(s=>s.getAttribute('name')?.toLowerCase()==='data');
    if(!sheet)throw new Error('Use the supplied template and keep its Data sheet.');
    const id=sheet.getAttribute('r:id');
    const relationship=Array.from(xml(entries['xl/_rels/workbook.xml.rels']).getElementsByTagName('Relationship')).find(r=>r.getAttribute('Id')===id);
    const target=relationship?.getAttribute('Target')??'';
    const path=target.startsWith('/')?target.slice(1):`xl/${target.replace(/^\.\//,'')}`;
    const sheetDoc=xml(entries[path]);
    const shared=entries['xl/sharedStrings.xml']?Array.from(xml(entries['xl/sharedStrings.xml']).getElementsByTagName('si')).map(item=>Array.from(item.getElementsByTagName('t')).map(t=>t.textContent??'').join('')):[];
    const row=sheetDoc.getElementsByTagName('row')[0];
    if(!row)throw new Error('The Data sheet is empty.');
    headers=[];
    for(const cell of Array.from(row.getElementsByTagName('c'))){
      const column=(cell.getAttribute('r')??'').replace(/\d/g,'');
      let index=0;for(const letter of column)index=index*26+letter.charCodeAt(0)-64;
      const raw=cell.getElementsByTagName('v')[0]?.textContent??'';
      const value=cell.getAttribute('t')==='s'?shared[Number(raw)]??'':cell.getAttribute('t')==='inlineStr'?Array.from(cell.getElementsByTagName('t')).map(t=>t.textContent??'').join(''):raw;
      headers[Math.max(0,index-1)]=value.trim();
    }
  }else throw new Error('Only CSV and XLSX files are supported.');
  while(headers.length&&!headers[headers.length-1])headers.pop();
  if(!headers.length||Array.from(headers).some(h=>!h))throw new Error('The header row has blank columns. Keep the supplied template headers.');
  if(new Set(headers).size!==headers.length)throw new Error('Column headers must be unique.');
  return headers;
}
