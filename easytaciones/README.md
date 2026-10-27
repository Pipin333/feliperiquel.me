# Integración Mercado Público (ChileCompra) + Transformer Semántico

Este proyecto implementa una solución completa para **consultar, indexar y filtrar efectivamente licitaciones activas de Mercado Público de Chile**, utilizando un **modelo Transformer de Procesamiento de Lenguaje Natural (NLP)** para calcular el **porcentaje de afinidad semántica** frente a cualquier perfil o requerimiento.

---

## 🚀 ¿Por qué búsqueda semántica con Transformers?

La búsqueda tradicional por palabras clave falla con licitaciones porque las instituciones públicas usan sinónimos, códigos técnicos o descripciones formales (ej: *"solución informática en la nube"* vs *"fábrica de software microservicios"* vs *"desarrollo web"*).

El transformer genera **embeddings vectoriales densos** capturando el **significado conceptual**:
- Compara semánticamente el perfil deseado contra:
  - **Título de la licitación**
  - **Descripción y alcance técnico**
  - **Organismo comprador**
  - **Ítems, productos y categorías solicitadas**
- Normaliza los vectores y calcula la **similitud coseno**, proyectándola a un **porcentaje intuitivo de afinidad (0% a 100%)**.
- Filtra automáticamente aquellas que cumplan con el `min_score` configurado (ej: 60%).
- Cuenta con **cache de embeddings en memoria** para que consultas subsecuentes respondan en **milisegundos**.

---

## 📁 Estructura del Proyecto

```text
licitaciones-matcher/
├── app/
│   ├── client_mp.py     # Cliente HTTP async para API Mercado Público (+ fallback mock)
│   ├── config.py        # Configuración centralizada (.env con pydantic-settings)
│   ├── matcher.py       # Motor de embeddings con SentenceTransformers y similitud coseno
│   ├── mock_data.py     # Catálogo de prueba realista de licitaciones chilenas
│   ├── models.py        # Esquemas Pydantic v2
│   └── main.py          # API REST FastAPI con documentación interactiva Swagger
├── tests/
│   └── test_matcher.py  # Tests unitarios del cálculo semántico y umbrales
├── cli.py               # Herramienta CLI con tablas formateadas (Rich)
├── .env.example         # Plantilla de variables de entorno
└── pyproject.toml       # Dependencias gestionadas con uv
```

---

## 🔑 1. Configuración de API Mercado Público

Para usar la API oficial de ChileCompra:
1. Regístrate gratuitamente en el portal de desarrolladores: [desarrolladores.mercadopublico.cl](https://desarrolladores.mercadopublico.cl/)
2. Copia tu **Ticket** de desarrollador.
3. Copia el archivo de entorno y agrega tu ticket:
   ```bash
   cp .env.example .env
   ```
   Edita `.env`:
   ```env
   MP_TICKET=tu_ticket_aqui
   ```
> **Nota:** Si no dispones de ticket inmediatamente, el sistema activa automáticamente el **modo mock con datos realistas** (desarrollo web, ciberseguridad, salud, obras, seguridad, etc.) para que puedas probar todo el pipeline de inmediato.

---

## 💻 2. Uso mediante CLI (Línea de comandos)

Puedes ejecutar búsquedas interactivas en tu terminal con tablas formateadas:

```bash
# Buscar licitaciones de desarrollo de software con match mínimo de 50%
uv run python cli.py --query "desarrollo de software y plataformas en la nube" --min-score 50

# Buscar licitaciones de ciberseguridad y pentesting
uv run python cli.py -q "auditoría de ciberseguridad y ethical hacking" -m 60

# Buscar licitaciones médicas o insumos de salud
uv run python cli.py -q "insumos médicos para pabellón y suturas quirúrgicas" -m 55
```

---

## 🌐 3. Servidor API REST (FastAPI)

Para iniciar el servidor:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

- Documentación interactiva Swagger: **`http://localhost:8000/docs`**
- Documentación ReDoc: **`http://localhost:8000/redoc`**

### Ejemplo de consumo del Endpoint de Matching:

```bash
curl -X POST "http://localhost:8000/api/v1/licitaciones/match" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Servicios de desarrollo de aplicaciones web y microservicios cloud",
    "min_score_percentage": 50.0,
    "top_k": 5
  }'
```

**Respuesta JSON estructurada:**
```json
{
  "query": "Servicios de desarrollo de aplicaciones web y microservicios cloud",
  "total_evaluadas": 8,
  "total_coincidentes": 2,
  "min_score_aplicado": 50.0,
  "tiempo_procesamiento_ms": 14.8,
  "resultados": [
    {
      "ranking": 1,
      "score_percentage": 76.84,
      "cosine_similarity": 0.7684,
      "licitacion": {
        "codigo_externo": "1502-32-LR24",
        "nombre": "Servicio de Desarrollo e Implementación de Plataforma Web en la Nube y Microservicios",
        "descripcion": "Contratación de fábrica de software externa...",
        "monto_estimado": 85000000,
        "fecha_cierre": "2026-11-15T15:00:00",
        "comprador": {
          "nombre_organismo": "Subsecretaría de Desarrollo Regional y Administrativo"
        }
      }
    }
  ]
}
```

---

## 🧪 4. Ejecución de Tests

```bash
uv run pytest -v
```

---

## 🐳 5. Despliegue con Docker (1-Click Run)

Para levantar el entorno completo con Docker y Docker Compose:

```bash
# Iniciar contenedor con la API REST
docker compose up -d

# Verificar estado y logs
docker compose ps
docker compose logs -f

# Probar healthcheck
curl http://localhost:8000/health
```

