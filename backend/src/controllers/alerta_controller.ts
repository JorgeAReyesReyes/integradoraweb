import { Request, Response } from "express";
import Alerta from "../models/Alerta"; // Ajusta la importación según tu modelo

// Crear una alerta
export const crearAlerta = async (req: Request, res: Response) => {
  const { salon, mensaje } = req.body;

  try {
    const nueva = await Alerta.create({ salon, mensaje });
    res.status(201).json(nueva);
  } catch (err) {
    res.status(400).json({ message: "Error al guardar alerta", details: err });
  }
};

// Obtener historial
export const getHistorialAlertas = async (_req: Request, res: Response) => {
  try {
    const alertas = await Alerta.find().sort({ createdAt: -1 });
    res.json(alertas);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener alertas", details: err });
  }
};