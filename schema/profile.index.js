const User = require('../models/User');

const profileTypeDefs = `

  extend type User {
    id: ID!
    email: String!
    fullname: String
    address: String
    phone: String
    role: String!
  }

  type ProfileResponse {
    message: String!
    user: User
  }

  input ProfileInput {
    fullname: String!
    address: String!
    phone: String!
  }

  extend type Query {
    fetchProfile: User
  }

  extend type Mutation {
    createProfile(input: ProfileInput!): ProfileResponse!
  }

`;

const profileResolvers = {
  
  Query: {
    fetchProfile: async (parent, args, context) => {
        const { req } = context;
        if (!req.user) throw new Error("Unauthorized");
        const user = await User.findById(req.user._id).select('-password')
        if (!user) throw new Error("User not found")
        
        return user;
      }
  },  

  Mutation: {
      createProfile: async (parent, { input }, context) => {
        const { req } = context;
        const { fullname, address, phone } = input;
    
        if (!req.user) throw new Error("Unauthorized");
    
        if (!fullname || !address || !phone) throw new Error("All fields are required")
    
        const updatedUser = await User.findByIdAndUpdate(req.user._id, { fullname, address, phone }, { new: true }).select('-password');
    
        return {
            message: "Profile created Successfully",
            user: updatedUser
        }
      },
  }
};

module.exports = { profileTypeDefs, profileResolvers };