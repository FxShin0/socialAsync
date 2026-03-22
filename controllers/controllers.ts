import { Request, Response } from "express";
import {
  User,
  Iuser,
  Ipost,
  IJWTPayload,
  Post,
  Icomment,
  Comment,
  Friendship,
} from "../db/schemas";
import bcryptjs from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { CLAVE } from "../config/config";
import { Types } from "mongoose";
import { error } from "console";

export const createUser = async (req: Request, res: Response) => {
  const { nombre, username, contraseña } = req.body;
  const userData: Iuser = { nombre, username, contraseña, estado: true };
  if (!nombre || !username || !contraseña) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }
  const existe = await User.exists({ username: username });
  if (existe) {
    res.status(400).json({
      msg: "Usuario ya existe",
      codErr: 102,
    });
    return;
  }
  const contraseñaEncriptada = bcryptjs.hashSync(contraseña);
  userData.contraseña = contraseñaEncriptada;
  const user = new User(userData);
  await user.save();
  res.json({
    msg: "Usuario creado",
    usuario: {
      username: userData.username,
      nombre: userData.nombre,
    },
  });
};

export const getUser = async (req: Request, res: Response) => {
  const { username, contraseña } = req.body;
  if (!username || !contraseña) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  const user: Iuser | null = await User.findOne({ username: username });
  if (!user) {
    res.status(404).json({
      msg: "No se encuentra un usuario con ese username",
      codErr: 103,
    });
    return;
  }

  const esContraseñaValida = bcryptjs.compareSync(contraseña, user.contraseña);
  if (!esContraseñaValida) {
    res.status(401).json({
      msg: "Contraseña no valida",
      codErr: 104,
    });
    return;
  }

  const token = jwt.sign({ username: user.username }, CLAVE, {
    expiresIn: "3h",
  });
  res.json({
    msg: "Login correcto",
    token,
  });
};

export const createPost = async (req: Request, res: Response) => {
  const { token, content } = req.body;
  if (!token || !content) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }
  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.status(401).json({
      msg: "Token no valido",
      err,
      codErr: 105,
    });
    return;
  }

  const postData: Ipost = {
    username: decodificado.username,
    content: content,
    estado: true,
  };

  const post = new Post(postData);
  await post.save();

  res.json({
    msg: "Post creado correctamente",
    post,
  });
};

export const getUserPosts = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  const pagina = parseInt(req.query.page as string) || 1;
  const { username } = req.params;
  if (!token || !username) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }
  const limit = 15;
  const skip = (pagina - 1) * limit;

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.status(401).json({
      msg: "Token no valido",
      err,
      codErr: 105,
    });
    return;
  }

  let hasPermission = await Friendship.exists({
    recieverUsername: { $in: [username, decodificado.username] },
    emitterUsername: { $in: [username, decodificado.username] },
    estado: true,
    isRejected: false,
  });

  if (!hasPermission && username != decodificado.username) {
    res.status(401).json({
      msg: "Debes ser amigo de la persona para ver sus posts",
      codErr: 115,
    });
    return;
  }

  const posts = await Post.find({
    username: username,
    estado: true,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ posts });
};

export const createComment = async (req: Request, res: Response) => {
  const { token, content, postId } = req.body;
  if (!token || !content || !postId) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.json({
      msg: "Token no valido",
      err,
      codErr: 105,
    });
    return;
  }

  const existePost = await Post.exists({
    _id: new Types.ObjectId(postId),
    estado: true,
  });

  if (!existePost) {
    res.status(404).json({
      msg: "No existe un post con el id especificado",
      cod: 106,
    });
    return;
  }

  const commentData: Icomment = {
    username: decodificado.username,
    postId: new Types.ObjectId(postId),
    content: content,
    estado: true,
  };

  const comment = new Comment(commentData);
  await comment.save();

  res.json({
    msg: "Comentario creado.",
    comment,
  });
};

export const deletePost = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { postId } = req.params;
  if (!token || !postId) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.status(401).json({
      msg: "Token no valido",
      err,
      codErr: 105,
    });
    return;
  }

  const existePost = await Post.exists({
    _id: new Types.ObjectId(postId as string),
    estado: true,
    username: decodificado.username,
  });

  if (!existePost) {
    res.status(404).json({
      msg: "No existe un post con el id especificado",
      codErr: 106,
    });
    return;
  }

  try {
    await Comment.updateMany(
      { postId: new Types.ObjectId(postId as string) },
      { $set: { estado: false } },
    );
    await Post.updateOne(
      { _id: new Types.ObjectId(postId as string) },
      { $set: { estado: false } },
    );
  } catch (err) {
    res.status(503).json({
      msg: "Hubo un error al intentar aplicar los cambios",
      err,
    });
    return;
  }

  res.json({
    msg: "Post eliminado",
  });
};
export const deleteComment = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { commentId } = req.params;

  if (!token || !commentId) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.status(401).json({
      msg: "Token no valido",
      err,
    });
    return;
  }

  const existeComentario = await Comment.exists({
    _id: new Types.ObjectId(commentId as string),
    username: decodificado.username,
    estado: true,
  });

  if (!existeComentario) {
    res.status(404).json({
      msg: "No existe un comentario con el id especificado",
      codErr: 107,
    });
    return;
  }

  try {
    await Comment.findOneAndUpdate(
      { _id: new Types.ObjectId(commentId as string) },
      { $set: { estado: false } },
    );
  } catch (err) {
    res.status(503).json({
      msg: "Hubo un error al intentar borrar el comentario",
      err,
    });
  }

  res.json({
    msg: "Comentario eliminado",
  });
};

export const getComments = async (req: Request, res: Response) => {
  let token = req.headers.authorization?.split(" ")[1];
  let { postId } = req.params;

  if (!token || !postId) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.status(401).json({
      msg: "Token no valido",
      err,
    });
    return;
  }

  let existePost = await Post.exists({
    _id: new Types.ObjectId(postId as string),
    estado: true,
  });
  if (!existePost) {
    res.status(404).json({
      msg: "No existe un post con el id especificado",
      codErr: 106,
    });
    return;
  }
  const comments = await Comment.find({
    postId: new Types.ObjectId(postId as string),
    estado: true,
  });

  res.json({
    comments,
  });
};

export const requestFriend = async (req: Request, res: Response) => {
  const { token, username } = req.body;
  if (!token || !username) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.status(401).json({
      msg: "Token no valido",
      err,
    });
    return;
  }

  if (decodificado.username === username) {
    res.status(403).json({
      msg: "No puedes enviar una solicitud de amistad a ti mismo",
      codErr: 114,
    });
  }

  let existeUsuario = await User.exists({ username: username });
  if (!existeUsuario) {
    res.status(404).json({
      msg: "No existe un usuario con el username especificado",
      codErr: 103,
    });
    return;
  }

  let existeSolicitudPendiente = await Friendship.exists({
    emitterUsername: decodificado.username,
    recieverUsername: username,
    estado: false,
    isRejected: false,
  });

  if (existeSolicitudPendiente) {
    res.status(400).json({
      msg: "Ya existe una solicitud de amistad pendiente",
      codErr: 108,
    });
    return;
  }

  let existeSolicitudRechazada = await Friendship.exists({
    emitterUsername: decodificado.username,
    recieverUsername: username,
    isRejected: true,
  });

  if (existeSolicitudRechazada) {
    res.status(403).json({
      msg: "La persona a la que intentas enviarle solicitud ya rechazo una solicitud previa",
      codErr: 111,
    });
    return;
  }

  let existeSolicitudInversa = await Friendship.exists({
    emitterUsername: username,
    recieverUsername: decodificado.username,
    estado: false,
  });

  if (existeSolicitudInversa) {
    await Friendship.updateOne(
      { emitterUsername: username, recieverUsername: decodificado.username },
      { $set: { estado: true, isRejected: false } },
    );

    res.json({
      msg: "No se envio la solicitud de amistad porque ya tenias uno pendiente de la persona, ahora ya son amigos.",
      cod: 200,
    });
    return;
  }

  let existeAmistad = await Friendship.exists({
    emitterUsername: { $in: [username, decodificado.username] },
    recieverUsername: { $in: [username, decodificado.username] },
    estado: true,
  });

  if (existeAmistad) {
    res.status(400).json({
      msg: "Ya son amigos",
      codErr: 109,
    });
    return;
  }

  const friendship = new Friendship({
    emitterUsername: decodificado.username,
    recieverUsername: username,
    estado: false,
    isRejected: false,
  });

  await friendship.save();

  res.json({
    msg: "Solicitud enviada",
    friendship,
  });
};

export const getFriendRequests = async (req: Request, res: Response) => {
  let token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.json({
      msg: "Token no valido",
      err,
    });
    return;
  }

  const friendRequests = await Friendship.find({
    recieverUsername: decodificado.username,
    estado: false,
  });

  res.json({
    friendRequests,
  });
};

export const acceptOrRejectFriendshipRequest = async (
  req: Request,
  res: Response,
) => {
  const { token, username, action } = req.body;
  if (!token || !username || !action) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  if (action != "false" && action != "true") {
    res.status(400).json({
      msg: "action debe ser true o false",
      codErr: 112,
    });
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.status(401).json({
      msg: "Token no valido",
      err,
    });
    return;
  }

  let existeRelacion = await Friendship.exists({
    estado: false,
    isRejected: false,
    recieverUsername: decodificado.username,
    emitterUsername: username,
  });

  if (!existeRelacion) {
    res.status(404).json({
      msg: "No se encuentra la solicitud de amistad indicada o ya esta rechazada/aceptada",
      codErr: 110,
    });
    return;
  }

  let newFriendship;

  if (action === "true") {
    newFriendship = await Friendship.findOneAndUpdate(
      {
        recieverUsername: decodificado.username,
        emitterUsername: username,
        estado: false,
        isRejected: false,
      },
      { $set: { estado: true } },
      { returnDocument: "after" },
    );
  } else {
    newFriendship = await Friendship.findOneAndUpdate(
      {
        recieverUsername: decodificado.username,
        emitterUsername: username,
        estado: false,
        isRejected: false,
      },
      { $set: { estado: false, isRejected: true } },
      { returnDocument: "after" },
    );
  }

  res.json({
    newFriendship,
  });
};

export const deleteFriendship = async (req: Request, res: Response) => {
  let token = req.headers.authorization?.split(" ")[1];
  let { deleteUsername } = req.params;
  if (!token || !deleteUsername) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.json({
      msg: "Token no valido",
      err,
    });
    return;
  }

  let sonAmigos = await Friendship.exists({
    recieverUsername: { $in: [decodificado.username, deleteUsername] },
    emitterUsername: { $in: [decodificado.username, deleteUsername] },
    estado: true,
  });

  if (!sonAmigos) {
    res.status(404).json({
      msg: "No puedes eliminar a alguien que no es tu amigo",
      codErr: 113,
    });
    return;
  }

  const deletedFriendship = await Friendship.findOneAndDelete({
    recieverUsername: { $in: [decodificado.username, deleteUsername] },
    emitterUsername: { $in: [decodificado.username, deleteUsername] },
  });

  res.json({
    msg: "Eliminado",
    deletedFriendship,
  });
};

export const getFriends = async (req: Request, res: Response) => {
  let token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.json({
      msg: "Token no valido",
      err,
    });
    return;
  }

  const friendList = await Friendship.find({
    $or: [
      { recieverUsername: decodificado.username },
      { emitterUsername: decodificado.username },
    ],
    estado: true,
  });

  res.json({ friendList });
};

export const getUserFeed = async (req: Request, res: Response) => {
  let token = req.headers.authorization?.split(" ")[1];
  const pagina = parseInt(req.query.page as string) || 1;
  const limit = 15;
  const skip = (pagina - 1) * limit;

  if (!token) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.json({
      msg: "Token no valido",
      err,
    });
    return;
  }

  let friendList = await Friendship.find({
    $or: [
      { emitterUsername: decodificado.username },
      { recieverUsername: decodificado.username },
    ],
    isRejected: false,
    estado: true,
  }).select("emitterUsername recieverUsername");

  let cleanFriendlist: string[];
  cleanFriendlist = friendList.map((relation) => {
    return relation.emitterUsername === decodificado.username
      ? relation.recieverUsername
      : relation.emitterUsername;
  });

  cleanFriendlist.push(decodificado.username);

  const posts = await Post.find({
    username: { $in: cleanFriendlist },
    estado: true,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    posts,
  });
};

export const getUsers = async (req: Request, res: Response) => {
  let token = req.headers.authorization?.split(" ")[1];
  let username = req.query.username as string;

  if (!token) {
    res.status(400).json({
      msg: "Campos insuficientes en solicitud",
      codErr: 100,
    });
    return;
  }

  let decodificado: IJWTPayload | null = null;
  try {
    decodificado = jwt.verify(token, CLAVE) as IJWTPayload;
  } catch (err) {
    res.json({
      msg: "Token no valido",
      err,
    });
    return;
  }

  let searchList;
  if (!username)
    searchList = await User.find({
      username: { $nin: [decodificado.username] },
    }).select("username");
  else {
    searchList = await User.find({
      $and: [
        { username: { $regex: username, $options: "i" } },
        { username: { $nin: [decodificado.username] } },
      ],
    }).select("username");
  }

  res.json({ searchList });
};
