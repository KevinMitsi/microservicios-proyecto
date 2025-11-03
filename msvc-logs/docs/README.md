# 📚 Documentación del Sistema de Logging

Este directorio contiene la documentación completa del sistema de logging con FluentBit.

## 📋 Documentos Disponibles

### Principales
- [`README.md`](../README.md) - Documentación principal del sistema
- [`README-TESTS.md`](../README-TESTS.md) - Guía completa de pruebas

### Configuración
- [`fluent-bit.conf`](../fluent-bit.conf) - Configuración de FluentBit
- [`package.json`](../package.json) - Dependencias y scripts
- [`Dockerfile`](../Dockerfile) - Contenedor FluentBit
- [`Dockerfile.direct`](../Dockerfile.direct) - Contenedor procesador directo

### Scripts
- [`scripts/`](../scripts/) - Scripts de automatización multiplataforma

## 🎯 Guías Rápidas

### Iniciar Sistema
```bash
docker-compose up -d rabbitmq opensearch fluent-bit
```

### Ejecutar Pruebas
```bash
npm test                    # Todas las pruebas
npm run test:unit          # Solo unitarias
npm run test:integration   # Solo integración
```

### Monitoreo
```bash
curl http://localhost:2020  # Métricas FluentBit
curl http://localhost:9200  # Estado OpenSearch
```

## 🔗 Enlaces Útiles

- [FluentBit Documentation](https://docs.fluentbit.io/)
- [OpenSearch Documentation](https://opensearch.org/docs/)
- [RabbitMQ Management](http://localhost:15672) (admin/admin)
- [OpenSearch Dashboards](http://localhost:5601)

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar [README-TESTS.md](../README-TESTS.md) para troubleshooting
2. Verificar logs: `docker logs fluent-bit`
3. Ejecutar health checks: `npm run test:health`
