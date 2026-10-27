import pytest
from app.mock_data import SAMPLE_LICITACIONES
from app.matcher import LicitacionMatcher
from app.models import Licitacion, Comprador, ItemLicitacion


def test_searchable_text_generation():
    lic = Licitacion(
        codigo_externo="TEST-01",
        nombre="Desarrollo de App Móvil",
        descripcion="Creación de aplicación en Flutter",
        comprador=Comprador(nombre_organismo="Ministerio de Educación"),
        items=[
            ItemLicitacion(nombre_producto="Programación", categoria="TI", descripcion="Frontend")
        ]
    )
    text = lic.get_searchable_text()
    assert "Título: Desarrollo de App Móvil" in text
    assert "Ministerio de Educación" in text
    assert "Programación" in text


def test_semantic_matching_accuracy():
    matcher = LicitacionMatcher.get_instance()

    # Query orientada a Software y Cloud
    query_it = "Desarrollo de software web en la nube con microservicios y bases de datos"
    results = matcher.match(
        query=query_it,
        licitaciones=SAMPLE_LICITACIONES,
        min_score_percentage=40.0,
        top_k=5,
    )

    assert len(results) > 0
    # La licitación de desarrollo cloud (1502-32-LR24) debe estar en el top
    top_match = results[0]
    assert "1502-32-LR24" == top_match.licitacion.codigo_externo
    assert top_match.score_percentage > 60.0

    # Query orientada a Ciberseguridad / Hacking
    query_sec = "Auditoría de ciberseguridad, pruebas de penetración y ethical hacking"
    results_sec = matcher.match(
        query=query_sec,
        licitaciones=SAMPLE_LICITACIONES,
        min_score_percentage=40.0,
        top_k=5,
    )
    assert len(results_sec) > 0
    assert "834-45-LQ24" == results_sec[0].licitacion.codigo_externo
    assert results_sec[0].score_percentage > 60.0


def test_min_score_threshold_filter():
    matcher = LicitacionMatcher.get_instance()

    query = "Servicios médicos e insumos de cirugía"
    # Con umbral alto sólo debería pasar la licitación médica
    strict_results = matcher.match(
        query=query,
        licitaciones=SAMPLE_LICITACIONES,
        min_score_percentage=70.0,
        top_k=10,
    )

    for res in strict_results:
        assert res.score_percentage >= 70.0
