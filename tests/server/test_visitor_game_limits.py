"""#553: a whole visitor game over the real Play API, with the limits Render runs it under.

The limits are parsed from render.yaml, so a change there is exercised here. AI seats are the
real LLM agents (real system prompts, so the ledger's worst-case holds are sized as on live)
over a fake client that answers at once; the Normal-mode human seat answers every turn. The
game must reach day 2 and finish. The second test records what a redeploy does to a game in
progress: the process restarts, `manager.shutdown()` cancels it, and it ends `failed`.
No paid calls.
"""

from pathlib import Path

import pytest

pytest.importorskip("fastapi", reason="needs the server extra: uv run --extra server pytest")

import httpx  # noqa: E402
import yaml  # noqa: E402
from fakes import FakeClient  # noqa: E402
from test_play_api import (  # noqa: E402
    auth,
    finished,
    play_env,  # noqa: F401  (autouse: no provider keys, dev-mode env)
    play_out,
    seeds,  # noqa: F401  (autouse: pinned game seeds)
    start,
    until,
    waiting,
)

from societysim.agents.llm_agent import llm_agents  # noqa: E402
from societysim.models.registry import load_registry  # noqa: E402
from societysim.server.app import create_app  # noqa: E402
from societysim.server.manager import Settings  # noqa: E402
from societysim.server.security import PlayConfig  # noqa: E402
from societysim.setup import REGISTRY  # noqa: E402

RENDER_YAML = Path(__file__).resolve().parents[2] / "render.yaml"


def render_env():
    """The plain-valued env vars of the societysim-play service (secrets are `sync: false`)."""
    blueprint = yaml.safe_load(RENDER_YAML.read_text(encoding="utf-8"))
    (service,) = [s for s in blueprint["services"] if s["name"] == "societysim-play"]
    return {e["key"]: str(e["value"]) for e in service["envVars"] if "value" in e}


def render_play_config():
    """render.yaml's limits, with two changes for a test. PLAY_DEV_MODE=1: no Turnstile or
    Neon, and no real client IP behind the in-process transport. PLAY_RATE_PER_MIN opened up:
    it counts HTTP requests per minute, and this test polls /me every few milliseconds."""
    env = {**render_env(), "PLAY_DEV_MODE": "1", "PLAY_RATE_PER_MIN": "1000000"}
    for name in ("PLAY_TRUSTED_PROXIES", "PLAY_CLIENT_IP_HEADER"):
        env.pop(name, None)  # the proxy hop Render adds is not in front of the test client
    return PlayConfig.from_env(env)


def fake_llm(cfg):
    registry = load_registry(REGISTRY)
    fake = FakeClient(players=[f"p{i}" for i in range(cfg.n_players)])
    specs = registry.resolve([m for m in cfg.seat_models() if m != "human"])
    return llm_agents(fake, {s.name: s for s in specs}), {}


@pytest.fixture
async def client(tmp_path):
    app = create_app(
        Settings(runs_dir=tmp_path, agents=fake_llm, neon=False, play=render_play_config())
    )
    c = httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
        headers={"Origin": "https://society-sim.us"},
    )
    c.manager = app.state.manager
    async with c:
        yield c
    await c.manager.shutdown()


def test_render_yaml_limits_are_the_real_ones():
    """Guards the test itself: it must run under render.yaml's limits, not the defaults."""
    play = render_play_config()
    env = render_env()
    assert play.max_game_minutes == float(env["PLAY_MAX_GAME_MINUTES"])
    assert play.daily_budget_usd == float(env["PLAY_DAILY_BUDGET_USD"])
    assert play.max_tokens == int(env["PLAY_MAX_TOKENS"])
    assert play.max_concurrent == int(env["PLAY_MAX_CONCURRENT"])
    assert play.max_active_per_ip == int(env["PLAY_MAX_ACTIVE_PER_IP"])
    assert play.allowed_models == frozenset(env["PLAY_ALLOWED_MODELS"].split(","))


async def test_full_visitor_game_under_render_limits_finishes(client):
    ledger, holds = client.manager.ledger, []
    try_reserve = ledger.try_reserve
    ledger.try_reserve = lambda usd: holds.append(try_reserve(usd)) or holds[-1]

    started = await start(client)
    assert started["seat"] == "p0"
    seen = await play_out(client, started)
    assert seen[-1]["status"] == "finished" and seen[-1]["winner"]

    session = await finished(client, started)
    assert session.status == "finished"
    assert max(e.day for e in session.game.events) >= 2
    # The human got a turn on day 2: they were not cut off after day 1.
    assert any(me["day"] >= 2 for me in seen if me["pending_action"])
    # The ledger never ran dry: every AI call's worst-case hold fit in the daily budget, so
    # no turn fell back to a scripted agent.
    assert holds and None not in holds
    assert ledger.remaining_today() > 0


async def test_shutdown_mid_game_fails_the_game(client, tmp_path):
    """A redeploy restarts the process: the lifespan calls manager.shutdown() (#553). A game
    in progress ends `failed`, with no game_end in its log; /me says so."""
    started = await start(client)
    me = await until(client, started, waiting)
    assert me["status"] == "running" and me["pending_action"]

    await client.manager.shutdown()

    session = client.manager.games[started["game_id"]]
    assert session.task.done() and session.status == "failed"
    r = await client.get(f"/api/games/{started['game_id']}/me", headers=auth(started["seat_token"]))
    assert r.status_code == 200 and r.json()["status"] == "failed"
    log = tmp_path / "visitor" / f"{started['game_id']}.jsonl"
    assert '"game_end"' not in log.read_text(encoding="utf-8")
