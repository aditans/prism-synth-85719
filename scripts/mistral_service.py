import os
from typing import List, Literal, Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.responses import JSONResponse, StreamingResponse

# Requires: pip install fastapi uvicorn mistralai
try:
    from mistralai import Mistral
except Exception as e:
    Mistral = None  # type: ignore

app = FastAPI(title="Mistral Proxy", version="0.1.0")

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = None
    temperature: Optional[float] = 0.3
    agent_id: Optional[str] = None


def get_client() -> Mistral:
    if Mistral is None:
        raise RuntimeError("mistralai package is not installed. Run: pip install mistralai")

    api_key = os.environ.get("MISTRAL_API_KEY")
    api_key= "jtgjGAr0DoF4HzysEqDowAsIh71wlW9Y"
    if not api_key:
        raise RuntimeError("MISTRAL_API_KEY is not set")
    return Mistral(api_key)


@app.post("/api/ai/chat")
async def chat(body: ChatRequest):
    try:
        client = get_client()
        # Use standard chat completions (avoid beta.conversations for compatibility)
        resp = client.chat.complete(
            model=body.model or "mistral-small-latest",
            messages=[m.dict() for m in body.messages],
            temperature=body.temperature or 0.3,
        )
        content = resp.output_text if hasattr(resp, "output_text") else (
            resp.choices[0].message.content if getattr(resp, "choices", None) else ""
        )
        raw = resp.dict() if hasattr(resp, "dict") else None
        return JSONResponse({"content": content, "raw": raw})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/api/ai/chat/stream")
async def chat_stream(body: ChatRequest):
    try:
        client = get_client()
        # Fallback simple streaming: send one chunk with completion output
        def event_gen():
            try:
                resp = client.chat.complete(
                    model=body.model or "mistral-small-latest",
                    messages=[m.dict() for m in body.messages],
                    temperature=body.temperature or 0.3,
                )
                content = resp.output_text if hasattr(resp, "output_text") else (
                    resp.choices[0].message.content if getattr(resp, "choices", None) else ""
                )
                yield f"data: {content}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: [ERROR] {str(e)}\n\n"

        return StreamingResponse(event_gen(), media_type="text/event-stream")
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/health")
async def health():
    ok = bool(os.environ.get("MISTRAL_API_KEY"))
    return {"status": "ok" if ok else "missing_api_key"}
