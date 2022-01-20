import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

const Header = () => {
  const { user, isLoading, signout } = useAuth();

  if (isLoading) { return <div> Loading... </div>; }

  return (
    <div>
      <nav className="navbar navbar-light bg-light">
        <div className="container-fluid d-flex justify-content-center justify-content-sm-between mx-4">
          <div>
            <Link to="/" className="navbar-brand">
              <img src={logo} alt="Logo" /> Countdown Tasks
            </Link>
          </div>

          {user ? (
            <form className="d-flex">
              <Link to="/profile" className="btn btn-primary me-3">Profile</Link>
              <button className="btn btn-secondary" onClick={signout}>Sign out</button>
            </form>
          ) : (
            <form className="d-flex">
              <Link to="/login" className="btn btn-secondary me-3">Log in</Link>
              <Link to="/signup" className="btn btn-primary">Register</Link>
            </form>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Header;
