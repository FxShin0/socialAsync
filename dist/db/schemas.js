"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Friendship = exports.Comment = exports.Post = exports.User = void 0;
const mongoose_1 = require("mongoose");
const friendshipSchema = new mongoose_1.Schema({
    emitterUsername: {
        type: String,
        required: true,
    },
    recieverUsername: {
        type: String,
        required: true,
    },
    estado: {
        type: Boolean,
        required: true,
    },
    isRejected: {
        type: Boolean,
        required: true,
    },
}, { timestamps: true });
const commentSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    estado: {
        type: Boolean,
        required: true,
    },
    postId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
}, { timestamps: true });
const postSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    estado: {
        type: Boolean,
        required: true,
    },
}, { timestamps: true });
const userSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    contraseña: {
        type: String,
        required: true,
    },
    nombre: {
        type: String,
        required: true,
    },
    estado: {
        type: Boolean,
        required: true,
    },
});
exports.User = (0, mongoose_1.model)("user", userSchema);
exports.Post = (0, mongoose_1.model)("post", postSchema);
exports.Comment = (0, mongoose_1.model)("comment", commentSchema);
exports.Friendship = (0, mongoose_1.model)("friendship", friendshipSchema);
//# sourceMappingURL=schemas.js.map