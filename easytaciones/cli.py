#!/usr/bin/env python3
"""CLI interactivo para filtrar licitaciones de Mercado Público con Transformers."""

import asyncio
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

from app.client_mp import MercadoPublicoClient
from app.matcher import LicitacionMatcher

app = typer.Typer(
    help="CLI para filtrar licitaciones de Mercado Público de Chile por similitud semántica."
)
console = Console()


async def _run_search(query: str, min_score: float, top_k: int, refresh: bool):
    with console.status("[bold green]Obteniendo licitaciones activas de Mercado Público..."):
        client = MercadoPublicoClient()
        licitaciones = await client.get_licitaciones_activas()

    console.print(f"[cyan]ℹ Obtenidas [bold]{len(licitaciones)}[/bold] licitaciones para evaluar.[/cyan]")

    with console.status(f"[bold blue]Calculando similitud semántica con Transformers para:[/bold blue] '{query}'..."):
        matcher = LicitacionMatcher.get_instance()
        matches = matcher.match(
            query=query,
            licitaciones=licitaciones,
            min_score_percentage=min_score,
            top_k=top_k,
            force_refresh=refresh,
        )

    if not matches:
        console.print(
            Panel(
                f"[yellow]No se encontraron licitaciones con un match semántico superior a [bold]{min_score}%[/bold].\nPrueba reduciendo el umbral con --min-score (ej: 40).[/yellow]",
                title="Sin resultados",
                border_style="yellow",
            )
        )
        return

    table = Table(
        title=f"Resultados de Coincidencia Semántica ({len(matches)} encontradas con score ≥ {min_score}%)",
        box=box.ROUNDED,
        header_style="bold magenta",
    )
    table.add_column("Rank", justify="center", style="bold yellow", width=5)
    table.add_column("Match %", justify="center", style="bold green", width=9)
    table.add_column("Código", style="cyan", width=14)
    table.add_column("Título", style="white", min_width=30)
    table.add_column("Organismo Comprador", style="blue", min_width=20)
    table.add_column("Monto Est.", justify="right", style="green", width=14)
    table.add_column("Cierre", style="dim", width=12)

    for match_result in matches:
        licitacion = match_result.licitacion
        organismo = licitacion.comprador.nombre_organismo if licitacion.comprador else "N/A"
        monto_formateado = f"${licitacion.monto_estimado:,.0f}" if licitacion.monto_estimado else "No informado"
        fecha_cierre_corta = licitacion.fecha_cierre[:10] if licitacion.fecha_cierre else "N/A"

        # Color coding según porcentaje de similitud
        if match_result.score_percentage >= 70:
            texto_porcentaje = f"[bold green]{match_result.score_percentage:.1f}%[/bold green]"
        elif match_result.score_percentage >= 50:
            texto_porcentaje = f"[bold yellow]{match_result.score_percentage:.1f}%[/bold yellow]"
        else:
            texto_porcentaje = f"[dim white]{match_result.score_percentage:.1f}%[/dim white]"

        table.add_row(
            str(match_result.ranking),
            texto_porcentaje,
            licitacion.codigo_externo,
            licitacion.nombre,
            organismo,
            monto_formateado,
            fecha_cierre_corta,
        )

    console.print(table)


@app.command()
def search(
    query: str = typer.Option(
        ...,
        "--query",
        "-q",
        help="Perfil de servicios o requerimiento a buscar (ej: 'auditoría de ciberseguridad y pentesting')",
    ),
    min_score: float = typer.Option(
        50.0,
        "--min-score",
        "-m",
        help="Porcentaje mínimo de afinidad semántica (0.0 a 100.0)",
    ),
    top_k: int = typer.Option(
        10,
        "--top-k",
        "-k",
        help="Cantidad máxima de resultados",
    ),
    refresh: bool = typer.Option(
        False,
        "--refresh",
        "-r",
        help="Forzar recálculo omitiendo cache en memoria",
    ),
):
    """Busca y filtra licitaciones activas por match semántico."""
    asyncio.run(_run_search(query=query, min_score=min_score, top_k=top_k, refresh=refresh))


if __name__ == "__main__":
    app()
