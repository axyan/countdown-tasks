import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

const authContext = createContext();

const AuthProvider = ({ children }) => {
  const auth = useAuthProvider();
  return (
    <authContext.Provider value={auth}>
      {children}
    </authContext.Provider>
  );
};

const useAuth = () => {
  return useContext(authContext);
};

const useAuthProvider = () => {
  const navigate = useNavigate();
  const [cookies, setCookie, removeCookie] = useCookies();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const DOMAIN_NAME = process.env.REACT_APP_DOMAIN_NAME;
  const COOKIE_OPTIONS = {
    secure: true,
    sameSite: true,
    maxAge: 3600
  };

  useEffect(() => {
    if (cookies.token !== undefined && cookies.token !== '') {
      const bytes = CryptoJS.AES.decrypt(cookies.token.value, process.env.REACT_APP_CRYPTOJS_SECRET);
      const decryptedJWT = bytes.toString(CryptoJS.enc.Utf8);

      setUser({ id: cookies.token.id, token: decryptedJWT });
    }
    setIsLoading(false);
  }, [cookies.token]);

  const login = async (email, password) => {
    try {
      const res = await fetch(
        `${DOMAIN_NAME}/api/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        }
      );
      
      const response = await res.json();
      if (response.error === undefined) {
        setCookie('token', { id: response.id, value: response.token }, COOKIE_OPTIONS);

        const bytes = CryptoJS.AES.decrypt(response.token, process.env.REACT_APP_CRYPTOJS_SECRET);
        const decryptedJWT = bytes.toString(CryptoJS.enc.Utf8);

        setUser({ id: response.id, token: decryptedJWT });
      }
      setIsLoading(false);

      return response;
    } catch (e) {
      //TODO
      console.log(e);
    }

  };

  const register = async (email, password, confirmPassword) => {
    try {
      const response = await fetch(
        `${DOMAIN_NAME}/api/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, confirmPassword })
        }
      );
      
      return await response.json();
    } catch (e) {
      //TODO
      console.log(e);
    }
  };

  const signout = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${DOMAIN_NAME}/api/session`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + user.token
          }
        }
      );

      if (response.status === 204) {
        setUser(null);
        removeCookie('token', COOKIE_OPTIONS);
      }
      
      navigate('login');
    } catch (e) {
      //TODO
      console.log(e);
    }
  };

  return {
    user,
    isLoading,
    login,
    register,
    signout
  };
};

export {
  AuthProvider,
  useAuth
};
