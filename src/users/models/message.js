import { model, Schema } from 'mongoose';

const messageSchema = new Schema({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    },
    content: String,
    timestamp: Date,
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Message = model('Message', messageSchema);

export default Message;