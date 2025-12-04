import Router from "express";
import Chat from '../models/chat.js'
import User from "../models/user.js";
import ChatInvite from "../models/requests/ChatInvite.js";
// import Message from "../models/Requests/message.js";
import { auth } from "../../middleware/auth.js";

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
        await creator.save();
        await chat.save();
        res.send(chat);
    }
    catch (e){
        console.log(e);
        res.status(500).send();
    }

});

router.post("/chat/:chatId/invitation/:userId", auth, async (req, res) => {
  try {
    const { chatId, userId } = req.params;

    const user = req.user;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    
    
    // if (chat.chatType === "direct") {
        //   return res
        //     .status(400)
        //     .json({ error: "Cannot invite members to a direct chat" });
        // }
        
        const isAlreadyMember = chat.users.some(
            (u) => u.userId.toString() === userId
    );
    if (isAlreadyMember) {
        return res.status(400).json({ error: "User is already in this chat" });
    }

    let receiver = await User.findById(userId);
    if (!receiver) return res.status(404).json({ error: "User to invite not found" });

    const invite = new ChatInvite({
        chat: {
            name: chat.groupName,
            chatId: chat._id
        },
        sender: {
            username: user.username,
            userId: user._id
        },
        receiver: {
            username: receiver.username,
            userId: receiver._id
        }
    });

    receiver.requests.push(invite);

    // chat.users.push({
        //   userId: userToAdd._id,
        //   username: userToAdd.username || "Unknown",
    // });
        
    // await chat.save();
    
    await receiver.save();
        
    res.status(200).json({ message: "Invite sent successfully", invite });
  } 
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/chat/:chatId/invitation/:requestId', auth, async (req, res) => {

    const user = req.user;

    const index = user.requests.findIndex(item => item._id.equals(req.params.requestId));
    
    if (index === -1) {
        return res.status(404).send()
    }

    const arr = user.requests.splice(index, 1); // remove 1 element at index
    const request = arr[0];

    if (req.query.accept === 'false') {
        try {
            await user.save()
            return res.send(user.requests)
        }
        catch (err) {
            return res.status(500).send()
        }
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: "Chat is not found"});

    try{
        chat.users.push({
            username: user.username,
            userId: user._id
        });

        user.chatSessions.push({
            chatId: chat._id,
            users: chat.users,
            owner: chat.owner,
            groupName: chat.groupName
        });

        

        await chat.save();
        await user.save();
    }
    catch (e){
        return 
    }

})

// router.delete("/chat/:chatId/membership", auth, async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     const { userId } = req.body;

//     if (!userId) return res.status(400).json({ error: "User ID required" });

//     const chat = await Chat.findById(chatId);
//     if (!chat) return res.status(404).json({ error: "Chat not found" });

//     const initialCount = chat.users.length;
//     chat.users = chat.users.filter((u) => u.userId.toString() !== userId);

//     if (chat.users.length === initialCount) {
//       return res
//         .status(400)
//         .json({ error: "User was not a member of this chat" });
//     }

//     await chat.save();

//     res.status(200).json({ message: "Successfully left the chat" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// router.get("/chat/:chatId/messages?limit=#&oﬀset=#&search=string", auth, async (req, res) => {
//    try {
//     const { chatId } = req.params;
//     const { limit = 20, offset = 0, search } = req.query;
//     const query = { chatId: chatId };

//     if (search) {
//       query.content = { $regex: search, $options: "i" };
//     }

//     const messages = await Message.find(query)
//       .sort({ createdAt: -1 })
//       .skip(parseInt(offset))
//       .limit(parseInt(limit))
//       .populate("senderId", "username email");
 
//     const totalCount = await Message.countDocuments(query);

//     res.status(200).json({
//       messages,
//       pagination: {
//         total: totalCount,
//         limit: parseInt(limit),
//         offset: parseInt(offset),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

export default router;