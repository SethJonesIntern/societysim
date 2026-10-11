"""#447: the global board as materialized views. Static checks of neon/schema.sql and
neon/migrations/002_global_board_matviews.sql, and the refresh calls, on fake connections.
Nothing here touches a real database; test_neon_global_board.py runs the SQL on Postgres."""

import re
from pathlib import Path

import pytest

from societysim.logging.sinks import neon
from societysim.logging.sinks.neon import (
    delete_games,
    prune_games,
    refresh_global_board,
    sync_batch,
    sync_game,
)

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = (ROOT / "neon/schema.sql").read_text(encoding="utf-8")
MIGRATION = (ROOT / "neon/migrations/002_global_board_matviews.sql").read_text(encoding="utf-8")
FIXTURE = ROOT / "fixtures/sample_game.jsonl"
VIEWS = ("global_detectors", "global_liars")

BOARD_START = "create materialized view if not exists global_detectors as"
BOARD_END = "create unique index if not exists global_liars_model_idx on global_liars (model);\n"


def _board(sql: str) -> str:
    return sql[sql.index(BOARD_START) : sql.index(BOARD_END) + len(BOARD_END)]


def _code(sql: str) -> str:
    return re.sub(r"--.*", "", sql).lower()


def _view(sql: str, name: str) -> str:
    return re.search(rf"create materialized view if not exists {name} as\n(.*?);\n", sql, re.S)[1]


def test_schema_builds_the_same_views_as_the_migration():
    assert _board(SCHEMA) == _board(MIGRATION)


def test_schema_builds_the_global_board_only_on_a_fresh_database():
    # schema.sql runs on every --neon start and server start: on the live database it must
    # never redefine, drop or refresh the global views, nor build an index (#319, #447).
    code = _code(SCHEMA)
    guard = (
        "if to_regclass('global_detectors') is null and to_regclass('global_liars') is null then"
    )
    assert code.count(guard) == 1
    fresh = code.split(guard, 1)[1].split("end if;\nend $$;", 1)[0]
    assert "create index if not exists events_game_type_idx" in fresh
    assert _board(SCHEMA).lower() in fresh
    outside = code.replace(fresh, "")
    for ddl in ("create index if not exists events_", "materialized view", "drop "):
        assert ddl not in outside, ddl
    assert not re.search(r"create or replace view global_", code)
    assert "refresh materialized" not in code


def test_migration_is_idempotent():
    code = _code(MIGRATION)
    creates = re.findall(r"create (?:unique )?(?:index|materialized view) (?!if not exists)", code)
    assert creates == []
    # It drops the #344 plain views only while they still are plain views.
    for name in VIEWS:
        assert re.search(rf"viewname = '{name}'\) then\s+drop view {name};", code), name
    assert "drop materialized" not in code and "cascade" not in code
    assert "alter table" not in code


@pytest.mark.parametrize("name", VIEWS)
def test_views_keep_the_privacy_filters(name):
    # #323/#325/#344: finished, non-scripted games only, and no human row.
    body = _view(MIGRATION, name)
    assert body.count("where g.status = 'finished' and g.agents is distinct from 'scripted'") >= 1
    assert body.rstrip().endswith("where p.model <> 'human'")
    assert "handle" not in body
    # every read of events or labels goes through the finished seats
    for m in re.finditer(r"from (events|labels) (\w+)", body):
        assert m[2] in ("e", "l"), m[0]
    assert f"global_{name.split('_')[1]}_model_idx" in MIGRATION  # unique, for concurrently


def test_migration_regrants_anonymous_and_nothing_else():
    code = _code(MIGRATION)
    assert re.findall(r"grant select on ([\w, ]+) to anonymous", code) == [
        "global_detectors, global_liars"
    ]
    assert "grant insert" not in code and "grant all" not in code


def test_refresh_is_guarded_and_concurrent():
    sql = neon._REFRESH_GLOBAL_BOARD
    for name in VIEWS:
        assert f"matviewname = '{name}'" in sql  # a no-op before migration 002
        assert f"refresh materialized view concurrently {name};" in sql


class Conn:
    def __init__(self, fail_refresh=False):
        self.sql: list[str] = []
        self.fail_refresh = fail_refresh

    async def execute(self, sql, *args):
        self.sql.append(sql)
        if self.fail_refresh and sql == neon._REFRESH_GLOBAL_BOARD:
            raise RuntimeError("canceling statement due to statement timeout")

    async def executemany(self, sql, rows):
        self.sql.append(sql)

    async def fetchval(self, sql, *args):
        return 1

    async def fetch(self, sql, ids):
        return [{"game_id": i} for i in ids]

    def transaction(self):
        return _Tx()

    @property
    def refreshes(self) -> int:
        return self.sql.count(neon._REFRESH_GLOBAL_BOARD)


class _Tx:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False


def _batch(tmp_path, n=3):
    d = tmp_path / "b1"
    d.mkdir()
    text = FIXTURE.read_text(encoding="utf-8")
    for i in range(n):
        (d / f"g{i}.jsonl").write_text(text.replace("fixture-0001", f"g{i}"), encoding="utf-8")
    return d


async def test_sync_batch_refreshes_once_after_all_games(tmp_path):
    conn = Conn()
    totals = await sync_batch(_batch(tmp_path), conn)
    assert totals["games"] == 3
    assert conn.refreshes == 1 and conn.sql[-1] == neon._REFRESH_GLOBAL_BOARD


async def test_sync_game_refreshes_by_default(tmp_path):
    # the server's visitor-game backfill calls sync_game(path, conn)
    path = _batch(tmp_path, 1) / "g0.jsonl"
    conn = Conn()
    await sync_game(path, conn)
    assert conn.refreshes == 1 and conn.sql[-1] == neon._REFRESH_GLOBAL_BOARD
    conn = Conn()
    await sync_game(path, conn, refresh=False)
    assert conn.refreshes == 0


async def test_failed_refresh_never_fails_the_sync(tmp_path):
    conn = Conn(fail_refresh=True)
    assert await refresh_global_board(conn) is False
    totals = await sync_batch(_batch(tmp_path), conn)
    assert totals["games"] == 3


async def test_delete_and_prune_refresh():
    conn = Conn()
    await delete_games(conn, ["g1"])
    assert conn.refreshes == 1
    conn = Conn()
    await prune_games(conn, ["g1"])
    assert conn.refreshes == 1
    conn = Conn()
    await prune_games(conn, [])
    assert conn.refreshes == 0
