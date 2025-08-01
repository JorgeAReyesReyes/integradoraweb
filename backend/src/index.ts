import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";  // <--- Importa cors
import routes from "./routes/auth.routes"; // aqui estan todas las rutas juntas
import { iniciarJobEmporia } from "./jobs/actualizarDatosJob";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api", routes);

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/integradora")
  .then(() => {
    console.log("✅ Conectado a MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });

    iniciarJobEmporia(); // Se inicia después de conectar a MongoDB
  })
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));