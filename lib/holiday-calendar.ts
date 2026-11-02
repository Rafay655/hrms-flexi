import type { YearHoliday } from '@/types/holiday';
export function holidayDateKey(year:number, month:number, day:number) {
 return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
export function holidayMonthGrid(year:number,month:number) {
 const offset=(new Date(year,month,1).getDay()+6)%7;
 const days=new Date(year,month+1,0).getDate();
 return Array.from({length:42},(_,index)=>{const day=index-offset+1;return day>=1&&day<=days?holidayDateKey(year,month,day):null;});
}
export function groupHolidaysByDate(holidays:YearHoliday[]) {
 const map=new Map<string,YearHoliday[]>();
 for(const holiday of holidays){const date=holiday.date.slice(0,10);map.set(date,[...(map.get(date)||[]),holiday]);}
 return map;
}
