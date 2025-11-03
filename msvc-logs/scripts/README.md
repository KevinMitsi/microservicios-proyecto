# Scripts de Pruebas para msvc-logs

Este directorio contiene scripts multiplataforma para ejecutar las pruebas del sistema de logging con FluentBit.

## 📁 Scripts Disponibles

- `run-tests.ps1` - Script para Windows PowerShell
- `run-tests.bat` - Script para Windows Batch  
- `run-tests.sh` - Script para Linux/Mac Bash

## 🚀 Uso

### Windows PowerShell
```powershell
.\scripts\run-tests.ps1 all       # Todas las pruebas
.\scripts\run-tests.ps1 unit      # Solo unitarias
.\scripts\run-tests.ps1 integration # Solo integración
```

### Windows Batch
```cmd
.\scripts\run-tests.bat all       # Todas las pruebas
.\scripts\run-tests.bat unit      # Solo unitarias  
.\scripts\run-tests.bat integration # Solo integración
```

### Linux/Mac Bash
```bash
./scripts/run-tests.sh all        # Todas las pruebas
./scripts/run-tests.sh unit       # Solo unitarias
./scripts/run-tests.sh integration # Solo integración
```

## ⚙️ Funcionamiento

Los scripts automáticamente:
1. Verifican que Docker esté ejecutándose
2. Inician los servicios necesarios
3. Instalan dependencias si es necesario
4. Ejecutan las pruebas seleccionadas
5. Muestran un resumen de resultados

## 🎯 Casos de Uso

### Desarrollo Local
```bash
./scripts/run-tests.sh unit    # Pruebas rápidas durante desarrollo
```

### CI/CD Pipeline
```bash
./scripts/run-tests.sh all     # Validación completa antes de merge
```

### Debugging
```bash
./scripts/run-tests.sh integration  # Solo pruebas que requieren servicios
```
