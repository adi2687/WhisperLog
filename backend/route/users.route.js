import express from 'express'
import UserModel from '../models/user.model.js'
const router = express.Router()

router.get("/:username", async (req, res) => {
    console.log('backend profile iss',req.params.username.charAt(0).toUpperCase() + req.params.username.slice(1))
    const user=await UserModel.findOne({username: req.params.username.charAt(0).toUpperCase() + req.params.username.slice(1)})
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }
    console.log('user is ',user)
    res.status(200).json({user:user})
})

export default router