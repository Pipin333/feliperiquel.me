"""Motor de matching semántico de licitaciones usando Transformers."""

import logging
import time
from typing import List, Optional, Tuple, Dict
import numpy as np

from app.config import settings
from app.models import Licitacion, MatchResult

logger = logging.getLogger("licitaciones.matcher")


class LicitacionMatcher:
    """Calcula similitud semántica entre perfiles de búsqueda y licitaciones activas."""

    _instance: Optional["LicitacionMatcher"] = None

    def __init__(self, model_name: Optional[str] = None, device: Optional[str] = None):
        self.model_name = model_name or settings.transformer_model_name
        self.device = device or settings.device
        self._model = None

        # Cache en memoria de embeddings de licitaciones:
        # Clave: codigo_externo -> Valor: (hash_texto, np.ndarray, timestamp)
        self._embedding_cache: Dict[str, Tuple[int, np.ndarray, float]] = {}

    @classmethod
    def get_instance(cls) -> "LicitacionMatcher":
        """Obtiene o inicializa la instancia singleton del matcher."""
        if cls._instance is None:
            cls._instance = LicitacionMatcher()
        return cls._instance

    @property
    def model(self):
        """Carga perezosa (lazy load) del modelo SentenceTransformer con optimizaciones CUDA/Tensor Cores."""
        if self._model is None:
            import torch
            from sentence_transformers import SentenceTransformer

            # Auto-detección de aceleración por hardware
            target_device = (self.device or "auto").lower()
            if target_device in ("auto", "cuda", "gpu"):
                if torch.cuda.is_available():
                    target_device = "cuda"
                else:
                    target_device = "cpu"
                    logger.info("CUDA no detectado en el entorno. Utilizando CPU con optimizaciones multi-hilo.")

            self.device = target_device

            logger.info(f"Cargando modelo de embeddings: {self.model_name} en dispositivo: '{self.device}'...")
            t0 = time.time()
            self._model = SentenceTransformer(self.model_name, device=self.device)

            if self.device == "cuda":
                gpu_name = torch.cuda.get_device_name(0)
                logger.info(f"🚀 Dispositivo GPU activo: {gpu_name}")

                # 1. Habilitar Tensor Cores en FP32/TF32 (Ampere, Ada, Blackwell / RTX 3000, 4000, 5000)
                if hasattr(torch, "set_float32_matmul_precision"):
                    torch.set_float32_matmul_precision("high")
                    logger.info("⚡ Soporte Tensor Cores TF32 activado.")

                # 2. Habilitar precisión media FP16 para máxima aceleración en Tensor Cores
                if settings.use_fp16:
                    try:
                        self._model.half()
                        logger.info("⚡ Precisión FP16 activada: 50% reducción de VRAM y ejecución en Tensor Cores.")
                    except Exception as exc:
                        logger.warning(f"No fue posible convertir a FP16: {exc}. Continuando con FP32 estándar.")

            logger.info(f"Modelo cargado exitosamente en {time.time() - t0:.2f}s")
        return self._model

    def _get_or_compute_tender_embeddings(
        self, licitaciones: List[Licitacion], force_refresh: bool = False
    ) -> np.ndarray:
        """Obtiene o computa los embeddings para una lista de licitaciones utilizando cache."""
        now = time.time()
        ttl = settings.cache_ttl_seconds

        # Poda de entradas expiradas para prevenir acumulación indefinida en memoria
        expired_keys = [key for key, (_, _, timestamp) in self._embedding_cache.items() if (now - timestamp) >= ttl]
        for key in expired_keys:
            del self._embedding_cache[key]

        to_encode_indices = []
        to_encode_texts = []
        embeddings = [None] * len(licitaciones)

        for idx, lic in enumerate(licitaciones):
            searchable_text = lic.get_searchable_text()
            text_hash = hash(searchable_text)

            cached = self._embedding_cache.get(lic.codigo_externo)
            if not force_refresh and cached:
                cached_hash, cached_emb, cached_time = cached
                if cached_hash == text_hash and (now - cached_time) < ttl:
                    embeddings[idx] = cached_emb
                    continue

            to_encode_indices.append(idx)
            to_encode_texts.append(searchable_text)

        if to_encode_texts:
            batch_size = settings.batch_size_cuda if self.device == "cuda" else settings.batch_size_cpu
            logger.info(
                f"Generando embeddings para {len(to_encode_texts)} licitaciones en {self.device} (batch_size={batch_size})..."
            )
            new_embeddings = self.model.encode(
                to_encode_texts,
                batch_size=batch_size,
                show_progress_bar=False,
                normalize_embeddings=True,  # Embeddings normalizados para similitud coseno directa
                convert_to_numpy=True,
            )

            for idx, text, emb in zip(to_encode_indices, to_encode_texts, new_embeddings):
                lic = licitaciones[idx]
                embeddings[idx] = emb
                self._embedding_cache[lic.codigo_externo] = (hash(text), emb, now)

        return np.vstack(embeddings)

    def match(
        self,
        query: str,
        licitaciones: List[Licitacion],
        min_score_percentage: float = 50.0,
        top_k: int = 20,
        force_refresh: bool = False,
    ) -> List[MatchResult]:
        """Calcula el match semántico entre un query y una lista de licitaciones.
        
        Args:
            query: Texto descriptivo de los servicios, rubro o palabras clave.
            licitaciones: Lista de licitaciones a comparar.
            min_score_percentage: Umbral mínimo de afinidad en % (ej: 60.0).
            top_k: Número máximo de resultados a retornar.
            force_refresh: Si es True, ignora la cache de embeddings.

        Returns:
            Lista de MatchResult ordenados de mayor a menor coincidencia.
        """
        if not licitaciones or not query.strip():
            return []

        # 1. Obtener embedding normalizado del query
        query_embedding = self.model.encode(
            query.strip(),
            normalize_embeddings=True,
            convert_to_numpy=True,
        )

        # 2. Obtener embeddings normalizados de las licitaciones (de cache o computados)
        tenders_embeddings = self._get_or_compute_tender_embeddings(
            licitaciones, force_refresh=force_refresh
        )

        # 3. Similitud Coseno: como los vectores están normalizados L2 (norma = 1),
        # cosine_sim(u, v) = u · v (producto punto)
        cosine_scores = np.dot(tenders_embeddings, query_embedding)

        # 4. Convertir a porcentaje intuitivo [0, 100]
        # La similitud coseno en embeddings semánticos suele moverse entre ~0.0 y ~0.95
        # Valores negativos corresponden a conceptos opuestos o sin relación (score 0%)
        results: List[MatchResult] = []

        for idx, lic in enumerate(licitaciones):
            raw_cosine = float(cosine_scores[idx])
            # Clamp entre 0.0 y 1.0 para el cálculo de porcentaje
            clamped_cosine = max(0.0, min(1.0, raw_cosine))
            score_pct = round(clamped_cosine * 100.0, 2)

            if score_pct >= min_score_percentage:
                results.append(
                    MatchResult(
                        licitacion=lic,
                        score_percentage=score_pct,
                        cosine_similarity=round(raw_cosine, 4),
                        ranking=0,  # Se asigna luego del ordenamiento
                    )
                )

        # 5. Ordenar por mayor score porcentual
        results.sort(key=lambda r: r.score_percentage, reverse=True)

        # 6. Limitar a top_k y asignar posiciones
        final_results = results[:top_k]
        for rank, res in enumerate(final_results, start=1):
            res.ranking = rank

        return final_results
