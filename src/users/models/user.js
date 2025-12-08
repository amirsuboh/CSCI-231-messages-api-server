import { model, Schema} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import RequestModel from './requests/Request.js';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
        // minLength: [5, "Username must be longer than 5 characters"]
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        minLength: [8, "Password must be longer than 8 characters"]
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: (email) => validator.isEmail(email),
            message: "Invalid email format"
        }
    },
    authTokens: [String],
    requests: [ RequestModel.schema ],
    friends: [
        {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: Schema.Types.ObjectId,
                required: true
            }
        }
    ],
    chatSessions: [ 
        {
            chatId: {
                type: Schema.Types.ObjectId,
                required: true
            },
            // users: [
            //     {
            //         username: {
            //             type: String,
            //             required: true
            //         },
            //         userId : {
            //             type: Schema.Types.ObjectId,
            //             required: true
            //         }
            //     }
            // ],
            // owner: {
            //     username: String,
            //     userId: Schema.Types.ObjectId
            // },
            // chatType: {
            //     enum: ["direct", "group"],
            //     required: true
            // },
            groupName: {
                type: String,
                required: true
            }
        }
    ]
});

userSchema.pre("save", async function (next) {
    const user = this;

    if (user.isModified("password")){
        user.password = await bcrypt.hash(user.password, 10);
    }

    next();
});

userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token = jwt.sign(
        {
            _id: user._id.toString(),
            type: "User"
        },
        process.env.JSON_WEB_TOKEN_SECRET
    );

    return token;
};

userSchema.methods.toJSON = function () {
    const user = this.toObject();

    delete user.password;
    delete user.authTokens;
    delete user.__v;

    return user;
};

const User = model('User', userSchema);

export default User;