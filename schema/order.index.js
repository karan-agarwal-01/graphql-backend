const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");

const orderTypeDefs = `

    type OrderItem {
        product: Product
        quantity: Int!
    }

    type Order {
        id: ID!
        user: User!
        orderItems: [OrderItem!]!
        totalAmount: Float!
        shippingAddress: String!
        phone: String!
        status: String!
        createdAt: String! 
    }

    type OrderResponse {
        message: String!
        order: Order
    }

    extend type Query {
        getAllOrder: [Order]
        getUserOrder: [Order]
    }

    extend type Mutation {
        createOrder(shippingAddress: String!, phone: String!): OrderResponse!
        updateOrderStatus(id: ID!, status: String!): String!
        deleteOrder(id: ID!): String!
        cancelOrder(id: ID!): String!
    }

`;

const orderResolvers = {

    Query: {
        getAllOrder: async () => {
            const orders = await Order.find().populate("user", "fullname email address phone").populate("orderItems.product", "name image price")
            return orders.map(order => ({
                ...order._doc,
                orderItems: order.orderItems.filter(item => item.product)
            }));
        },

        getUserOrder: async (parent, args, context) => {
            const { req } = context;
            if (!req.user) throw new Error('Unauthorized')

            const orders = await Order.find({ user: req.user.id }).populate("user", "fullname email address phone").populate("orderItems.product", "name image price")

            return orders.map(order => ({
                ...order._doc,
                orderItems: order.orderItems.filter(item => item.product)
            }));
        }
    },

    Mutation: {
        createOrder: async (parent, { shippingAddress,  phone}, context) => {
            const { req } = context;
            if (!req.user) throw new Error('Unauthorized')

            if (!shippingAddress || !phone) throw new Error("Create Profile First");

            const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
            if (!cart) throw new Error("Cart is empty")

            const totalAmount = cart.totalPrice;
            const order =  new Order({
                user: req.user.id,
                orderItems: cart.items.map((i) => ({
                    product: i.product,
                    quantity: i.quantity
                })),
                shippingAddress,
                phone,
                totalAmount
            });

            if (order.orderItems.length === 0) throw new Error("No order found")
            await order.save();

            cart.items = [];
            cart.totalPrice = 0;
            await cart.save();

            await order.populate("user");

            return {
                message: "Order created successfully",
                order: order
            }
        },

        updateOrderStatus: async (parent, {id, status}, context) => {
            const { req } = context;
            if (!req.user) throw new Error("Unauthorized");
            if (req.user.role !== "admin") throw new Error("Access denied: Admins only");

            const order = await Order.findById(id);
            if (!order) throw new Error("Order not found");

            if (status === "Confirmed" && order.status !== "Confirmed") {
                for (let item of order.orderItems) {
                    if (!item.product) continue;
                    const product = await Product.findById(item.product._id)
                    if (product.stock < item.quantity) throw new Error(`${product.name} does not have enough stock`)
                    product.stock -= item.quantity
                    await product.save();
                }
            }

            order.status = status;
            await order.save();

            return "Order status updated"
        },

        deleteOrder: async (parent, { id }, context) => {
            const { req } = context;
            if (!req.user) throw new Error("Unauthorized");
            if (req.user.role !== "admin") throw new Error("Access denied: Admins only");

            const order = await Order.findByIdAndDelete(id);
            if (!order) throw new Error("Order not found");

            return "Order deleted successfully"
        },

        cancelOrder: async (parent, { id }, context) => {
            const { req } = context;
            if (!req.user) throw new Error("Unauthorized");
            
            const order = await Order.findById(id).populate("orderItems.product");
            if (!order) throw new Error("Order not found");

            const nonCancelable = ["Shipped", "Delivered"];

            if (nonCancelable.includes(order.status)) throw new Error("Order cannot be canceled at this stage");

            for (let item of order.orderItems) {
                if (!item.product) continue;
                const product = await Product.findById(item.product._id);
                product.stock += item.quantity;
                await product.save();
            }

            order.status = "Cancelled"
            await order.save();
            
            return "Order Cancelled Successfully"
        }
    }
};

module.exports = { orderTypeDefs, orderResolvers };