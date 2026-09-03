-- Lets a logged-in customer check a coupon code without exposing the
-- whole coupons table to them (which stays staff-only via RLS).
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns table (
  code text, kind text, value numeric, "minOrder" numeric, "maxDiscount" numeric,
  discount numeric
) as $$
declare
  c coupons%rowtype;
  d numeric;
  prior_uses int;
begin
  select * into c from coupons where coupons.code = upper(trim(p_code));

  if c.code is null then
    raise exception 'This coupon is invalid or no longer active.';
  end if;
  if not c.active then
    raise exception 'This coupon is invalid or no longer active.';
  end if;
  if now() < c."startsAt" then
    raise exception 'This coupon isn''t active yet.';
  end if;
  if now() > c."expiresAt" then
    raise exception 'This coupon has expired.';
  end if;
  if p_subtotal < c."minOrder" then
    raise exception 'Requires a minimum order of %.', c."minOrder";
  end if;
  if c."usageLimit" > 0 and c.used >= c."usageLimit" then
    raise exception 'This coupon has reached its usage limit.';
  end if;

  select count(*) into prior_uses from orders o
    where o."customerId" = auth.uid() and o."couponCode" = c.code;
  if prior_uses >= c."perCustomer" then
    raise exception 'You''ve already used this coupon.';
  end if;

  d := case when c.kind = 'percent' then (p_subtotal * c.value) / 100 else c.value end;
  if c."maxDiscount" is not null then
    d := least(d, c."maxDiscount");
  end if;
  d := least(d, p_subtotal);

  return query select c.code, c.kind, c.value, c."minOrder", c."maxDiscount", round(d, 2);
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.validate_coupon(text, numeric) to authenticated;
