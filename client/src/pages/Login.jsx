import { useState, useEffect } from 'react';
import { useAuth } from '@/services/auth-context.jsx';
import { useNavigate } from 'react-router-dom';
// Removed import of custom Button, using native button instead
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('User is already logged in:', user);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'client') {
        navigate('/client/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh here
    setError('');
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);
      console.log('Logged in user:', loggedInUser);

      if (loggedInUser?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (loggedInUser?.role === 'client') {
        navigate('/client/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-gray-800 border border-gray-700 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-white">
            Login to Cystas EMS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="text-red-400 text-sm sm:text-base">{error}</div>
            )}

            <div>
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
