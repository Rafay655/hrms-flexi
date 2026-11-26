import {afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore,createSlice} from '@reduxjs/toolkit';
import {act} from 'react';
import {Button} from '@/components/ui/button';
import {PermissionBoundary} from './PermissionBoundary';
vi.mock('next/navigation',()=>({usePathname:()=>'/time-sync/shift-templates'}));
afterEach(cleanup);
function setup(permissions:string[]){const auth=createSlice({name:'auth',initialState:{permissions,roles:['custom-reviewer'],user:{id:'user'}},reducers:{setPermissions:(state,action:{payload:string[]})=>{state.permissions=action.payload;}}});const store=configureStore({reducer:{auth:auth.reducer}});return {store,change:(values:string[])=>store.dispatch(auth.actions.setPermissions(values))};}
describe('permission driven controls',()=>{
 it('accepts a grant on any role and hides unrelated actions',()=>{const {store}=setup(['shift.view','shift.edit']);render(<Provider store={store}><PermissionBoundary><Button permission="shift.edit">Edit shift</Button><Button permission="shift.delete">Delete shift</Button></PermissionBoundary></Provider>);expect(screen.getByRole('button',{name:'Edit shift'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Delete shift'})).not.toBeInTheDocument();});
 it('updates controls when the Redux grant snapshot changes',()=>{const {store,change}=setup([]);render(<Provider store={store}><Button permission="shift.create">Create shift</Button></Provider>);expect(screen.queryByRole('button')).not.toBeInTheDocument();act(()=>{change(['shift.create']);});expect(screen.getByRole('button')).toBeInTheDocument();act(()=>{change([]);});expect(screen.queryByRole('button')).not.toBeInTheDocument();});
 it('does not mount protected page content without view access',()=>{const {store}=setup(['shift.create']);render(<Provider store={store}><PermissionBoundary><p>Protected content</p></PermissionBoundary></Provider>);expect(screen.queryByText('Protected content')).not.toBeInTheDocument();expect(screen.getByRole('alert')).toHaveTextContent('Access restricted');});
});
