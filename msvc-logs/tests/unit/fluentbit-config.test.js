const fs = require('fs');
const path = require('path');

describe('Configuración de FluentBit', () => {

  test('debe existir el archivo de configuración fluent-bit.conf', () => {
    const configPath = path.join(__dirname, '../../fluent-bit.conf');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  test('debe tener configuración válida de input HTTP', () => {
    const configPath = path.join(__dirname, '../../fluent-bit.conf');
    const config = fs.readFileSync(configPath, 'utf8');

    // Verificar que contiene la configuración de input HTTP
    expect(config).toContain('[INPUT]');
    expect(config).toContain('Name              http');
    expect(config).toContain('Listen            0.0.0.0');
    expect(config).toContain('Port              9880');
    expect(config).toContain('Tag               logs.http');
  });

  test('debe tener configuración válida de output OpenSearch', () => {
    const configPath = path.join(__dirname, '../../fluent-bit.conf');
    const config = fs.readFileSync(configPath, 'utf8');

    // Verificar que contiene la configuración de output OpenSearch
    expect(config).toContain('[OUTPUT]');
    expect(config).toContain('Name            opensearch');
    expect(config).toContain('Host            opensearch');
    expect(config).toContain('Port            9200');
    expect(config).toContain('Index           logs-%Y.%m.%d');
  });

  test('debe tener la estructura correcta del pipeline', () => {
    const configPath = path.join(__dirname, '../../fluent-bit.conf');
    const config = fs.readFileSync(configPath, 'utf8');

    // Verificar estructura básica
    expect(config).toContain('[SERVICE]');
    expect(config).toContain('[INPUT]');
    expect(config).toContain('[FILTER]');
    expect(config).toContain('[OUTPUT]');
  });

  test('debe existir el Dockerfile con la configuración correcta de FluentBit', () => {
    const dockerfilePath = path.join(__dirname, '../../Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);

    const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
    expect(dockerfile).toContain('FROM fluent/fluent-bit');
    expect(dockerfile).toContain('COPY fluent-bit.conf /fluent-bit/etc/fluent-bit.conf');
    expect(dockerfile).toContain('EXPOSE 2020 9880 24224');
    expect(dockerfile).toContain('CMD ["/fluent-bit/bin/fluent-bit"');
  });

  test('debe tener filtros de procesamiento configurados', () => {
    const configPath = path.join(__dirname, '../../fluent-bit.conf');
    const config = fs.readFileSync(configPath, 'utf8');

    // Verificar filtros
    expect(config).toContain('[FILTER]');
    expect(config).toContain('Name    modify');
    expect(config).toContain('Add     processed_by fluent-bit');
  });

});
