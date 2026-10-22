insert into public.sectors(id, name, slug) values
  ('10000000-0000-4000-8000-000000000001', 'Pronto Atendimento', 'pronto-atendimento'),
  ('10000000-0000-4000-8000-000000000002', 'Internação', 'internacao'),
  ('10000000-0000-4000-8000-000000000003', 'Ambulatório', 'ambulatorio');
insert into public.surveys(sector_id, title, status)
  select id, 'Como foi o seu atendimento?', 'published' from public.sectors;
insert into public.questions(sector_id, text, position)
  select id, 'Como você avalia a atenção da nossa equipe?', 0 from public.sectors;
insert into public.questions(sector_id, text, position)
  select id, 'Como você avalia o tempo de espera?', 1 from public.sectors;
insert into public.questions(text, position) values ('Como você avalia a limpeza e o conforto do hospital?', 0);
