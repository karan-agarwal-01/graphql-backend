const { buildSchema } = require('graphql');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/Token');
const jwt = require('jsonwebtoken')

const setTokenCookies = (res, _id) => {
  const accessToken = generateAccessToken(_id);
  const refreshToken = generateRefreshToken(_id);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 1000,
    path: "/",
  })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

const authTypeDefs = `

  type User {
    id: ID!
    email: String!
    fullname: String
    address: String
    phone: String
    role: String!
  }

  type AuthResponse {
    message: String!
    user: User
  }

  input AuthInput {
    email: String!
    password: String!
  }

  type Query {
    verifyUser: User
  }

  type Mutation {
    registerUser(input: AuthInput!): AuthResponse!
    loginUser(input: AuthInput!): AuthResponse!
    refreshAccessToken: String!
    logout: String!
  }

`;

const authResolvers = {

  Query: {
    verifyUser: async (parent, args, context) => {
      const token = context.req.cookies.accessToken;
      if (!token) return null;
    
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.id);
        return user ? { id: user._id, email: user.email, role: user.role } : null;
      } catch (err) {
        return null;
      }
    }
  },

  Mutation: {
    registerUser: async (parent, { input }, context) => {
      const { email, password  } = input;
      const { req, res } = context;
  
      if (!email || !password) throw new Error("Please enter all fields");
  
      const userExist = await User.findOne({ email });
      if (userExist) throw new Error("User already exists");
  
      const user = await User.create({ email, password });
  
      setTokenCookies(res, user._id)
  
      return {
          message: "User registered successfully", user: {
            id: user._id,
            email: user.email,
            role: user.role
          }
      }
    },
  
    loginUser: async (parent, { input }, context) => {
      const { email, password  } = input;
      const { req, res } = context;
  
      if (!email || !password) throw new Error("Please enter all fields");
  
      const user = await User.findOne({ email })
      if (!user) throw new Error("Invalid login credentials");
  
      const match = await user.matchPassword(password);
      if (!match) throw new Error("Invalid credentials")
  
      setTokenCookies(res, user._id);
  
      return {
          message: "User Login successfully", user: {
            id: user._id,
            email: user.email,
            role: user.role
          }
      }
    },
  
    refreshAccessToken: async (parent, args, context) => {
      const { req, res } = context;
  
      const token = req.cookies.refreshToken;
      if (!token) throw new Error("No refresh token")
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) throw new Error("User not found")
  
        const newAccessToken = generateAccessToken(user._id);
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 60 * 60 * 1000,
          path: "/",
        })
  
        return "Access token refreshed";
      } catch (error) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        throw new Error("Invalid refresh token")
      }
    },
  
    logout: async (parent, args, context) => {
      const { req, res } = context;
      res.clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: "none" });
      res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "none" });
      return "Logout successfully"
    },
  }
};

module.exports = { authTypeDefs, authResolvers };