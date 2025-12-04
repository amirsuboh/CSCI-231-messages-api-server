import { Schema } from "mongoose";
import Request from "./Request.js";

const friendRequestSchema = new Schema({ });

const FriendRequest = Request.discriminator('FriendRequest', friendRequestSchema);

export default FriendRequest;