import { model, Schema } from 'mongoose';

const requestSchema = new Schema({
    sender: {
        username: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    receiver: {
        username: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }
},
{ 
    timestamps: true ,
    discriminatorKey: 'kind'
});

const RequestModel = model('RequestModel', requestSchema);

export default RequestModel;