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
                        Utilizamos o Firebase Authentication para entrada por e-mail e senha ou por Google. O serviço processa os dados necessários à autenticação, como e-mail e, quando fornecidos, nome e foto.
                        Sua senha é tratada pelo Firebase Authentication e nunca é armazenada nos documentos públicos do PortalAnimes. O e-mail também não é gravado no perfil público.
                        Não vendemos seus dados.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">3. Telemetria Opcional</h2>
                    <p>
                        A telemetria de produto permanece desativada por padrão e só usa o Firebase Analytics quando a implantação define explicitamente a flag de ativação e um ID de medição válido.
                        Os eventos personalizados do Portal usam apenas IDs numéricos, ações, status, contagens e origens enumeradas; seus payloads não incluem e-mail, nome, título livre, texto livre ou senha.
                        Quando habilitado, o próprio Firebase Analytics também pode processar dados técnicos e eventos automáticos, como página acessada, sessão, navegador, dispositivo e localização aproximada, conforme a configuração do projeto Firebase.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">4. Uso de Cookies e Armazenamento Local</h2>
                    <p>
                        Utilizamos `localStorage` do seu navegador para salvar preferências simples, como o estado da barra lateral (expandida/colapsada) e filtros do catálogo.
                        Com a telemetria desativada, o Portal não adiciona rastreamento analítico. Quando o Firebase Analytics é habilitado pela implantação, ele pode usar cookies ou identificadores locais necessários à medição.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">5. Conteúdo Externo</h2>
                    <p>
                        Este site utiliza a API pública da AniList para exibir informações. Imagens e metadados pertencem aos respectivos autores, estúdios e provedores.
                        Não hospedamos vídeos ou conteudos piratas.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-3">6. Contato</h2>
                    <p>
                        Se tiver dúvidas sobre esta política, entre em contato através das redes sociais linkadas no rodapé.
                    </p>
                </section>
            </div>
        </div>
    );
}
