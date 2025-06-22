import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import UserModel from '../models/user.model.js'

import dotenv from 'dotenv'
dotenv.config()
const router = express.Router()

const SECRET_KEY = process.env.SECRET_KEY
// console.log(SECRET_KEY)
router.post("", async (req, res) => {
    console.log(req.body)
    const { username, email, password } = req.body

    try {
        const user = await UserModel.findOne({ email })
        if (user) {
            return res.status(400).json({ message: "User already exists" })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = new UserModel({ username, email, password: hashedPassword })
        await newUser.save()
        const token = jwt.sign({ username: newUser.username, id: newUser._id, email: newUser.email, profilePicture: newUser.profileImageURL }, SECRET_KEY, { expiresIn: '24h' })
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000
        })
        res.status(201).json({ message: "User registered successfully", user:newUser,token:token })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" })
    }

})
export default router