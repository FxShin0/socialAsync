"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("./controllers/controllers");
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./db/config");
const config_2 = require("./config/config");
const app = (0, express_1.default)();
app.listen(config_2.PORT, () => {
    console.log(`socialAsync API in port ${config_2.PORT}`);
});
(0, config_1.conectarDB)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res
            .status(400)
            .json({ err: "Formato de JSON invalido", codError: 101 });
    }
    next(err);
});
//post
app.post("/register", controllers_1.createUser);
app.post("/login", controllers_1.getUser);
app.post("/post", controllers_1.createPost);
app.post("/comment", controllers_1.createComment);
app.post("/friend", controllers_1.requestFriend);
app.post("/friend/acceptOrReject", controllers_1.acceptOrRejectFriendshipRequest);
// get
app.get("/posts/:username", controllers_1.getUserPosts);
app.get("/comment/:postId", controllers_1.getComments);
app.get("/friend", controllers_1.getFriendRequests);
app.get("/friend/list", controllers_1.getFriends);
app.get("/feed", controllers_1.getUserFeed);
app.get("/search", controllers_1.getUsers);
//delete
app.delete("/post/:postId", controllers_1.deletePost);
app.delete("/comment/:commentId", controllers_1.deleteComment);
app.delete("/friend/:deleteUsername", controllers_1.deleteFriendship);
//# sourceMappingURL=App.js.map