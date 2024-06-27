# Utiliser l'image de base Node.js
FROM node:14

# Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copier package.json et package-lock.json dans le répertoire de travail
COPY package*.json ./

# Installer les dépendances de l'application
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Exposer le port utilisé par l'application
EXPOSE 8080

# Commande pour lancer l'application
CMD ["node", "index.js"]