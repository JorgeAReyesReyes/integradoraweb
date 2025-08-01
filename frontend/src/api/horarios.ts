import axios from 'axios';

/* ===================== Configuración de axios ===================== */
const API = axios.create({
  baseURL: 'http://localhost:3001/api',
});

/* ===================== Tipos ===================== */
export interface Horario {
  _id?: string;
  salon: string;
  day: string; // "Lunes", "Martes", etc.
  inicioDate: string; // formato ISO: "2025-07-22T13:00:00.000Z"
  finDate: string;
}

/* ===================== Peticiones ===================== */
export const fetchHorarios = () => API.get<Horario[]>('/horarios');

export const createHorario = (data: Horario) => API.post('/horarios', data);

export const updateHorario = (id: string, data: Partial<Horario>) =>
  API.put(`/horarios/${id}`, data);

export const deleteHorario = (id: string) => API.delete(`/horarios/${id}`);

export const deleteHorariosPorSalon = (salon: string) =>
  API.delete(`/horarios/salon/${salon}`);

/* ===================== Utilidades ===================== */

/** Obtiene el nombre del día (Lunes, Martes, etc.) desde una fecha en formato ISO */
export const obtenerDiaDesdeFecha = (fecha: string): string => {
  const dias = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado',
  ];
  return dias[new Date(fecha).getDay()];
};

/** Verifica si el valor del campo "day" coincide con el día real de inicioDate */
export const esDiaCorrecto = (horario: Horario): boolean => {
  const diaReal = obtenerDiaDesdeFecha(horario.inicioDate);
  return diaReal === horario.day;
};