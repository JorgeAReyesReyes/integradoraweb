import { Request, Response } from "express";
import { Horario } from "../models/Horario";

export const getHorarios = async (req: Request, res: Response) => {
  try {
    const horarios = await Horario.find().sort({ salon: 1, day: 1, inicioDate: 1 });
    res.json(horarios);
  } catch (error) {
    console.error('Error en getHorarios:', error);
    res.status(500).json({ error: "Error al obtener horarios" });
  }
};

export const createHorario = async (req: Request, res: Response) => {
  try {
    const nuevoHorario = new Horario(req.body);
    await nuevoHorario.save();
    res.status(201).json(nuevoHorario);
  } catch (error) {
    console.error('Error en createHorario:', error);
    res.status(500).json({ error: "Error al crear el horario" });
  }
};

export const updateHorario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const horarioActualizado = await Horario.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(horarioActualizado);
  } catch (error) {
    console.error('Error en updateHorario:', error);
    res.status(500).json({ error: "Error al actualizar el horario" });
  }
};

export const deleteHorario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Horario.findByIdAndDelete(id);
    res.json({ mensaje: "Horario eliminado correctamente" });
  } catch (error) {
    console.error('Error en deleteHorario:', error);
    res.status(500).json({ error: "Error al eliminar el horario" });
  }
};

export const deleteHorariosPorSalon = async (req: Request, res: Response) => {
  try {
    const { salon } = req.params;
    await Horario.deleteMany({ salon });
    res.json({ mensaje: `Horarios del salón ${salon} eliminados` });
  } catch (error) {
    console.error('Error en deleteHorariosPorSalon:', error);
    res.status(500).json({ error: "Error al eliminar horarios por salón" });
  }
};

export const createHorariosPorSalon = async (req: Request, res: Response) => {
  try {
    const { salon } = req.params;
    const horarios = req.body;

    if (!Array.isArray(horarios)) {
      return res.status(400).json({ error: "Se esperaba un arreglo de horarios" });
    }

    // Validar que todos los horarios tengan los campos requeridos
    for (const horario of horarios) {
      if (!horario.day || !horario.inicioDate || !horario.finDate) {
        return res.status(400).json({ error: "Todos los horarios deben tener day, inicioDate y finDate" });
      }
    }

    await Horario.deleteMany({ salon });

    const horariosConSalon = horarios.map((h: any) => ({ ...h, salon }));
    const horariosInsertados = await Horario.insertMany(horariosConSalon);

    res.status(201).json({
      mensaje: `Horarios insertados para el salón ${salon}`,
      horarios: horariosInsertados,
    });
  } catch (error) {
    console.error('Error en createHorariosPorSalon:', error);
    res.status(500).json({ error: "Error al crear horarios por salón" });
  }
};

export const guardarHorariosSalonCompleto = async (req: Request, res: Response) => {
  try {
    const { salon } = req.params;
    const nuevosHorarios = req.body;

    if (!Array.isArray(nuevosHorarios)) {
      return res.status(400).json({ error: "Se esperaba un arreglo de horarios" });
    }

    // Validar horarios antes de guardar
    const horariosValidados = nuevosHorarios.map((h: any) => {
      if (!h.day || !h.inicioDate || !h.finDate) {
        throw new Error("Faltan campos requeridos en alguno de los horarios");
      }
      return {
        salon,
        day: h.day,
        inicioDate: new Date(h.inicioDate),
        finDate: new Date(h.finDate),
      };
    });

    await Horario.deleteMany({ salon });
    const horariosInsertados = await Horario.insertMany(horariosValidados);

    res.status(201).json({
      mensaje: `Horarios reemplazados para el salón ${salon}`,
      horarios: horariosInsertados,
    });
  } catch (error) {
    console.error('Error en guardarHorariosSalonCompleto:', error);
    res.status(500).json({ 
      error: "Error al reemplazar horarios por salón",
      details: error instanceof Error ? error.message : undefined
    });
  }
};