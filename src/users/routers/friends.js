import Router from 'express';
import User from '../models/user.js';
import FriendRequest from '../models/requests/FriendRequest.js';
import { auth } from '../../middleware/auth.js';

const router = new Router();

router.post('/friend-request/:id', auth, async (req, res) => {
    let sender = req.user
    let receiver = await User.findById(req.params.id)

    if (!receiver) {
        return res.status(404).send('User not found')
    }

    const request = new FriendRequest({
        sender: {
            username: sender.username,
            userId: sender._id
        },
        receiver: {
            username: receiver.username,
            userId: receiver._id
        }
    })

    receiver.requests.push(request)

    try {
        await request.save();
        await receiver.save();
        res.send(request)
    }
    catch (err) {
        console.log(err)
        res.status(500).send()
    }
});

router.patch('/friend-request/:id', auth, async (req, res) => {
    const user = req.user

    const index = user.requests.findIndex(item => item._id.equals(req.params.id));

    if (index === -1) {
        return res.status(404).send()
    }

    const arr = user.requests.splice(index, 1); // remove 1 element at index
    const request = arr[0]

    if (!req.query || !Object.hasOwn(req.query, 'accept')) {
        return res.status(400).send()
    }

    if (req.query.accept === 'false') {
        try {
            await user.save()
            return res.send(user.requests)
        }
        catch (err) {
            return res.status(500).send()
        }
    }

    const sender = await User.findById(request.sender.userId)

    if (sender) {
        try {
            if (!user.friends.some(item => item.userId.equals(sender._id))) {
                user.friends.push({ username: sender.username, userId: sender._id })
                await user.save()
            }
            if (!sender.friends.some(item => item.userId.equals(user._id))) {
                sender.friends.push({ username: user.username, userId: user._id })
                await sender.save()
            }
        }
        catch (err) {
            return res.status(500).send()
        }
    }

    try {
        user.save();
        res.send(user.requests);
    }
    catch (err) {
        return res.status(500).send()
    }

});

router.get('/friend-requests', auth, async (req, res) => {

    res.send(req.user.requests)

});

router.delete('/friend/:userId', auth, async (req, res) => {
    const user = req.user

    // TODO: remove user from target's friends list

    user.friends = user.friends.filter(item => !item.userId.equals(req.params.userId))

    try {
        await user.save()
        res.send(user.friends)
    }
    catch (err) {
        console.log(err)
        res.status(500).send()
    }
});

export default router;