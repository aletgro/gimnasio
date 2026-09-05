# Usamos la imagen oficial y mínima de Debian (no usa Microsoft)
FROM debian:bookworm-slim

# Instalamos las herramientas mínimas necesarias para que VS Code y Git funcionen
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    git \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Creamos un usuario llamado 'dev' para no usar root
RUN useradd -m -s /bin/bash dev \
    && echo "dev ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Cambiamos al usuario 'dev'
USER dev