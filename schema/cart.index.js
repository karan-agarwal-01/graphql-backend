const Cart = require("../models/Cart");
const Product = require("../models/Product");

const cartTypeDefs = `

    type CartItem {
        product: Product!
        quantity: Int!
    }

    type Cart {
        id: ID!
        user: ID!
        items: [CartItem!]!
        totalPrice: Float!
    }

    type CartResponse {
        message: String!
        cart: Cart
    }

    extend type Query {
        getCart: Cart
    }

    extend type Mutation {
        addToCart(productId: ID!, quantity: Int!): CartResponse!
        removeFromCart(productId: ID!): String!
        updateQuantity(productId: ID!, quantity: Int!): String!
        clearCart: String!
    }

`;

const cartResolvers = {

    Query: {
        getCart: async (parent, args, context) => {
            const { req } = context;
            if (!req.user) throw new Error('Unauthorized');

            const cart = await Cart.findOne({ user: req.user.id}).populate("items.product");
            if (!cart)  throw new Error("Cart not found")

            return cart;
        },
    },

    Mutation: {
        addToCart: async (parent, { productId, quantity }, context) => {
            const { req } = context;
            if (!req.user) throw new Error('Unauthorized');

            const product = await Product.findById(productId);
            if (!product) throw new Error("Product not found")

            let cart = await Cart.findOne({ user: req.user.id});
            if (!cart) {
                cart = await Cart.create({
                    user: req.user.id,
                    items: [{ product: productId, quantity }],
                    totalPrice: product.price * quantity
                })
            } else {
                const existingItem = cart.items.find((i) =>  i.product.toString() === productId)
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cart.items.push({ product: productId, quantity })
                }

                cart.totalPrice += product.price * quantity
            }
            await cart.save()

            const populateCart = await Cart.findById(cart._id).populate("items.product")

            return {
                message: "Product added to cart",
                cart: populateCart
            }
        }, 

        removeFromCart: async (parent, { productId }, context) => {
            const { req } = context;
            if (!req.user) throw new Error('Unauthorized');

            const cart = await Cart.findOne({ user: req.user.id});
            if (!cart) throw new Error("Cart not found")

            const itemIndex = cart.items.findIndex((i) => i.product.toString() === productId);
            if (itemIndex === -1) throw new Error('Product not found in cart')

            const product = await Product.findById(productId);
            cart.totalPrice -= product.price * cart.items[itemIndex].quantity;
            cart.items.splice(itemIndex, 1);
            await cart.save();

            return "Product removed from the cart";
        },

        updateQuantity: async (parent, { productId, quantity }, context) => {
            const { req } = context;
            if (!req.user) throw new Error('Unauthorized');

            const cart = await Cart.findOne({ user: req.user.id});
            if (!cart) throw new Error("Cart not found")

            const item = cart.items.find((i) => i.product.toString() === productId)
            if (!item) throw new Error("Product not found in cart")

            const product = await Product.findById(productId);
            cart.totalPrice -= product.price * item.quantity;
            item.quantity = quantity;
            cart.totalPrice += product.price * quantity;
            
            await cart.save();
            return "Quantity Updated"
        },

        clearCart: async (parent, args, context) => {
            const { req } = context;
            if (!req.user) throw new Error('Unauthorized');

            const cart = await Cart.findOne({ user: req.user.id})
            cart.items = [],
            cart.totalPrice = 0

            await cart.save();

            return "Cart Cleared"
        }
    }
};

module.exports = { cartTypeDefs, cartResolvers };