"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.getUserFeed = exports.getFriends = exports.deleteFriendship = exports.acceptOrRejectFriendshipRequest = exports.getFriendRequests = exports.requestFriend = exports.getComments = exports.deleteComment = exports.deletePost = exports.createComment = exports.getUserPosts = exports.createPost = exports.getUser = exports.createUser = void 0;
const schemas_1 = require("../db/schemas");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const mongoose_1 = require("mongoose");
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, username, contraseña } = req.body;
    const userData = { nombre, username, contraseña, estado: true };
    if (!nombre || !username || !contraseña) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    const existe = yield schemas_1.User.exists({ username: username });
    if (existe) {
        res.status(400).json({
            msg: "Usuario ya existe",
            codErr: 102,
        });
        return;
    }
    const contraseñaEncriptada = bcryptjs_1.default.hashSync(contraseña);
    userData.contraseña = contraseñaEncriptada;
    const user = new schemas_1.User(userData);
    yield user.save();
    res.json({
        msg: "Usuario creado",
        usuario: {
            username: userData.username,
            nombre: userData.nombre,
        },
    });
});
exports.createUser = createUser;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, contraseña } = req.body;
    if (!username || !contraseña) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    const user = yield schemas_1.User.findOne({ username: username });
    if (!user) {
        res.status(404).json({
            msg: "No se encuentra un usuario con ese username",
            codErr: 103,
        });
        return;
    }
    const esContraseñaValida = bcryptjs_1.default.compareSync(contraseña, user.contraseña);
    if (!esContraseñaValida) {
        res.status(401).json({
            msg: "Contraseña no valida",
            codErr: 104,
        });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ username: user.username }, config_1.CLAVE, {
        expiresIn: "3h",
    });
    res.json({
        msg: "Login correcto",
        token,
    });
});
exports.getUser = getUser;
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, content } = req.body;
    if (!token || !content) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.status(401).json({
            msg: "Token no valido",
            err,
            codErr: 105,
        });
        return;
    }
    const postData = {
        username: decodificado.username,
        content: content,
        estado: true,
    };
    const post = new schemas_1.Post(postData);
    yield post.save();
    res.json({
        msg: "Post creado correctamente",
        post,
    });
});
exports.createPost = createPost;
const getUserPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    const pagina = parseInt(req.query.page) || 1;
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
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.status(401).json({
            msg: "Token no valido",
            err,
            codErr: 105,
        });
        return;
    }
    let hasPermission = yield schemas_1.Friendship.exists({
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
    const posts = yield schemas_1.Post.find({
        username: username,
        estado: true,
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    res.json({ posts });
});
exports.getUserPosts = getUserPosts;
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, content, postId } = req.body;
    if (!token || !content || !postId) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.json({
            msg: "Token no valido",
            err,
            codErr: 105,
        });
        return;
    }
    const existePost = yield schemas_1.Post.exists({
        _id: new mongoose_1.Types.ObjectId(postId),
        estado: true,
    });
    if (!existePost) {
        res.status(404).json({
            msg: "No existe un post con el id especificado",
            cod: 106,
        });
        return;
    }
    const commentData = {
        username: decodificado.username,
        postId: new mongoose_1.Types.ObjectId(postId),
        content: content,
        estado: true,
    };
    const comment = new schemas_1.Comment(commentData);
    yield comment.save();
    res.json({
        msg: "Comentario creado.",
        comment,
    });
});
exports.createComment = createComment;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    const { postId } = req.params;
    if (!token || !postId) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.status(401).json({
            msg: "Token no valido",
            err,
            codErr: 105,
        });
        return;
    }
    const existePost = yield schemas_1.Post.exists({
        _id: new mongoose_1.Types.ObjectId(postId),
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
        yield schemas_1.Comment.updateMany({ postId: new mongoose_1.Types.ObjectId(postId) }, { $set: { estado: false } });
        yield schemas_1.Post.updateOne({ _id: new mongoose_1.Types.ObjectId(postId) }, { $set: { estado: false } });
    }
    catch (err) {
        res.status(503).json({
            msg: "Hubo un error al intentar aplicar los cambios",
            err,
        });
        return;
    }
    res.json({
        msg: "Post eliminado",
    });
});
exports.deletePost = deletePost;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    const { commentId } = req.params;
    if (!token || !commentId) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.status(401).json({
            msg: "Token no valido",
            err,
        });
        return;
    }
    const existeComentario = yield schemas_1.Comment.exists({
        _id: new mongoose_1.Types.ObjectId(commentId),
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
        yield schemas_1.Comment.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(commentId) }, { $set: { estado: false } });
    }
    catch (err) {
        res.status(503).json({
            msg: "Hubo un error al intentar borrar el comentario",
            err,
        });
    }
    res.json({
        msg: "Comentario eliminado",
    });
});
exports.deleteComment = deleteComment;
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    let { postId } = req.params;
    if (!token || !postId) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.status(401).json({
            msg: "Token no valido",
            err,
        });
        return;
    }
    let existePost = yield schemas_1.Post.exists({
        _id: new mongoose_1.Types.ObjectId(postId),
        estado: true,
    });
    if (!existePost) {
        res.status(404).json({
            msg: "No existe un post con el id especificado",
            codErr: 106,
        });
        return;
    }
    const comments = yield schemas_1.Comment.find({
        postId: new mongoose_1.Types.ObjectId(postId),
        estado: true,
    });
    res.json({
        comments,
    });
});
exports.getComments = getComments;
const requestFriend = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, username } = req.body;
    if (!token || !username) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
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
    let existeUsuario = yield schemas_1.User.exists({ username: username });
    if (!existeUsuario) {
        res.status(404).json({
            msg: "No existe un usuario con el username especificado",
            codErr: 103,
        });
        return;
    }
    let existeSolicitudPendiente = yield schemas_1.Friendship.exists({
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
    let existeSolicitudRechazada = yield schemas_1.Friendship.exists({
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
    let existeSolicitudInversa = yield schemas_1.Friendship.exists({
        emitterUsername: username,
        recieverUsername: decodificado.username,
        estado: false,
    });
    if (existeSolicitudInversa) {
        yield schemas_1.Friendship.updateOne({ emitterUsername: username, recieverUsername: decodificado.username }, { $set: { estado: true, isRejected: false } });
        res.json({
            msg: "No se envio la solicitud de amistad porque ya tenias uno pendiente de la persona, ahora ya son amigos.",
            cod: 200,
        });
        return;
    }
    let existeAmistad = yield schemas_1.Friendship.exists({
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
    const friendship = new schemas_1.Friendship({
        emitterUsername: decodificado.username,
        recieverUsername: username,
        estado: false,
        isRejected: false,
    });
    yield friendship.save();
    res.json({
        msg: "Solicitud enviada",
        friendship,
    });
});
exports.requestFriend = requestFriend;
const getFriendRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.json({
            msg: "Token no valido",
            err,
        });
        return;
    }
    const friendRequests = yield schemas_1.Friendship.find({
        recieverUsername: decodificado.username,
        estado: false,
    });
    res.json({
        friendRequests,
    });
});
exports.getFriendRequests = getFriendRequests;
const acceptOrRejectFriendshipRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.status(401).json({
            msg: "Token no valido",
            err,
        });
        return;
    }
    let existeRelacion = yield schemas_1.Friendship.exists({
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
        newFriendship = yield schemas_1.Friendship.findOneAndUpdate({
            recieverUsername: decodificado.username,
            emitterUsername: username,
            estado: false,
            isRejected: false,
        }, { $set: { estado: true } }, { returnDocument: "after" });
    }
    else {
        newFriendship = yield schemas_1.Friendship.findOneAndUpdate({
            recieverUsername: decodificado.username,
            emitterUsername: username,
            estado: false,
            isRejected: false,
        }, { $set: { estado: false, isRejected: true } }, { returnDocument: "after" });
    }
    res.json({
        newFriendship,
    });
});
exports.acceptOrRejectFriendshipRequest = acceptOrRejectFriendshipRequest;
const deleteFriendship = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    let { deleteUsername } = req.params;
    if (!token || !deleteUsername) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.json({
            msg: "Token no valido",
            err,
        });
        return;
    }
    let sonAmigos = yield schemas_1.Friendship.exists({
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
    const deletedFriendship = yield schemas_1.Friendship.findOneAndDelete({
        recieverUsername: { $in: [decodificado.username, deleteUsername] },
        emitterUsername: { $in: [decodificado.username, deleteUsername] },
    });
    res.json({
        msg: "Eliminado",
        deletedFriendship,
    });
});
exports.deleteFriendship = deleteFriendship;
const getFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.json({
            msg: "Token no valido",
            err,
        });
        return;
    }
    const friendList = yield schemas_1.Friendship.find({
        $or: [
            { recieverUsername: decodificado.username },
            { emitterUsername: decodificado.username },
        ],
        estado: true,
    });
    res.json({ friendList });
});
exports.getFriends = getFriends;
const getUserFeed = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    const pagina = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (pagina - 1) * limit;
    if (!token) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.json({
            msg: "Token no valido",
            err,
        });
        return;
    }
    let friendList = yield schemas_1.Friendship.find({
        $or: [
            { emitterUsername: decodificado.username },
            { recieverUsername: decodificado.username },
        ],
        isRejected: false,
        estado: true,
    }).select("emitterUsername recieverUsername");
    let cleanFriendlist;
    cleanFriendlist = friendList.map((relation) => {
        return relation.emitterUsername === decodificado.username
            ? relation.recieverUsername
            : relation.emitterUsername;
    });
    cleanFriendlist.push(decodificado.username);
    const posts = yield schemas_1.Post.find({
        username: { $in: cleanFriendlist },
        estado: true,
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    res.json({
        posts,
    });
});
exports.getUserFeed = getUserFeed;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    let username = req.query.username;
    if (!token) {
        res.status(400).json({
            msg: "Campos insuficientes en solicitud",
            codErr: 100,
        });
        return;
    }
    let decodificado = null;
    try {
        decodificado = jsonwebtoken_1.default.verify(token, config_1.CLAVE);
    }
    catch (err) {
        res.json({
            msg: "Token no valido",
            err,
        });
        return;
    }
    let searchList;
    if (!username)
        searchList = yield schemas_1.User.find({
            username: { $nin: [decodificado.username] },
        }).select("username");
    else {
        searchList = yield schemas_1.User.find({
            $and: [
                { username: { $regex: username, $options: "i" } },
                { username: { $nin: [decodificado.username] } },
            ],
        }).select("username");
    }
    res.json({ searchList });
});
exports.getUsers = getUsers;
//# sourceMappingURL=controllers.js.map