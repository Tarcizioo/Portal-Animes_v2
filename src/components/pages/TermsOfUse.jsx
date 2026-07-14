import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { usePageTitle } from '@/hooks/usePageTitle';

export function TermsOfUse() {
    usePageTitle('Termos de Uso');

    return (
        <div className="max-w-4xl mx-auto w-full p-6 lg:p-10">
            <h1 className="text-3xl font-black mb-8 text-primary">Termos de Uso</h1>

            <div className="space-y-6 text-text-secondary leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">1. Aceitação dos Termos</h2>
                    <p>
                        Ao acessar e usar o Portal Animes V2, você concorda em cumprir estes termos de serviço. Se você não concordar com alguma parte dos termos, não deverá usar nossos serviços.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">2. Natureza do Projeto</h2>
                    <p>
                        Este site é um projeto pessoal de portfólio desenvolvido por Tarcizio Pereira Neto. Ele serve para demonstrar habilidades de desenvolvimento web (React, Tailwind, API Integration).
                        Não há garantia de disponibilidade contínua ou suporte oficial.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">3. Uso Permitido</h2>
                    <p>
                        Você concorda em usar o site apenas para fins legais e de entretenimento pessoal. É proibido tentar comprometer a segurança do site, realizar spam ou uso abusivo das APIs conectadas.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">4. Propriedade Intelectual</h2>
                    <p>
                        Todo o código fonte deste projeto está disponível no GitHub do autor. Os dados de animes, personagens e profissionais são fornecidos pela API pública da AniList e pertencem aos respectivos detentores de direitos autorais.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">5. Alterações</h2>
                    <p>
                        Podemos revisar estes termos a qualquer momento sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses Termos de Uso.
                    </p>
                </section>
            </div>
        </div>
    );
}
