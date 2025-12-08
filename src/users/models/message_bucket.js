import { model, Schema } from 'mongoose';
import Message from './message.js';

const messageBucketSchema = new Schema({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    },
    startDate: Date,
    endDate: Date,
    size: {
        type: Number, 
        required: true,
        default: 0
    },
    messages: [Message.schema]
});

const MessageBucket = model('MessageBucket', messageBucketSchema);

export default MessageBucket;