const { makeExecutableSchema } = require("@graphql-tools/schema")
const { authTypeDefs, authResolvers } = require("./auth.index")
const { cartTypeDefs, cartResolvers } = require("./cart.index")
const { categoryTypeDefs, categoryResolvers } = require("./category.index")
const { orderTypeDefs, orderResolvers } = require("./order.index")
const { paymentTypeDefs, paymentResolvers } = require("./payment.index")
const { productTypeDefs, productResolvers } = require("./product.index")
const { profileTypeDefs, profileResolvers } = require("./profile.index")
const { mergeResolvers, mergeTypeDefs } = require("@graphql-tools/merge")

const typeDefs = mergeTypeDefs([authTypeDefs, profileTypeDefs, categoryTypeDefs, productTypeDefs, cartTypeDefs, orderTypeDefs, paymentTypeDefs])

const resolvers = mergeResolvers([authResolvers, profileResolvers, categoryResolvers, productResolvers, cartResolvers, orderResolvers, paymentResolvers])

module.exports = makeExecutableSchema({ typeDefs, resolvers });