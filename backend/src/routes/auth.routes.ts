import { Router } from "express";
import {
  deleteUser,
  updateUser,
  getAllUsers,
  getTimeToken,
  disableUser,
  login,
  saveUser,
  updateToken,
  getAllRoles
} from "../controllers/auth.controller";
import { actualizarDatos } from "../controllers/emporia.controller";
import {
  getHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
  deleteHorariosPorSalon,
  createHorariosPorSalon,
  guardarHorariosSalonCompleto,
} from "../controllers/horario.controller";
import { crearAlerta, getHistorialAlertas } from "../controllers/alerta_controller";
import {
  getComentariosPorSalon,
  crearComentario,
  eliminarComentario,
} from "../controllers/comentario.controller";

const router = Router();

// Verificación de controladores (para debug)
console.log("Login function:", typeof login); // Debe mostrar "function"
console.log("getAllUsers function:", typeof getAllUsers); // Debe mostrar "function"

// Auth  
router.post("/login", login);
router.get("/getTime/:userId", getTimeToken);
router.patch("/update/:userId", updateToken);

// Users
router.get("/users", getAllUsers);
router.post("/users", saveUser);
router.patch("/users/:userId", updateUser);
router.delete("/users/:userId", disableUser);

// Roles
router.get("/roles", getAllRoles);

// Datos Emporia  
router.get("/datos/actualizar", actualizarDatos);

// Horarios  
router.get("/horarios", getHorarios);
router.post("/horarios", createHorario);
router.put("/horarios/:id", updateHorario);
router.delete("/horarios/:id", deleteHorario);
router.delete("/horarios/salon/:salon", deleteHorariosPorSalon);
router.post("/horarios/:salon/individuales", createHorariosPorSalon);
router.post("/horarios/:salon/completo", guardarHorariosSalonCompleto);

// Alertas  
router.post("/alertas", crearAlerta);
router.get("/alertas", getHistorialAlertas);

// Comentarios  
router.get("/comentarios/:salon", getComentariosPorSalon);
router.post("/comentarios", crearComentario);
router.delete("/comentarios/:id", eliminarComentario);

export default router;