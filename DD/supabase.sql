create table if not exists public.thoughts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists thoughts_user_id_created_at_idx
on public.thoughts (user_id, created_at desc);

alter table public.thoughts enable row level security;

create policy "thoughts_select_own"
on public.thoughts for select
using (auth.uid() = user_id);

create policy "thoughts_insert_own"
on public.thoughts for insert
with check (auth.uid() = user_id);

create policy "thoughts_update_own"
on public.thoughts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "thoughts_delete_own"
on public.thoughts for delete
using (auth.uid() = user_id);
