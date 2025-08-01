import { Request, Response } from "express";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { Datos } from "../models/Datos";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const PYTHON_TIMEOUT = 45000; // 45 segundos (mayor que el timeout de Python)
const MAX_LOG_LENGTH = 1000; // Máximo de caracteres a loguear

// Helper para parsear JSON con limpieza ante posibles caracteres erróneos
function safeJsonParse(data: string): any {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Error parsing JSON:", e.message);
    const cleaned = data.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
    try {
      return JSON.parse(cleaned);
    } catch {
      return data; // Devuelve original si no puede parsear
    }
  }
}

// Valida si es JSON válido
function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Parseo flexible de fechas con fallback
function parseDate(dateString: any): Date {
  if (dateString instanceof Date) return dateString;
  if (typeof dateString === "number") return new Date(dateString);

  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) return parsed;

  const moment = require("moment");
  const formats = ["YYYY-MM-DD HH:mm:ss", "MM/DD/YYYY HH:mm:ss", "DD-MM-YYYY HH:mm:ss"];
  for (const fmt of formats) {
    const date = moment(dateString, fmt);
    if (date.isValid()) return date.toDate();
  }
  return new Date();
}

// Transformación y validación de registros recibidos
function transformAndValidateData(datos: any[]): { validos: any[]; invalidos: any[] } {
  const validos = [];
  const invalidos = [];

  for (const [index, d] of datos.entries()) {
    try {
      const registro = {
        timestamp: parseDate(d.timestamp),
        device_gid: parseInt(d.device_gid) || 0,
        channel_num: parseInt(d.channel_num) || index + 1,
        channel_name: String(d.channel_name || `Canal ${index + 1}`).substring(0, 50),
        usage_kWh: Math.max(0, parseFloat(d.usage_kWh) || 0),
        usage_W: Math.max(0, parseFloat(d.usage_W) || 0),
        percentage: Math.min(Math.max(0, parseFloat(d.percentage) || 0), 100),
      };

      if (!registro.timestamp || isNaN(registro.timestamp.getTime())) {
        throw new Error("Fecha inválida");
      }
      validos.push(registro);
    } catch (error: any) {
      invalidos.push({ index, error: error.message, rawData: d });
    }
  }

  return { validos, invalidos };
}

// Inserción con reintentos en MongoDB
async function insertDataWithRetry(
  data: any[],
  maxRetries = 3
): Promise<{ insertedCount: number; duplicates: number; insertTime: string }> {
  let attempt = 0;
  let lastError;
  const startTime = process.hrtime();

  while (attempt < maxRetries) {
    attempt++;
    try {
      const result = await Datos.insertMany(data, { ordered: false, rawResult: true });
      const insertTime = process.hrtime(startTime);
      return {
        insertedCount: result.insertedCount,
        duplicates: data.length - result.insertedCount,
        insertTime: `${insertTime[0]}.${Math.round(insertTime[1] / 1e6)}s`,
      };
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Intento ${attempt} fallido. Reintentando...`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  console.error("❌ Todos los reintentos fallaron:", lastError);
  return { insertedCount: 0, duplicates: 0, insertTime: "0s" };
}

// Controlador principal para actualizar datos
export const actualizarDatos = async (_req: Request, res: Response) => {
  const scriptPath = path.resolve(__dirname, "..", "scripts", "get_usage.py");

  console.log(`\n🔍 Iniciando actualización de datos Emporia`);
  console.log(`📂 Ruta del script: ${scriptPath}`);

  if (!fs.existsSync(scriptPath)) {
    const errorMsg = `❌ El script Python no existe en ${scriptPath}`;
    console.error(errorMsg);
    return res.status(500).json({
      success: false,
      message: errorMsg,
      details: {
        absolutePath: scriptPath,
        dirExists: fs.existsSync(path.dirname(scriptPath)),
        filesInDir: fs.readdirSync(path.dirname(scriptPath)),
      },
    });
  }

  try {
    const { stdout, stderr } = await execFileAsync("python", [scriptPath], {
      timeout: PYTHON_TIMEOUT,
      maxBuffer: 1024 * 1024 * 5,
    });

    if (stderr) {
      console.error(`🐍 Python stderr: ${stderr.substring(0, MAX_LOG_LENGTH)}`);
    }

    console.log(`📦 Salida del script (${stdout.length} caracteres):`);
    console.log(stdout.substring(0, MAX_LOG_LENGTH) + (stdout.length > MAX_LOG_LENGTH ? "..." : ""));

    const resultado = safeJsonParse(stdout);

    switch (resultado?.status) {
      case "no_internet":
        console.log("🌐 No hay conexión a internet");
        return res.status(200).json({
          success: true,
          status: "no_connection",
          message: resultado.message,
          timestamp: resultado.timestamp,
        });

      case "api_error":
        console.error(`⚠️ Error API: ${resultado.message}`);
        return res.status(200).json({
          success: false,
          status: "device_error",
          message: "El dispositivo no respondió correctamente",
          error: resultado.message,
          execution_time: resultado.execution_time,
          timestamp: resultado.timestamp,
        });

      case "success":
        console.log(`✅ Datos recibidos (${resultado.data?.length || 0} registros)`);
        const { validos, invalidos } = transformAndValidateData(resultado.data || []);

        if (invalidos.length > 0) {
          console.warn(`⚠️ ${invalidos.length} registros inválidos encontrados`);
          console.warn(invalidos.slice(0, 3));
        }

        if (validos.length > 0) {
          const { insertedCount, duplicates, insertTime } = await insertDataWithRetry(validos);
          return res.status(200).json({
            success: true,
            status: "success",
            insertedCount,
            duplicates,
            invalidRecords: invalidos.length,
            insertTime,
            executionTime: resultado.execution_time,
          });
        }

        return res.status(200).json({
          success: true,
          status: "no_valid_data",
          message: "No se encontraron datos válidos para insertar",
          invalidRecords: invalidos.length,
        });

      case "dispositivo_desconectado":
        console.log("🔴 Dispositivo desconectado o sin respuesta");
        return res.status(200).json({
          success: true,
          status: "device_disconnected",
          message: resultado.message,
          suggestion: resultado.suggestion,
          timestamp: resultado.timestamp,
        });

      default:
        console.error(`💣 Error inesperado: ${stdout.substring(0, MAX_LOG_LENGTH)}`);
        return res.status(500).json({
          success: false,
          status: "unknown_error",
          message: "Error desconocido del script Python",
          output: stdout.substring(0, MAX_LOG_LENGTH),
        });
    }
  } catch (error: any) {
    console.error(`💥 Error ejecutando script: ${error.message}`);

    if (error.message.includes("ETIMEDOUT") || error.message.includes("timed out")) {
      return res.status(500).json({
        success: false,
        status: "timeout",
        message: `Timeout de ${PYTHON_TIMEOUT / 1000}s excedido`,
        suggestion: "El dispositivo está respondiendo muy lentamente",
      });
    }

    return res.status(500).json({
      success: false,
      status: "execution_error",
      message: "Error al ejecutar script Python",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Controlador para obtener últimos registros guardados
export const obtenerUltimosDatos = async (_req: Request, res: Response) => {
  const startTime = process.hrtime();

  try {
    console.log("📡 Obteniendo últimos registros...");
    const datos = await Datos.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .lean()
      .maxTimeMS(5000)
      .exec();

    const executionTime = process.hrtime(startTime);
    const seconds = executionTime[0] + executionTime[1] / 1e9;

    console.log(`✓ ${datos.length} registros obtenidos en ${seconds.toFixed(2)}s`);

    return res.status(200).json({
      success: true,
      status: "success",
      count: datos.length,
      data: datos,
      metrics: {
        executionTime: `${seconds.toFixed(2)}s`,
        dbQueryTime: `${seconds.toFixed(2)}s`,
      },
    });
  } catch (error: any) {
    const executionTime = process.hrtime(startTime);
    const seconds = executionTime[0] + executionTime[1] / 1e9;

    console.error(`❌ Error al obtener datos (${seconds.toFixed(2)}s):`, error);

    return res.status(500).json({
      success: false,
      status: "db_error",
      message: "Error al obtener datos históricos",
      error: {
        name: error.name,
        message: error.message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
      metrics: {
        executionTime: `${seconds.toFixed(2)}s`,
      },
    });
  }
};

// Controlador para eliminar datos antiguos (más viejos que N días)
export const limpiarDatosAntiguos = async (req: Request, res: Response) => {
  try {
    const dias = parseInt(req.query.dias as string) || 30;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    console.log(`🧹 Limpiando datos anteriores a ${fechaLimite.toISOString()}...`);

    const result = await Datos.deleteMany({
      timestamp: { $lt: fechaLimite },
    });

    console.log(`✅ ${result.deletedCount} registros eliminados`);

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      olderThan: fechaLimite.toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Error al limpiar datos antiguos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al limpiar datos antiguos",
      error: error.message,
    });
  }
};