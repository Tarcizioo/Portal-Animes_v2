import { Link } from 'react-router-dom';
import { Github, Instagram, Heart } from 'lucide-react';
import { PortalAnimesLogo } from '@/components/brand/PortalAnimesLogo';


export function Footer() {
    return (
        <footer className="mt-auto border-t border-border-color bg-bg-secondary/30 backdrop-blur-sm pt-12 pb-8 min-h-[300px]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-1 space-y-4">
                        <Link to="/" aria-label="PortalAnimes - Inicio" className="group inline-flex rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            <span className="inline-flex items-center gap-2.5">
                                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-text-on-primary shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                                    <PortalAnimesLogo compact markClassName="h-8 w-8" />
                                </span>
                                <PortalAnimesLogo
                                    className="text-text-primary"
                                    markClassName="hidden"
                                    wordmarkClassName="text-xl transition-colors group-hover:text-primary"
                                />
                            </span>
                        </Link>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            Sua fonte definitiva para animes, personagens e cultura pop japonesa. Design moderno e performance para a melhor experiência.
                        </p>
                    </div>

                    {/* Navigation 1 */}
                    <div className="col-span-1 md:col-span-1">
                        <h4 className="font-bold text-text-primary mb-4">Explorar</h4>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-text-secondary">
                            <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
                            <li><Link to="/catalog" className="hover:text-primary transition-colors">Catálogo</Link></li>
                            <li><Link to="/discover" className="hover:text-primary transition-colors">Temporada</Link></li>
                            <li><Link to="/characters" className="hover:text-primary transition-colors">Personagens</Link></li>
                            <li><Link to="/people" className="hover:text-primary transition-colors">Top Pessoas</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter / Socials */}
                    <div className="col-span-1 md:col-span-1">
                        <h4 className="font-bold text-text-primary mb-4">Redes Sociais</h4>
                        <div className="flex gap-3">
                            <SocialButton icon={Github} href="https://github.com/Tarcizioo/portal-animes-V2" label="GitHub" />
                            <SocialButton icon={Instagram} href="https://www.instagram.com/tarcizio_nt/" label="Instagram" />
                        </div>
                        <div className="mt-6">
                            <p className="text-xs text-text-secondary mb-2">Feito com <Heart className="w-3 h-3 inline text-red-500 fill-red-500 mx-1" /> por Tarcízio</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border-color pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-secondary text-center md:text-left">
                    <p className="max-w-xs md:max-w-none mx-auto md:mx-0">&copy; {new Date().getFullYear()} Portal Animes. Todos os direitos reservados.</p>
                    <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                        <Link to="/privacy" className="hover:text-primary transition-colors whitespace-nowrap">Privacidade</Link>
                        <Link to="/terms" className="hover:text-primary transition-colors whitespace-nowrap">Termos de Uso</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialButton({ icon: Icon, href, label }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="w-10 h-10 rounded-lg bg-bg-primary border border-border-color flex items-center justify-center text-text-secondary hover:text-white hover:bg-primary hover:border-primary transition-all duration-300"
        >
            <Icon className="w-5 h-5" />
        </a>
    );
}
