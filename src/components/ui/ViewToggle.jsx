import { motion as Motion } from 'framer-motion';
import clsx from 'clsx';
import { createElement } from 'react';

export function ViewToggle({ value, onChange, options }) {
    return (
        <div className="flex items-center bg-bg-tertiary/50 p-1 rounded-xl border border-border-color gap-1 backdrop-blur-sm">
            {options.map((option) => (
                <ToggleOption
                    key={option.value}
                    active={value === option.value}
                    onClick={() => onChange(option.value)}
                    icon={option.icon}
                    label={option.label}
                    ariaLabel={option.ariaLabel || option.label}
                />
            ))}
        </div>
    );
}

function ToggleOption({ active, onClick, icon, label, ariaLabel }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            aria-pressed={active}
            className={clsx(
                "relative flex items-center justify-center px-4 py-2 rounded-lg transition-all z-10 bg-transparent border-none",
                active ? "text-text-primary" : "text-text-secondary hover:text-text-primary hover:bg-white/5"
            )}
            title={label}
        >
            {active && (
                <Motion.div
                    layoutId="viewToggleBg"
                    className="absolute inset-0 bg-bg-secondary border border-border-color/50 rounded-lg shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            )}

            <div className="flex items-center gap-2 relative z-20">
                {createElement(icon, { className: clsx("w-4 h-4", active && "text-primary") })}
                {label && (
                    <span className="text-sm font-bold">{label}</span>
                )}
            </div>
        </button>
    );
}
