-- =============================================================================
-- Migração 0015 — Food Intelligence Engine: seed curado (Sprint 1.3)
--
-- Conjunto CURADO de alimentos brasileiros comuns, com composição por 100 g
-- em estilo TBCA/TACO e atributos estratégicos autorados. NÃO é a base TBCA
-- completa — é uma semente representativa para operar e validar o motor
-- (busca, filtros, classificação, alertas). A importação em massa da TBCA
-- usa o importador tipado em src/modules/foods/services/tbcaImport.ts.
--
-- Valores nutricionais aproximados de TBCA/TACO; conferir na importação oficial.
-- =============================================================================

-- ── Grupos / categorias ──────────────────────────────────────────────────────
insert into public.food_categories (name, description) values
  ('Carnes e ovos', 'Fontes proteicas de origem animal'),
  ('Pescados', 'Peixes e frutos do mar'),
  ('Laticínios', 'Leite e derivados'),
  ('Cereais e derivados', 'Arroz, aveia, pães e afins'),
  ('Leguminosas', 'Feijões, lentilha, grão-de-bico'),
  ('Tubérculos e raízes', 'Batata-doce, mandioca e afins'),
  ('Frutas', 'Frutas in natura'),
  ('Hortaliças', 'Verduras e legumes'),
  ('Óleos e gorduras', 'Azeites e gorduras'),
  ('Oleaginosas', 'Castanhas e pastas')
on conflict (name) do nothing;

-- ── Alimentos (composição por 100 g) ─────────────────────────────────────────
with s as (select name, id from public.food_sources),
     c as (select name, id from public.food_categories)
insert into public.foods (
  source_id, category_id, source_code, name, food_group, subgroup,
  energy_kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g,
  saturated_fat_g, sodium_mg, potassium_mg, data_confidence, processing_level, synonyms
)
select s.id, c.id, v.code, v.name, v.grp, v.sub,
       v.kcal, v.p, v.c, v.f, v.fib, v.sug, v.sat, v.na, v.k, v.conf, v.proc, v.syn::text[]
from (values
  -- code, source, category, name, group, subgroup, kcal, p, c, f, fiber, sugar, sat, sodium, potassium, conf, processing, synonyms
  ('FIE001','TBCA','Carnes e ovos','Frango, peito, grelhado','Carnes','Aves',159,32.0,0.0,2.5,0.0,0.0,0.7,72,330,'high','minimally_processed','{peito de frango,filé de frango}'),
  ('FIE002','TBCA','Carnes e ovos','Ovo de galinha, inteiro, cozido','Ovos','Ovo',146,13.3,0.6,9.5,0.0,0.6,3.1,140,126,'high','minimally_processed','{ovo cozido}'),
  ('FIE003','TACO','Carnes e ovos','Carne bovina, patinho, moído, cozido','Carnes','Bovina',219,35.9,0.0,7.3,0.0,0.0,2.9,52,340,'high','minimally_processed','{patinho,carne moída magra}'),
  ('FIE004','TBCA','Pescados','Tilápia, filé, grelhado','Pescados','Peixe',128,26.2,0.0,2.7,0.0,0.0,0.9,56,380,'high','minimally_processed','{filé de tilápia}'),
  ('FIE005','TACO','Pescados','Atum, conserva em água','Pescados','Peixe',116,25.5,0.0,0.8,0.0,0.0,0.2,320,240,'medium','processed','{atum em lata}'),
  ('FIE006','TBCA','Laticínios','Iogurte natural, desnatado','Laticínios','Iogurte',41,3.8,5.9,0.2,0.0,5.9,0.1,52,180,'high','minimally_processed','{iogurte natural}'),
  ('FIE007','TACO','Laticínios','Queijo cottage','Laticínios','Queijo',98,11.0,3.4,4.3,0.0,3.0,2.7,380,90,'medium','processed','{cottage}'),
  ('FIE008','TBCA','Laticínios','Leite de vaca, integral','Laticínios','Leite',61,3.2,4.7,3.3,0.0,4.7,1.9,50,150,'high','minimally_processed','{leite integral}'),
  ('FIE009','TBCA','Cereais e derivados','Arroz, branco, cozido','Cereais','Arroz',128,2.5,28.1,0.2,1.6,0.1,0.1,1,15,'high','minimally_processed','{arroz branco}'),
  ('FIE010','TBCA','Cereais e derivados','Arroz, integral, cozido','Cereais','Arroz',124,2.6,25.8,1.0,2.7,0.2,0.2,1,42,'high','minimally_processed','{arroz integral}'),
  ('FIE011','TACO','Cereais e derivados','Aveia, flocos','Cereais','Aveia',394,13.9,66.6,8.5,9.1,1.0,1.5,5,336,'high','minimally_processed','{aveia em flocos}'),
  ('FIE012','TACO','Cereais e derivados','Pão, francês','Cereais','Pão',300,8.0,58.6,3.1,2.3,1.5,0.7,648,110,'medium','processed','{pão de sal,pãozinho}'),
  ('FIE013','TBCA','Leguminosas','Feijão, carioca, cozido','Leguminosas','Feijão',76,4.8,13.6,0.5,8.5,0.3,0.1,2,255,'high','minimally_processed','{feijão carioca}'),
  ('FIE014','TACO','Leguminosas','Lentilha, cozida','Leguminosas','Lentilha',93,6.3,16.3,0.5,7.9,0.3,0.1,2,220,'medium','minimally_processed','{lentilha}'),
  ('FIE015','TBCA','Tubérculos e raízes','Batata-doce, cozida','Tubérculos','Raiz',77,0.6,18.4,0.1,2.2,5.7,0.0,4,270,'high','minimally_processed','{batata doce}'),
  ('FIE016','TACO','Tubérculos e raízes','Mandioca, cozida','Tubérculos','Raiz',125,0.6,30.1,0.3,1.6,1.4,0.1,1,180,'medium','minimally_processed','{aipim,macaxeira}'),
  ('FIE017','TBCA','Frutas','Banana, prata','Frutas','Fruta',98,1.3,26.0,0.1,2.0,17.0,0.0,0,358,'high','in_natura','{banana}'),
  ('FIE018','TBCA','Frutas','Maçã, com casca','Frutas','Fruta',56,0.3,15.2,0.0,1.3,13.0,0.0,0,110,'high','in_natura','{maçã}'),
  ('FIE019','TACO','Óleos e gorduras','Azeite de oliva, extra virgem','Óleos','Azeite',884,0.0,0.0,100.0,0.0,0.0,14.0,2,1,'high','minimally_processed','{azeite}'),
  ('FIE020','TACO','Oleaginosas','Pasta de amendoim, integral','Oleaginosas','Pasta',589,25.0,20.0,50.0,6.0,9.0,10.0,17,650,'medium','processed','{manteiga de amendoim}'),
  ('FIE021','TACO','Oleaginosas','Castanha-do-pará','Oleaginosas','Castanha',643,14.5,15.1,63.5,7.9,2.3,15.1,1,660,'high','in_natura','{castanha do pará}'),
  ('FIE022','TBCA','Frutas','Abacate','Frutas','Fruta',96,1.2,6.0,8.4,6.3,0.7,1.8,2,206,'high','in_natura','{abacate}'),
  ('FIE023','TBCA','Hortaliças','Brócolis, cozido','Hortaliças','Verdura',25,2.1,4.4,0.5,3.4,1.1,0.1,8,190,'high','minimally_processed','{brócolis}'),
  ('FIE024','TBCA','Hortaliças','Cenoura, crua','Hortaliças','Legume',34,1.3,7.7,0.2,3.2,4.7,0.0,65,315,'high','in_natura','{cenoura}')
) v(code, src, cat, name, grp, sub, kcal, p, c, f, fib, sug, sat, na, k, conf, proc, syn)
join s on s.name = v.src
join c on c.name = v.cat;

-- ── Atributos estratégicos por alimento ──────────────────────────────────────
insert into public.food_attributes (
  food_id, satiety_score, practicality_score, digestibility_score, palatability_score,
  acceptance_score, overeating_risk, cost_range, availability, prep_time_minutes,
  freezes_well, portability, needs_cooking, can_eat_cold, can_prep_ahead,
  good_for_lunchbox, good_for_travel, good_for_hunger_control, good_for_few_meals,
  best_times, suitable_goals, strategic_applications
)
select f.id, a.sat, a.prat, a.dig, a.pal, a.acc, a.risk, a.cost, a.avail, a.prep,
       a.frz, a.port, a.cook, a.cold, a.ahead, a.lunch, a.travel, a.hunger, a.few,
       a.times::text[], a.goals::text[], a.apps
from (values
  -- code, satiety, practicality, digestibility, palatability, acceptance, overeating_risk, cost, availability, prep_min, freezes, portable, needs_cooking, eat_cold, prep_ahead, lunchbox, travel, hunger_control, few_meals, best_times, goals, applications
  ('FIE001',82,70,80,72,88,'low','medium','high',15,true,false,true,true,true,true,false,true,true,'{lunch,dinner,post_workout}','{weight_loss,hypertrophy,recomposition,maintenance}','Base proteica magra e versátil; excelente para marmitas.'),
  ('FIE002',78,88,82,70,90,'low','low','high',10,false,true,true,true,true,true,true,true,true,'{breakfast,snack,post_workout}','{weight_loss,hypertrophy,recomposition}','Proteína completa, barata e prática; ótima saciedade.'),
  ('FIE003',80,60,70,78,82,'moderate','high','high',20,true,false,true,true,true,true,false,true,true,'{lunch,dinner}','{hypertrophy,recomposition,maintenance}','Proteína densa com ferro; ótima para hipertrofia.'),
  ('FIE004',75,68,85,68,72,'low','medium','medium',15,true,false,true,true,true,true,false,true,true,'{lunch,dinner}','{weight_loss,recomposition,performance}','Proteína magra de rápida digestão.'),
  ('FIE005',72,92,80,60,70,'low','medium','high',2,false,true,false,true,true,true,true,true,true,'{lunch,snack,travel}','{weight_loss,recomposition}','Proteína pronta e portátil; atenção ao sódio.'),
  ('FIE006',60,90,88,66,80,'low','low','high',0,false,true,false,true,true,false,false,true,false,'{breakfast,snack,supper}','{weight_loss,maintenance}','Base proteica leve; boa para ceia.'),
  ('FIE007',70,85,84,58,64,'low','medium','medium',0,false,true,false,true,true,true,false,true,true,'{snack,supper,post_workout}','{weight_loss,hypertrophy,recomposition}','Alta proteína e baixa caloria; ótima saciedade.'),
  ('FIE008',48,90,70,68,86,'moderate','low','high',0,false,false,false,true,true,false,false,false,false,'{breakfast,supper}','{hypertrophy,maintenance}','Fonte prática de proteína e cálcio.'),
  ('FIE009',45,72,90,62,92,'moderate','very_low','high',20,true,false,true,true,true,true,false,false,false,'{lunch,dinner}','{hypertrophy,maintenance,performance}','Carboidrato acessível e bem aceito.'),
  ('FIE010',58,66,78,58,80,'low','low','high',25,true,false,true,true,true,true,false,true,false,'{lunch,dinner,pre_workout}','{weight_loss,recomposition,maintenance}','Carboidrato com fibra; melhor saciedade que o branco.'),
  ('FIE011',72,86,74,64,84,'moderate','low','high',5,false,true,false,true,true,false,true,true,false,'{breakfast,pre_workout}','{weight_loss,hypertrophy,performance}','Fibra e carboidrato de liberação gradual.'),
  ('FIE012',40,88,80,74,90,'high','very_low','high',0,true,true,false,true,false,false,true,false,false,'{breakfast,pre_workout}','{hypertrophy,maintenance}','Carboidrato prático e palatável; controlar porção.'),
  ('FIE013',74,55,60,60,85,'low','very_low','high',40,true,false,true,true,true,true,false,true,false,'{lunch,dinner}','{weight_loss,maintenance,recomposition}','Fibra e proteína vegetal; muito saciante e barato.'),
  ('FIE014',76,58,64,60,68,'low','low','medium',35,true,false,true,true,true,true,false,true,false,'{lunch,dinner}','{weight_loss,recomposition}','Leguminosa rica em fibra e proteína vegetal.'),
  ('FIE015',80,74,82,70,84,'low','low','high',20,true,true,true,true,true,true,true,true,false,'{pre_workout,lunch,post_workout}','{weight_loss,hypertrophy,performance}','Carboidrato saciante e versátil; excelente para treino.'),
  ('FIE016',55,64,66,64,74,'moderate','very_low','high',30,true,false,true,true,true,true,false,false,false,'{lunch,pre_workout}','{hypertrophy,performance,maintenance}','Carboidrato energético e barato.'),
  ('FIE017',52,95,84,76,88,'moderate','low','high',0,false,true,false,true,false,false,true,false,false,'{pre_workout,snack,post_workout}','{performance,maintenance,hypertrophy}','Fruta prática e portátil; ótima ao redor do treino.'),
  ('FIE018',58,96,80,70,88,'low','low','high',0,false,true,false,true,false,false,true,true,false,'{snack,supper}','{weight_loss,maintenance}','Fruta com fibra; saciante e muito prática.'),
  ('FIE019',20,98,60,55,70,'moderate','high','high',0,false,false,false,true,false,false,false,false,false,'{lunch,dinner}','{maintenance,performance}','Gordura boa concentrada; usar com moderação.'),
  ('FIE020',66,90,58,84,76,'high','medium','high',0,false,true,false,true,false,true,true,true,false,'{breakfast,snack,pre_workout}','{hypertrophy,maintenance}','Alta densidade energética; ótima para ganho de peso.'),
  ('FIE021',68,94,56,70,66,'high','high','medium',0,false,true,false,true,false,true,true,true,false,'{snack}','{maintenance,performance}','Gordura boa e selênio; porção pequena já basta.'),
  ('FIE022',70,72,72,72,70,'moderate','medium','medium',0,false,false,false,true,false,false,false,true,false,'{breakfast,snack}','{maintenance,performance}','Gordura boa saciante; excelente com fibra.'),
  ('FIE023',72,60,80,52,66,'low','low','high',12,true,false,true,true,true,true,false,true,true,'{lunch,dinner}','{weight_loss,recomposition}','Baixa caloria e alta fibra; grande volume alimentar.'),
  ('FIE024',66,90,78,62,80,'low','very_low','high',0,false,true,false,true,true,true,true,true,true,'{snack,lunch}','{weight_loss,maintenance}','Crua e portátil; ótima para saciedade de baixa caloria.')
) a(code, sat, prat, dig, pal, acc, risk, cost, avail, prep, frz, port, cook, cold, ahead, lunch, travel, hunger, few, times, goals, apps)
join public.foods f on f.source_code = a.code;

-- ── Medidas caseiras (amostra) ───────────────────────────────────────────────
insert into public.food_portions (food_id, name, grams)
select f.id, p.name, p.grams
from (values
  ('FIE002','unidade média', 50),
  ('FIE008','copo (200 ml)', 200),
  ('FIE009','escumadeira cheia', 45),
  ('FIE011','colher de sopa', 15),
  ('FIE012','unidade', 50),
  ('FIE017','unidade média', 70),
  ('FIE018','unidade média', 130),
  ('FIE019','fio / colher de chá', 5),
  ('FIE020','colher de sopa', 20),
  ('FIE021','unidade', 5)
) p(code, name, grams)
join public.foods f on f.source_code = p.code
on conflict (food_id, name) do nothing;

-- ── Catálogo de tags (Documento 15) ──────────────────────────────────────────
insert into public.food_tags (name, tag_type, description) values
  ('Alta proteína', 'nutritional', 'Boa densidade proteica por caloria'),
  ('Alta fibra', 'nutritional', 'Rico em fibras'),
  ('Baixa caloria', 'nutritional', 'Baixa densidade energética'),
  ('Alta densidade energética', 'nutritional', 'Muitas calorias por grama'),
  ('Alta saciedade', 'strategic', 'Alto poder de saciedade'),
  ('Baixo custo', 'strategic', 'Excelente custo-benefício'),
  ('Pré-treino', 'timing', 'Adequado no pré-treino'),
  ('Pós-treino', 'timing', 'Adequado no pós-treino'),
  ('Rápido preparo', 'logistic', 'Pronto em poucos minutos'),
  ('Portátil', 'logistic', 'Fácil de transportar'),
  ('Congelável', 'logistic', 'Congela bem'),
  ('Sem lactose', 'dietary', 'Compatível com intolerância à lactose'),
  ('Sem glúten', 'dietary', 'Compatível com dieta sem glúten'),
  ('Vegetariano', 'dietary', 'Compatível com dieta vegetariana'),
  ('Vegano', 'dietary', 'Compatível com dieta vegana')
on conflict (name) do nothing;

-- ── Atribuição de tags aos alimentos ─────────────────────────────────────────
insert into public.food_tag_assignments (food_id, tag_id)
select f.id, t.id
from (values
  ('FIE001','Alta proteína'),('FIE001','Alta saciedade'),('FIE001','Congelável'),('FIE001','Sem glúten'),('FIE001','Sem lactose'),
  ('FIE002','Alta proteína'),('FIE002','Baixo custo'),('FIE002','Rápido preparo'),('FIE002','Portátil'),('FIE002','Sem glúten'),('FIE002','Sem lactose'),('FIE002','Vegetariano'),
  ('FIE003','Alta proteína'),('FIE003','Alta saciedade'),('FIE003','Sem glúten'),('FIE003','Sem lactose'),
  ('FIE004','Alta proteína'),('FIE004','Baixa caloria'),('FIE004','Sem glúten'),('FIE004','Sem lactose'),
  ('FIE005','Alta proteína'),('FIE005','Rápido preparo'),('FIE005','Portátil'),('FIE005','Sem glúten'),('FIE005','Sem lactose'),
  ('FIE006','Alta proteína'),('FIE006','Baixa caloria'),('FIE006','Rápido preparo'),('FIE006','Vegetariano'),('FIE006','Sem glúten'),
  ('FIE007','Alta proteína'),('FIE007','Baixa caloria'),('FIE007','Alta saciedade'),('FIE007','Vegetariano'),('FIE007','Sem glúten'),
  ('FIE008','Vegetariano'),('FIE008','Sem glúten'),('FIE008','Rápido preparo'),
  ('FIE009','Baixo custo'),('FIE009','Sem glúten'),('FIE009','Sem lactose'),('FIE009','Vegano'),
  ('FIE010','Alta fibra'),('FIE010','Baixo custo'),('FIE010','Sem glúten'),('FIE010','Sem lactose'),('FIE010','Vegano'),('FIE010','Congelável'),
  ('FIE011','Alta fibra'),('FIE011','Pré-treino'),('FIE011','Baixo custo'),('FIE011','Vegano'),('FIE011','Sem lactose'),
  ('FIE012','Pré-treino'),('FIE012','Rápido preparo'),('FIE012','Vegano'),('FIE012','Baixo custo'),
  ('FIE013','Alta fibra'),('FIE013','Alta saciedade'),('FIE013','Baixo custo'),('FIE013','Sem glúten'),('FIE013','Vegano'),('FIE013','Congelável'),
  ('FIE014','Alta fibra'),('FIE014','Alta saciedade'),('FIE014','Sem glúten'),('FIE014','Vegano'),
  ('FIE015','Alta saciedade'),('FIE015','Pré-treino'),('FIE015','Baixo custo'),('FIE015','Sem glúten'),('FIE015','Vegano'),('FIE015','Congelável'),
  ('FIE016','Pré-treino'),('FIE016','Baixo custo'),('FIE016','Sem glúten'),('FIE016','Vegano'),('FIE016','Congelável'),
  ('FIE017','Pré-treino'),('FIE017','Pós-treino'),('FIE017','Portátil'),('FIE017','Rápido preparo'),('FIE017','Vegano'),('FIE017','Sem glúten'),
  ('FIE018','Alta fibra'),('FIE018','Portátil'),('FIE018','Baixa caloria'),('FIE018','Vegano'),('FIE018','Sem glúten'),
  ('FIE019','Alta densidade energética'),('FIE019','Vegano'),('FIE019','Sem glúten'),('FIE019','Sem lactose'),
  ('FIE020','Alta densidade energética'),('FIE020','Alta proteína'),('FIE020','Portátil'),('FIE020','Vegano'),
  ('FIE021','Alta densidade energética'),('FIE021','Portátil'),('FIE021','Vegano'),('FIE021','Sem glúten'),
  ('FIE022','Alta fibra'),('FIE022','Alta densidade energética'),('FIE022','Vegano'),('FIE022','Sem glúten'),
  ('FIE023','Alta fibra'),('FIE023','Baixa caloria'),('FIE023','Alta saciedade'),('FIE023','Vegano'),('FIE023','Sem glúten'),
  ('FIE024','Alta fibra'),('FIE024','Baixa caloria'),('FIE024','Portátil'),('FIE024','Vegano'),('FIE024','Sem glúten')
) m(code, tag)
join public.foods f on f.source_code = m.code
join public.food_tags t on t.name = m.tag
on conflict (food_id, tag_id) do nothing;
