from pyemvue import PyEmVue
from pyemvue.device import VueDevice
import sys

username = "softnova73@gmail.com"
password = "1234567890"

vue = PyEmVue()

print("🔐 Iniciando sesión...")
try:
    vue.login(username, password)
    print("✅ Sesión iniciada")
except Exception as e:
    print("❌ Error al iniciar sesión:", e)
    sys.exit(1)

print("🔍 Obteniendo dispositivos...")
try:
    devices = vue.get_devices()
    for device in devices:
        print(f"ID: {device.device_gid}, Nombre: {device.device_name}")
except Exception as e:
    print("❌ Error al obtener dispositivos:", e)