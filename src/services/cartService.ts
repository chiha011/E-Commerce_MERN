import { cartModel, ICartItem } from "../models/cartModel";
import ProductModel from "../models/productModel";
import userModel from "../models/userModel";


interface CreateCartForUser {
    userId : string;
}

const createCartForUser = async ({userId}:CreateCartForUser ) => {
    
    const cart = await cartModel.create({userId, totalAmount:0});
    await cart.save();
    return cart;
} ;


interface GetActiveCartForUser {
    userId:string;
}

export const GetActiveCartForUser = async ({userId}:GetActiveCartForUser) => {
    let cart = await cartModel.findOne({userId,status:"active"})

    if(!cart) {
        cart = await createCartForUser({ userId });
    }

    return cart;
}

interface ClearCart {
    userId : string;
}

export const clearCart = async ({ userId} : ClearCart) => {
    const cart = await GetActiveCartForUser({userId});

    cart.items = [];
    cart.totalAmount = 0;
    const updatedCart = await cart.save();

    return { data: updatedCart, statusCode:200};

};


interface AddItemToCart {
    productId: any;
    quantity: number;
    userId:string;
}

export const addItemToCart = async ({productId,quantity,userId}: AddItemToCart) => {
    const cart = await GetActiveCartForUser({userId});

    //does the item exist in the cart !!?
    const existsInCart = cart.items.find((p)=> p.product.toString() === productId);


    if (existsInCart){
        return {data: "Item already exists in cart!", statusCode:400};
    }

    //Fetch the product
    const product = await ProductModel.findById(productId);

    if(!product) {
        return {data: "Product not found!", statusCode: 400};
    }

    if(product.stock < quantity) {
        return {data : "Low stock for item", statusCode:400};
    }

    cart.items.push({
        product: productId,
        unitPrice: product.price,
        quantity
    })

    //update the totalAmount for the cart
    cart.totalAmount += product.price * quantity;

    const updatedCart = await cart.save();
    
    return{data: updatedCart, statusCode:200};
};


interface UpdateItemInCart {
    quantity:number;
    userId:string;
    productId:any;
}



export const updatedItemInCart = async ({
    productId,
    quantity,
    userId,
}: UpdateItemInCart) => {
    const cart = await GetActiveCartForUser ({userId});
    
    const existsInCart = cart.items.find(
        (p) => p.product.toString() === productId
    );

    if(!existsInCart){
        return{data: "Item does not exist in cart", statusCode:400};
    }


    const product = await ProductModel.findById(productId);

    if(!product) {
        return {data: "Product not found!", statusCode: 400};
    }

    if(product.stock < quantity) {
        return {data : "Low stock for item", statusCode:400};
    }


    const otherCartItems = cart.items.filter((p) => p.product.toString() !== productId);

let total = calculateCartTotalItems({cartItems: otherCartItems})

existsInCart.quantity = quantity;

total += existsInCart.quantity * existsInCart.unitPrice;

cart.totalAmount= total;

const updatedCart = await cart.save();

return {data: updatedCart, statusCode:200};

}



interface DeleteItemInCart {
    
    userId:string;
    productId:any;
}


export const deleteItemInCart = async ({userId, productId}: DeleteItemInCart) => {

    const cart = await GetActiveCartForUser ({userId});
    
    const existsInCart = cart.items.find(
        (p) => p.product.toString() === productId
    );

    if(!existsInCart){
        return{data: "Item does not exist in cart", statusCode:400};
    }


    const otherCartItems = cart.items.filter((p) => p.product.toString() !== productId);

    const total = calculateCartTotalItems({cartItems: otherCartItems})

    cart.items = otherCartItems;
    cart.totalAmount = total ;

    const updatedCart = await cart.save();

return {data: updatedCart, statusCode:200};

}


const calculateCartTotalItems = ({cartItems} : {cartItems: ICartItem[]; })=> {

    const total = cartItems.reduce((sum, product) => {
        sum += product.quantity * product.unitPrice;
        return sum;
    }, 0 );

    return total ;

}