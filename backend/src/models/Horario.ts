import { Schema, model, Document } from "mongoose";

export interface IHorario extends Document {
  salon: string;
  day: string;
  inicioDate: Date;
  finDate: Date;
}

const HorarioSchema = new Schema<IHorario>({
  salon: { 
    type: String, 
    required: true,
    enum: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'lab']
  },
  day: { 
    type: String, 
    required: true,
    enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  },
  inicioDate: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(this: IHorario, value: Date) {
        return value < this.finDate;
      },
      message: 'La fecha de inicio debe ser anterior a la fecha de fin'
    }
  },
  finDate: { 
    type: Date, 
    required: true 
  },
}, {
  timestamps: true
});

// Índice para búsquedas frecuentes
HorarioSchema.index({ salon: 1, day: 1 });
HorarioSchema.index({ inicioDate: 1, finDate: 1 });

export const Horario = model<IHorario>("Horario", HorarioSchema);