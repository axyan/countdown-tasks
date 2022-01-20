import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

import { nowEpoch, parseJWT } from '../utils/utils';

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
    maxAge: 3600,
  };

  useEffect(() => {
    if (cookies.token !== undefined && cookies.token !== "") {
      const bytes = CryptoJS.AES.decrypt(
        cookies.token.value,
        process.env.REACT_APP_CRYPTOJS_SECRET
      );
      const decryptedJWT = bytes.toString(CryptoJS.enc.Utf8);

      setUser({
        id: cookies.token.id,
        email: cookies.token.email,
        token: decryptedJWT,
      });
    }
    setIsLoading(false);
  }, [cookies.token]);

  const register = async (email, password, confirmPassword) => {
    try {
      const response = await fetch(`${DOMAIN_NAME}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error);
      }
    } catch (e) {
      throw e;
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${DOMAIN_NAME}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const response = await res.json();
      if (response.error !== undefined) {
        throw new Error(response.error);
      }

      // Response token is encrypted during transport to guarantee HTTPS only;
      // not possible to set cookies across different domains for FE & BE;
      // FE & BE domains also belong to the Public Suffix List
      const bytes = CryptoJS.AES.decrypt(
        response.token,
        process.env.REACT_APP_CRYPTOJS_SECRET
      );
      const decryptedJWT = bytes.toString(CryptoJS.enc.Utf8);

      // Set cookie expiration same as JWT exp claim
      const claims = parseJWT(decryptedJWT);
      if (claims != null) {
        COOKIE_OPTIONS.maxAge = claims["exp"] - nowEpoch();
      }

      setCookie(
        'token',
        { id: response.id, email: email, value: response.token },
        COOKIE_OPTIONS
      );

      setUser({ id: response.id, email: email, token: decryptedJWT });
    } catch (e) {
      throw e;
    }
  };

  const update = async (
    email,
    oldPassword,
    newPassword,
    confirmNewPassword
  ) => {
    try {
      const response = await fetch(`${DOMAIN_NAME}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + user.token,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          oldPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error);
      }

      setCookie(
        'token',
        { id: cookies.token.id, email: email, value: cookies.token.value },
        COOKIE_OPTIONS
      );

      setUser({ id: user.id, email: email, token: user.token });
    } catch (e) {
      throw e;
    }
  };

  const signout = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${DOMAIN_NAME}/api/session`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + user.token,
        },
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error);
      }
    } catch (e) {
      alert(e);
    } finally {
      // Always 'sign out' user even if error occurs
      setUser(null);
      removeCookie('token', COOKIE_OPTIONS);
      navigate('login');
    }
  };

  return {
    user,
    isLoading,
    register,
    login,
    update,
    signout,
  };
};

export { AuthProvider, useAuth };
