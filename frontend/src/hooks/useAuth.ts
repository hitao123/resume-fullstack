import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

export const useAuth = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginAction,
    register: registerAction,
    logout: logoutAction,
    checkAuth,
    clearError,
  } = useAuthStore();

  const login = async (email: string, password: string) => {
    try {
      await loginAction(email, password);
      message.success('Logged in successfully');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      await registerAction(email, password, name);
      message.success('Account created successfully');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutAction();
      message.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      message.error(error.message || 'Logout failed');
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  };
};

export default useAuth;
