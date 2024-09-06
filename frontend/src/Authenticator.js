import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const AuthContext = createContext();

export const Authenticator = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await axios.get('/home', { withCredentials: true });
                if (response.status === 200 && response.data.authenticated) {
                    setIsLoggedIn(true);
                } else {
                    setIsLoggedIn(false);
                }
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    setIsLoggedIn(false);
                }
            } finally {
                setLoading(false);
            }
        };

        checkLoginStatus();
    }, []);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    // useMemo kullanarak value prop'unu sarmala
    const value = useMemo(() => ({
        isLoggedIn,
        setIsLoggedIn,
        handleLoginSuccess,
        loading
    }), [isLoggedIn, handleLoginSuccess, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

Authenticator.propTypes = {
    children: PropTypes.node.isRequired
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default Authenticator;
