import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '../Shared/UI/Button';
import { Card } from '../Shared/UI/Card';
import { Logo } from '../Shared/UI/Logo';

const Signup: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'HOD' | 'Teacher' | 'Student'>('Student');
    const [department, setDepartment] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signup(email, password, name, role, department || undefined);
            // Navigation will be handled by useEffect
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    // Redirect based on role after signup
    React.useEffect(() => {
        if (user) {
            switch (user.role) {
                case 'HOD': navigate('/hod/dashboard'); break;
                case 'Teacher': navigate('/teacher/dashboard'); break;
                case 'Student': navigate('/student/dashboard'); break;
            }
        }
    }, [user, navigate]);

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

            <Card className="max-w-md w-full relative z-10 p-8 shadow-glass border-white/20 backdrop-blur-xl bg-white/90">
                <div className="flex flex-col items-center mb-6">
                    <Logo className="mb-2" iconClassName="w-12 h-12" dark={false} />
                    <h1 className="text-3xl font-serif font-bold text-card-ink mb-2">Create Account</h1>
                    <p className="text-card-ink/80 font-sans tracking-wide">Join the REC Lab Digital</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-card-ink/80 mb-1.5 uppercase tracking-widest">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-black/5 border border-card-ink/10 rounded-xl focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all text-sm text-card-ink placeholder:text-card-ink/40"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-card-ink/80 mb-1.5 uppercase tracking-widest">
                            Email address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-black/5 border border-card-ink/10 rounded-xl focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all text-sm text-card-ink placeholder:text-card-ink/40"
                            placeholder="you@example.com"
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
                            required
                            minLength={6}
                            className="w-full px-4 py-2 bg-black/5 border border-card-ink/10 rounded-xl focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all text-sm text-card-ink placeholder:text-card-ink/40"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-card-ink/80 mb-1.5 uppercase tracking-widest">
                            Role
                        </label>
                        <div className="relative">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'HOD' | 'Teacher' | 'Student')}
                                className="w-full px-4 py-2 bg-black/5 border border-card-ink/10 rounded-xl focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all text-sm text-card-ink appearance-none"
                            >
                                <option value="Student" className="bg-white">Student</option>
                                <option value="Teacher" className="bg-white">Teacher</option>
                                <option value="HOD" className="bg-white">HOD / Course Coordinator</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-accent">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-card-ink/80 mb-1.5 uppercase tracking-widest">
                            Department <span className="text-card-ink/40 font-normal normal-case">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-4 py-2 bg-black/5 border border-card-ink/10 rounded-xl focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all text-sm text-card-ink placeholder:text-card-ink/40"
                            placeholder="Computer Science"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 animate-fade-in-up">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        isLoading={loading}
                        fullWidth
                        size="lg"
                        leftIcon={<UserPlus className="w-5 h-5" />}
                    >
                        Create Account
                    </Button>
                </form>

                <div className="text-center mt-6 pt-6 border-t border-card-ink/5">
                    <p className="text-sm text-card-ink/80">
                        Already have an account?{' '}
                        <Link to="/login" className="text-accent hover:text-accent-hover font-bold transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Signup;
