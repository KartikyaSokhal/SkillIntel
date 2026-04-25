# SkillIntel Trend Service

Tiny FastAPI wrapper around `pytrends` so the Node backend can pull Google Trends
interest scores over HTTP without bundling a Python runtime into the API process.

## Run

From the project root:

```bash
source .venv/bin/activate
pip install -r trend-service/requirements.txt   # only on first run
uvicorn trend-service.main:app --host 0.0.0.0 --port 8000 --reload
```

Then point the Node backend at it via `.env`:

```
TREND_SERVICE_URL=http://localhost:8000
```

## Endpoints

### `GET /health`

```json
{ "status": "ok", "service": "skillintel-trend-service", "version": "1.0.0" }
```

### `GET /interest?keywords=Python,React,Go&timeframe=today%203-m&geo=`

Returns a normalized 0–100 score per keyword, computed as the mean of the most
recent 4 weeks of Google Trends interest. `geo` is optional (worldwide by
default). Failed batches are reported under `failedKeywords` and their scores
default to `0`, so the caller never has to handle exceptions for partial data.

```json
{
  "timeframe": "today 3-m",
  "geo": "",
  "scores": { "Python": 84.5, "React": 71.0, "Go": 32.25 },
  "failedKeywords": []
}
```

## Notes

- pytrends limits each request to 5 keywords; this service batches transparently.
- If Google rate-limits us, the affected batch is added to `failedKeywords` and
  its scores fall back to `0`. The caller can renormalize weights accordingly.
- This service is fail-soft by design: the Node backend treats an unreachable
  service as "Google Trends contributes 0" rather than failing the pipeline.
