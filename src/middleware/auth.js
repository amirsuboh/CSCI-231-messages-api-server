import jwt from 'jsonwebtoken'
import User from '../users/models/user.js'

export const auth = async (req, res, next) => {
    try {
        let token = req.header('Authorization')
        if (!token) {
            return res.status(400).send("Missing authentication token")
        }

        token = token.replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET)

        let user = await User.findOne({ _id: decoded._id, authTokens: token })
        
        if (!user) {
            return res.status(401).send("Authentication failed")
        }

        req.user = user
        req.token = token
        next()
    }
    catch (error) {
        return res.status(401).send("Invalid authentication token")
    }
}