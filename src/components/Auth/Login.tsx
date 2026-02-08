import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Shared/UI/Button';
import { Card } from '../Shared/UI/Card';
import { Logo } from '../Shared/UI/Logo';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate(location.state?.from || '/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-ink">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
                style={{
                    backgroundImage: 'url("/login_bg.jpg")',
                    filter: 'brightness(0.5)'
                }}
            >
                {/* Black Translucent Filter Overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            </div>

            <Card className="w-full max-w-md relative z-10 p-8 shadow-glass border-white/20 backdrop-blur-xl bg-white/90">
                <div className="flex flex-col items-center mb-6">
                    <Logo className="mb-2" iconClassName="w-12 h-12" dark={false} />
                    <h1 className="text-2xl font-serif font-bold text-card-ink mb-1">Welcome Back</h1>
                    <p className="text-card-ink/80 font-sans text-sm tracking-wide">Sign in to your dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-5 text-xs flex items-center border border-red-100 animate-fade-in-up">
                        <span className="font-bold mr-2 uppercase tracking-wider">Error:</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-card-ink/80 mb-1.5 uppercase tracking-widest">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-black/5 border border-card-ink/10 rounded-xl focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all text-sm text-card-ink placeholder:text-card-ink/40"
                            placeholder="your-email@gmail.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-card-ink/80 mb-1.5 uppercase tracking-widest">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-black/5 border border-card-ink/10 rounded-xl focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all text-sm text-card-ink placeholder:text-card-ink/40"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        isLoading={loading}
                        fullWidth
                        size="md"
                    >
                        Sign In
                    </Button>
                </form>

                <div className="text-center mt-5 pt-5 border-t border-card-ink/5">
                    <p className="text-xs text-card-ink/80">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-accent hover:text-accent-hover font-bold transition-colors">
                            Sign up
                        </Link>
                    </p>
                </div>


            </Card>
        </div>
    );
};

export default Login;
