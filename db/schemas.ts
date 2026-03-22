import { Schema, Model, model, Types } from "mongoose";

export interface Iuser {
  username: string;
  contraseña: string;
  nombre: string;
  estado: boolean;
}

export interface Ipost {
  username: string;
  content: string;
  estado: boolean;
}

export interface IJWTPayload {
  username: string;
}

export interface Icomment {
  username: string;
  content: string;
  estado: boolean;
  postId: Types.ObjectId;
}

export interface Ifriendship {
  emitterUsername: string;
  recieverUsername: string;
  estado: boolean;
  isRejected: boolean;
}

const friendshipSchema = new Schema<Ifriendship>(
  {
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
  },
  { timestamps: true },
);

const commentSchema = new Schema<Icomment>(
  {
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
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true },
);

const postSchema = new Schema<Ipost>(
  {
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
  },
  { timestamps: true },
);

const userSchema = new Schema<Iuser>({
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

export const User: Model<Iuser> = model<Iuser>("user", userSchema);

export const Post: Model<Ipost> = model<Ipost>("post", postSchema);

export const Comment: Model<Icomment> = model<Icomment>(
  "comment",
  commentSchema,
);

export const Friendship: Model<Ifriendship> = model<Ifriendship>(
  "friendship",
  friendshipSchema,
);
