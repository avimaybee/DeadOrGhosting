import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 32 }) => {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <img
                src="/logo.png"
                alt="RizzBot Logo"
                style={{ width: size, height: size }}
                className="object-contain mix-blend-screen"
            />
        </div>
    );
};
