import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Card, Button, Tag, Space, message, Select, Modal } from 'antd';
import axios from 'axios';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const dayOptions = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 7;
  const start = hour.toString().padStart(2, '0') + ':00';
  const end = (hour + 1).toString().padStart(2, '0') + ':00';
  return `${start} - ${end}`;
});
const salones = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'lab'];

interface Horario {
  _id?: string;
  salon: string;
  day: string;
  inicioDate: string;
  finDate: string;
}

const generarDatosIniciales = () => {
  const datos: Record<string, any[]> = {};
  salones.forEach((salon) => {
    datos[salon] = timeSlots.map((slot) => {
      const fila: Record<string, any> = { key: slot, horario: slot };
      dayOptions.forEach((dia) => {
        fila[dia] = '';
      });
      return fila;
    });
  });
  return datos;
};

const formatearHora = (fecha: string) => {
  const d = new Date(fecha);
  return d.toTimeString().slice(0, 5);
};

const HorarioForm: React.FC = () => {
  const [horarios, setHorarios] = useState<Record<string, any[]>>(generarDatosIniciales);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [salonSeleccionado, setSalonSeleccionado] = useState(salones[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const { data } = await axios.get<Horario[]>('http://localhost:3001/api/horarios');
      const nuevosHorarios = generarDatosIniciales();

      data.forEach((horario) => {
        const slot = `${formatearHora(horario.inicioDate)} - ${formatearHora(horario.finDate)}`;
        const fila = nuevosHorarios[horario.salon]?.find((f) => f.horario === slot);
        if (fila) {
          fila[horario.day] = 'Ocupado';
        }
      });

      setHorarios(nuevosHorarios);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      message.error('Error cargando horarios');
    }
  };

  const guardarCambios = async () => {
    setLoading(true);

    try {
      const nuevosHorariosList: Omit<Horario, '_id'>[] = [];

      horarios[salonSeleccionado].forEach((fila) => {
        dayOptions.forEach((dia) => {
          if (fila[dia] === 'Ocupado') {
            const [inicio, fin] = fila.horario.split(' - ');
            const fechaBase = new Date().toISOString().split('T')[0];

            nuevosHorariosList.push({
              salon: salonSeleccionado,
              day: dia,
              inicioDate: new Date(`${fechaBase}T${inicio}:00`).toISOString(),
              finDate: new Date(`${fechaBase}T${fin}:00`).toISOString(),
            });
          }
        });
      });

      await axios.post(
        `http://localhost:3001/api/horarios/${salonSeleccionado}/completo`,
        nuevosHorariosList
      );

      message.success('Cambios guardados');
      setModoEdicion(false);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      message.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const manejarClick = (salon: string, slot: string, dia: string) => {
    if (!modoEdicion) return;

    setHorarios((prev) => {
      const nuevos = { ...prev };
      nuevos[salon] = nuevos[salon].map((fila) =>
        fila.horario === slot
          ? { ...fila, [dia]: fila[dia] === 'Ocupado' ? '' : 'Ocupado' }
          : fila
      );
      return nuevos;
    });
  };

  const borrarHorarios = () => {
    confirm({
      title: `¿Seguro que quieres borrar todos los horarios del salón ${salonSeleccionado}?`,
      okText: 'Sí',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        setLoading(true);
        try {
          await axios.delete(`http://localhost:3001/api/horarios/salon/${salonSeleccionado}`);
          message.success(`Horarios del salón ${salonSeleccionado} eliminados`);

          setHorarios((prev) => {
            const nuevos = { ...prev };
            nuevos[salonSeleccionado] = nuevos[salonSeleccionado].map((fila) => {
              dayOptions.forEach((dia) => (fila[dia] = ''));
              return fila;
            });
            return nuevos;
          });
        } catch (error) {
          console.error(error);
          message.error('Error al eliminar horarios');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columnas = (salon: string) => [
    {
      title: 'Horario',
      dataIndex: 'horario',
      key: 'horario',
      fixed: 'left',
      width: 120,
    },
    ...dayOptions.map((dia) => ({
      title: dia,
      dataIndex: dia,
      key: dia,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const valor = record[dia];
        return (
          <div
            style={{ cursor: modoEdicion ? 'pointer' : 'default' }}
            onClick={() => manejarClick(salon, record.horario, dia)}
          >
            {valor === 'Ocupado' ? (
              <Tag color="green">Ocupado</Tag>
            ) : (
              <div style={{ height: 24 }} />
            )}
          </div>
        );
      },
    })),
  ];

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '2rem' }}>
      <Content style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
          Horarios por salón
        </Title>

        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Select
            value={salonSeleccionado}
            onChange={(value) => setSalonSeleccionado(value)}
            style={{ width: 150 }}
            disabled={loading}
          >
            {salones.map((salon) => (
              <Option key={salon} value={salon}>
                {salon}
              </Option>
            ))}
          </Select>
        </div>

        <Card
          title={`Salón ${salonSeleccionado}`}
          style={{
            marginBottom: '2rem',
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
          bodyStyle={{ padding: '1rem' }}
        >
          <Table
            columns={columnas(salonSeleccionado)}
            dataSource={horarios[salonSeleccionado]}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
            size="middle"
            loading={loading}
            rowKey="key"
          />
        </Card>

        <Space style={{ display: 'flex', justifyContent: 'center', marginTop: 32, gap: '1rem' }}>
          <Button
            type="primary"
            onClick={() => setModoEdicion(!modoEdicion)}
            style={{
              width: 180,
              height: 45,
              fontSize: '1rem',
              backgroundColor: '#1890ff',
              borderColor: '#1890ff',
            }}
            disabled={loading}
          >
            {modoEdicion ? 'Cancelar edición' : 'Editar'}
          </Button>

          <Button
            type="default"
            onClick={guardarCambios}
            disabled={!modoEdicion || loading}
            style={{
              width: 180,
              height: 45,
              fontSize: '1rem',
              backgroundColor: '#52c41a',
              color: '#fff',
              borderColor: '#52c41a',
              opacity: modoEdicion && !loading ? 1 : 0.6,
              cursor: modoEdicion && !loading ? 'pointer' : 'not-allowed',
            }}
            loading={loading}
          >
            Guardar cambios
          </Button>

          <Button
            danger
            onClick={borrarHorarios}
            disabled={!modoEdicion || loading}
            style={{
              width: 180,
              height: 45,
              fontSize: '1rem',
              opacity: modoEdicion && !loading ? 1 : 0.6,
              cursor: modoEdicion && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            Borrar horarios
          </Button>
        </Space>
      </Content>
    </Layout>
  );
};

export default HorarioForm;