import { Link, Outlet } from 'react-router-dom';
import logo from './assets/logo.png';

const App = () => {
  return (
    <div>
      <nav className="navbar navbar-light bg-light">
        <div className="container-fluid mx-4">
          <div>
            <a href="/" className="navbar-brand">
              <img src={logo} alt="Logo" /> Countdown Tasks
            </a>
          </div>

          <form className="d-flex">
            <Link to="/login">
              <button type="button" className="btn btn-secondary me-3">Log in</button>
            </Link>
            <Link to="/signup">
              <button type="button" className="btn btn-primary">Register</button>
            </Link>
          </form>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}

export default App;
