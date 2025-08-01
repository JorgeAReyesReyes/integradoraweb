import { Document, model, Schema, Types } from "mongoose";

export interface IRol extends Document {
    _id: Types.ObjectId;
    type: string;
    name: string;
    permissions: string[];
    creationDate: Date;
    status: boolean;
    updateDate: Date;
}

const rolSchema = new Schema<IRol>({
    type: { 
        type: String, 
        required: true,
        enum: ['admin', 'user'],
        unique: true
    },
    name: { 
        type: String,
        required: true,
        unique: true
    },
    permissions: {
        type: [String],
        required: true,
        default: []
    },
    creationDate: { 
        type: Date, 
        default: Date.now,
        required: true,
    },
    status: {
        type: Boolean,
        default: true,
        required: true,
    },
    updateDate: { 
        type: Date,
        default: Date.now,
        required: true,
    },
});

// Crear roles por defecto al iniciar
rolSchema.statics.initDefaultRoles = async function() {
    const count = await this.countDocuments();
    if (count === 0) {
        await this.create([
            { 
                type: 'admin', 
                name: 'Administrador', 
                permissions: ['create', 'read', 'update', 'delete', 'manage_users'] 
            },
            { 
                type: 'user', 
                name: 'Usuario', 
                permissions: ['read'] 
            }
        ]);
        console.log('Roles por defecto creados');
    }
};

export const Rol = model<IRol>("Rol", rolSchema);

// Ejecutar al importar el modelo
Rol.initDefaultRoles().catch(console.error);