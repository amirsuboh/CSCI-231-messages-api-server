import { Schema } from "mongoose";
import RequestModel from "./Request.js";

const friendRequestSchema = new Schema({ });

const FriendRequest = RequestModel.discriminator('FriendRequest', friendRequestSchema);

export default FriendRequest;