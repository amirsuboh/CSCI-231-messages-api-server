import Chat from '../models/chat.js';
import Router from 'express';
import { auth } from '../../middleware/auth.js'

const router = new Router();

router.post('/chat', auth, async (req, res) => {
    let creator = req.user;

    const chat = new Chat({
        owner: {
            username: creator.username,
            userId: creator._id
        },
        users: [
            {
                username: creator.username,
                userId: creator._id
            }
        ],
        groupName: req.body.groupName ?? ''
    });

    creator.chatSessions.push({
        chatId: chat._id,
        users: chat.users,
        owner: chat.owner,
        groupName: chat.groupName
    });

    try {
        creator.save();
        res.send();
    }
    catch (e){
        console.log(e);
        res.status(500).send();
    }

});

export default router;