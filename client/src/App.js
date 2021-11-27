import { Link } from 'react-router-dom';

const App = () => {
  return (
    <div>
      <h1>Countdown Tasks</h1>
      <nav>
        <Link to="/login">Log in</Link>
        <Link to="/signup">Register</Link>
      </nav>
    </div>
  );
}

export default App;
