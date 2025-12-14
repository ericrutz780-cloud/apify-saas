
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';

interface Country {
    code: string;
    name: string;
}

interface CountrySelectorProps {
    value: string;
    onChange: (value: string) => void;
    countries: Country[];
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ value, onChange, countries }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const selectedCountry = countries.find(c => c.code === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && listRef.current) {
            // Scroll to selected
            const selectedEl = itemRefs.current[value];
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' });
            }

            // Keyboard listener for type-ahead navigation
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
                    const char = e.key.toLowerCase();
                    // Find first country starting with the pressed character
                    const match = countries.find(c => c.name.toLowerCase().startsWith(char));
                    if (match) {
                        const el = itemRefs.current[match.code];
                        if (el) {
                            el.scrollIntoView({ block: 'start' });
                        }
                    }
                }
            };
            
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, value, countries]);

    return (
        <div className="relative h-10" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="h-full flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm whitespace-nowrap w-auto min-w-[max-content]"
            >
                <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="truncate max-w-[150px]">{selectedCountry?.name || 'Select Country'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ml-1 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div 
                    ref={listRef}
                    className="absolute top-full left-0 mt-2 w-64 max-h-[320px] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] animate-in fade-in zoom-in-95 duration-100"
                >
                    <div className="p-1">
                        {countries.map((country) => {
                            const isSelected = country.code === value;
                            return (
                                <button
                                    key={country.code}
                                    ref={el => { itemRefs.current[country.code] = el; }}
                                    onClick={() => {
                                        onChange(country.code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                                        isSelected 
                                        ? 'bg-brand-50 text-brand-700 font-medium' 
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {country.name}
                                    {isSelected && <Check className="w-4 h-4" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CountrySelector;
