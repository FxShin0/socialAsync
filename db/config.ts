import mongoose from "mongoose";
import { MONGO_URI } from "../config/config";

export const conectarDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("socialAsync DB conectada.");
  } catch (error) {
    console.log(error);
    throw new Error("Hubo un error al conectar con la DB.");
  }
};
