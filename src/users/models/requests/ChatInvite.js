import { Schema } from "mongoose";
import Request from "./Request.js";

const chatInviteSchema = new Schema({ 
    chat: {
        name: {
            type: String,
            required: true
        },
        chatId: {
            type: Schema.Types.ObjectId,
            ref: 'Chat',
            required: true
        }
    }
});

const ChatInvite = Request.discriminator('ChatInvite', chatInviteSchema);

export default ChatInvite;