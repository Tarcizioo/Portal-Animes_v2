import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ReusableCarousel({ items, title, icon: Icon, renderItem }) {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="relative group/carousel">
            <div className="flex items-center justify-between mb-4 px-1">
                {title && (
                    <h3 className="text-2xl font-black text-text-primary flex items-center gap-3">
                        {Icon && (
                            <span className="p-2 mr-1 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg text-primary">
                                <Icon className="w-6 h-6" />
                            </span>
                        )}
                        {title}
                    </h3>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                    <button
                        onClick={() => scroll('left')}
                        className="p-2 rounded-full bg-bg-secondary hover:bg-primary hover:text-white transition-colors border border-border-color"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-2 rounded-full bg-bg-secondary hover:bg-primary hover:text-white transition-colors border border-border-color"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
                {items.map((item, index) => (
                    <div key={index} className="snap-start shrink-0">
                        {renderItem ? renderItem(item) : (
                            // Default rendering if no renderItem provided (fallback)
                            <div className="w-[200px] h-[300px] bg-bg-secondary rounded-xl"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
