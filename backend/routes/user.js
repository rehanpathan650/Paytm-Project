const express = require('express');
const z = require('zod');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { authMiddleware } = require("../middleware/middleware")
const JWT_SECRET = require('../config');
const { User, Account } = require('../db/db');

const signupSchema = z.object({
     username: z.string().min(3).max(50),
     password: z.string().min(6),
     firstName: z.string().max(50),
     lastName: z.string().max(50)
})

router.post("/signup", async (req,res) => {
    
   const {success} = signupSchema.safeParse(req.body);
   
   if(!success){
      return res.json({
          message: "Email already taken / incorrect inputs"
      })
   }

   const existingUser = await User.findOne({
      username: req.body.username
   })

   if(existingUser){
      return res.json({
          message: "Email already taken / incorrect inputs"
      })
   }

   const hashedPassword = await bcrypt.hash(req.body.password,10);
   
    const user =  await User.create({
        username: req.body.username,
        password: hashedPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    });
    
    const userId = user._id;

   //  Creating a new Account
    await Account.create({
        userId,
        balance: 1 + Math.random()*10000
    })

    const token = jwt.sign({
       userId
     }, JWT_SECRET);

    res.status(200).json({
      message: "User created successfully",
      token
    })
})


const signinSchema = z.object({
     username: z.string().email().min(3).max(50),
     password: z.string()
})

router.post("/signin",async (req,res) => {
   
   const { success } = signinSchema.safeParse(req.body);

   if(!success){
     return res.json({
          message: "Email already taken / incorrect inputs"
     })
   }

   const user = await User.findOne({
      username: req.body.username,
   })
    
   if(user && await bcrypt.compare(req.body.password, user.password)){

      const token = jwt.sign({
          userId: user._id
      },JWT_SECRET);

      res.status(200).json({
          token: token
      })
   } else {
     res.status(411).json({
          msg: "Error while logging in"
     })
   }
})


const updateBody = z.object({
    password: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
})

router.put("/", authMiddleware, async (req,res) => {

   try {
     
      const { success } = updateBody.safeParse(req.body);

      if(!success){
          res.status(411).json({
             message: "Error while updating information"
          })
      }
      // Model.updateOne(filter, updateData)
   
      // This logic is wrong 
      // await User.updateOne(req.body, {
      //     _id: req.userId
      // })
      
      // New Logic
      // await User.updateOne(
      //    { _id: req.userId }, // filter: find the user with this ID
      //    { $set: req.body }   // update: set the fields provided in req.body
      // );

      // Better Logic
      await User.findByIdAndUpdate(
         req.userId,
         { $set: req.body },
         { new: true }
       );
      

      res.json({
          message: "Updated successfully"
      })

   } catch(err) {
      res.status(404).json({
         msg: err
      })
   }   
})



// Route to get users from the backend, filterable via firstName/lastName
// -> This is needed so users can search for their friends and send them money

router.get("/bulk", authMiddleware, async (req,res) => {

   try {
   const filter = req.query.filter || "" ;

   const users = await User.find({
      $or: [{ 
         firstName: {
            $regex : filter,
            $options: "i" 
         }
      },{ 
         lastName: {
            $regex: filter,
            $options: "i"
         }  
      }]
   }) 
   res.json({
      users: users.map(user => ({
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          _id: user._id 
      }))
   })
  }
  catch(err){
    console.error("Error in /bulk route:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }

})


module.exports = router

