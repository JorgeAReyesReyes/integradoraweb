import { Schema, model, Document, Model } from "mongoose";

export interface IDatos extends Document {
  timestamp: Date;
  device_gid: number;
  channel_num: number;
  channel_name: string;
  usage_kWh: number;
  usage_W: number;
  percentage: number;
}

const datosSchema = new Schema<IDatos>({
  timestamp: {
    type: Date,
    required: [true, "El timestamp es requerido"],
    index: true,
    validate: {
      validator: (v: Date) => !isNaN(v.getTime()),
      message: "Timestamp debe ser una fecha válida"
    }
  },
  device_gid: {
    type: Number,
    required: [true, "El device_gid es requerido"],
    min: [0, "El device_gid no puede ser negativo"]
  },
  channel_num: {
    type: Number,
    required: [true, "El channel_num es requerido"],
    min: [1, "El número de canal debe ser al menos 1"]
  },
  channel_name: {
    type: String,
    required: [true, "El channel_name es requerido"],
    trim: true,
    minlength: [2, "El nombre del canal debe tener al menos 2 caracteres"],
    maxlength: [50, "El nombre del canal no puede exceder 50 caracteres"]
  },
  usage_kWh: {
    type: Number,
    required: [true, "El usage_kWh es requerido"],
    min: [0, "El consumo en kWh no puede ser negativo"],
    get: (v: number) => parseFloat(v.toFixed(4)),
    set: (v: number) => parseFloat(v.toFixed(4))
  },
  usage_W: {
    type: Number,
    required: [true, "El usage_W es requerido"],
    min: [0, "El consumo en vatios no puede ser negativo"],
    get: (v: number) => parseFloat(v.toFixed(2)),
    set: (v: number) => parseFloat(v.toFixed(2))
  },
  percentage: {
    type: Number,
    required: [true, "El percentage es requerido"],
    min: [0, "El porcentaje no puede ser menor que 0"],
    max: [100, "El porcentaje no puede exceder 100"],
    get: (v: number) => parseFloat(v.toFixed(1)),
    set: (v: number) => parseFloat(v.toFixed(1))
  }
}, {
  timestamps: false,
  versionKey: false,
  toJSON: { getters: true },
  toObject: { getters: true },
  collation: { locale: 'es', strength: 1 }
});

// Índices para mejorar consultas
datosSchema.index({ device_gid: 1, channel_num: 1 });
datosSchema.index({ timestamp: -1 });
datosSchema.index({ channel_name: "text" });

// Middleware de validación previa
datosSchema.pre<IDatos>("save", function(next) {
  if (this.usage_kWh < 0 || this.usage_W < 0 || this.percentage < 0) {
    console.warn(`⚠️ Datos inválidos detectados: ${this}`);
  }
  next();
});

export const Datos: Model<IDatos> = model<IDatos>("Datos", datosSchema);

// Función de utilidad para limpiar datos antiguos
export const limpiarDatosAntiguos = async (dias: number = 30) => {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - dias);
  
  try {
    const result = await Datos.deleteMany({ 
      timestamp: { $lt: fechaLimite } 
    }).exec();
    
    console.log(`🧹 ${result.deletedCount} registros antiguos eliminados`);
    return result;
  } catch (error) {
    console.error("❌ Error al limpiar datos antiguos:", error);
    throw error;
  }
};