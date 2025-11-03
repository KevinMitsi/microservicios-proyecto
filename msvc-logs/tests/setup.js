// Configuración global para las pruebas

// Configuración global de timeout para pruebas de integración
jest.setTimeout(60000);

// Variables globales para contenedores de test
global.testContainers = {
  rabbitmq: null,
  opensearch: null,
  fluentbit: null
};

// Configuración antes de todas las pruebas
beforeAll(async () => {
  console.log('Iniciando configuración de pruebas...');
});

// Limpieza después de todas las pruebas
afterAll(async () => {
  console.log('Limpiando contenedores de prueba...');

  // Limpiar contenedores si existen
  for (const [name, container] of Object.entries(global.testContainers)) {
    if (container) {
      try {
        await container.stop();
        console.log(`Contenedor ${name} detenido`);
      } catch (error) {
        console.warn(`Error al detener contenedor ${name}:`, error.message);
      }
    }
  }
});
