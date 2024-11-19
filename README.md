# Gerador de Certificados - Simplifica Treinamentos

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


