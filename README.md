# Gerador de Certificados — Simplifica Treinamentos

Sistema web completo para emissão de certificados em PDF, com painel administrativo, múltiplas turmas e página pública customizável.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.12 + Flask 3 + Gunicorn |
| Frontend | React 18 + Vite 5 + TypeScript + Bootstrap 5 |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Armazenamento | Supabase Storage |
| PDF | ReportLab + Pillow |
| Gráficos | Recharts |
| Infraestrutura | Docker Compose + Nginx |

---

## Funcionalidades

### Área pública
- Página de emissão com título, subtítulo, cor e imagem de fundo customizáveis por turma
- Geração de PDF A4 paisagem com imagem de fundo e nome posicionado
- Hash SHA-256 único por participante (evita emissão duplicada)
- Download automático do certificado em PDF

### Painel administrativo (`/admin`)
- Login via Supabase Auth
- **Dashboard** — KPIs (total emitidos, turma ativa, hoje, semana), atalhos rápidos, últimos certificados
- **Turmas** — CRUD completo, configuração de posição/tamanho do nome no PDF, upload de imagem de fundo, customização da página pública
- **Certificados** — listagem, busca, exclusão, exportação CSV
- **Estatísticas** — gráficos de emissões por dia, por turma, por hora e top 10 dias

---

## Estrutura do projeto

```
certificados/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── admin.py       # Endpoints protegidos (turmas, certificados, estatísticas)
│   │   │   └── public.py      # Endpoints públicos (config, gerar PDF)
│   │   └── services/
│   │       ├── auth_service.py
│   │       ├── pdf_service.py  # ReportLab + cache de imagens
│   │       └── supabase_service.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx                  # Página pública de emissão
│   │   │   └── admin/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Turmas.tsx
│   │   │       ├── Certificados.tsx
│   │   │       ├── Estatisticas.tsx
│   │   │       └── Login.tsx
│   │   ├── components/
│   │   └── lib/
│   │       ├── api.ts          # Funções de chamada à API
│   │       └── supabase.ts
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env                        # Não versionado
```

---

## Configuração

### 1. Variáveis de ambiente

Crie o arquivo `.env` na raiz:

```env
SUPABASE_URL=https://<projeto>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_KEY=<service_key>

VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_API_URL=
```

### 2. Tabelas no Supabase

```sql
CREATE TABLE turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text DEFAULT '',
  ativa boolean DEFAULT false,
  imagem_url text DEFAULT '',
  nome_pos_x float DEFAULT 148,
  nome_pos_y float DEFAULT 105,
  nome_fonte_tam int DEFAULT 36,
  nome_maiusculo boolean DEFAULT true,
  pagina_titulo text DEFAULT 'Emissão de Certificados',
  pagina_subtitulo text DEFAULT 'Preencha os dados abaixo para gerar seu certificado',
  pagina_cor_fundo text DEFAULT '#0f3460',
  pagina_img_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE certificados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id uuid REFERENCES turmas(id) ON DELETE CASCADE,
  nome_completo text NOT NULL,
  hash_sha256 text UNIQUE NOT NULL,
  data_emissao timestamptz DEFAULT now()
);
```

### 3. Storage

Criar bucket `imagens-fundo` como **público** no Supabase Storage.

---

## Executar com Docker

```bash
# Subir
sudo docker compose up --build -d

# Parar
sudo docker compose down

# Ver logs
sudo docker logs certificados_backend
sudo docker logs certificados_frontend
```

A aplicação ficará disponível em `http://localhost`.

---

## Deploy (Oracle Cloud Free Tier)

1. Liberar porta **80** no Security List da instância
2. Liberar no firewall do SO:
   ```bash
   sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
   ```
3. No Cloudflare: DNS tipo `A` apontando para o IP da Oracle com proxy ativado (SSL Flexible)
4. Clonar o repositório, criar o `.env` e rodar `sudo docker compose up --build -d`


Este é um projeto para gerar certificados personalizados de forma dinâmica utilizando PHP e FPDF. Ele inclui uma interface web amigável, baseada em Bootstrap, para facilitar o uso.

---

## Estrutura do Projeto

### 📁 Arquivos e Diretórios
- **`index.html`**: Página inicial onde o usuário insere seu nome para gerar o certificado.
- **`geracertificado.php`**: Script principal que processa os dados, gera o certificado em PDF e salva informações no arquivo CSV.
- **`certificados.csv`**: Registro de todos os certificados gerados, com nome, hash único e data/hora.
- **`sucesso.html`**: Página de sucesso exibida após a geração do certificado.
- **`erro.html`**: Página exibida caso o certificado já tenha sido gerado anteriormente.
- **`search.html`**: Página que utiliza Grid.js para exibir os certificados gerados em uma tabela pesquisável.
- **`download.php`**: Endpoint para permitir o download do certificado diretamente.
- **`fundo.jpg`**: Imagem de fundo usada nas páginas do projeto.
- **`simplifica.png`**: Logotipo da Simplifica Treinamentos.
- **`makefont.php`**: Script auxiliar para conversão de fontes para o FPDF.

---

## Funcionalidades

1. **Geração de Certificados:**
   - O usuário insere seu nome no formulário em `index.html`.
   - O nome é processado em `geracertificado.php`, que verifica se o certificado já foi gerado.
   - Caso o certificado não exista, ele é gerado como um arquivo PDF e registrado no `certificados.csv`.

2. **Verificação de Certificados:**
   - Se o certificado já existir, o usuário é redirecionado para `erro.html`, com uma mensagem indicando o problema.

3. **Tabela Pesquisável:**
   - `search.html` exibe os certificados registrados no arquivo `certificados.csv` em uma tabela interativa e pesquisável, utilizando Grid.js.

4. **Download de Certificados:**
   - Após a geração do certificado, o usuário pode baixá-lo diretamente através de um botão em `sucesso.html` ou usando o endpoint `download.php`.

---

## Como Usar

1. **Configuração Inicial:**
   - Certifique-se de que o servidor PHP está ativo.
   - Coloque todos os arquivos em um servidor acessível.

2. **Passo a Passo:**
   - Acesse `index.html` no navegador.
   - Insira seu nome completo no campo e clique em "Gerar Certificado".
   - Se o certificado for gerado com sucesso, o usuário será redirecionado para `sucesso.html`.
   - O botão "Baixar Certificado" estará disponível para download.
   - Caso o certificado já tenha sido gerado, a página `erro.html` será exibida.

3. **Pesquisar Certificados:**
   - Acesse `search.html` para visualizar todos os certificados gerados.

---

## Dependências

- **FPDF**: Biblioteca PHP para geração de PDFs.
- **Bootstrap**: Framework CSS para estilização.
- **Grid.js**: Biblioteca JavaScript para criar tabelas pesquisáveis.

---

## Personalizações

- **Alterar a Imagem de Fundo:**
  Substitua o arquivo `fundo.jpg` por outra imagem com o mesmo nome.

- **Alterar o Logotipo:**
  Substitua o arquivo `simplifica.png` por sua logomarca.

---

## Estrutura dos Certificados

Os certificados gerados incluem:
- Nome do participante.
- Layout personalizado com imagem de fundo e logotipo.
- Registro de dados no arquivo `certificados.csv`.

---

## Segurança

- Cada certificado possui um **hash único** gerado com o nome do usuário para evitar duplicidades.
- O sistema redireciona para `erro.html` caso o certificado já tenha sido gerado para o mesmo nome.

---

## Como Contribuir

1. Faça um fork do repositório.
2. Crie um branch para sua feature: `git checkout -b minha-feature`.
3. Faça o commit das alterações: `git commit -m "Minha nova feature"`.
4. Envie para o branch: `git push origin minha-feature`.
5. Abra um Pull Request.

---

## Screenshots

### Página Inicial
![index.html](fundo.jpg)

### Certificado Gerado
![sucesso.html](simplifica.png)

---


