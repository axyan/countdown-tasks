import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const navigate = useNavigate();
  
  const { register } = useAuth();
  const [registration, setRegistration] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (event) => {
    setRegistration(prevState => ({
      ...prevState,
      [event.target.id]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await register(registration.email, registration.password, registration.confirmPassword);

      // Navigate to login page if no registration errors
      navigate('/login');
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setRegistration(prevRegistration => ({
        ...prevRegistration,
        password: '',
        confirmPassword: ''
      }));
    }
  };

  return (
    <div className="container">
      <div className="text-center mt-5 mb-4">
        <h1>Sign up</h1>
      </div>

      <div className="row justify-content-center">
        <form className="row col-8 col-md-6" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              className="form-control"
              value={registration.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              className="form-control"
              value={registration.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              className="form-control"
              value={registration.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary mt-3">Sign up</button>
        </form>
      </div>
      {errorMessage && <div className="error text-center mt-3"> {errorMessage} </div>}
    </div>
  );
};

export default Register;
