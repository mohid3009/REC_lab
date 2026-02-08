import React from 'react';
import { FlaskConical } from 'lucide-react';

interface LogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    showText?: boolean;
    dark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
    className = "",
    iconClassName = "w-8 h-8",
    textClassName = "",
    showText = true,
    dark = true
}) => {
    return (
        <div className={`flex items-center space-x-3 group ${className}`}>
            <div className={`
                ${iconClassName} 
                relative flex items-center justify-center 
                bg-gradient-to-br from-accent to-accent-hover 
                rounded-xl shadow-lg 
                group-hover:shadow-accent/40 group-hover:scale-105 
                transition-all duration-500 
                border border-white/10
            `}>
                <FlaskConical className="w-5 h-5 text-white" />
                <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {showText && (
                <div className={`flex flex-col ${textClassName}`}>
                    <span className={`font-serif text-xl font-bold tracking-tight leading-none ${dark ? 'text-white' : 'text-ink'}`}>
                        REC Lab
                    </span>
                    <span className={`text-[9px] uppercase tracking-[0.3em] font-bold mt-0.5 ${dark ? 'text-white/40' : 'text-ink/40'}`}>
                        Digital
                    </span>
                </div>
            )}
        </div>
    );
};
