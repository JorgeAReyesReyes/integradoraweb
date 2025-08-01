import cron from "node-cron";
import { actualizarDatos } from "../controllers/emporia.controller";

const JOB_CONFIG = {
    CRON_SCHEDULE: "*/15 * * * * *", // Cada 15 segundos para pruebas (cambiar a "*/15 * * * *" en producción)
    MAX_RETRIES: 2
};

let isRunning = false;

export const iniciarJobEmporia = () => {
    cron.schedule(JOB_CONFIG.CRON_SCHEDULE, async () => {
        if (isRunning) {
            console.log("⏭️ Job anterior aún en ejecución. Omitiendo...");
            return;
        }
        
        isRunning = true;
        const startTime = new Date();
        console.log(`\n⏰ Iniciando job Emporia [${startTime.toLocaleString()}]`);
        
        let attempts = 0;
        let lastError;
        
        while (attempts < JOB_CONFIG.MAX_RETRIES) {
            try {
                await actualizarDatos({} as any, {
                    status: (code) => ({
                        json: (data) => {
                            console.log(`📡 Resultado: ${data.success ? '✅' : '❌'} ${data.message || ''}`);
                            return this;
                        }
                    }) as any
                });
                break;
            } catch (error) {
                lastError = error;
                attempts++;
                console.error(`⚠️ Intento ${attempts} fallido: ${error.message}`);
                
                if (attempts < JOB_CONFIG.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, 5000 * attempts));
                }
            }
        }
        
        isRunning = false;
        console.log(`🏁 Job completado en ${(new Date().getTime() - startTime.getTime()) / 1000}s`);
    });
    
    console.log(`🕒 Job programado: '${JOB_CONFIG.CRON_SCHEDULE}'`);
};