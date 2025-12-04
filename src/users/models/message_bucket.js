import { model, Schema } from 'mongoose';

const messageBucketSchema = new Schema({
    startDate: Date,
    endDate: Date,
    size: {
        type: Number, 
        required: true
    },
    messages: [
        {
            content: String,
            timestamp: Date,
            sender: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
        }
    ]
});

const MessageBucket = model('MessageBucket', messageBucketSchema);

export default MessageBucket;