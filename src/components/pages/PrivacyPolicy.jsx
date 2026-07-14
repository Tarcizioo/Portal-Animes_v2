import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { usePageTitle } from '@/hooks/usePageTitle';

export function PrivacyPolicy() {
    usePageTitle('Política de Privacidade');

    return (
        <div className="max-w-4xl mx-auto w-full p-6 lg:p-10">
            <h1 className="text-3xl font-black mb-8 text-primary">Política de Privacidade</h1>

            <div className="space-y-6 text-text-secondary leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">1. Introdução</h2>
                    <p>
                        Bem-vindo ao Portal Animes V2. Nós respeitamos a sua privacidade e estamos comprometidos em proteger as informações pessoais que você possa compartilhar conosco.
                        Esta política explica como tratamos os dados, lembrando que este é um projeto de portfólio sem fins comerciais diretos.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">2. Coleta de Dados</h2>
                    <p>
                        Atualmente, utilizamos o Firebase Authentication para login (Google). Coletamos apenas as informações básicas fornecidas por esse serviço (nome, e-mail e foto de perfil) para personalizar sua experiência.
                        Não vendemos nem compartilhamos seus dados com terceiros.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">3. Uso de Cookies e Armazenamento Local</h2>
                    <p>
                        Utilizamos `localStorage` do seu navegador para salvar preferências simples, como o estado da barra lateral (expandida/colapsada) e filtros do catálogo.
                        Não utilizamos cookies de rastreamento invasivos.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">4. Conteúdo Externo</h2>
                    <p>
                        Este site utiliza a API pública da AniList para exibir informações. Imagens e metadados pertencem aos respectivos autores, estúdios e provedores.
                        Não hospedamos vídeos ou conteudos piratas.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">5. Contato</h2>
                    <p>
                        Se tiver dúvidas sobre esta política, entre em contato através das redes sociais linkadas no rodapé.
                    </p>
                </section>
            </div>
        </div>
    );
}
