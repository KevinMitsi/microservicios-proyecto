# Dockerfile para msvc-profiles
FROM python:3.11-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar solo los archivos de dependencias primero
COPY requirements.txt ./

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt && pip install pydantic-settings

# Copiar el resto del código fuente
COPY app/ ./app/
COPY main.py ./main.py

# Exponer puerto
EXPOSE 8082

# Variables de entorno por defecto
ENV PYTHONUNBUFFERED=1

# Comando de inicio
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082"]
