-- Mucula 007 — reject_as_seller + expire_stale_negotiations
-- Aplicar no SQL Editor do projecto domkswueipwpyicebotc
-- Regra de grants: revoke explícito + grant só a authenticated

-- ---------------------------------------------------------------------------
-- reject_as_seller: só o seller; fecha negociação; offers pending → rejected
-- ---------------------------------------------------------------------------
create or replace function public.reject_as_seller(p_negotiation_id uuid)
returns public.negotiations
language plpgsql
security definer
set search_path = public
as $$
declare
  n public.negotiations;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'NEED_AUTH';
  end if;

  select * into n from public.negotiations where id = p_negotiation_id for update;
  if not found then
    raise exception 'Negociação não encontrada.';
  end if;

  if n.seller_id is distinct from uid then
    raise exception 'Só o vendedor pode recusar.';
  end if;

  if n.state = 'closed' then
    return n;
  end if;

  if n.state = 'matched' then
    raise exception 'Acordo já confirmado — não dá para recusar assim.';
  end if;

  if n.proposed_price is null then
    raise exception 'Ainda não há proposta para recusar.';
  end if;

  update public.offers
  set status = 'rejected',
      updated_at = now()
  where negotiation_id = n.id
    and status = 'pending';

  update public.negotiations
  set state = 'closed',
      closed_reason = 'rejected',
      needs_seller_decision = false,
      updated_at = now()
  where id = n.id
  returning * into n;

  return n;
end;
$$;

revoke execute on function public.reject_as_seller(uuid) from anon, authenticated, service_role, public;
grant execute on function public.reject_as_seller(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- expire_stale_negotiations: fecha open > 48h (created_at)
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_negotiations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n_count integer := 0;
begin
  update public.offers o
  set status = 'expired',
      updated_at = now()
  where o.status = 'pending'
    and exists (
      select 1 from public.negotiations n
      where n.id = o.negotiation_id
        and n.state not in ('closed', 'matched')
        and n.created_at < now() - interval '48 hours'
    );

  with updated as (
    update public.negotiations
    set state = 'closed',
        closed_reason = 'expired',
        needs_seller_decision = false,
        updated_at = now()
    where state not in ('closed', 'matched')
      and created_at < now() - interval '48 hours'
    returning id
  )
  select count(*)::integer into n_count from updated;

  return n_count;
end;
$$;

revoke execute on function public.expire_stale_negotiations() from anon, authenticated, service_role, public;
grant execute on function public.expire_stale_negotiations() to authenticated;

