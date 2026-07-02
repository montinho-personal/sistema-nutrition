# Módulo `sync` — Backup e sincronização na nuvem (Sprint A)

Persistência real sem perder dados. Camada **aditiva**: o `localStorage` continua sendo a fonte
reativa da UI (zero regressão) e a nuvem entra como backup + restauração.

## Como funciona

- Toda escrita local (`writeLocal`) é observada (`onLocalWrite`) e **espelhada na nuvem** com um
  pequeno atraso (debounce). Backup contínuo.
- Ao entrar (sessão ativa), o app **baixa e funde** o que está na nuvem com o local
  (`hydrateFromCloud`) — restauração e uso em vários dispositivos.
- Se a nuvem falhar ou não houver login, tudo segue funcionando **local-first** (try/catch, sem
  bloquear a UI).

## Segurança

- Os dados são de saúde → o acesso é **sempre do próprio usuário logado** (`auth.uid()`).
- A chave anon **não acessa** nada aqui: as funções `montinho_sync_push/pull` (schema `public`,
  `SECURITY DEFINER`) só são concedidas a `authenticated` e filtram por `auth.uid()`.
- RLS na tabela `montinho.app_collections` reforça o isolamento por usuário (migração 0018).

## Estrutura

- `services/mergeCollections.ts` — fusão determinística (união por id, mais recente vence).
- `services/cloudSync.ts` — push (debounced), pull/hydrate, status reativo.
- `hooks/` — sessão do Supabase e status da sincronização.
- `components/sync-provider.tsx` — liga o sync quando há sessão (montado no layout do app).
- `components/sync-settings-card.tsx` — entrar / status / sair (na tela de Configurações).

## Escopo (decisão de arquitetura)

Sprint A guarda cada coleção como um **documento por usuário** (`app_collections`) — resolve já o
risco de perda de dados e o "preso num navegador", sem reescrever a UI para async. Adotar o
**schema normalizado** (as 60 tabelas de domínio) fica para quando houver inteligência no servidor
que precise consultar os dados linha a linha.
