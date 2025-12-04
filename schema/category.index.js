const Category = require("../models/Category");

const categoryTypeDefs = `

  type Category {
    id: ID!
    name: String!
    description: String!
    image: String!
  }

  type categoryResponse {
    message: String!
    category: Category
  }

  input CategoryInput {
    name: String!
    description: String!
    image: String!
  }

  extend type Query {
    fetchCategories: [Category!]!
  }

  extend type Mutation {
    createCategory(input: CategoryInput!): categoryResponse!
  }

`;

const categoryResolvers = {

    Category: {
        id: (parent) => parent._id.toString()
    },

    Query: {
        fetchCategories: async () => {
            const categories = await Category.find()
            return categories;
        }
    },

    Mutation: {
        createCategory: async (parent, { input }, context) => {
            const { req } = context;
            if (!req.user) throw new Error("Unauthorized");

            if (req.user.role !== "admin") {
                throw new Error("Access denied: Admins only");
            }
        
            const { name, description, image } = input;

            if (!name || !description || !image) throw new Error("All fields are required")

            const category = await Category.create({ name, description, image });

            return {
                message: "category created Successfully",
                category: category
            }
        },
    }
};

module.exports = { categoryTypeDefs, categoryResolvers };