# Imagem base
FROM node:18

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar o restante do código
COPY . .

# Expor a porta (se sua aplicação roda em 3000)
EXPOSE 3000

# Comando para rodar
CMD ["npm", "start"]
