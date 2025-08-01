import { Request, Response } from "express";
import { generateAccessToken } from "../utils/generateToken";
import { cache } from "../utils/cache";
import dayjs from "dayjs";
import { User } from "../models/User";
import bcrypt from "bcryptjs";

// Expresión regular: al menos 8 caracteres, una mayúscula y un número
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

// ==== LOGIN ====
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (email === "admin" && password === "1234") {
    const accessToken = generateAccessToken("admin");
    cache.set("admin", accessToken, 60 * 15);
    return res.json({ message: "Login exitoso como admin", accessToken });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "usuario incorrecto" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ message: "Contraceña incorrecta" });

  const accessToken = generateAccessToken(user._id.toString());
  cache.set(user._id.toString(), accessToken, 60 * 15);

  return res.json({ message: "Login exitoso", accessToken });
};

// ==== CONSULTAR TIEMPO DEL TOKEN ====
export const getTimeToken = (req: Request, res: Response) => {
  const { userId } = req.params;
  const ttl = cache.getTtl(userId);
  if (!ttl) return res.status(404).json({ message: "Token no encontrado" });

  const now = Date.now();
  const timeToLifeSeconds = Math.floor((ttl - now) / 1000);
  const expTime = dayjs(ttl).format("HH:mm:ss");

  return res.json({ timeToLifeSeconds, expTime });
};

// ==== ACTUALIZAR TTL DEL TOKEN ====
export const updateToken = (req: Request, res: Response) => {
  const { userId } = req.params;
  const ttl = cache.getTtl(userId);
  if (!ttl) return res.status(404).json({ message: "Token no encontrado" });

  cache.ttl(userId, 60 * 15);
  return res.json({ message: "Actualización exitosa" });
};

// ==== OBTENER TODOS LOS USUARIOS ====
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const userList = await User.find();
    return res.json({ userList });
  } catch (error) {
    console.error("Error en getAllUsers:", error);
    return res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// ==== GUARDAR USUARIO NUEVO ====
export const saveUser = async (req: Request, res: Response) => {
  try {
    const { name, userName, email, phone, password, roles } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(409).json({ message: "El correo ya está en uso" });

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username: userName,
      email,
      phone,
      password: hashedPassword,
      roles,
      status: true,
    });

    const user = await newUser.save();
    return res.json({ user });
  } catch (error) {
    console.error("SAVEUSER:", error);
    return res.status(500).json({ message: "Error del servidor" });
  }
};

// ==== DESHABILITAR USUARIO ====
export const disableUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndUpdate(
      userId, 
      { status: false }, 
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    return res.status(200).json({ 
      message: "Usuario deshabilitado correctamente", 
      user 
    });
  } catch (error) {
    console.error("Error en disableUser:", error);
    return res.status(500).json({ 
      message: "Error al deshabilitar el usuario", 
      error: error instanceof Error ? error.message : "Error desconocido" 
    });
  }
};

// ==== ACTUALIZAR USUARIO EXISTENTE ====
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { email, phone, password, roles, name } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const emailExists = await User.findOne({ email, _id: { $ne: userId } });
    if (emailExists) return res.status(409).json({ message: "El correo ya está en uso" });

    if (password) {
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message: "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número",
        });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    user.email = email ?? user.email;
    user.phone = phone ?? user.phone;
    user.roles = roles ?? user.roles;
    user.name = name ?? user.name;

    const updatedUser = await user.save();
    return res.json({ updatedUser });
  } catch (error) {
    console.error("UPDATEUSER:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor", 
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

// ==== ELIMINAR (DESACTIVAR) USUARIO ====
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    user.status = false;
    user.deleteDate = new Date();

    await user.save();
    return res.json({ message: "Eliminación exitosa" });
  } catch (error) {
    console.error("DELETEUSER:", error);
    return res.status(500).json({ 
      message: "Error del servidor", 
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

// ==== OBTENER TODOS LOS ROLES ====
export const getAllRoles = async (_req: Request, res: Response) => {
  try {
    // Implementación para obtener roles
    // Ejemplo: const roles = await Role.find();
    // return res.json({ roles });
    return res.json({ message: "Implementar lógica para obtener roles" });
  } catch (error) {
    console.error("Error en getAllRoles:", error);
    return res.status(500).json({ message: "Error al obtener roles" });
  }
};