import { model, Schema} from 'mongoose';

const chatSchema = new Schema({
    // chatType: {
    //     enum: ["direct", "group"],
    //     required: true
    // },
    messageBuckets: [{
        type: Schema.Types.ObjectId,
        ref: 'MessageBucket',
        required: true
    }],
    users: [
        {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
        }
    ],
    groupName: String,
    owner: {
        username: String,
        userId: Schema.Types.ObjectId
    }
});

const Chat = model('Chat', chatSchema);

export default Chat;