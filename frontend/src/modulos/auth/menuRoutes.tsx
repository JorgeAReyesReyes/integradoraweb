import UserForm from '../UserForm';
import LoginForm from '../LoginForm';
import Comment from '../Comment'; 
import HorarioForm from '../HorarioForm'; 
import DatosEmporia from '../DatosEmporia'; 
import EdificioC from '../EdificioC';
import Dashboard from "./Dashboard/Dashboard";

export interface MenuRoute {
  path: string;
  element: JSX.Element; 
  label: string;
}

const routes: MenuRoute[] = [
  {
    path: 'users',
    element: <UserForm />,
    label: 'Usuarios',
  },
  {
    path: 'login',
    element: <LoginForm />,
    label: 'Login',
  },
  {
    path: 'Comment',
    element: <Comment />,
    label: 'Comentarios',
  },
  {
    path: 'HorarioForm',
    element: <HorarioForm />,
    label: 'Horarios',
  },
  {
    path: "EdificioC",
    element: <EdificioC />,
    label: "EdificioC"
  },
  {
    path: "DatosEmporia",
    element: <DatosEmporia />,
    label: "Consumo"
  },
 {
  path: "dashboard",
  element: <Dashboard />,
  label: "Dashboard"
}
];

export default routes;