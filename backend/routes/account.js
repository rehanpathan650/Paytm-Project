const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/middleware');
const z = require("zod");
const router = express.Router();
const { Account } = require("../db/db");

// An endpoint for user to get their balance
router.get("/balance", authMiddleware, async (req,res) => {
    
    const account = await Account.findOne({
        userId: req.userId
    })
     
    res.json({
        balance: account.balance
    })
})

// An endpoint for user to transfer money to another account
// Status code: 200 and 400.
// Bad Solution (doesn't use transactions)
// Good Solution (uses transactions in db)
// Problems you might run into if you run into the problem mentioned above, feel free to proceed with the bad solution

// Bad Solution
// const transferSchema = z.object({
//     to: z.string(),
//     amount: z.number()
// });

// router.post("/transfer",accountMiddleware ,async (req,res) => {
   
//    const { success } = transferSchema.safeParse(req.body);
   
//    if(!success){
//       return res.send("invalid inputs");
//    }
   
//    const { amount, to } = req.body;

//    const account = await Account.findOne({
//        userId: req.userId
//    });

//    if(account.balance < amount ){
//       return res.json({
//          message: "Insufficient balance"
//       })
//    }

//    const toAccount = Account.findOne({
//       userId: to
//    })

//    if( !toAccount ){
//        return res.status(400).json({
//           message: "Invalid account"
//        })
//    }
    
//     // Decreasing the balance of the Sending User
//     await Account.updateOne({
//         userId: req.userId
//     }, {
//        $inc: {
//           balance: -amount
//        } 
//     })
    
//     // Increasing the balance of the Receiving User
//     await Account.updateOne({
//         userId: to
//     }, {
//        $inc: {
//           balance: amount
//        } 
//     })

//     res.json({
//         message: "Transfer successful"
//     })
// })

// Good Solution

const transferSchema = z.object({
    to: z.string(),
    amount: z.number()
});

router.post("/transfer" ,authMiddleware ,async (req,res) => {

    try {
     
    const { success } = transferSchema.safeParse(req.body);

    if(!success) {
        return res.status(402).json({
            msg: "Invalid input"
        })
    }

    const session = await mongoose.startSession();

    session.startTransaction();
    const { amount, to } = req.body;

    // Fetch the accounts within the transaction
    const account = await Account.findOne({ userId: req.userId}).session(session);

    if(!account || account.balance < amount){
        await session.abortTransaction();
        return res.status(404).json({
            msg: "Insufficient balance"
        })
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);
    if(!toAccount) {
        await session.abortTransaction();
        return res.status(404).json({
            msg: "Invalid account"
        })
    }

    // Perform the Transfer
    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount }}).session(session);
    await Account.updateOne({ userId: to}, {$inc: { balance: amount }}).session(session);

    // Commit the transaction
    await session.commitTransaction();
    res.json({
        msg: "Transfer successful"
    })

    } catch(error){
        res.status(404).json({
            error
        })
    }

})

module.exports = router
