# Glosario de Dominio: Mercado Público & Matcher Semántico

Este glosario documenta los conceptos de negocio de las compras públicas en Chile (ChileCompra / Mercado Público) y su mapeo al sistema de filtrado semántico:

---

## 🏛️ Conceptos de Compras Públicas (ChileCompra)

- **ChileCompra**: Dirección de Compras y Contratación Pública del Estado de Chile.
- **Mercado Público**: Plataforma transaccional oficial (`mercadopublico.cl`) donde los organismos del Estado licitan y contratan bienes y servicios.
- **Código Externo**: Identificador único oficial de cada licitación (ej: `1502-32-LR24`), compuesto por:
  - Primer número: Código de la unidad de compra.
  - Segundo número: Correlativo anual.
  - Letras finales: Tipo de licitación:
    - `LE`: Licitación Pública menor a 100 UTM.
    - `LP`: Licitación Pública entre 100 y 1.000 UTM.
    - `LQ`: Licitación Pública entre 1.000 y 2.000 UTM.
    - `LR`: Licitación Pública entre 2.000 y 5.000 UTM.
    - `LS`: Licitación Pública mayor a 5.000 UTM.
- **Organismo Comprador**: Entidad pública que emite la licitación (ej: Municipalidades, Ministerios, Servicios de Salud, Universidades Estatales).
- **Ítem / Ficha del Producto**: Detalle específico de los productos o servicios solicitados con código estándar UNSPSC (ej: `81111508` para servicios de programación).
- **Monto Estimado**: Presupuesto referencial disponible para la adjudicación, expresado habitualmente en pesos chilenos (CLP) o Unidades de Fomento (UF).

---

## 🧠 Conceptos de NLP & Matching

- **Embedding Semántico**: Representación vectorial densa (384 dimensiones para `paraphrase-multilingual-MiniLM-L12-v2`) que codifica el significado conceptual del requerimiento.
- **Similitud Coseno ($S_c$)**: Ángulo normalizado entre el vector de búsqueda y el vector consolidado de la licitación ($u \cdot v \in [-1, 1]$).
- **Score Porcentual**: Proyección intuitiva de la similitud coseno escalada de 0% a 100% ($S_c \times 100$). En modelos multilingües, un score $\ge 50\%$ representa ya una correlación temática significativa en contratación pública.
- **Texto Consolidado (Searchable Text)**: Síntesis normalizada que concatena título, descripción, organismo e ítems antes de la inferencia para maximizar el contexto del modelo.
