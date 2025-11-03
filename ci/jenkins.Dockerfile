# Jenkins con Docker CLI/Compose + Node.js + Python para pipelines multi-stack
FROM jenkins/jenkins:lts

USER root

# Instalar Docker CLI, Docker Compose, Node.js, Python3, pip, OpenJDK 21 para Gradle
RUN apt-get update && apt-get install -y \
    ca-certificates curl gnupg lsb-release \
    python3 python3-pip \
    openjdk-21-jdk \
    git \
 && rm -rf /var/lib/apt/lists/*

# Instalar Docker CLI
RUN install -m 0755 -d /etc/apt/keyrings \
 && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
 && chmod a+r /etc/apt/keyrings/docker.gpg \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list \
 && apt-get update \
 && apt-get install -y docker-ce-cli \
 && rm -rf /var/lib/apt/lists/*

# Instalar Docker Compose v2
RUN curl -SL "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-$(uname -m)" -o /usr/local/bin/docker-compose \
 && chmod +x /usr/local/bin/docker-compose \
 && ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Instalar Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
 && apt-get update && apt-get install -y nodejs \
 && npm i -g npm@latest

# Preparar home de Jenkins
RUN mkdir -p /var/jenkins_home && chown -R jenkins:jenkins /var/jenkins_home

USER jenkins

EXPOSE 8080
