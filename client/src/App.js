import { Outlet } from 'react-router-dom';

import Header from './components/Header';
import { AuthProvider } from './hooks/useAuth';

const App = () => {
  return (
    <AuthProvider>
      <Header />
      <Outlet />
    </AuthProvider>
  );
}

export default App;
