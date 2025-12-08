import Router from "express";
import Chat from '../models/chat.js'
import User from "../models/user.js";
import ChatInvite from "../models/requests/ChatInvite.js";
import { auth } from "../../middleware/auth.js";
import MessageBucket from "../models/message_bucket.js";
import Message from "../models/message.js";

const router = new Router();

router.post('/chat', auth, async (req, res) => {
    let creator = req.user;

    let name = "New Chat";
    if (req.body && req.body.groupName) {
        name = req.body.groupName;
    }

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
        groupName: name
    });

    creator.chatSessions.push({
        chatId: chat._id,
        // users: chat.users,
        // owner: chat.owner,
        groupName: chat.groupName
    });

    try {
        await creator.save();
        await chat.save();
        res.status(201).send(chat);
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
        sender: {
            username: user.username,
            userId: user._id
        },
        receiver: {
            username: receiver.username,
            userId: receiver._id
        },
        chat: {
            name: chat.groupName,
            chatId: chat._id
        }
    });

    receiver.requests.push(invite);

    // chat.users.push({
        //   userId: userToAdd._id,
        //   username: userToAdd.username || "Unknown",
    // });
        
    // await chat.save();
    // await invite.save();
    
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
        return res.status(404).send();
    }

    const arr = user.requests.splice(index, 1); // remove 1 element at index
    const request = arr[0];

    if (!req.query || !Object.hasOwn(req.query, 'accept')) {
        return res.status(400).send();
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

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: "Chat is not found"});

    try{
        chat.users.push({
            username: user.username,
            userId: user._id
        });
        
        
        user.chatSessions.push({
            chatId: chat._id,
            // users: chat.users,
            // owner: chat.owner,
            groupName: chat.groupName
        });

        await chat.save();
        await user.save();
        return res.status(200).send(chat);
    }
    catch (e){
        return res.status(500).send();
    }

});

router.delete("/chat/:chatId/membership", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const user = req.user;
    // const { userId } = req.body;

    // if (!userId) return res.status(400).json({ error: "User ID required" });
    if (!user) return res.status(400).json({ error: "User not found" });


    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    if (chat.owner.userId.equals(user._id)) return res.status(401).json({ error: "Owners cannot leave a chat"});

    // const initialCount = chat.users.length;
    // chat.users = chat.users.filter((u) => u.userId.toString() !== userId);

    let index = chat.users.findIndex(u => u.userId.equals(user._id));
    if (index === -1){
        return res
        .status(400)
        .json({ error: "User was not a member of this chat" });
    }

    chat.users.splice(index, 1);

    // chat.users = chat.users.filter((u) => {
    //     !u.userId.equals(user._id)
    // });

    // if (chat.users.length === initialCount) {
    //   return res
    //     .status(400)
    //     .json({ error: "User was not a member of this chat" });
    // }

    // user.chatSessions = user.chatSessions.filter(c => c.chatId === chatId);
    index = user.chatSessions.findIndex(c => c.chatId.equals(chat._id));
    if (index === -1){
        return res.status(400).json({error: "Chat not found in user sessions"});
    }

    user.chatSessions.splice(index, 1);

    await chat.save();
    await user.save();

    res.status(200).json({ message: "Successfully left the chat" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/chat/:chatId/message', auth, async (req, res) => {
    const user = req.user;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) return res.status(400).json({error: "Chat is not found"});

    if (!req.body || !req.body.content) return res.status(400).json({error: "No message content found"});

    try {

        const message = new Message({
            chatId: chat._id,
            content: req.body.content,
            timestamp: new Date(),
            sender: user._id
        });

        let recentBucket;

        let bucketsCount = chat.messageBuckets.length;

        if (bucketsCount === 0){
            recentBucket = new MessageBucket({
                chatId: chat._id,
                startDate: message.timestamp,
                size: 0
            });
            chat.messageBuckets.push(recentBucket._id);
        }
        else {
            let recentBucketId = chat.messageBuckets[chat.messageBuckets.length - 1];
            recentBucket = await MessageBucket.findById(recentBucketId);
        }


        if (recentBucket.size === 10){
            recentBucket = new MessageBucket({
                chatId: chat._id,
                startDate: message.timestamp,
                size: 0
            });
            chat.messageBuckets.push(recentBucket._id);
        }

        recentBucket.messages.push(message);
        recentBucket.endDate = message.timestamp;
        recentBucket.size += 1;

        await recentBucket.save();
        await chat.save();
        return res.status(201).send(message);
    }
    catch (e) {
        return res.status(500).send();
    }

});

router.get("/chat/:chatId/messages", auth, async (req, res) => {
   try {
    const { chatId } = req.params;
    const { limit = 10, offset = 0, search } = req.query;
    const query = { chatId: chatId };

    if (search) {
        search = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.content = { $regex: search, $options: "i" };
    }

    const messages = await MessageBucket.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate("senderId", "username email");
 
    const totalCount = await Message.countDocuments(query);

    res.status(200).json({
      messages,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;