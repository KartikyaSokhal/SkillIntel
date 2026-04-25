"""
SkillIntel Google Trends microservice.

Exposes a tiny FastAPI app that wraps `pytrends` so the Node backend can pull
Google Trends interest scores over HTTP. Designed to fail soft: if Google
throttles us we still return 200 with whatever we managed to score.

Run locally:
    source .venv/bin/activate
    uvicorn trend-service.main:app --port 8000 --reload
"""

from __future__ import annotations

import logging
import os
from typing import Dict, List

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from pytrends.request import TrendReq
except ImportError as exc:
    raise SystemExit(
        "pytrends is not installed. Activate the venv (.venv) or run `pip install pytrends`."
    ) from exc


logging.basicConfig(level=logging.INFO, format="%(asctime)s [trend-service] %(message)s")
log = logging.getLogger("trend-service")

app = FastAPI(
    title="SkillIntel Trend Service",
    version="1.0.0",
    description="Wraps Google Trends (pytrends) for the SkillIntel Node backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# pytrends only allows up to 5 keywords per request, so we batch.
MAX_KEYWORDS_PER_BATCH = 5
DEFAULT_TIMEFRAME = os.environ.get("TREND_DEFAULT_TIMEFRAME", "today 3-m")
DEFAULT_GEO = os.environ.get("TREND_DEFAULT_GEO", "")


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class InterestResponse(BaseModel):
    timeframe: str
    geo: str
    scores: Dict[str, float]
    failedKeywords: List[str]


def _build_pytrends() -> TrendReq:
    return TrendReq(hl="en-US", tz=360, retries=2, backoff_factor=0.4, timeout=(10, 25))


def _score_batch(pytrends: TrendReq, batch: List[str], timeframe: str, geo: str) -> Dict[str, float]:
    """Returns a {keyword: 0-100 mean-of-recent-week} mapping for one batch."""
    pytrends.build_payload(batch, cat=0, timeframe=timeframe, geo=geo, gprop="")
    df = pytrends.interest_over_time()
    if df is None or df.empty:
        return {kw: 0.0 for kw in batch}

    if "isPartial" in df.columns:
        df = df.drop(columns=["isPartial"])

    tail = df.tail(4)
    scores: Dict[str, float] = {}
    for kw in batch:
        if kw not in tail.columns:
            scores[kw] = 0.0
            continue
        try:
            mean_val = float(tail[kw].mean())
        except (TypeError, ValueError):
            mean_val = 0.0
        scores[kw] = round(mean_val, 2) if mean_val == mean_val else 0.0
    return scores


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="skillintel-trend-service", version="1.0.0")


@app.get("/interest", response_model=InterestResponse)
def interest(
    keywords: str = Query(..., description="Comma-separated keyword list, max ~50."),
    timeframe: str = Query(DEFAULT_TIMEFRAME, description="pytrends timeframe e.g. 'today 3-m'."),
    geo: str = Query(DEFAULT_GEO, description="ISO geo code, '' for worldwide."),
) -> InterestResponse:
    raw_keywords = [k.strip() for k in keywords.split(",") if k.strip()]
    if not raw_keywords:
        raise HTTPException(status_code=400, detail="keywords query parameter is required")

    seen: set[str] = set()
    deduped: List[str] = []
    for kw in raw_keywords:
        key = kw.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(kw)
    deduped = deduped[:50]

    pytrends = _build_pytrends()
    scores: Dict[str, float] = {}
    failed: List[str] = []

    for i in range(0, len(deduped), MAX_KEYWORDS_PER_BATCH):
        batch = deduped[i : i + MAX_KEYWORDS_PER_BATCH]
        try:
            scores.update(_score_batch(pytrends, batch, timeframe, geo))
        except Exception as err:  # noqa: BLE001 — we want to swallow and report
            log.warning("pytrends batch failed (%s): %s", batch, err)
            failed.extend(batch)
            for kw in batch:
                scores.setdefault(kw, 0.0)

    return InterestResponse(timeframe=timeframe, geo=geo, scores=scores, failedKeywords=failed)
