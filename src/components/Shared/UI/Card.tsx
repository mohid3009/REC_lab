import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hover = false,
    onClick,
    noPadding = false,
}) => {
    const baseStyles = "bg-white text-ink rounded-xl border border-accent/10 shadow-soft overflow-hidden transition-all duration-300";
    const hoverStyles = hover || onClick ? "hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 cursor-pointer" : "";
    const paddingStyles = noPadding ? "" : "p-4";

    return (
        <div
            className={`${baseStyles} ${hoverStyles} ${paddingStyles} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
