import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,act} from '@testing-library/react';
import {CreateProfileModal} from './create-profile-modal';
import {employeeProfileApi} from '@/services/employee-profile.service';
import type {EmployeeProfileCreateDefaults} from '@/types/employee-profile.types';
vi.mock('@/services/employee-profile.service',()=>({employeeProfileApi:{getCreateDefaults:vi.fn(),createProfile:vi.fn()}}));
vi.mock('react-hot-toast',()=>({default:{success:vi.fn()}}));
vi.mock('@/components/ui/searchable-select',()=>({default:({id,options,value,onChange,disabled,...props}:{id:string;options:{value:string;label:string}[];value:string;onChange:(value:string)=>void;disabled?:boolean;'aria-label'?:string})=><select id={id} aria-label={props['aria-label']} value={value} disabled={disabled} onChange={event=>onChange(event.target.value)}><option value="">Select</option>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>}));
vi.stubGlobal('ResizeObserver',class {observe(){} unobserve(){} disconnect(){}});
const employees=[{value:'employee-a',label:'Example Employee A'},{value:'employee-b',label:'Example Employee B'}];
const defaults=(id='employee-a'):EmployeeProfileCreateDefaults=>({employee_uuid:id,cnic:'0000012345678',state_id:3176,state:{id:3176,name:'Punjab',code:'PK-PB'}});
beforeEach(()=>{vi.resetAllMocks();vi.mocked(employeeProfileApi.getCreateDefaults).mockResolvedValue(defaults());});
afterEach(()=>cleanup());
function open(initial=true){const onCreated=vi.fn(),onClose=vi.fn();const view=render(<CreateProfileModal employees={employees} states={[]} initialEmployee={initial?employees[0]:null} onCreated={onCreated} onClose={onClose} />);return {...view,onCreated,onClose};}
it('prefills a row-selected employee, preserves CNIC zeros and uses the returned province label',async()=>{
 open();
 await waitFor(()=>expect(screen.getByLabelText('CNIC (13 digits)')).toHaveValue('0000012345678'));
 expect(screen.getByLabelText('Province')).toHaveValue('3176');expect(screen.getByRole('option',{name:'Punjab'})).toBeInTheDocument();
 expect(employeeProfileApi.getCreateDefaults).toHaveBeenCalledWith('employee-a',expect.any(AbortSignal));
});
it('waits for selection from the empty modal and saves string CNIC and integer state without a blank effective date',async()=>{
 const view=open(false);expect(employeeProfileApi.getCreateDefaults).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Employee'),{target:{value:'employee-a'}});
 await waitFor(()=>expect(screen.getByLabelText('CNIC (13 digits)')).toHaveValue('0000012345678'));
 vi.mocked(employeeProfileApi.createProfile).mockResolvedValue({data:{data:{employee_uuid:'employee-a',state:{id:3176,name:'Punjab'}}}} as never);
 fireEvent.click(screen.getByRole('button',{name:'Create'}));
 await waitFor(()=>expect(employeeProfileApi.createProfile).toHaveBeenCalledWith(expect.objectContaining({cnic:'0000012345678',state_id:3176})));
 const payload=vi.mocked(employeeProfileApi.createProfile).mock.calls[0][0];expect(payload).not.toHaveProperty('effective_from');
 await waitFor(()=>expect(view.onCreated).toHaveBeenCalled());
});
it('clears defaults on switching employees and ignores a late response from the previous selection',async()=>{
 let resolveA!:(value:EmployeeProfileCreateDefaults)=>void;
 vi.mocked(employeeProfileApi.getCreateDefaults).mockImplementation(id=>id==='employee-a'?new Promise(resolve=>{resolveA=resolve;}):Promise.resolve({employee_uuid:id,cnic:null,state_id:null,state:null}));
 open();const signal=vi.mocked(employeeProfileApi.getCreateDefaults).mock.calls[0][1]!;
 expect(screen.getByRole('button',{name:'Create'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Employee'),{target:{value:'employee-b'}});
 await waitFor(()=>expect(screen.getByRole('button',{name:'Create'})).toBeEnabled());
 expect(signal.aborted).toBe(true);expect(screen.getByLabelText('CNIC (13 digits)')).toHaveValue('');expect(screen.getByLabelText('Province')).toHaveValue('');
 await act(async()=>resolveA(defaults()));expect(screen.getByLabelText('CNIC (13 digits)')).toHaveValue('');
});
it('ignores defaults whose employee UUID does not match the selection',async()=>{
 vi.mocked(employeeProfileApi.getCreateDefaults).mockResolvedValue(defaults('employee-b'));open();
 await screen.findByText('Defaults did not match the selected employee. Try again.');
 expect(screen.getByLabelText('CNIC (13 digits)')).toHaveValue('');expect(screen.getByRole('button',{name:'Create'})).toBeDisabled();
});
it.each([403,404])('handles %s without creating a profile and supports retry',async status=>{
 vi.mocked(employeeProfileApi.getCreateDefaults).mockRejectedValueOnce({response:{status,data:{success:false}}}).mockResolvedValue(defaults());open();
 fireEvent.click(await screen.findByRole('button',{name:'Try again'}));
 await waitFor(()=>expect(screen.getByLabelText('CNIC (13 digits)')).toHaveValue('0000012345678'));
 expect(employeeProfileApi.createProfile).not.toHaveBeenCalled();
});
it('keeps rejected values in the modal and displays 422 field errors beneath their inputs',async()=>{
 vi.mocked(employeeProfileApi.createProfile).mockRejectedValue({response:{status:422,data:{success:false,error:{message:'Fix the highlighted fields.',field_errors:{cnic:['CNIC is invalid.'],state_id:['Province is invalid.']}}}}});open();
 await waitFor(()=>expect(screen.getByRole('button',{name:'Create'})).toBeEnabled());
 fireEvent.click(screen.getByRole('button',{name:'Create'}));
 await screen.findByText('CNIC is invalid.');expect(screen.getByLabelText('CNIC (13 digits)').parentElement).toHaveTextContent('CNIC is invalid.');
 expect(screen.getByLabelText('Province').parentElement).toHaveTextContent('Province is invalid.');expect(screen.getByLabelText('CNIC (13 digits)')).toHaveValue('0000012345678');
});
it('omits missing CNIC and province so the backend can reuse recorded values',async()=>{
 vi.mocked(employeeProfileApi.getCreateDefaults).mockResolvedValue({employee_uuid:'employee-a',cnic:null,state_id:null,state:null});
 vi.mocked(employeeProfileApi.createProfile).mockResolvedValue({data:{data:{employee_uuid:'employee-a',state:null}}} as never);open();
 await waitFor(()=>expect(screen.getByRole('button',{name:'Create'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Create'}));
 await waitFor(()=>expect(employeeProfileApi.createProfile).toHaveBeenCalled());const payload=vi.mocked(employeeProfileApi.createProfile).mock.calls[0][0];expect(payload).not.toHaveProperty('cnic');expect(payload).not.toHaveProperty('state_id');
});
