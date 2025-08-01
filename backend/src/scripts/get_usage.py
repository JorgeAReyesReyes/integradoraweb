from pyemvue import PyEmVue
from datetime import datetime, timezone
import json
import sys
import time
import requests

# Configuración
EMAIL = "softnova73@gmail.com"
PASSWORD = "1234567890"
DEVICE_GID = 464590
TIMEOUT_API = 25  # Timeout para la API Emporia (25 segundos)
TIMEOUT_CONN = 10  # Timeout para verificación de conexión

def obtener_datos():
    print("⏳ Iniciando obtención de datos...", file=sys.stderr)
    
    try:
        # 1. Verificar conexión a internet
        print("🌐 Verificando conexión...", file=sys.stderr)
        try:
            requests.get("https://api.emporiaenergy.com", timeout=TIMEOUT_CONN)
        except:
            print(json.dumps({
                "status": "no_internet",
                "message": "No hay conexión a internet",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }))
            return

        # 2. Autenticación
        print("🔑 Autenticando...", file=sys.stderr)
        vue = PyEmVue()
        start_time = time.time()
        vue.login(EMAIL, PASSWORD)
        
        # 3. Obtener datos con timeout controlado
        print("📡 Obteniendo datos del dispositivo...", file=sys.stderr)
        try:
            result = vue.get_device_list_usage(
                deviceGids=[DEVICE_GID],
                instant=datetime.now(timezone.utc),
                scale="1S",
                unit="KilowattHours"
            )
            
            # Procesar datos exitosos
            datos = []
            for device_gid, device in result.items():
                for channel_num, channel in device.channels.items():
                    datos.append({
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "device_gid": device_gid,
                        "channel_num": channel_num,
                        "channel_name": channel.name,
                        "usage_kWh": round(channel.usage or 0, 6),
                        "usage_W": round((channel.usage or 0) * 1000 * 3600, 2)
                    })
            
            print(json.dumps({
                "status": "success",
                "execution_time": round(time.time() - start_time, 2),
                "data": datos
            }))
            
        except Exception as api_error:
            print(json.dumps({
                "status": "api_error",
                "message": str(api_error),
                "execution_time": round(time.time() - start_time, 2),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }))
            
    except Exception as e:
        print(json.dumps({
            "status": "fatal_error",
            "message": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))
        sys.exit(1)

if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(line_buffering=True)

    obtener_datos()