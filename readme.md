⚠️ Bonus Tip: Protect against malicious updates
If you're concerned about users sending unwanted fields (like isAdmin: true), it's better to only allow specific fields like:

const { firstName, lastName, password } = req.body;

await User.updateOne({ _id: req.userId }, {
  ...(firstName && { firstName }),
  ...(lastName && { lastName }),
  ...(password && { password }),
});


The code you're seeing uses $regex for partial and case-insensitive search in MongoDB.


Ohh yes, you're diving into some good security fundamentals now — let's break down what **salt** is in the context of **password hashing** 👇

---

### 🧂 What is **Salt**?

A **salt** is a random string that gets added to a password *before hashing it*.

This prevents attackers from using precomputed tables (like rainbow tables) to reverse-engineer hashes.

---

### 🔐 How does it work?

Let’s say the password is:

```
password123
```

Without salt:
```js
hashed = hash("password123");
```

With salt (e.g., `salt = "x9@qz"`):
```js
hashed = hash("password123x9@qz");
```

Even if two users have the same password, their **hashed passwords will be different** due to unique salts.

---

### 💡 Real Example with `bcrypt` in Node.js

```js
const bcrypt = require('bcrypt');

// Generate salt
const salt = await bcrypt.genSalt(10);

// Hash password with salt
const hashedPassword = await bcrypt.hash("password123", salt);

// Store hashedPassword in DB
```

---

### ✅ Why is salt important?

- 🛡️ Prevents **rainbow table attacks**
- 🔒 Ensures **unique hashes** for same passwords
- 🕵️‍♂️ Makes brute-force slower because each password requires its own computation

---

### 🤔 Where is the salt stored?

- In libraries like **bcrypt**, the salt is usually **embedded in the hash**.
- So when you store `hashedPassword` in your DB, it **already contains the salt**.

---

### TL;DR:
> Salt = a random string added to passwords before hashing  
> 🔐 Makes stored hashes more secure  
> 🛡️ Helps protect against precomputed attacks  

Want to see how to verify a password using bcrypt too?


⚠️ Important Note (from the image):
You shouldn't store floats for balances in the DB ❌
Instead, store integers ✅

Why?
Floating point numbers can lose precision, especially in monetary calculations.

Imagine someone has ₹33.33 → store it as 3333 (i.e., in paise or 100x the value).

This way, ₹1 = 100, ₹10 = 1000, etc.

This is a common practice in financial systems to avoid rounding issues and precision errors.

💡 Real-World Precision:
“There is a certain precision that you need to support (for India it is 2/4 decimal places)”

You might store ₹1.50 as 150, or ₹0.0001 as 1, depending on how much precision you want.

For Indian Rupees, usually 2 decimal places (like paise) is sufficient.

🧠 Bonus Tip (From the bottom line):
You should reference the users table in the schema.

In Mongoose, this means:

js
Copy
Edit
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true
}
This lets you "join" user data using .populate() if needed later.


## Step 10 - Transactions in Databases 

-> A lot of times, you want multiple databases transactions to be atomic 
-> Either all of them should update, or none should 

This is super important in the case of a bank.

# Can you guess what; wrong in the following code ?

const mongoose = require("mongoose");
const Account = require("./path to your account model");


const transferFunds = async (fromAccountId, toAccountId, amount) => {

   // Decrement the balance of the fromAccount
   await Account.findByIdAndUpdate(fromAccountId, {$inc : { balance: -amount }})
  
   // Increment the balance of the fromAccount
   await Account.findByIdAndUpdate(fromAccountId, {$inc : { balance: amount }})

}

// Example usage 
transferFunds('fromAccountID', toAccountID, 100);

## Note: Inconsistency happens in the above code

-> What if the database crashes right after the first request (only the balance is decreased for one user, and not for the second user)
#  What if the Node.js crashes right after the first update ? 
  -> It would lead to a "database inconsistency" .Amount would get debited for the first user,and not credited into the other users 
       account
  -> If a failure ever happens, the first transaction should rollback

-> That is what is called a "transaction" in a database. We need to implement a transaction on the next set of endpoints
    that allows users to transfer INR.



## Step 11 - Initilize balances on signup 

-> Update the signup endpoint to give the user a random balance between 1 to 10000
-> This is so we don't have to integrate with banks and give them random balances to start with 


Absolutely! Let's break down sessions in MongoDB (Mongoose) — especially when you're dealing with transactions and need to ensure data consistency (like in banking apps 💸).

🧠 What is a MongoDB Session?
A session in MongoDB is like a context under which commands can be executed. It’s used primarily for:

Transactions (multi-document)

Retryable writes

Auditing, versioning, etc.

In Mongoose, sessions are used to handle multi-document transactions — changes that should either all succeed or all fail.

✅ When Do You Need a Transaction?
Use it when:

You’re updating multiple collections (e.g., deduct balance from Account A and add to Account B)

You want to avoid inconsistent data

🔄 Example Use Case:
Let’s say you're building a money transfer API:

Deduct ₹100 from User A

Add ₹100 to User B

You must ensure both steps happen together, or neither happen.

🔧 How to Use Sessions in Mongoose?
1. Start a session
js
Copy
Edit
const session = await mongoose.startSession();
2. Start a transaction
js
Copy
Edit
session.startTransaction();
3. Perform operations within the session
js
Copy
Edit
await Account.updateOne(
  { userId: senderId },
  { $inc: { balance: -amount } },
  { session }
);

await Account.updateOne(
  { userId: receiverId },
  { $inc: { balance: amount } },
  { session }
);
4. Commit or Abort
js
Copy
Edit
await session.commitTransaction(); // if everything went well
// or
await session.abortTransaction();  // if something failed
5. End the session
js
Copy
Edit
session.endSession();
🧪 Full Example:
js
Copy
Edit
const session = await mongoose.startSession();
try {
  session.startTransaction();

  await Account.updateOne(
    { userId: senderId },
    { $inc: { balance: -amount } },
    { session }
  );

  await Account.updateOne(
    { userId: receiverId },
    { $inc: { balance: amount } },
    { session }
  );

  await session.commitTransaction();
  console.log("Transaction successful");
} catch (err) {
  await session.abortTransaction();
  console.error("Transaction failed:", err);
} finally {
  session.endSession();
}
⚠️ Important Notes:
Transactions require MongoDB replica set or sharded cluster.

Mongoose >= 5.2.0 supports transactions.

Always handle errors and ensure session is ended to avoid memory leaks.

Let me know if you want me to help you add this logic to your code (like the money transfer thing you shared earlier).

## 

Great question — you're on the right track thinking about validation in both **Zod** and **Mongoose**!

### ✅ Short Answer:
**Yes, you should absolutely include validation in Zod**, even if you're already validating in Mongoose.

---

### 🧠 Why You Need Both:

#### 1. **Zod handles validation at the API level (before DB)**
- Catches bad input early
- Prevents unnecessary DB queries
- Gives better user feedback
- Improves security and performance

#### 2. **Mongoose handles validation at the database schema level**
- Acts as a last line of defense
- Enforces constraints even if data somehow bypasses your API (e.g., via DB admin panel or other internal tools)
- Helps with DB integrity

---

### 🔍 Looking at Your Code:

You've done a solid job with your Zod schema:

```js
const signupSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  firstName: z.string().max(50),
  lastName: z.string().max(50)
});
```

But here's a **tiny bug** in logic:

Your **Zod schema allows any string** for `username`, but your `signinSchema` expects it to be an **email**:

```js
const signinSchema = z.object({
  username: z.string().email(),
  password: z.string()
});
```

But in your Mongoose schema, the `username` isn't an email — it’s just a lowercase, unique string. So either:
- Update the `signupSchema` to require an email **and** update your Mongoose schema to reflect that.
- **OR** (probably better if you're not doing email logins) remove `.email()` from the `signinSchema`.

---

### ✅ Fix for signinSchema:
If you’re using `username` (not email) for login:

```js
const signinSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string()
});
```

---

### 💡 Bonus Suggestion – Hash the Password

Currently you're storing passwords as plain text in MongoDB:

```js
password: req.body.password
```

That’s risky. Use **bcrypt** to hash passwords before saving them:

```bash
npm install bcrypt
```

Then:

```js
const bcrypt = require('bcrypt');

// In signup route
const hashedPassword = await bcrypt.hash(req.body.password, 10);

await User.create({
  username: req.body.username,
  password: hashedPassword,
  firstName: req.body.firstName,
  lastName: req.body.lastName,
});
```

And in signin:

```js
const user = await User.findOne({ username: req.body.username });

if (user && await bcrypt.compare(req.body.password, user.password)) {
  // success
}
```

---

### ✅ Summary:
- Yes, keep both **Zod** and **Mongoose** validation.
- Fix `signinSchema` to match the actual type of `username`.
- Strongly recommend hashing passwords with **bcrypt**.
- You're doing a solid job with clean, modular routes and schema design 💪

Want help plugging in bcrypt properly, or anything else in the app?
