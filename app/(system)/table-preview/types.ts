export type Product={id:string;name:string;price:number;sold:number;stock:number;rating:number;active:boolean;tone:string};
export type ProductValues=Pick<Product,'name'|'price'|'stock'|'active'>;
