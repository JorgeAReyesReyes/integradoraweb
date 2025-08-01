import { Document, model, Schema, Types } from "mongoose";

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    password: string;
    email: string;
    phone: string;
    status: boolean;
    createDate: Date;
    deleteDate?: Date;
    roles: Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    createDate: {
        type: Date,
        default: Date.now,
    },
    roles: [{
        type: Schema.Types.ObjectId,
        ref: "Rol",
        required: true,
        validate: {
            validator: async function(roles: Types.ObjectId[]) {
                const count = await model("Rol").countDocuments({ _id: { $in: roles } });
                return count === roles.length;
            },
            message: "Uno o más roles no existen"
        }
    }],
    phone: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        required: true,
        default: true,
    },
    deleteDate: {
        type: Date,
    },
});

// Middleware para validar roles antes de guardar
userSchema.pre('save', async function(next) {
    if (this.isModified('roles')) {
        const Rol = model("Rol");
        const rolesExistentes = await Rol.countDocuments({ _id: { $in: this.roles } });
        if (rolesExistentes !== this.roles.length) {
            throw new Error("Uno o más roles no existen");
        }
    }
    next();
});

export const User = model<IUser>("User", userSchema);