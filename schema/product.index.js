const Category = require("../models/Category");
const Product = require("../models/Product");

const productTypeDefs = `

  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    image: String!
    stock: Int!
    category: Category!
  }

  type ProductResponse {
    message: String!
    product: Product
  }

  input ProductInput {
    name: String!
    description: String!
    price: Float!
    stock: Int!
    image: String!
    categoryId: ID!
  }

  extend type Query {
    fetchProducts: [Product!]!
    fetchSingleProduct(id: ID!): Product
  }

  extend type Mutation {
    createProduct(input: ProductInput!): ProductResponse!
    deleteProduct(id: ID!): String!
  }

`;

const productResolvers = {

    Product: {
        id: (parent) => parent._id.toString(),
        category: async (parent) => {
            return await Category.findById(parent.category)
        }
    },

    Query: {
        fetchProducts: async () => {
            return await Product.find().populate("category");
        },
        fetchSingleProduct: async (parent, { id }) => {
            return await Product.findById(id).populate("category")
        }
    },

    Mutation: {
        createProduct: async (parent, { input }, context) => {
            const { req } = context;
            if (!req.user) throw new Error("Unauthorized");

            if (req.user.role !== "admin") {
                throw new Error("Access denied: Admins only");
            }
        
            const { name, description, price, stock, image, categoryId } = input;

            if (!name || !price || !categoryId) throw new Error("All fields are required")

            const category = await Category.findById(categoryId);
            if (!category) throw new Error("Category not found");

            const product = await Product.create({ name, description, price, stock, image, category: category._id })

            return {
                message: "Product created successfully",
                product: product
            }
        },

        deleteProduct: async (parent, { id }, context) => {
            const { req } = context;

            if (!req.user) throw new Error("Unauthorized");
            if (req.user.role !== "admin") throw new Error("Access denied: Admins only");

            const deleted = await Product.findByIdAndDelete(id);
            if (!deleted) throw new Error("Product not found");

            return "Product deleted successfully"
        }
    }
};

module.exports = { productTypeDefs, productResolvers };