import { Request, Response } from "express";
import { Comentario } from "../models/Comentario";

// GET /api/comentarios/:salon
export const getComentariosPorSalon = async (req: Request, res: Response) => {
  const { salon } = req.params;
  try {
    const comentarios = await Comentario.find({ salon }).sort({ fecha: -1 });
    res.json({ comentarios });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener comentarios", error });
  }
};

// POST /api/comentarios
export const crearComentario = async (req: Request, res: Response) => {
  const { salon, texto } = req.body;
  try {
    const nuevoComentario = new Comentario({ salon, texto });
    await nuevoComentario.save();
    res.json({ comentario: nuevoComentario });
  } catch (error) {
    res.status(500).json({ message: "Error al crear comentario", error });
  }
};

// DELETE /api/comentarios/:id
export const eliminarComentario = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await Comentario.findByIdAndDelete(id);
    res.json({ message: "Comentario eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar comentario", error });
  }
};