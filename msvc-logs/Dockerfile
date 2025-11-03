FROM fluent/fluent-bit:3.0

# Copiar configuración de FluentBit
COPY fluent-bit.conf /fluent-bit/etc/fluent-bit.conf

# Puertos para métricas HTTP y input HTTP
EXPOSE 2020 9880 24224

# Comando por defecto - FluentBit se ejecuta como root en el contenedor
CMD ["/fluent-bit/bin/fluent-bit", "--config", "/fluent-bit/etc/fluent-bit.conf"]

