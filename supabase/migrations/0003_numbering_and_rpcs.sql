-- Auto-numbering for orders (LVO-1, LVO-2, ...) and tickets (TKT-1046, ...)
create sequence if not exists orders_number_seq start 1;
create sequence if not exists tickets_number_seq start 1046;

create or replace function public.set_order_number()
returns trigger as $$
begin
  if new.number is null or new.number = '' then
    new.number := 'LVO-' || nextval('orders_number_seq')::text;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_order_number on orders;
create trigger trg_set_order_number before insert on orders
  for each row execute function public.set_order_number();

create or replace function public.set_ticket_number()
returns trigger as $$
begin
  if new.number is null or new.number = '' then
    new.number := 'TKT-' || nextval('tickets_number_seq')::text;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_ticket_number on tickets;
create trigger trg_set_ticket_number before insert on tickets
  for each row execute function public.set_ticket_number();

-- Bump coupon usage automatically whenever an order uses one
create or replace function public.bump_coupon_usage()
returns trigger as $$
begin
  if new."couponCode" is not null then
    update coupons set used = used + 1 where code = new."couponCode";
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_bump_coupon_usage on orders;
create trigger trg_bump_coupon_usage after insert on orders
  for each row execute function public.bump_coupon_usage();

-- Let a customer cancel their own subscription safely (writes are staff-only otherwise)
create or replace function public.cancel_subscription(p_sub_id uuid)
returns void as $$
begin
  update subscriptions
    set status = 'cancelled', "cancelledAt" = now()
    where id = p_sub_id and "customerId" = auth.uid();

  if not found then
    raise exception 'Subscription not found or not yours.';
  end if;

  update ownerships set status = 'expired'
    where "subscriptionId" = p_sub_id and "customerId" = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.cancel_subscription(uuid) to authenticated;
