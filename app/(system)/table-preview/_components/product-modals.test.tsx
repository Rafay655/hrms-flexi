import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {CreateProductModal,EditProductModal,DeleteProductsModal} from './product-modals';
import type {Product} from '../types';
vi.stubGlobal('ResizeObserver',class {observe(){} unobserve(){} disconnect(){}});
const product:Product={id:'DEMO-1',name:'Example Shirt',price:25,stock:0,sold:3,rating:4.5,active:true,tone:'#eee'};
afterEach(()=>{cleanup();vi.clearAllMocks();});
function fill(name='New Shirt',price='0',stock='0'){
 fireEvent.change(screen.getByRole('textbox',{name:/Product name/}),{target:{value:name}});
 fireEvent.change(screen.getByRole('textbox',{name:/Price/}),{target:{value:price}});
 fireEvent.change(screen.getByRole('textbox',{name:/Stock quantity/}),{target:{value:stock}});
}
it('shows inline errors and never submits blank, fractional-stock or invalid-price values',async()=>{
 const submit=vi.fn();render(<CreateProductModal products={[product]} onSubmit={submit} onClose={vi.fn()} />);
 fireEvent.click(screen.getByRole('button',{name:'Create product'}));
 expect(screen.getAllByRole('alert')).toHaveLength(3);expect(submit).not.toHaveBeenCalled();
 expect(screen.getByRole('heading',{name:'Create product'})).toBeInTheDocument();
 fill('New Shirt','-1','1.5');fireEvent.click(screen.getByRole('button',{name:'Create product'}));
 expect(screen.getByText(/Enter a price from/)).toBeInTheDocument();expect(screen.getByText(/whole-number stock/)).toBeInTheDocument();expect(submit).not.toHaveBeenCalled();
});
it('accepts zero values, prevents duplicate submissions and waits for completion',async()=>{
 let finish!:()=>void;const submit=vi.fn(()=>new Promise<void>(resolve=>{finish=resolve;})),close=vi.fn();
 render(<CreateProductModal products={[product]} onSubmit={submit} onClose={close} />);fill();
 fireEvent.click(screen.getByRole('button',{name:'Create product'}));fireEvent.submit(screen.getByRole('textbox',{name:/Product name/}).closest('form')!);
 expect(submit).toHaveBeenCalledTimes(1);expect(submit).toHaveBeenCalledWith({name:'New Shirt',price:0,stock:0,active:true});
 expect(screen.getByRole('button',{name:'Saving…'})).toBeDisabled();expect(close).not.toHaveBeenCalled();
 await act(async()=>finish());await screen.findByRole('heading',{name:'Product created'});expect(close).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Done'}));expect(close).toHaveBeenCalledTimes(1);
});
it('rejects a duplicate name regardless of case and surrounding spaces',()=>{
 const submit=vi.fn();render(<CreateProductModal products={[product]} onSubmit={submit} onClose={vi.fn()} />);fill('  EXAMPLE SHIRT  ');
 fireEvent.click(screen.getByRole('button',{name:'Create product'}));expect(screen.getByText('A product with this name already exists.')).toBeInTheDocument();expect(submit).not.toHaveBeenCalled();
});
it('prefills edits, disables unchanged saves and protects unsaved changes on cancel',()=>{
 const submit=vi.fn(),close=vi.fn();render(<EditProductModal product={product} products={[product]} onSubmit={submit} onClose={close} />);
 expect(screen.getByRole('textbox',{name:/Stock quantity/})).toHaveValue('0');expect(screen.getByRole('button',{name:'Save changes'})).toBeDisabled();
 fireEvent.change(screen.getByRole('textbox',{name:/Product name/}),{target:{value:'Updated Shirt'}});fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
 expect(screen.getByText('Discard your unsaved changes?')).toBeInTheDocument();expect(close).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Keep editing'}));expect(screen.getByRole('textbox',{name:/Product name/})).toHaveValue('Updated Shirt');
 fireEvent.click(screen.getByRole('button',{name:'Cancel'}));fireEvent.click(screen.getByRole('button',{name:'Discard changes'}));expect(close).toHaveBeenCalledTimes(1);expect(submit).not.toHaveBeenCalled();
});
it('retains edits and allows retry after a save failure',async()=>{
 const submit=vi.fn().mockRejectedValueOnce(new Error('Product no longer available')).mockResolvedValueOnce(undefined),close=vi.fn();
 render(<EditProductModal product={product} products={[product]} onSubmit={submit} onClose={close} />);fill('Updated Shirt','30.50','8');
 fireEvent.click(screen.getByRole('button',{name:'Save changes'}));await screen.findByText('Product no longer available');expect(screen.getByRole('heading',{name:'Could not update product'})).toBeInTheDocument();expect(close).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(screen.getByRole('textbox',{name:/Price/})).toHaveValue('30.50');
 fireEvent.click(screen.getByRole('button',{name:'Save changes'}));await screen.findByRole('heading',{name:'Product updated'});fireEvent.click(screen.getByRole('button',{name:'Done'}));expect(close).toHaveBeenCalled();expect(submit).toHaveBeenLastCalledWith({name:'Updated Shirt',price:30.5,stock:8,active:true});
});
it('cancels deletion without mutating anything',()=>{
 const remove=vi.fn(),close=vi.fn();render(<DeleteProductsModal products={[product]} onDelete={remove} onClose={close} />);
 expect(screen.getByText('Example Shirt')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Cancel'}));expect(remove).not.toHaveBeenCalled();expect(close).toHaveBeenCalledTimes(1);
});
it('guards bulk deletion and shows a recoverable error',async()=>{
 let fail!:(error:Error)=>void;const remove=vi.fn(()=>new Promise<void>((_resolve,reject)=>{fail=reject;})),close=vi.fn();
 const view=render(<DeleteProductsModal products={[product,{...product,id:'DEMO-2',name:'Second Shirt'}]} onDelete={remove} onClose={close} />);
 fireEvent.click(screen.getByRole('button',{name:'Delete 2 products'}));expect(screen.getByRole('button',{name:'Deleting…'})).toBeDisabled();expect(screen.getByRole('button',{name:'Cancel'})).toBeDisabled();expect(remove).toHaveBeenCalledTimes(1);
 view.rerender(<DeleteProductsModal products={[]} onDelete={remove} onClose={close} />);expect(screen.getByText('Second Shirt')).toBeInTheDocument();
 await act(async()=>fail(new Error('Unable to remove products')));expect(screen.getByText('Unable to remove products')).toBeInTheDocument();expect(close).not.toHaveBeenCalled();expect(screen.getByRole('heading',{name:'Could not delete products'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(screen.getByRole('button',{name:'Delete 2 products'})).toBeEnabled();
});
it('prevents confirming an empty deletion',()=>{
 render(<DeleteProductsModal products={[]} onDelete={vi.fn()} onClose={vi.fn()} />);expect(screen.getByRole('button',{name:'Delete 0 products'})).toBeDisabled();
});

it('confirms deletion success in a modal before dismissing',async()=>{
 const remove=vi.fn(),close=vi.fn();render(<DeleteProductsModal products={[product]} onDelete={remove} onClose={close} />);
 fireEvent.click(screen.getByRole('button',{name:'Delete product'}));await screen.findByRole('heading',{name:'Product deleted'});
 expect(remove).toHaveBeenCalledTimes(1);expect(close).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Done'}));expect(close).toHaveBeenCalledTimes(1);
});
it('can create another product from the success modal with a fresh form',async()=>{
 const submit=vi.fn(),close=vi.fn();render(<CreateProductModal products={[product]} onSubmit={submit} onClose={close} />);fill();
 fireEvent.click(screen.getByRole('button',{name:'Create product'}));await screen.findByRole('heading',{name:'Product created'});
 fireEvent.click(screen.getByRole('button',{name:'Create another'}));expect(screen.getByRole('textbox',{name:/Product name/})).toHaveValue('');expect(screen.getByRole('textbox',{name:/Price/})).toHaveValue('');expect(close).not.toHaveBeenCalled();
});
it('retries directly from the error modal without losing submitted values',async()=>{
 const submit=vi.fn().mockRejectedValueOnce(new Error('Temporary failure')).mockResolvedValueOnce(undefined);
 render(<CreateProductModal products={[product]} onSubmit={submit} onClose={vi.fn()} />);fill('Retry Shirt','10','2');
 fireEvent.click(screen.getByRole('button',{name:'Create product'}));await screen.findByRole('heading',{name:'Could not create product'});
 fireEvent.click(screen.getByRole('button',{name:'Try again'}));await screen.findByRole('heading',{name:'Product created'});expect(submit).toHaveBeenCalledTimes(2);expect(submit).toHaveBeenLastCalledWith({name:'Retry Shirt',price:10,stock:2,active:true});
});

it.each([
 {name:'A',price:'1',stock:'1',error:'Use a product name between 2 and 100 characters.'},
 {name:'Valid Shirt',price:'1.999',stock:'1',error:'Enter a price from 0 to 99,999,999.99, with up to 2 decimals.'},
 {name:'Valid Shirt',price:'100000000',stock:'1',error:'Enter a price from 0 to 99,999,999.99, with up to 2 decimals.'},
 {name:'Valid Shirt',price:'10',stock:'-1',error:'Enter a whole-number stock quantity from 0 to 1,000,000.'},
 {name:'Valid Shirt',price:'10',stock:'1.5',error:'Enter a whole-number stock quantity from 0 to 1,000,000.'},
 {name:'Valid Shirt',price:'10',stock:'1000001',error:'Enter a whole-number stock quantity from 0 to 1,000,000.'},
])('keeps validation inline and preserves values: $name / $price / $stock',({name,price,stock,error})=>{
 const submit=vi.fn();render(<CreateProductModal products={[product]} onSubmit={submit} onClose={vi.fn()} />);fill(name,price,stock);
 fireEvent.click(screen.getByRole('button',{name:'Create product'}));expect(screen.getByRole('heading',{name:'Create product'})).toBeInTheDocument();expect(screen.getByText(error)).toBeInTheDocument();expect(submit).not.toHaveBeenCalled();
 expect(screen.queryByRole('button',{name:'Back to form'})).not.toBeInTheDocument();expect(screen.getByRole('textbox',{name:/Product name/})).toHaveValue(name);expect(screen.getByRole('textbox',{name:/Price/})).toHaveValue(price);expect(screen.getByRole('textbox',{name:/Stock quantity/})).toHaveValue(stock);
});
it('accepts an inactive product as a valid status',async()=>{
 const submit=vi.fn();render(<CreateProductModal products={[product]} onSubmit={submit} onClose={vi.fn()} />);fill('Inactive Shirt','10','0');
 fireEvent.click(screen.getByRole('switch',{name:'Active product'}));fireEvent.click(screen.getByRole('button',{name:'Create product'}));await screen.findByRole('heading',{name:'Product created'});expect(submit).toHaveBeenCalledWith({name:'Inactive Shirt',price:10,stock:0,active:false});
});
