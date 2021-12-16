import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();

  const { login } = useAuth();
  const [loginCred, setLoginCred] = useState({
    email: '',
    password: ''
  });

  const handleChange = (event) => {
    setLoginCred(prevState => ({
      ...prevState,
      [event.target.id]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await login(loginCred.email, loginCred.password);

      setLoginCred({
        email: '',
        password: ''
      });

      if (response.error === undefined) {
        navigate('/');
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="container">
      <div className="text-center mt-5 mb-4">
        <h1>Log in</h1>
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
              value={loginCred.email} 
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
              value={loginCred.password} 
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary mt-3">Log in</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
