import express, { NextFunction, Request, Response } from "express";
import {
  acceptOrRejectFriendshipRequest,
  createComment,
  createPost,
  createUser,
  deleteComment,
  deleteFriendship,
  deletePost,
  getComments,
  getFriendRequests,
  getFriends,
  getUser,
  getUserFeed,
  getUserPosts,
  getUsers,
  requestFriend,
} from "./controllers/controllers";
import cors from "cors";
import { conectarDB } from "./db/config";
import { PORT } from "./config/config";
const app = express();

app.listen(PORT, () => {
  console.log(`socialAsync API in port ${PORT}`);
});
conectarDB();
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ err: "Formato de JSON invalido", codError: 101 });
  }
  next(err);
});

//post
app.post("/register", createUser);
app.post("/login", getUser);
app.post("/post", createPost);
app.post("/comment", createComment);
app.post("/friend", requestFriend);
app.post("/friend/acceptOrReject", acceptOrRejectFriendshipRequest);

// get
app.get("/posts/:username", getUserPosts);
app.get("/comment/:postId", getComments);
app.get("/friend", getFriendRequests);
app.get("/friend/list", getFriends);
app.get("/feed", getUserFeed);
app.get("/search", getUsers);

//delete
app.delete("/post/:postId", deletePost);
app.delete("/comment/:commentId", deleteComment);
app.delete("/friend/:deleteUsername", deleteFriendship);
