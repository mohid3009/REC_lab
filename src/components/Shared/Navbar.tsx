import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Bell, HelpCircle, Settings } from 'lucide-react';
import { Button } from './UI/Button';
import { Logo } from './UI/Logo';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const getDashboardLink = () => {
        switch (user.role) {
            case 'HOD': return '/hod/dashboard';
            case 'Teacher': return '/teacher/dashboard';
            case 'Student': return '/student/dashboard';
            default: return '/';
        }
    };

    const isHOD = user.role === 'HOD';

    return (
        <nav className="h-14 bg-ink text-white sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between shadow-lg border-b border-white/5 transition-all duration-300 backdrop-blur-md">
            <Link to={getDashboardLink()}>
                <Logo />
            </Link>

            <div className="flex-1 flex items-center justify-center space-x-6">
                {isHOD && (
                    <>
                        <Link to="/hod/dashboard" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-accent transition-colors">Dashboard</Link>
                        <Link to="/hod/courses" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-accent transition-colors">Courses</Link>
                        <Link to="/hod/classrooms" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-accent transition-colors">Classrooms</Link>
                    </>
                )}
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
                {/* Navigation Icons */}
                <div className="hidden md:flex items-center space-x-1 border-r border-white/10 pr-4">
                    <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all relative group">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-ink"></span>
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all relative group">
                        <HelpCircle className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all relative group">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center space-x-3 pl-1">
                    <div className="hidden md:flex items-center space-x-2.5">
                        <div className="text-right">
                            <div className="font-semibold text-xs text-white leading-tight">{user.name}</div>
                            <div className="text-[9px] uppercase tracking-wider font-bold text-accent">{user.role}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white font-serif font-bold text-sm border border-accent/30 shadow-lg">
                            {user.name.charAt(0)}
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors p-1"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
