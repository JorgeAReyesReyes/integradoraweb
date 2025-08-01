import { Document, model, Schema, Types } from "mongoose";

export interface IComentario extends Document {
  salon: string;
  texto: string;
  fecha: Date;
}

const comentarioSchema = new Schema<IComentario>({
  salon: { type: String, required: true },
  texto: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
});

export const Comentario = model<IComentario>("Comentario", comentarioSchema)