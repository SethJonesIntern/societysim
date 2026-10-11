-- #447: global_liars ran past the Data API's statement timeout on the live site (HTTP 500,
-- SQLSTATE 57014), and global_detectors has the same shape, so it would follow as games pile
-- up. Both become materialized views. The anonymous role then reads a stored table of a few
-- rows, and the work runs once per refresh (refresh_global_board in logging/sinks/neon.py:
-- after `sync-neon`, a visitor game's backfill, `--delete` and `--prune --apply`).
--
-- Same columns, same rows, same filters as the #344 views: finished games only, scripted
-- games and the human row left out, no handles. Only the plan changes:
--   * a finished game's seats are found once per view (a materialized CTE), where every join
--     on finished_seats used to inline that view again (up to six times in global_liars);
--   * deaths come from one join on a distinct (game, seat) list, not a subquery per seat;
--   * vote targets are pulled out of the jsonb once, not once per join;
--   * every per-model step is a materialized CTE too, so it runs once: inlined, the planner
--     misjudged the jsonb row counts and re-ran whole aggregates once per model (#466);
--   * events (game_id, type) lets the per-game game_start, death and vote lookups skip the
--     rest of each game's events (the other views benefit too).
--
-- Idempotent: a second run changes nothing. Runs only through `sync-neon --migrate --apply`,
-- which needs Seth's and Marcus's OK on the live database. It runs in one transaction with the
-- other migrations, so a failure (for example the 10 s client timeout) leaves the old views.
-- neon/schema.sql builds the same objects on a fresh database and never touches them on an
-- existing one. Keep the two copies identical (tests/integration/test_neon_migrations.py).

create index if not exists events_game_type_idx on events (game_id, type);

-- The #344 plain views. Dropped only while they are still plain views, so a re-run keeps the
-- materialized ones.
do $$
begin
    if exists (select 1 from pg_views
               where schemaname = current_schema() and viewname = 'global_detectors') then
        drop view global_detectors;
    end if;
    if exists (select 1 from pg_views
               where schemaname = current_schema() and viewname = 'global_liars') then
        drop view global_liars;
    end if;
end $$;

create materialized view if not exists global_detectors as
with seats as materialized (
    select g.game_id,
           s.key as seat,
           s.value ->> 'model' as model,
           s.value ->> 'role' = 'wolf' as wolf
    from games g
    join events e on e.game_id = g.game_id and e.type = 'game_start'
    cross join lateral jsonb_each(e.event -> 'meta' -> 'seats') s
    where g.status = 'finished' and g.agents is distinct from 'scripted'
),
suspicion as materialized (
    select l.game_id,
           l.actor as judge,
           x ->> 'player' as subject,
           (x ->> 'p')::numeric as p
    from (
        select distinct on (e.game_id, e.actor, e.day)
               e.game_id, e.actor, e.event -> 'suspicion' as suspicion
        from events e
        join seats j on j.game_id = e.game_id and j.seat = e.actor and not j.wolf
        where jsonb_typeof(e.event -> 'suspicion') = 'array'
        order by e.game_id, e.actor, e.day, e.seq desc
    ) l
    cross join lateral jsonb_array_elements(l.suspicion) x
),
votes as materialized (
    select e.game_id, v.model, e.event ->> 'target' as target
    from seats v
    join events e on e.game_id = v.game_id and e.type = 'vote' and e.actor = v.seat
    where not v.wolf
),
played as materialized (
    select model, count(*) as village_games from seats where not wolf group by model
),
judged as materialized (
    select j.model,
           avg(f.p) filter (where s.wolf) - avg(f.p) filter (where not s.wolf) as gap
    from suspicion f
    join seats j on j.game_id = f.game_id and j.seat = f.judge
    join seats s on s.game_id = f.game_id and s.seat = f.subject
    group by j.model
),
voted as materialized (
    select e.model, count(*) as votes, count(*) filter (where t.wolf) as wolf_votes
    from votes e
    join seats t on t.game_id = e.game_id and t.seat = e.target
    group by e.model
)
select p.model,
       p.village_games,
       round(j.gap, 3) as suspicion_gap,
       coalesce(v.votes, 0) as votes,
       round(v.wolf_votes::numeric / nullif(v.votes, 0), 3) as wolf_vote_rate,
       p.village_games >= 5 as ranked
from played p
left join judged j using (model)
left join voted v using (model)
where p.model <> 'human';

create unique index if not exists global_detectors_model_idx on global_detectors (model);

create materialized view if not exists global_liars as
with dead as materialized (
    select distinct d.game_id, d.event ->> 'target' as seat
    from games g
    join events d on d.game_id = g.game_id and d.type in ('elimination', 'death_reveal')
    where g.status = 'finished' and g.agents is distinct from 'scripted'
),
seats as materialized (
    select g.game_id,
           s.key as seat,
           s.value ->> 'model' as model,
           s.value ->> 'role' = 'wolf' as wolf,
           x.seat is null as survived
    from games g
    join events e on e.game_id = g.game_id and e.type = 'game_start'
    cross join lateral jsonb_each(e.event -> 'meta' -> 'seats') s
    left join dead x on x.game_id = g.game_id and x.seat = s.key
    where g.status = 'finished' and g.agents is distinct from 'scripted'
),
suspicion as materialized (
    select l.game_id,
           l.actor as judge,
           x ->> 'player' as subject,
           (x ->> 'p')::numeric as p
    from (
        select distinct on (e.game_id, e.actor, e.day)
               e.game_id, e.actor, e.event -> 'suspicion' as suspicion
        from events e
        join seats j on j.game_id = e.game_id and j.seat = e.actor and not j.wolf
        where jsonb_typeof(e.event -> 'suspicion') = 'array'
        order by e.game_id, e.actor, e.day, e.seq desc
    ) l
    cross join lateral jsonb_array_elements(l.suspicion) x
),
votes as materialized (
    select e.game_id, e.seq, e.day, e.event ->> 'target' as target
    from seats v
    join events e on e.game_id = v.game_id and e.type = 'vote' and e.actor = v.seat
    where not v.wolf
),
played as materialized (
    select model, count(*) as wolf_games, count(*) filter (where survived) as survived
    from seats where wolf group by model
),
suspected as materialized (
    select w.model, avg(f.p) as p
    from suspicion f
    join seats w on w.game_id = f.game_id and w.seat = f.subject and w.wolf
    group by w.model
),
voted as materialized (
    select w.model, count(*) as votes
    from votes e
    join seats w on w.game_id = e.game_id and w.seat = e.target and w.wolf
    group by w.model
),
told as materialized (
    select l.game_id, l.source, l.label_type, l.actor, l.source_seq, w.model,
           src.day, src.type as src_type,
           src.event ->> 'target' as src_target,
           src.event -> 'meta' ->> 'result' as result
    from labels l
    join seats w on w.game_id = l.game_id and w.seat = l.actor and w.wolf
    join events src on src.game_id = l.game_id and src.seq = l.source_seq
    where l.source in ('self_tag', 'jev')
      and l.label_type in ('false_role_claim', 'false_report', 'bussing')
),
heard as (
    select t.model,
           t.source,
           case
               when t.label_type = 'bussing' then
                   case when sw.wolf then e.target = t.src_target
                        else vt.wolf and e.target <> t.actor end
               when t.label_type = 'false_report' and t.src_type = 'seer_claim' then
                   case when t.result = 'wolf' then e.target = t.src_target
                        else e.target not in (t.src_target, t.actor) end
               else e.target <> t.actor
           end as followed
    from told t
    join votes e on e.game_id = t.game_id and e.day = t.day and e.seq > t.source_seq
    left join seats vt on vt.game_id = e.game_id and vt.seat = e.target
    left join seats sw on sw.game_id = t.game_id and sw.seat = t.src_target
),
fooled as materialized (
    select model,
           count(*) filter (where source = 'self_tag') as self_tag_voters,
           count(*) filter (where source = 'self_tag' and followed) as self_tag_followed,
           count(*) filter (where source = 'jev') as jev_voters,
           count(*) filter (where source = 'jev' and followed) as jev_followed
    from heard
    group by model
)
select p.model,
       p.wolf_games,
       round(s.p, 3) as suspicion_received,
       round(p.survived::numeric / p.wolf_games, 3) as survival_rate,
       round(coalesce(v.votes, 0)::numeric / p.wolf_games, 3) as votes_received_per_game,
       coalesce(f.self_tag_voters, 0) as self_tag_lie_voters,
       round(f.self_tag_followed::numeric / nullif(f.self_tag_voters, 0), 3) as self_tag_lie_success,
       coalesce(f.jev_voters, 0) as jev_lie_voters,
       round(f.jev_followed::numeric / nullif(f.jev_voters, 0), 3) as jev_lie_success,
       p.wolf_games >= 5 as ranked
from played p
left join suspected s using (model)
left join voted v using (model)
left join fooled f using (model)
where p.model <> 'human';

create unique index if not exists global_liars_model_idx on global_liars (model);

-- Dropping the plain views dropped their grants.
do $$
begin
    if exists (select 1 from pg_roles where rolname = 'anonymous') then
        grant select on global_detectors, global_liars to anonymous;
    end if;
end $$;

notify pgrst, 'reload schema';
