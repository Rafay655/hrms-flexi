import {useState} from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {ImportLookupInput} from './import-lookup-input';
import {importStudioService} from '@/services/import-studio.service';
vi.mock('@/services/import-studio.service',()=>({importStudioService:{lookup:vi.fn()}}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('searches from the same input, displays dropdown options and selects with the keyboard',async()=>{
 vi.mocked(importStudioService.lookup).mockImplementation(async(_source,q)=>({options:q.toLowerCase().startsWith('mar')?[{id:42,label:'Married'}]:[{id:42,label:'Married'},{id:1,label:'Single'}],has_more:false}));
 const selected=vi.fn(),client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 function Harness(){const [value,setValue]=useState('');return <ImportLookupInput label="Marital Status" source="marital_statuses" value={value} scope="company:user" disabled={false} requiresParent={false} onText={setValue} onSelect={option=>{selected(option);setValue(option.label);}} />;}
 render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
 const input=screen.getByRole('combobox',{name:'Marital Status'});
 fireEvent.focus(input);fireEvent.change(input,{target:{value:'Mar'}});
 await waitFor(()=>expect(importStudioService.lookup).toHaveBeenCalledWith('marital_statuses','Mar',1,undefined,expect.any(AbortSignal)));
 expect(await screen.findByRole('option',{name:'Married'})).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Search Marital Status'})).not.toBeInTheDocument();
 expect(screen.getAllByRole('combobox')).toHaveLength(1);expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter'});
 expect(selected).toHaveBeenCalledWith({id:42,label:'Married'});expect(input).toHaveValue('Married');
 await waitFor(()=>expect(screen.queryByRole('option',{name:'Married'})).not.toBeInTheDocument());
 client.clear();
});
