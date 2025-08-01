import { useEffect, useState } from 'react';
import {
  notification,
  Card,
  Select,
  Modal,
  Button,
  Input,
  List,
  Space,
  message,
} from 'antd';
import axios from 'axios';
import plantaAlta from '../assets/planta_alta.png';
import plantaBaja from '../assets/planta_baja.png';

interface RoomData {
  id: string;
  salon: string;
  estadoAire: 'Encendido' | 'Apagado';
  voltaje?: string;
  estadoSalon: 'Ocupado' | 'Vacio';
  hasCommentButton: boolean;
  canEdit: boolean;
  planta: 'alta' | 'baja';
}

interface CommentType {
  _id: string;
  texto: string;
  fecha: string;
}

interface HorarioAPI {
  _id: string;
  salon: string;
  day: string;
  inicioDate: string;
  finDate: string;
}

const salonCoords: Record<string, { top: string; left: string }> = {
  C6: { top: '83%', left: '16%' },
  C7: { top: '78%', left: '30%' },
  C8: { top: '74%', left: '45%' },
  C9: { top: '69%', left: '59%' },
  C10: { top: '66%', left: '74%' },
  C11: { top: '27%', left: '68%' },
  C12: { top: '27%', left: '53%' },
  C13: { top: '27%', left: '38%' },
  C14: { top: '27%', left: '23%' },
  lab: { top: '30%', left: '87%' },
  lab2: { top: '35%', left: '87%' },
  C1: { top: '67%', left: '69%' },
  C2: { top: '27%', left: '64%' },
  C3: { top: '27%', left: '49%' },
  C4: { top: '27%', left: '33%' },
  C5: { top: '27%', left: '17%' },
};

const LegendTable = () => (
  <Card title="Código de colores" style={{ width: 300, marginLeft: '90px' }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
      <div
        style={{
          width: 30,
          height: 20,
          borderRadius: '50%',
          backgroundColor: 'red',
          marginRight: 10,
          border: '1px solid #ccc',
        }}
      />
      <span>A/C encendido y salón vacío</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
      <div
        style={{
          width: 35,
          height: 25,
          borderRadius: '50%',
          backgroundColor: 'green',
          marginRight: 10,
          border: '1px solid #ccc',
        }}
      />
      <span>A/C encendido y salón ocupado</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
      <div
        style={{
          width: 30,
          height: 20,
          borderRadius: '50%',
          backgroundColor: 'yellow',
          marginRight: 10,
          border: '1px solid #ccc',
        }}
      />
      <span>Salón ocupado, A/C apagado</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: 'white',
          marginRight: 10,
          border: '1px solid #ccc',
        }}
      />
      <span>A/C apagado y salón vacío</span>
    </div>
  </Card>
);

const { Option } = Select;

// Mapeo canales -> salón para el sensor Emporia
const canalToSalonMap: Record<number, string> = {
  1: 'C14',
  2: 'C13',
  3: 'C10',
  4: 'C8',
  5: 'C7',
  6: 'C9',
  7: 'C6',
  8: 'C11',
  9: 'lab',
  10: 'lab2',
};

const EdificioC = () => {
  const [roomData, setRoomData] = useState<RoomData[]>([]);
  const [plantaActual, setPlantaActual] = useState<'alta' | 'baja'>('alta');
  const [notificados, setNotificados] = useState<Set<string>>(new Set());
  const [comentarios, setComentarios] = useState<Record<string, CommentType[]>>({});
  const [comentarioOpen, setComentarioOpen] = useState(false);
  const [salonSeleccionado, setSalonSeleccionado] = useState<string | null>(null);
  const [nuevoComentarioTexto, setNuevoComentarioTexto] = useState('');
  const [horarios, setHorarios] = useState<Record<string, HorarioAPI[]>>({});

  const salonesBase = [
    { id: '1', salon: 'C6', planta: 'alta' },
    { id: '2', salon: 'C7', planta: 'alta' },
    { id: '3', salon: 'C8', planta: 'alta' },
    { id: '4', salon: 'C9', planta: 'alta' },
    { id: '5', salon: 'C10', planta: 'alta' },
    { id: '6', salon: 'C11', planta: 'alta' },
    { id: '7', salon: 'C12', planta: 'alta' },
    { id: '8', salon: 'C13', planta: 'alta' },
    { id: '9', salon: 'C14', planta: 'alta' },
    { id: '10', salon: 'lab', planta: 'alta' },
    { id: '11', salon: 'lab2', planta: 'alta' },
    { id: '12', salon: 'C1', planta: 'baja' },
    { id: '13', salon: 'C2', planta: 'baja' },
    { id: '14', salon: 'C3', planta: 'baja' },
    { id: '15', salon: 'C4', planta: 'baja' },
    { id: '16', salon: 'C5', planta: 'baja' },
  ];

  // --- Función para cargar horarios desde backend ---
  const cargarHorarios = async () => {
    try {
      const { data } = await axios.get<HorarioAPI[]>('http://localhost:3001/api/horarios');
      const horariosPorSalon: Record<string, HorarioAPI[]> = {};
      data.forEach((horario) => {
        if (!horariosPorSalon[horario.salon]) {
          horariosPorSalon[horario.salon] = [];
        }
        horariosPorSalon[horario.salon].push(horario);
      });
      setHorarios(horariosPorSalon);
      message.success('Horarios actualizados correctamente');
    } catch (error) {
      console.error('Error cargando horarios:', error);
      message.error('Error al actualizar horarios');
      setHorarios({});
    }
  };

  // Cargar horarios al inicio y refrescar cada 60 segundos
  useEffect(() => {
    cargarHorarios();
    const interval = setInterval(cargarHorarios, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Función para cargar datos base y estado de ocupación ---
  const cargarDatosBase = async () => {
    try {
      const { data } = await axios.get('http://localhost:3001/api/ocupacion');

      const roomsConDatos: RoomData[] = salonesBase.map(({ id, salon, planta }) => {
        const dato = data.find((d: any) => d.salon === salon);

        if (!dato || !dato.consumo || dato.consumo === 0) {
          return {
            id,
            salon,
            planta,
            estadoAire: 'Apagado',
            estadoSalon: 'Vacio',
            voltaje: '0W',
            hasCommentButton: false,
            canEdit: false,
          };
        }

        return {
          id,
          salon,
          planta,
          estadoAire: dato.consumo > 0 ? 'Encendido' : 'Apagado',
          estadoSalon: dato.ocupado ? 'Ocupado' : 'Vacio',
          voltaje: dato.voltaje || 'N/A',
          hasCommentButton: true,
          canEdit: false,
        };
      });

      setRoomData(roomsConDatos);
    } catch (error) {
      console.error('Error al cargar datos base:', error);
      const roomsDefault = salonesBase.map(({ id, salon, planta }) => ({
        id,
        salon,
        planta,
        estadoAire: 'Apagado',
        estadoSalon: 'Vacio',
        voltaje: '0W',
        hasCommentButton: false,
        canEdit: false,
      }));
      setRoomData(roomsDefault);
    }
  };

  // Cargar datos base al inicio
  useEffect(() => {
    cargarDatosBase();
  }, []);

  // --- Función para actualizar estado de A/C con datos sensores Emporia ---
  const actualizarEstadoSensores = async () => {
    try {
      const { data } = await axios.get<{ channel_num: number; usage_W: number }[]>(
        'http://localhost:3001/api/emporia/datos'
      );

      setRoomData((prevRooms) => {
        const newRooms = [...prevRooms];

        data.forEach(({ channel_num, usage_W }) => {
          const salon = canalToSalonMap[channel_num];
          if (!salon) return;

          const idx = newRooms.findIndex((r) => r.salon === salon);
          if (idx === -1) return;

          newRooms[idx] = {
            ...newRooms[idx],
            estadoAire: usage_W && usage_W > 1 ? 'Encendido' : 'Apagado',
            voltaje: `${usage_W} W`,
          };
        });

        return newRooms;
      });
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn("Datos sensores no disponibles (404). El dispositivo podría estar apagado.");
        setRoomData((prevRooms) =>
          prevRooms.map((r) => ({
            ...r,
            estadoAire: "Apagado",
            voltaje: "0 W",
          }))
        );
      } else {
        console.error('Error al obtener datos sensores Emporia:', error);
      }
    }
  };

  // Ejecutar refresco de sensores cada 15 segundos
  useEffect(() => {
    actualizarEstadoSensores();
    const interval = setInterval(actualizarEstadoSensores, 15000);
    return () => clearInterval(interval);
  }, []);

  // --- Notificaciones para alertas A/C encendido en salón vacío ---
  useEffect(() => {
    roomData.forEach((room) => {
      const alerta = room.estadoAire === 'Encendido' && room.estadoSalon === 'Vacio';
      if (alerta && !notificados.has(room.id)) {
        notification.warning({
          message: `A/C encendido en salón vacío`,
          description: `El salón ${room.salon} tiene el aire acondicionado encendido y está vacío.`,
          duration: 0,
          className: 'custom-notification',
        });

        axios
          .post('http://localhost:3001/api/alertas', {
            salon: room.salon,
            mensaje: `El salón ${room.salon} tiene el aire acondicionado encendido y está vacío.`,
          })
          .catch((err) => console.error('Error al registrar la alerta:', err));

        setNotificados((prev) => new Set(prev).add(room.id));
      }

      if (!alerta && notificados.has(room.id)) {
        setNotificados((prev) => {
          const copy = new Set(prev);
          copy.delete(room.id);
          return copy;
        });
      }
    });
  }, [roomData, notificados]);

  // --- Función para validar si el salón está ocupado según horario ---
  const isSalonOcupadoEnHorario = (salon: string) => {
    const ahora = new Date();
    const diaActual = ahora.toLocaleDateString('es-ES', { weekday: 'long' });
    const diaNormalizado = diaActual.charAt(0).toUpperCase() + diaActual.slice(1);

    if (!horarios[salon]) return false;

    return horarios[salon].some((h) => {
      if (h.day !== diaNormalizado) return false;

      const inicio = new Date(h.inicioDate);
      const fin = new Date(h.finDate);
      const margen = 5 * 60 * 1000; // 5 min margen
      const inicioConMargen = new Date(inicio.getTime() - margen);
      const finConMargen = new Date(fin.getTime() + margen);

      return ahora >= inicioConMargen && ahora <= finConMargen;
    });
  };

  // --- Función para determinar color según estado ---
  const getColor = (estadoAire: string, estadoSalon: string, salon: string) => {
    const ocupadoAhora = isSalonOcupadoEnHorario(salon);
    const aireEncendido = estadoAire === 'Encendido';

    if (aireEncendido && !ocupadoAhora) return 'red';
    if (aireEncendido && ocupadoAhora) return 'green';
    if (!aireEncendido && ocupadoAhora) return 'yellow';
    return 'white';
  };

  // --- Funciones para manejo de comentarios ---
  const cargarComentarios = async (salon: string) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/comentarios/${salon}`);
      setComentarios((prev) => ({ ...prev, [salon]: res.data.comentarios }));
    } catch (error) {
      console.error('Error al cargar comentarios', error);
      setComentarios((prev) => ({ ...prev, [salon]: [] }));
    }
  };

  const abrirModalComentarios = (salon: string) => {
    setSalonSeleccionado(salon);
    cargarComentarios(salon);
    setComentarioOpen(true);
  };

  const agregarComentario = async () => {
    if (!nuevoComentarioTexto.trim() || !salonSeleccionado) {
      message.error('Escribe un comentario antes de guardar.');
      return;
    }
    try {
      await axios.post(`http://localhost:3001/api/comentarios/${salonSeleccionado}`, {
        texto: nuevoComentarioTexto.trim(),
      });
      setNuevoComentarioTexto('');
      cargarComentarios(salonSeleccionado);
      message.success('Comentario agregado');
    } catch (error) {
      console.error('Error al agregar comentario', error);
      message.error('Error al agregar comentario');
    }
  };

  // --- Renderizado de planta con marcadores ---
  const renderImageWithMarkers = (planta: 'alta' | 'baja', img: string) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '40px' }}>
      <div style={{ position: 'relative', width: '800px', border: '1px solid #ccc' }}>
        <img src={img} alt={`Croquis Planta ${planta}`} style={{ width: '800px', height: 'auto' }} />
        {roomData
          .filter((r) => r.planta === planta)
          .map((room) => {
            const coords = salonCoords[room.salon];
            if (!coords) return null;
            const color = getColor(room.estadoAire, room.estadoSalon, room.salon);
            return (
              <div
                key={room.id}
                title={`Salón ${room.salon}`}
                style={{
                  position: 'absolute',
                  top: coords.top,
                  left: coords.left,
                  transform: 'translate(-50%, -50%)',
                  width: '45px',
                  height: '45px',
                  backgroundColor: color,
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                  zIndex: 10,
                  cursor: 'pointer',
                }}
                onClick={() => abrirModalComentarios(room.salon)}
              />
            );
          })}
      </div>
      <LegendTable />
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        Monitoreo de Aire Acondicionado
      </h2>

      <Space style={{ marginBottom: 16 }}>
        <Select
          value={plantaActual}
          onChange={setPlantaActual}
          style={{ width: 200 }}
          placeholder="Selecciona una planta"
        >
          <Option value="alta">Planta Alta</Option>
          <Option value="baja">Planta Baja</Option>
        </Select>

        <Button type="primary" onClick={cargarHorarios}>
          Actualizar Horarios
        </Button>
      </Space>

      {plantaActual === 'alta' && renderImageWithMarkers('alta', plantaAlta)}
      {plantaActual === 'baja' && renderImageWithMarkers('baja', plantaBaja)}

      <Modal
        title={`Comentarios para salón ${salonSeleccionado}`}
        open={comentarioOpen}
        onCancel={() => setComentarioOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setComentarioOpen(false)}>
            Cancelar
          </Button>,
          <Button key="add" type="primary" onClick={agregarComentario}>
            Agregar Comentario
          </Button>,
        ]}
      >
        <List
          bordered
          dataSource={comentarios[salonSeleccionado ?? ''] || []}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                description={item.texto}
                title={new Date(item.fecha).toLocaleString()}
              />
            </List.Item>
          )}
          locale={{ emptyText: 'No hay comentarios' }}
          style={{ marginBottom: 12 }}
        />
        <Input.TextArea
          rows={3}
          placeholder="Escribe un nuevo comentario..."
          value={nuevoComentarioTexto}
          onChange={(e) => setNuevoComentarioTexto(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default EdificioC;
