import express from 'express'
import UserModel from '../models/user.model.js'
const router = express.Router()

router.get("/:id", async (req, res) => {
    const user=await UserModel.findById(req.params.id)
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }
    res.status(200).json({user:user})
})

export default router