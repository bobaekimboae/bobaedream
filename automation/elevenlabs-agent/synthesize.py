"""Produce a WAV from one public Korean narration request."""

import io
import json
import os
from pathlib import Path
import re
import sys
from urllib import error, request
import wave


RATE = 24000
MODEL = "eleven_flash_v2_5"
KEY_PATTERN = re.compile(r"sk[_-][A-Za-z0-9_-]{32,}|AIza[A-Za-z0-9_-]{35}|AQ\.[A-Za-z0-9_-]{40,200}")


class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def synthesize(config, key):
    fields = {"public_input", "request_id", "text", "voice_id"}
    if not isinstance(config, dict) or config.keys() != fields or config["public_input"] is not True:
        raise ValueError("Use an explicitly public narration request.")
    request_id, voice, text = (config[field] for field in ("request_id", "voice_id", "text"))
    if not isinstance(request_id, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}", request_id):
        raise ValueError("Use a valid request_id.")
    if not isinstance(voice, str) or not re.fullmatch(r"[A-Za-z0-9]{20,40}", voice):
        raise ValueError("Use an approved ElevenLabs voice ID.")
    if not isinstance(text, str) or not 1 <= len(text.strip()) <= 300:
        raise ValueError("Provide 1–300 characters of public narration.")
    if not key:
        raise ValueError("ELEVENLABS_API_KEY is not registered.")
    if KEY_PATTERN.search(json.dumps(config)) or key in json.dumps(config):
        raise ValueError("Credentials are not permitted in the input.")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=pcm_{RATE}"
    body = {"text": text.strip(), "model_id": MODEL, "language_code": "ko"}
    call = request.Request(
        url, data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "xi-api-key": key}, method="POST",
    )
    limit = 180 * RATE * 2
    try:
        with request.build_opener(NoRedirect()).open(call, timeout=150) as response:
            content_type = response.headers.get_content_type()
            if not (content_type.startswith("audio/") or content_type == "application/octet-stream"):
                raise RuntimeError("ElevenLabs response was not audio.")
            pcm = response.read(limit + 1)
    except error.HTTPError as exc:
        raise RuntimeError(f"ElevenLabs HTTP {exc.code}. Check access, voice and credits.") from None
    except (error.URLError, TimeoutError):
        raise RuntimeError("ElevenLabs response unavailable. Check usage before retrying.") from None
    if not 0 < len(pcm) <= limit or len(pcm) % 2 or pcm[:4] in (b"RIFF", b"OggS", b"fLaC") or pcm.startswith(b"ID3"):
        raise RuntimeError("ElevenLabs did not return valid PCM.")
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm)
    return request_id, buffer.getvalue(), len(pcm) / (RATE * 2)


def main():
    try:
        config = json.loads(Path(__file__).with_name("request.json").read_text(encoding="utf-8"))
        request_id, wav, duration = synthesize(config, os.environ.get("ELEVENLABS_API_KEY", "").strip())
        Path("narration.wav").write_bytes(wav)
    except (ValueError, RuntimeError, OSError) as exc:
        sys.exit(str(exc))
    print(f"ElevenLabs request completed: {request_id} ({duration:.2f}s)")


if __name__ == "__main__":
    main()
