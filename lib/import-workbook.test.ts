import { expect,it } from 'vitest';
import { zipSync,strToU8 } from 'fflate';
import { importWorkbookHeaders,parseImportCsvHeader } from './import-workbook';
function file(bytes:Uint8Array,name='employees.xlsx'){return {name,size:bytes.length,arrayBuffer:async()=>bytes.buffer,text:async()=>new TextDecoder().decode(bytes)} as File;}
function workbook(header:string){return zipSync({
 'xl/workbook.xml':strToU8('<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" r:id="rId1" /></sheets></workbook>'),
 'xl/_rels/workbook.xml.rels':strToU8('<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml" /></Relationships>'),
 'xl/sharedStrings.xml':strToU8('<sst><si><t>Employee ID</t></si></sst>'),
 'xl/worksheets/sheet1.xml':strToU8(`<worksheet><sheetData><row r="1">${header}</row><row r="2"><c r="A2"><is><t>__metadata__</t></is></c></row></sheetData></worksheet>`),
});}
it('reads quoted CSV headers with a BOM and commas',()=>{expect(parseImportCsvHeader('\uFEFF"Employee ID","Name, full"\r\n1,A')).toEqual(['Employee ID','Name, full']);});
it('reads shared and inline XLSX header cells without consuming metadata rows',async()=>{
 const bytes=workbook('<c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>Division</t></is></c>');
 expect(await importWorkbookHeaders(file(bytes))).toEqual(['Employee ID','Division']);
});
it('rejects duplicate workbook headers',async()=>{await expect(importWorkbookHeaders(file(workbook('<c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>0</v></c>')))).rejects.toThrow('unique');});
it('rejects missing header cells rather than shifting mappings',async()=>{await expect(importWorkbookHeaders(file(workbook('<c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Division</t></is></c>')))).rejects.toThrow('blank');});
it('rejects unsupported and oversized files',async()=>{
 await expect(importWorkbookHeaders(file(strToU8('a'),'old.xls'))).rejects.toThrow('CSV and XLSX');
 await expect(importWorkbookHeaders({name:'large.xlsx',size:11*1024*1024} as File)).rejects.toThrow('10 MB');
});
