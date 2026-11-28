"use client";
import {DndContext,PointerSensor,KeyboardSensor,useSensor,useSensors,closestCenter,type DragEndEvent,type Modifier} from '@dnd-kit/core';
import {SortableContext,useSortable,verticalListSortingStrategy,sortableKeyboardCoordinates} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripVertical} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {Button} from '@/components/ui/button';
import {fieldTypeLabel} from '@/lib/import-studio';
import type {FieldDefinition} from '@/lib/flexi-import';
export const restrictToVerticalAxis:Modifier=({transform})=>({...transform,x:0});
export function SortableFields({fields,selectedKeys,missingParentKeys,onChoose,onReorder,disabled=false}:{fields:FieldDefinition[];selectedKeys:string[];missingParentKeys:string[];onChoose:(key:string,selected:boolean)=>void;onReorder:(active:string,over:string)=>void;disabled?:boolean}){
 const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}));
 const selected=new Set(selectedKeys);const label=(id:string)=>fields.find(field=>field.key===id)?.label??'Column';
 function drop(event:DragEndEvent){if(!disabled&&event.over&&event.active.id!==event.over.id)onReorder(String(event.active.id),String(event.over.id));}
 return <DndContext modifiers={[restrictToVerticalAxis]} sensors={sensors} collisionDetection={closestCenter} onDragEnd={drop} accessibility={{announcements:{onDragStart:({active})=>`Picked up ${label(String(active.id))}.`,onDragOver:({active,over})=>over?`${label(String(active.id))} over ${label(String(over.id))}.`:undefined,onDragEnd:({active,over})=>over?`Placed ${label(String(active.id))} at ${label(String(over.id))}.`:'Column order unchanged.',onDragCancel:()=> 'Reordering cancelled.'}}}>
 <SortableContext items={fields.filter(field=>selected.has(field.key)).map(field=>field.key)} strategy={verticalListSortingStrategy}>{fields.map(field=><FieldRow key={field.key} field={field} selected={selected.has(field.key)} position={selectedKeys.indexOf(field.key)+1} missingParent={missingParentKeys.includes(field.key)} onChoose={onChoose} disabled={disabled}/>)}</SortableContext>
 </DndContext>;
}
function FieldRow({field,selected,position,missingParent,onChoose,disabled}:{field:FieldDefinition;selected:boolean;position:number;missingParent:boolean;onChoose:(key:string,selected:boolean)=>void;disabled:boolean}){
 const {attributes,listeners,setNodeRef,setActivatorNodeRef,transform,transition,isDragging}=useSortable({id:field.key,disabled:disabled||!selected});
 const description=[field.description,field.options?.length?`Options: ${field.options.map(option=>typeof option==='string'?option:option.label??String(option.value??option.id??'')).join(', ')}`:''].filter(Boolean).join(' · ');
 return <div ref={setNodeRef} style={{transform:CSS.Transform.toString(transform),transition,zIndex:isDragging?20:undefined,position:'relative'}} className={`flex min-h-11 items-center gap-3 border-b px-4 py-2 ${isDragging?'border-brand-200 bg-brand-100 shadow-md':selected?'border-gray-100 bg-[#F8F7FB]':'border-gray-100 bg-white'} hover:bg-gray-50`}>
 <Checkbox id={`column-${field.key}`} aria-label={`Select ${field.label}`} checked={selected} disabled={field.required||disabled} onCheckedChange={value=>onChoose(field.key,value===true)}/>
 <span className="w-5 shrink-0 text-right text-[10px] tabular-nums text-gray-400">{selected?position:'—'}</span>
 <div className="min-w-0 flex-1"><label htmlFor={`column-${field.key}`} className="block truncate text-[13px] font-medium text-gray-800" title={description}>{field.label}</label>{missingParent&&<p className="text-[11px] text-rose-600">Select this field’s controlling column.</p>}</div>
 <span className="hidden min-w-16 text-[11px] text-gray-400 sm:block">{fieldTypeLabel(field.type)}</span><span className={`w-16 text-[10px] ${field.required?'font-medium text-brand-800':'text-gray-400'}`}>{field.required?'Required':'Optional'}</span>
 <div className="flex w-8 shrink-0 justify-end">{selected&&<Button ref={setActivatorNodeRef} {...attributes} {...listeners} type="button" size="icon" variant="ghost" disabled={disabled} className="h-7 w-7 touch-none cursor-grab rounded-none text-gray-400 hover:text-brand-800 active:cursor-grabbing" aria-label={`Reorder ${field.label}`} title="Drag to reorder. Keyboard: Space, arrow keys, Space to drop; Escape to cancel."><GripVertical className="h-4 w-4"/></Button>}</div>
 </div>;
}
