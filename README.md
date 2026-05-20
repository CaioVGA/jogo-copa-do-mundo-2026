# 🏆 Bolão Copa do Mundo 2026 — Bolão, Oráculo & Palpites

Bem-vindo ao **Bolão Copa do Mundo 2026**, uma plataforma web premium completa desenvolvida para criar bolões, palpitar sobre os jogos e competir com amigos em grupos privados durante a maior Copa do Mundo da história!

O projeto é construído sobre uma arquitetura robusta, moderna e escalável, utilizando Next.js no frontend, NestJS no backend, PostgreSQL como banco de dados principal relacional e Redis para cache de alta performance dos rankings e dados de grupos.

---

## 🚀 Como Iniciar a Aplicação (Instalação e Execução)

A aplicação está totalmente configurada com **Docker** e **Docker Compose**, permitindo que você inicie todos os serviços (Banco, Cache, Backend, Migrações e Frontend) com um único comando.

### 📋 Pré-requisitos
Certifique-se de ter instalado em sua máquina:
- **Docker**
- **Docker Compose**

---

### 🛠️ Passo a Passo para Execução

#### 1. Configurar as Variáveis de Ambiente
Na raiz do projeto (e também nos diretórios `apps/backend/` e `apps/frontend/` caso queira rodar localmente sem Docker), você pode verificar os arquivos de variáveis de ambiente. Para a execução simplificada com Docker Compose, as variáveis padrão já estão pré-configuradas no `docker-compose.yml`, necessitando apenas dos dados de e-mail se quiser enviar mensagens reais.

#### 2. Iniciar os Containers Docker
Execute o comando abaixo na pasta raiz do projeto para construir e iniciar todos os serviços em segundo plano:

```bash
docker compose up -d --build
```

#### 3. O que acontece nos bastidores?
* **PostgreSQL (`copa2026_postgres`)** e **Redis (`copa2026_redis`)** são iniciados e entram em estado saudável.
* O container **`copa2026_migrate`** roda e realiza as seguintes tarefas automaticamente:
  1. Cria e aplica o esquema das tabelas no banco de dados (`npx prisma db push`).
  2. Popula o seed inicial (`npx prisma db seed`), que cadastra todas as **48 seleções** com suas respectivas bandeiras, grupos oficiais (A até L), **todos os confrontos da fase de grupos e chaves do mata-mata**, além de criar o usuário administrador de testes.
* O **Backend (`copa2026_backend`)** e o **Frontend (`copa2026_frontend`)** são levantados prontos para uso.

#### 4. Acessar a Aplicação
* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)

---

### 🔑 Usuário de Testes Pré-Cadastrado
Durante o seed automático, um usuário pronto para uso é criado para facilitar o seu primeiro login:

* **E-mail:** `caio@example.com`
* **Senha:** `password123`

---

## 🎯 Principais Funcionalidades da Aplicação

### 🔑 1. Autenticação & Segurança (Cadastro, OTP e Recuperação)
Fluxo completo e robusto de controle de acesso:
* **Cadastro e Login:** Registro de novos usuários com validação forte no front e senhas salvas de forma segura (criptografadas com bcrypt no backend).
* **Ativação por E-mail (OTP):** Contas criadas exigem ativação em duas etapas utilizando um código de uso único (OTP) enviado automaticamente por e-mail via Nodemailer.
* **Recuperação de Acesso:** Fluxo de redefinição de senhas com envio de token OTP temporário para o e-mail cadastrado.
* **Route Guard Automático:** Interceptação inteligente de rotas privadas e públicas para garantir que apenas usuários devidamente autenticados entrem nas telas do dashboard.

### 🏠 2. Visão Geral (Dashboard)
A central de informações do usuário. Apresenta:
* **Cards Estatísticos:** Exibição da pontuação acumulada, total de palpites realizados, aproveitamento de acertos e contador de jogos que acontecem hoje.
* **Próximos Jogos:** Widget inteligente que traz as partidas mais próximas em ordem cronológica.
* **Tabelas da Fase de Grupos:** Classificação dos grupos de A a L atualizada em tempo real com base nos resultados oficiais definidos.

### 📅 3. Jogos (Palpites)
A tela onde os usuários enviam e editam seus palpites para os jogos da Copa.
* **Filtros por Fase:** Divisão clara entre **Fase de Grupos** e **Mata-Mata**.
* **Navegação Inteligente:** Barra de rolagem horizontal com suporte a **auto-scrolling suave**. Ao selecionar um grupo (de A a L) ou fase do mata-mata (Dezesseisavos de Final até a Final), a rolagem se ajusta automaticamente ao item em foco.
* **Bloqueio de Segurança:** Palpites são automaticamente bloqueados para edição assim que o relógio alcança o horário de início do confronto ou se o status da partida for alterado.

### 🔮 4. O Oráculo (Oracle)
Uma mecânica exclusiva e competitiva! No Oráculo, o usuário preenche de uma só vez a previsão de classificação exata (1º ao 4º lugar) de cada um dos grupos da Copa de 2026. Essa previsão gera pontuações adicionais conforme a classificação final real é definida.

### 👥 5. Grupos Privados (Bolões de Amigos)
O coração competitivo e social do Bolão:
* **Criação de Grupos:** Crie um bolão com nome personalizado e defina o número máximo de membros.
* **Código de Convite Único:** Cada grupo gera um código alfa-numérico exclusivo para convidar amigos.
* **Ranking Integrado:** Tabela de classificação interna do grupo exibindo a pontuação agregada de cada membro.
* **Visualização de Palpites:** Transparência total — após o início de cada jogo, os membros do grupo podem visualizar e comparar os palpites uns dos outros.
* **Administração de Grupo:** Donos de grupo podem renomear, excluir, remover membros específicos ou transferir a propriedade a qualquer momento.

### ⚙️ 6. Configurações & Personalização
Espaço para o usuário configurar suas preferências de perfil:
* **Ajustar Foto de Perfil (Avatar Cropper):** Modal de recorte interativo que permite carregar imagens locais, ajustar a escala e recortar o avatar no formato ideal antes do envio.
* **Dados Pessoais:** Troca rápida de Nome e E-mail com propagação instantânea da atualização no layout do dashboard sem necessidade de atualizar a página.
* **Segurança:** Área integrada para alteração segura de senha de acesso.

### 🛡️ 7. Painel de Gerenciamento (Apenas para ADMIN)
Aba exclusiva para usuários administradores. Permite:
* Inserir e editar placares oficiais de partidas encerradas.
* O sistema calcula instantaneamente os pontos obtidos por todos os usuários do sistema.
* O Redis limpa de forma inteligente o cache dos grupos impactados para refletir a nova classificação e pontos imediatamente.

### 🛑 8. Tratamento de Erros & Telas Temáticas
Implementação de páginas temáticas de futebol para enriquecer o tratamento de erros e exceções:
* **Erro 404 (Página Não Encontrada):** *"BANDEIRA LEVANTADA! 🚩"* — Ilustração de um bandeirinha marcando impedimento.
* **Erro 403 (Forbidden / Acesso Proibido):** *"EXPULSO DO LANCE! 🟥"* — Árbitro erguendo cartão vermelho direto ao tentar acessar áreas restritas do painel de administração sem privilégios.
* **Erro 500 / Rede (Erro Global / `error.tsx`):** *"JOGO ADIADO! ⛈️"* — Bola de futebol sob tempestade com chuva e raios para indicar falhas críticas do sistema ou quedas de internet.
* **Rota de Laboratório (`/test-error`):** Rota de testes para desenvolvedores simularem erros e inspecionarem o design das telas.

### 🔄 9. Fluxo de Saída com Confirmação (Substituição)
Ao clicar em "Sair da Conta" no painel principal ou no menu responsivo mobile:
* O sistema exibe um modal animado com o título *"CANSOU DO JOGO? 🥵"* (Substituição).
* Apresenta um gráfico animado em SVG do jogador saindo de campo exausto e com suor, oferecendo opções de voltar ao jogo ou confirmar a saída definitiva para o vestiário.

---

## 📈 Regras de Pontuação do Sistema

O sistema de pontuação é dividido em duas partes fundamentais: os **Palpites das Partidas (Bolão)** e a **Classificação de Grupos (Oráculo)**. Os cálculos e atualizações de classificação ocorrem em tempo real assim que um administrador insere os placares oficiais.

### ⚽ 1. Pontuação dos Palpites (Bolão)

Os pontos de cada palpite individual de jogo são concedidos com base no nível de precisão do placar enviado em comparação com o resultado oficial da partida:

| Nível de Acerto | Pontuação | Critério de Validação | Exemplos (Palpite vs. Placar Real) |
| :--- | :---: | :--- | :--- |
| 🌟 **Placar Exato** | **5 pts** | Acertou exatamente o número de gols de ambas as seleções. | Palpite: `2 x 1` \| Real: `2 x 1`<br>Palpite: `0 x 0` \| Real: `0 x 0` |
| 🔥 **Vencedor + Gols de uma Equipe** | **4 pts** | Acertou o vencedor ou empate da partida, e acertou o número exato de gols marcados por um dos times. | Palpite: `2 x 1` \| Real: `2 x 0` *(vencedor casa + 2 gols da casa)*<br>Palpite: `1 x 1` \| Real: `1 x 2` *(vencedor fora + 1 gol da casa)* |
| 🎯 **Vencedor/Empate Seco** | **3 pts** | Acertou apenas quem venceria (ou que daria empate), sem acertar a quantidade exata de gols de nenhum time. | Palpite: `2 x 1` \| Real: `1 x 0` *(acertou vitória da casa)*<br>Palpite: `2 x 2` \| Real: `1 x 1` *(acertou empate)* |
| 🛡️ **Gols de uma Equipe (Sem acertar vencedor)** | **1 pt** | Errou o vencedor ou empate da partida, mas acertou a quantidade exata de gols marcados por uma das duas seleções. | Palpite: `2 x 1` \| Real: `0 x 1` *(acertou 1 gol do visitante, mas errou vencedor)* |
| ❌ **Erro Total** | **0 pts** | Não acertou o vencedor, empate, nem a quantidade de gols de nenhuma das seleções. | Palpite: `2 x 1` \| Real: `0 x 2` |

---

### 🔮 2. Pontuação do Oráculo (Classificação de Grupos)

O **Oráculo** é uma funcionalidade especial de previsão de longo prazo. A pontuação é computada somente após a finalização completa de **todos** os confrontos da Fase de Grupos (Grupos A a L):

*   **Critério de Pontuação:** Para cada grupo (A a L), o usuário deve preencher a previsão do 1º ao 4º colocados.
*   **Valor por Posição Correta:** Cada seleção colocada na sua exata posição da classificação final oficial rende **+4 pontos**.
*   **Pontuação Máxima por Grupo:** **16 pontos** *(4 seleções x 4 pts)*.
*   **Pontuação Máxima Global:** **192 pontos** *(12 grupos x 16 pts)*.
*   **Integração com Ranking:** A pontuação obtida no Oráculo é adicionada automaticamente ao total do usuário nos rankings dos grupos dos quais ele participa, servindo como um grande diferencial competitivo na classificação final do bolão.

---

## 💻 Arquitetura e Stack Tecnológica

### 🎨 Frontend (`apps/frontend`)
* **Framework:** Next.js 15 (React 19 & App Router)
* **Estilização:** TailwindCSS (Design premium com gradientes metálicos, cartões translúcidos com efeito Glassmorphism e alta responsividade)
* **Ícones:** Lucide-React
* **Segurança e Interceptação:** Axios com interceptador automático de erros HTTP, guardas de rota dinâmicos para sessões expiradas ou acessos restritos (redirecionamento inteligente para `/login` ou `/forbidden`).

### ⚡ Backend (`apps/backend`)
* **Framework:** NestJS 11 (Arquitetura limpa modular em TypeScript)
* **ORM:** Prisma ORM (Integração otimizada com o banco de dados)
* **Autenticação:** Passport JWT
* **Notificação & Ativação:** Nodemailer integrado

### 🗄️ Infraestrutura e Serviços
* **PostgreSQL:** Banco de dados relacional para usuários, grupos, partidas e palpites.
* **Redis:** Cache de alto desempenho para manter os rankings e os feeds de grupos rápidos e estáveis sob alta concorrência.
* **Docker / Docker Compose:** Orquestração completa de containers.

---

## ⚙️ Comandos Úteis de Desenvolvimento

Se precisar manipular os dados diretamente nos containers em execução, utilize estes atalhos:

* **Zerar e Recriar o Banco de Dados:**
  ```bash
  docker compose down -v
  docker compose up -d --build
  ```

* **Visualizar os logs do Backend:**
  ```bash
  docker logs -f copa2026_backend
  ```

* **Acessar o Prisma Studio (Visualizador de Banco):**
  *(Comandos executados no container do backend)*
  ```bash
  docker compose exec backend npx prisma studio
  ```

---

Desenvolvido para proporcionar a melhor experiência competitiva para a **Copa do Mundo FIFA 2026**! 🏆⚽