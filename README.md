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

### 🏠 1. Visão Geral (Dashboard)
A central de informações do usuário. Apresenta:
* **Cards Estatísticos:** Exibição da pontuação acumulada, total de palpites realizados, aproveitamento de acertos e contador de jogos que acontecem hoje.
* **Próximos Jogos:** Widget inteligente que traz as partidas mais próximas em ordem cronológica.
* **Tabelas da Fase de Grupos:** Classificação dos grupos de A a L atualizada em tempo real com base nos resultados oficiais definidos.

### 📅 2. Jogos (Palpites)
A tela onde os usuários enviam e editam seus palpites para os jogos da Copa.
* **Filtros por Fase:** Divisão clara entre **Fase de Grupos** e **Mata-Mata**.
* **Navegação Inteligente:** Barra de rolagem horizontal com suporte a **auto-scrolling suave**. Ao selecionar um grupo (de A a L) ou fase do mata-mata (Dezesseisavos de Final até a Final), a rolagem se ajusta automaticamente ao item em foco.
* **Bloqueio de Segurança:** Palpites são automaticamente bloqueados para edição assim que o relógio alcança o horário de início do confronto ou se o status da partida for alterado.

### 🔮 3. O Oráculo (Oracle)
Uma mecânica exclusiva e competitiva! No Oráculo, o usuário preenche de uma só vez a previsão de classificação exata (1º ao 4º lugar) de cada um dos grupos da Copa de 2026. Essa previsão gera pontuações adicionais conforme a classificação final real é definida.

### 👥 4. Grupos Privados (Bolões de Amigos)
O coração competitivo e social do Bolão:
* **Criação de Grupos:** Crie um bolão com nome personalizado e defina o número máximo de membros.
* **Código de Convite Único:** Cada grupo gera um código alfa-numérico exclusivo para convidar amigos.
* **Ranking Integrado:** Tabela de classificação interna do grupo exibindo a pontuação agregada de cada membro.
* **Visualização de Palpites:** Transparência total — após o início de cada jogo, os membros do grupo podem visualizar e comparar os palpites uns dos outros.

### 🛡️ 5. Painel de Gerenciamento (Apenas para ADMIN)
Aba exclusiva para usuários administradores. Permite:
* Inserir e editar placares oficiais de partidas encerradas.
* O sistema calcula instantaneamente os pontos obtidos por todos os usuários do sistema.
* O Redis limpa de forma inteligente o cache dos grupos impactados para refletir a nova classificação e pontos imediatamente.

---

## 📈 Regras de Pontuação do Bolão

As pontuações são computadas automaticamente pelo servidor assim que um administrador encerra e registra o placar de uma partida:

| Acerto | Pontos | Exemplo |
| :--- | :---: | :--- |
| **Placar Exato** | **3 pts** | Palpite: `2 x 1` \| Placar Real: `2 x 1` |
| **Resultado do Jogo** (Acertou o vencedor ou empate, mas errou o placar exato) | **1 pt** | Palpite: `2 x 1` \| Placar Real: `1 x 0` (ou Palpite: `1 x 1` \| Placar Real: `0 x 0`) |
| **Erro Total** | **0 pts** | Palpite: `2 x 1` \| Placar Real: `1 x 2` |

---

## 💻 Arquitetura e Stack Tecnológica

### 🎨 Frontend (`apps/frontend`)
* **Framework:** Next.js 15 (React 19 & App Router)
* **Estilização:** TailwindCSS (Design premium com gradientes metálicos, cartões translúcidos com efeito Glassmorphism e alta responsividade)
* **Ícones:** Lucide-React
* **Consumo de API:** Axios com interceptador para gerenciamento automatizado do JWT

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