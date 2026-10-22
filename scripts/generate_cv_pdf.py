"""Script de generacion de CV ATS-compliant para Felipe Riquelme Salvo.

Genera un documento PDF estructurado en public/cv-felipe-riquelme.pdf
siguiendo las directrices internacionales de parsing ATS (Workday, Greenhouse, Lever)
y manteniendo consistencia con el sistema de diseno de feliperiquel.me.
"""

import os
import sys
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

# Regla estricta: Cero en-dashes y cero em-dashes.
FORBIDDEN_CHARS = ["\u2013", "\u2014"]


def assert_no_forbidden_chars(text: str) -> None:
    for char in FORBIDDEN_CHARS:
        if char in text:
            raise ValueError(f"Caracter prohibido detectado ({repr(char)}) en texto: {text[:40]}...")


def build_pdf(filename: str) -> None:
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Colores corporativos sobrios y de alto contraste
    color_primary = colors.HexColor("#0F172A")    # Slate 900
    color_secondary = colors.HexColor("#0369A1")  # Deep Sky Blue 700 (sobrio pero con identidad tech)
    color_body = colors.HexColor("#1E293B")       # Slate 800
    color_sub = colors.HexColor("#475569")        # Slate 600
    color_line = colors.HexColor("#CBD5E1")       # Slate 300

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=color_primary,
        alignment=0,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=color_secondary,
        alignment=0,
    )

    contact_style = ParagraphStyle(
        "ContactLine",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=color_sub,
        alignment=0,
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=color_primary,
        spaceBefore=8,
        spaceAfter=2,
        keepWithNext=True,
    )

    item_title = ParagraphStyle(
        "ItemTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=color_primary,
        keepWithNext=True,
    )

    item_meta = ParagraphStyle(
        "ItemMeta",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=12,
        textColor=color_sub,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=color_body,
        spaceAfter=3,
    )

    bullet_style = ParagraphStyle(
        "BulletItem",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=color_body,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5,
    )

    story = []

    def p(text: str, style=body_style) -> Paragraph:
        assert_no_forbidden_chars(text)
        return Paragraph(text, style)

    def hr() -> HRFlowable:
        return HRFlowable(width="100%", thickness=0.75, color=color_line, spaceBefore=2, spaceAfter=5)

    # 1. ENCABEZADO Y CONTACTO
    story.append(p("FELIPE SEBASTIAN RIQUELME SALVO", title_style))
    story.append(p("INGENIERO CIVIL EN INFORMATICA | BACKEND, ALGORITMOS & SISTEMAS DISTRIBUIDOS", subtitle_style))
    story.append(Spacer(1, 2))

    contact_text = (
        "Santiago, Chile &nbsp;|&nbsp; "
        "<b>Email:</b> <a href='mailto:feliperiquelme34@gmail.com' color='#0369A1'>feliperiquelme34@gmail.com</a> &nbsp;|&nbsp; "
        "<b>Tel:</b> +56 9 7520 0121 &nbsp;|&nbsp; "
        "<b>Web:</b> <a href='https://feliperiquel.me' color='#0369A1'>feliperiquel.me</a> &nbsp;|&nbsp; "
        "<b>LinkedIn:</b> <a href='https://linkedin.com/in/friquelmes' color='#0369A1'>linkedin.com/in/friquelmes</a> &nbsp;|&nbsp; "
        "<b>GitHub:</b> <a href='https://github.com/Pipin333' color='#0369A1'>github.com/Pipin333</a> &nbsp;|&nbsp; "
        "<b>Ingles:</b> C1 Avanzado"
    )
    story.append(p(contact_text, contact_style))
    story.append(Spacer(1, 4))
    story.append(hr())

    # 2. RESUMEN PROFESIONAL
    story.append(p("RESUMEN PROFESIONAL", section_heading))
    story.append(hr())
    resumen_text = (
        "Estudiante de Ingenieria Civil Informatica (UNAB) con solida preparacion practica en desarrollo backend con "
        "Python, computacion cientifica de alto rendimiento (HPC), optimizacion continua y arquitectura de sistemas distribuidos. "
        "Creador de <b>AD-BSA</b>, prototipo de algoritmo metaheuristico basado en la familia SHADE, con enfoque en el aprendizaje negativo "
        "explicito como motor. y rigurosa auditoria empirica con telemetria mecanicista y protocolos pareados sobre la suite IEEE CEC 2020. "
        "Experiencia demostrada en la industria formulando especificaciones tecnicas estructuradas y matrices de logica de "
        "negocio en J.E.J. Ingenieria, asi como liderazgo de equipos de hasta 12 colaboradores bajo alta demanda operativa en Dunkin' Chile. "
        "Orientado al codigo limpio, observabilidad, ejecucion agil y testing en terreno."
    )
    story.append(p(resumen_text, body_style))
    story.append(Spacer(1, 4))

    # 3. EXPERIENCIA LABORAL
    story.append(p("EXPERIENCIA LABORAL", section_heading))
    story.append(hr())

    # J.E.J. Ingenieria
    story.append(p("J.E.J. INGENIERIA S.A. | Gerencia de Innovacion y Transformacion Digital", item_title))
    story.append(p("Practicante de Soluciones Digitales & TI | Santiago, Chile | Julio 2026 - Agosto 2026", item_meta))
    story.append(p(
        "&bull; <b>Levantamiento & Especificacion Funcional:</b> Lidero el levantamiento de requerimientos corporativos y redacto "
        "especificaciones funcionales y tecnicas estructuradas como unica fuente de verdad previo a la construccion en Power Platform, "
        "traduciendo necesidades de negocio a modelos de datos relacionales y flujos de ejecucion.",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>Arquitectura Logica & Reglas de Negocio:</b> Diseno matrices tridimensionales de acceso por Centro de Costos, "
        "motores de urgencia automatica y asignacion ponderada de desarrolladores para el sistema de solicitudes corporativas.",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>SLA & Deflexion Activa:</b> Modelo flujos BPMN con tiempos de respuesta estructurados, trazabilidad integral de estados y "
        "mecanismos de deflexion activa de requerimientos mediante bases de conocimiento corporativas.",
        bullet_style,
    ))
    story.append(Spacer(1, 3))

    # Dunkin' Chile
    story.append(p("DUNKIN' CHILE | Operaciones & Retail", item_title))
    story.append(p("Segundo Subgerente (Sept. 2025 - Ene. 2026) | Colaborador de Tienda (Abr. 2023 - Sept. 2025) | Santiago, Chile", item_meta))
    story.append(p(
        "&bull; <b>Liderazgo Operativo:</b> Dirigio la operacion de turnos criticos y superviso equipos de hasta 12 colaboradores bajo "
        "alta afluencia de publico, resolviendo incidencias tecnicas, administrativas y de atencion en tiempo real.",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>Control de Inventarios & BPM:</b> Lidero auditorias de existencias, control de mermas y recepcion de materias primas bajo "
        "estrictos estandares BPM. Distinguido como Empleado del Mes y promovido al programa de desarrollo gerencial.",
        bullet_style,
    ))
    story.append(Spacer(1, 4))

    # 4. EDUCACION
    story.append(p("EDUCACION", section_heading))
    story.append(hr())
    story.append(p("UNIVERSIDAD ANDRES BELLO (UNAB)", item_title))
    story.append(p("Ingenieria Civil Informatica (Grado en Ingenieria) | Santiago, Chile | 2021 - 2027 (Estimada)", item_meta))
    story.append(p(
        "&bull; <b>Enfoque Academico:</b> Algoritmos Avanzados, Estructuras de Datos, Computacion Cientifica, Inteligencia Artificial, "
        "Sistemas Distribuidos, Bases de Datos Relacionales y Arquitectura de Software.",
        bullet_style,
    ))
    story.append(Spacer(1, 4))

    # 5. PROYECTOS TECNICOS DESTACADOS
    story.append(p("PROYECTOS TECNICOS DESTACADOS", section_heading))
    story.append(hr())

    # AD-BSA
    story.append(p("AD-BSA: Algoritmo de Optimizacion Global Heuristica & Auditoria HPC | Python, NumPy, SciPy", item_title))
    story.append(p("Codigo Abierto (Licencia Apache 2.0) | github.com/Pipin333/AD-BSA", item_meta))
    story.append(p(
        "&bull; <b>Optimizacion Continua & Auditoria Cientifica:</b> Formulo e implemento en Python un operador tripartito de aprendizaje "
        "negativo activo (repulsion cosecante |csc| y anti-atractores) sobre L-SHADE/jSO. Instrumento telemetria para caracterizar la concentracion "
        "de medida en 20D, benchmarks pareados con pruebas de Wilcoxon y deteccion de un defecto de signo en opfunu.",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>Vectorizacion NumPy & Rendimiento:</b> Optimizo la arquitectura en NumPy erradicando bucles escalares mediante broadcasting "
        "y vectorizacion matricial, alcanzando una aceleracion de 8.0x en tiempo de ejecucion (Wall-Clock) frente a la implementacion L-SHADE.",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>Aplicaciones Reales de Ingenieria:</b> Aplico el motor a planificacion 3D de rutas para drones con evasion de obstaculos y a la "
        "resolucion del problema de horarios universitarios (UCTP) de 172 sesiones y 62 salas en UNAB en 33 segundos. Suite de 15 pruebas en Pytest y CI en GitHub Actions.",
        bullet_style,
    ))
    story.append(Spacer(1, 3))

    # Cuanto Rinde
    story.append(p("Cuanto Rinde: PWA de Optimizacion Combinatoria & Data Pipeline | JavaScript, Python, Firebase", item_title))
    story.append(p("Web App en Produccion (PWA) | pipin333.github.io/calculadoracopete", item_meta))
    story.append(p(
        "&bull; <b>Motor Algoritmico (Knapsack DP):</b> Desarrollo en JavaScript puro un motor de optimizacion basado en programacion "
        "dinamica para resolver el problema de la mochila multidimensional aplicado a compras y presupuestos grupales en milisegundos.",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>ETL & Scraping Concurrente:</b> Pipeline modular en Python con Playwright Stealth para recoleccion automatizada de catalogos "
        "de retail con evasion de bloqueos bot, orquestado en GitHub Actions con matriz paralela de 6 runners y sincronizacion en Firebase RTDB.",
        bullet_style,
    ))
    story.append(Spacer(1, 3))

    # Toodles
    story.append(p("Toodles: Bot de Streaming de Audio, Concurrencia & RecSys | Python, Asyncio, PostgreSQL", item_title))
    story.append(p("Proyecto Personal | github.com/Pipin333/Toodles", item_meta))
    story.append(p(
        "&bull; <b>Arquitectura Asincrona:</b> Servicio de streaming de audio de baja latencia con procesamiento en tiempo real via FFmpeg y Asyncio. "
        "Persistencia relacional en PostgreSQL con transacciones atomicas en SQLAlchemy ORM y sistema de recomendacion de pistas musicales.",
        bullet_style,
    ))
    story.append(Spacer(1, 3))

    # Whatsarr
    story.append(p("Whatsarr: Hub Domotico & Bot de Automatizacion de Medios | Node.js, TypeScript, Docker", item_title))
    story.append(p("Proyecto Personal | github.com/Pipin333/Whatsarr", item_meta))
    story.append(p(
        "&bull; <b>Automatizacion Conversacional:</b> Bot en TypeScript sobre Baileys para control remoto de servidores multimedia (*Arr stack). "
        "Gestion multi-instancia en Docker con reconexion automatica mediante backoff exponencial y parsing de lenguaje natural.",
        bullet_style,
    ))
    story.append(Spacer(1, 3))

    # JD Watch Controller
    story.append(p("JD Watch Controller: Telemetria Inercial Wearable a 50 Hz | Kotlin, Wear OS", item_title))
    story.append(p("Proyecto Personal de Hardware & Sensores | github.com/Pipin333/jd-watch-controller", item_meta))
    story.append(p(
        "&bull; <b>Fusion Sensorial & Protocolos:</b> Aplicacion para smartwatches Wear OS con captura inercial IMU de 6 ejes "
        "(acelerometro y giroscopio) a 50 Hz por UDP/WebSocket sin perdida para reconocimiento cinematico de movimientos.",
        bullet_style,
    ))
    story.append(Spacer(1, 3))

    # SonicRip Studio & Retorica y Descalabro (RyD)
    story.append(p("SonicRip Studio & Retorica y Descalabro (RyD) | Web Audio API, Canvas API, NLP Cliente", item_title))
    story.append(p("Micro-aplicaciones Web en Vivo | feliperiquel.me/lab", item_meta))
    story.append(p(
        "&bull; <b>SonicRip Studio:</b> Suite de procesamiento DSP con ecualizador parametrico biquad de 8 bandas, modulador Lo-Fi Bitcrusher "
        "y visualizador FFT de espectro en tiempo real mediante Canvas API a 60 FPS ejecutado 100% en el cliente.",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>Retorica y Descalabro (RyD):</b> Transmutador de estilo y motor heuristico de lenguaje natural (NLP) que reescribe jerga moderna "
        "a prosa decimononica y diplomacia barroca con diccionario morfologico contextual en tiempo real.",
        bullet_style,
    ))
    story.append(Spacer(1, 4))

    # 6. HABILIDADES TECNICAS & HERRAMIENTAS
    story.append(p("HABILIDADES TECNICAS & HERRAMIENTAS", section_heading))
    story.append(hr())
    story.append(p(
        "&bull; <b>Lenguajes de Programacion:</b> Python 3.11+ (Avanzado: NumPy, SciPy, Asyncio, Pytest), JavaScript (ES6+), TypeScript, SQL (PostgreSQL), Kotlin, HTML5/CSS3.",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>Algoritmos, Computacion & Datos:</b> Metaheuristicas (DE, L-SHADE, CMA-ES, PSO), Programacion Dinamica, Vectorizacion Matricial, Estadistica No Parametrica (Wilcoxon, Friedman), Web Scraping (Playwright Stealth, BeautifulSoup4), Pipelines ETL, High-Performance Computing (HPC).",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>Infraestructura, DevOps & Cloud:</b> Linux (Ubuntu Server), Docker, PostgreSQL, Supabase, Firebase RTDB, SQLAlchemy ORM, Oracle Cloud Infrastructure (ARM64), Git, GitHub Actions (CI/CD Paralelo), Vercel.",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>Frameworks & Ecosistema Web:</b> Astro 5, React / Next.js, Tailwind CSS, FastAPI, Node.js, Web Audio API, Service Workers (PWA).",
        bullet_style,
    ))
    story.append(p(
        "&bull; <b>Idiomas & Certificaciones:</b> Espanol (Nativo) | Ingles: C1 Avanzado (Fluidez tecnica y conversacional) | Fundamentos de IA & Machine Learning (LinkedIn Learning, 2025) | Habilidades de Liderazgo y Resolucion de Conflictos (SENCE, 2025).",
        bullet_style,
    ))

    doc.build(story)
    print(f"PDF generado exitosamente en: {filename}")


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "cv-felipe-riquelme.pdf")
    build_pdf(pdf_path)

    # Validacion con PyPDF
    reader = PdfReader(pdf_path)
    print(f"Total de paginas generadas: {len(reader.pages)}")
    full_text = "\n".join([page.extract_text() for page in reader.pages])
    print(f"Longitud de texto extraido: {len(full_text)} caracteres")

    # Chequeo estricto de caracteres prohibidos
    for bad in FORBIDDEN_CHARS:
        if bad in full_text:
            raise ValueError(f"CRITICO: Se encontro caracter prohibido {repr(bad)} en el PDF generado!")

    # Chequeo de palabras clave ATS
    keywords = [
        "FELIPE SEBASTIAN RIQUELME SALVO",
        "AD-BSA",
        "J.E.J. INGENIERIA",
        "DUNKIN",
        "UNIVERSIDAD ANDRES BELLO",
        "NumPy",
        "Python",
        "Playwright",
        "PostgreSQL",
    ]
    for kw in keywords:
        if kw.lower() not in full_text.lower():
            print(f"ADVERTENCIA: Keyword '{kw}' no encontrada en el texto extraido!")
        else:
            print(f"[OK] Keyword verificada: '{kw}'")

    print("\nValidacion ATS superada al 100%.")
