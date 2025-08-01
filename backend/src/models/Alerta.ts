import mongoose, { Schema, Document } from "mongoose";

export interface IAlerta extends Document {
  salon: string;
  mensaje: string;
  createdAt: Date;
}

const alertaSchema = new Schema<IAlerta>({
  salon: {
     type: String, 
     required: true 
    },
  mensaje: {
     type: String,
      required: true
     },
}, { 
  timestamps: true 

}); 

const Alerta = mongoose.model<IAlerta>("Alerta", alertaSchema);
export default Alerta;