import { useEffect, useState } from 'react';

import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { user, update } = useAuth();
  const [profile, setProfile] = useState({
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Refreshing on this page will reset useAuth() state
  useEffect(() => {
    if (user != null) {
      setProfile({
        email: user.email,
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      })
    }
  }, [user]);

  const handleChange = (event) => {
    setProfile(prevState => ({
      ...prevState,
      [event.target.id]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      await update(
        profile.email,
        profile.oldPassword,
        profile.newPassword,
        profile.confirmNewPassword
      );
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setProfile({
        email: user.email,
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    }
  };

  return (
    <div className="container">
      <div className="text-center mt-5 mb-4">
        <h1>Profile</h1>
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
              value={profile.email} 
              onChange={handleChange}
              required 
            />
          </div>

          <div className="mb-3">
            <label htmlFor="oldPassword" className="form-label">Old Password</label>
            <input 
              type="password"
              name="oldPassword" 
              id="oldPassword" 
              className="form-control" 
              value={profile.oldPassword} 
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <input 
              type="password"
              name="newPassword" 
              id="newPassword" 
              className="form-control" 
              value={profile.newPassword} 
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password</label>
            <input 
              type="password"
              name="confirmNewPassword" 
              id="confirmNewPassword" 
              className="form-control" 
              value={profile.confirmNewPassword} 
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary mt-3">Update</button>
        </form>
      </div>
      {errorMessage && <div className="error text-center mt-3"> {errorMessage} </div>}
    </div>
  );
};

export default Profile;
