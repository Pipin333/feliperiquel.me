"""Conjunto de datos simulados realistas de Mercado Público (ChileCompra)."""

from typing import List
from app.models import Licitacion, Comprador, ItemLicitacion


SAMPLE_LICITACIONES: List[Licitacion] = [
    Licitacion(
        codigo_externo="1502-32-LR24",
        nombre="Servicio de Desarrollo e Implementación de Plataforma Web en la Nube y Microservicios",
        codigo_estado=5,
        descripcion="Contratación de fábrica de software externa para el diseño, desarrollo, pruebas y despliegue continuo de nuevo sistema de gestión ciudadana en AWS/Azure con arquitectura de microservicios en Python/NodeJS y base de datos PostgreSQL.",
        fecha_cierre="2026-11-15T15:00:00",
        monto_estimado=85000000,
        moneda="CLP",
        comprador=Comprador(
            codigo_organismo="SUBDERE",
            nombre_organismo="Subsecretaría de Desarrollo Regional y Administrativo",
            rut_unidad="60.501.000-9",
            comuna="Santiago",
            region="Región Metropolitana",
        ),
        items=[
            ItemLicitacion(
                correlativo=1,
                codigo_producto=81111508,
                nombre_producto="Servicios de programación de aplicaciones",
                categoria="Tecnología de la Información",
                descripcion="Desarrollo ágil de frontend en React y backend en FastAPI/Node, integración con ClaveÚnica.",
                cantidad=12,
                unidad_medida="Mes",
            ),
            ItemLicitacion(
                correlativo=2,
                codigo_producto=81112002,
                nombre_producto="Servicios de arquitectura cloud y devops",
                categoria="Tecnología de la Información",
                descripcion="Configuración de infraestructura como código (Terraform), pipelines CI/CD y monitoreo.",
                cantidad=1,
                unidad_medida="Unidad",
            ),
        ],
    ),
    Licitacion(
        codigo_externo="2401-18-LP24",
        nombre="Adquisición de Insumos Médicos y Material Fungible para Pabellones Quirúrgicos",
        codigo_estado=5,
        descripcion="Suministro de material médico descartable, suturas mecánicas, apósitos estériles y gasas quirúrgicas para abastecer la red hospitalaria de alta complejidad durante el primer semestre.",
        fecha_cierre="2026-11-05T12:00:00",
        monto_estimado=140000000,
        moneda="CLP",
        comprador=Comprador(
            codigo_organismo="HOSPSALV",
            nombre_organismo="Hospital del Salvador",
            rut_unidad="61.602.000-K",
            comuna="Providencia",
            region="Región Metropolitana",
        ),
        items=[
            ItemLicitacion(
                correlativo=1,
                codigo_producto=42142500,
                nombre_producto="Suturas quirúrgicas absorbibles",
                categoria="Equipamiento y Suministros Médicos",
                descripcion="Cajas con 36 unidades de sutura sintética absorbible calibre 3-0 aguja curva.",
                cantidad=500,
                unidad_medida="Caja",
            ),
            ItemLicitacion(
                correlativo=2,
                codigo_producto=42131600,
                nombre_producto="Gasas y apósitos estériles",
                categoria="Equipamiento y Suministros Médicos",
                descripcion="Compresas de gasa estéril de 10x10 cm radiopacas para cirugía.",
                cantidad=1200,
                unidad_medida="Paquete",
            ),
        ],
    ),
    Licitacion(
        codigo_externo="834-45-LQ24",
        nombre="Servicios Profesionales de Auditoría de Ciberseguridad, Pentesting y Ethical Hacking",
        codigo_estado=5,
        descripcion="Evaluación integral de vulnerabilidades en infraestructura perimetral, aplicaciones móviles y sistemas core. Análisis estático y dinámico de código fuente, pruebas de intrusión tipo caja negra y caja gris.",
        fecha_cierre="2026-11-20T17:00:00",
        monto_estimado=45000000,
        moneda="CLP",
        comprador=Comprador(
            codigo_organismo="SERNAC",
            nombre_organismo="Servicio Nacional del Consumidor",
            rut_unidad="60.805.000-1",
            comuna="Santiago",
            region="Región Metropolitana",
        ),
        items=[
            ItemLicitacion(
                correlativo=1,
                codigo_producto=81112005,
                nombre_producto="Auditoría de seguridad de sistemas de información",
                categoria="Tecnología y Ciberseguridad",
                descripcion="Pentesting a 4 aplicaciones web y 2 apps móviles iOS/Android con informe de remediación.",
                cantidad=1,
                unidad_medida="Servicio",
            )
        ],
    ),
    Licitacion(
        codigo_externo="3102-09-LE24",
        nombre="Mantención Preventiva y Correctiva de Áreas Verdes, Plazas y Parques Comunales",
        codigo_estado=5,
        descripcion="Servicio integral de riego, poda de árboles en altura, mantención de césped y desmalezado en los cuadrantes norte y poniente de la comuna.",
        fecha_cierre="2026-11-10T14:00:00",
        monto_estimado=110000000,
        moneda="CLP",
        comprador=Comprador(
            codigo_organismo="MUNINUNOA",
            nombre_organismo="Ilustre Municipalidad de Ñuñoa",
            rut_unidad="69.070.300-4",
            comuna="Ñuñoa",
            region="Región Metropolitana",
        ),
        items=[
            ItemLicitacion(
                correlativo=1,
                codigo_producto=72102900,
                nombre_producto="Servicios de paisajismo y cuidado de plantas",
                categoria="Servicios de Limpieza y Mantenimiento",
                descripcion="Mantención de 45.000 metros cuadrados de jardines públicos.",
                cantidad=12,
                unidad_medida="Mes",
            )
        ],
    ),
    Licitacion(
        codigo_externo="910-14-LP24",
        nombre="Servicio de Consultoría y Modelos de Inteligencia Artificial para Detección de Anomalías",
        codigo_estado=5,
        descripcion="Desarrollo de modelos predictivos y procesamiento de lenguaje natural (NLP) / Machine Learning para la clasificación automática y detección de inconsistencias en declaraciones tributarias.",
        fecha_cierre="2026-11-28T16:00:00",
        monto_estimado=95000000,
        moneda="CLP",
        comprador=Comprador(
            codigo_organismo="SII",
            nombre_organismo="Servicio de Impuestos Internos",
            rut_unidad="60.803.000-0",
            comuna="Santiago",
            region="Región Metropolitana",
        ),
        items=[
            ItemLicitacion(
                correlativo=1,
                codigo_producto=81111600,
                nombre_producto="Servicios de consultoría en sistemas de inteligencia artificial",
                categoria="Tecnología de la Información",
                descripcion="Entrenamiento y despliegue de modelos LLM y embeddings para análisis de documentos.",
                cantidad=1,
                unidad_medida="Proyecto",
            )
        ],
    ),
    Licitacion(
        codigo_externo="450-88-LR24",
        nombre="Reposición y Reparación de Aceras, Pavimentos y Soleras en Casco Histórico",
        codigo_estado=5,
        descripcion="Obras civiles menores para demolición de baldosas deterioradas, compactación de terreno y colocación de nuevo hormigón estampado y accesibilidad universal.",
        fecha_cierre="2026-11-12T11:00:00",
        monto_estimado=180000000,
        moneda="CLP",
        comprador=Comprador(
            codigo_organismo="MUNICONA",
            nombre_organismo="Municipalidad de Concepción",
            rut_unidad="69.150.100-3",
            comuna="Concepción",
            region="Región del Biobío",
        ),
        items=[
            ItemLicitacion(
                correlativo=1,
                codigo_producto=72141000,
                nombre_producto="Construcción y reparación de aceras y caminos peatonales",
                categoria="Obras Civiles e Infraestructura",
                descripcion="Demolición e instalación de 3.200 m2 de adoquines y hormigón.",
                cantidad=1,
                unidad_medida="Global",
            )
        ],
    ),
    Licitacion(
        codigo_externo="110-67-LP24",
        nombre="Contratación de Servicios de Vigilancia, Guardias de Seguridad y Control de Acceso",
        codigo_estado=5,
        descripcion="Provisión de personal de seguridad OS10 para dependencias centrales, bodegas y edificios anexos en modalidad de turnos 24/7.",
        fecha_cierre="2026-11-08T15:30:00",
        monto_estimado=70000000,
        moneda="CLP",
        comprador=Comprador(
            codigo_organismo="JUNAEB",
            nombre_organismo="Junta Nacional de Auxilio Escolar y Becas",
            rut_unidad="60.908.000-0",
            comuna="Santiago",
            region="Región Metropolitana",
        ),
        items=[
            ItemLicitacion(
                correlativo=1,
                codigo_producto=92121500,
                nombre_producto="Servicios de vigilancia con guardias",
                categoria="Seguridad y Protección",
                descripcion="Guardias con credencial OS10 vigente y uniforme para 4 sucursales.",
                cantidad=12,
                unidad_medida="Mes",
            )
        ],
    ),
    Licitacion(
        codigo_externo="521-03-LE24",
        nombre="Soporte Técnico, Mesa de Ayuda TI y Mantenimiento de Servidores Linux y Windows",
        codigo_estado=5,
        descripcion="Servicio de soporte nivel 1, 2 y 3 para usuarios internos, monitoreo de infraestructura de servidores on-premise y virtualización VMware.",
        fecha_cierre="2026-11-22T13:00:00",
        monto_estimado=52000000,
        moneda="CLP",
        comprador=Comprador(
            codigo_organismo="INDAP",
            nombre_organismo="Instituto de Desarrollo Agropecuario",
            rut_unidad="60.702.000-4",
            comuna="Santiago",
            region="Región Metropolitana",
        ),
        items=[
            ItemLicitacion(
                correlativo=1,
                codigo_producto=81111800,
                nombre_producto="Servicios de soporte a sistemas de computación",
                categoria="Tecnología de la Información",
                descripcion="Mesa de ayuda para 600 puestos de trabajo y administración de redes.",
                cantidad=12,
                unidad_medida="Mes",
            )
        ],
    ),
]
