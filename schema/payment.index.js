const { stripe } = require("../config/stripe");
const Order = require("../models/Order");

const paymentTypeDefs = `

    type PaymentResponse {
        url: String!
    }

    extend type Mutation {
        createCheckoutSession(orderId: ID!): PaymentResponse!
    }

`;

const paymentResolvers = {

    Mutation: {
        createCheckoutSession: async (parent, { orderId }, context) => {
            const { req } = context;
            if (!req.user) throw new Error('Unauthorized')

            if (!orderId) throw new Error('Order ID is required')

            const order = await Order.findById(orderId).populate("orderItems.product")

            if (!order) throw new Error('Order not found')

            const lineItems = order.orderItems.map((item) => ({
                price_data: {
                    currency: "inr",
                    product_data: { name: item.product.name },
                    unit_amount: item.product.price * 100
                },
                quantity: item.quantity
            }));

            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                payment_method_types: ["card"],
                line_items: lineItems,
                success_url: `https://graphql-frontend-lilac.vercel.app/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `https://graphql-frontend-lilac.vercel.app/payment-failed`,
                metadata: {
                    orderId: order._id.toString()
                }
            })

            return {
                url: session.url
            }

        },
    }
};

module.exports = { paymentTypeDefs, paymentResolvers };