# Auth Module — Atlantis Engineer Challenge

Реализация модуля аутентификации (register / login / reset password)

---

## Запуск

### Простой путь — Docker Compose

```bash
docker compose up --build
```

Поднимет Postgres + приложение, дождётся healthcheck БД, прогонит миграции и запустит dev-сервер. GraphiQL будет на `http://localhost:3000/graphiql`.

Остановить: `docker compose down` (с `-v` сбросит данные БД).

Тесты не требуют поднятой БД — используют in-memory fakes.

### Переменные окружения

`.env` уже содержит рабочие дефолты для локального запуска. Ключевые:

- `POSTGRES_*` — credentials БД
- `DB_HOST` — `localhost` для локалки, в docker-compose оверрайдится на `postgres_atls`
- `JWT_SECRET` — секрет для подписи JWT (для прода обязательно поменять)
- `JWT_ACCESS_TTL` — TTL access-токена (по умолчанию `15m`)
- `RESET_URL_TEMPLATE` — шаблон ссылки восстановления, `{token}` будет подставлен
- `NODE_ENV` — `development` использует `ConsoleEmailSender` (логирует ссылку), `production` потребует SMTP-переменные

---

## Стек и обоснование

| Слой           | Выбор                 | Почему именно это                                                                                                                                                                                                                                   |
| -------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Язык           | TypeScript            | Типы — главный инструмент защиты доменных инвариантов (Value Objects через приватный конструктор + branded-стиль). Без статических типов половина DDD-механики осыпается.                                                                           |
| HTTP-фреймворк | Fastify               | Native-плагины, низкий overhead, идиоматичный плагин Mercurius для GraphQL. Альтернатива — Express + Apollo: классика, но Apollo тащит свой HTTP-слой и больше boilerplate.                                                                         |
| GraphQL        | Mercurius             | Fastify-native, codegen из схемы, устраивает производительность. Apollo Server 4 рассматривал — мощнее экосистема, но избыточен для одного модуля.                                                                                                  |
| Query Builder  | Knex                  | Не ORM, поэтому **не утягивает entity-модель в инфру**. Это важно для DDD: репозиторий вручную мапит row → domain entity, никаких декораторов на доменных классах. TypeORM/Prisma были бы быстрее в написании, но размывали бы границу домен/инфра. |
| DI             | Awilix (CLASSIC mode) | Резолв по именам параметров → конструкторы остаются «чистыми», без декораторов и метаданных. tsyringe требует `reflect-metadata` и декораторов на доменных классах — отверг по той же причине что ORM.                                              |
| Auth-крипто    | bcrypt + jsonwebtoken | Стандарт. bcrypt cost = 12. JWT с TTL 15 минут. Refresh не делал — out of scope.                                                                                                                                                                    |
| БД             | PostgreSQL 16         | UUID v4 через `gen_random_uuid()`, transactional DDL, foreign keys — всё что нужно.                                                                                                                                                                 |
| Тесты          | Jest + ts-jest        | Классика. Все handler-тесты гоняются с in-memory fakes — без поднятой БД, ~2 секунды на 59 тестов.                                                                                                                                                  |

---

## Архитектура

### Bounded context

Один модуль `auth` (один bounded context). Структура внутри — DDD-слои:

```
src/
├── modules/auth/                       ← bounded context
│   ├── domain/                         ← бизнес-правила, без зависимостей от инфры
│   │   ├── entities/                   ← User, PasswordResetToken (фабрики, инварианты)
│   │   ├── value-objects/              ← Email, Password, PasswordHash, ResetToken, ResetTokenHash
│   │   └── errors.ts                   ← типизированные доменные ошибки с code
│   ├── application/                    ← оркестровка use cases
│   │   ├── ports/                      ← интерфейсы для инфры (DI inversion)
│   │   └── commands/                   ← Command + Handler на каждый use case
│   ├── infrastructure/                 ← реализации портов
│   │   ├── db/                         ← Knex-репозитории + mappers row↔entity
│   │   ├── crypto/                     ← bcrypt, JWT
│   │   └── email/                      ← console (dev) + smtp stub (prod)
│   ├── interface/graphql/              ← schema + resolvers (тонкий транспорт)
│   └── test-support/                   ← fakes для unit-тестов
├── interface/graphql/                  ← top-level агрегатор schema/resolvers
├── infrastructure/                     ← Knex client, DI container, AppLogger
└── app.ts / main.ts                    ← Fastify + Mercurius, errorFormatter
```

Зависимости направлены **внутрь**: `infrastructure → application → domain`. Домен ничего не знает про Knex, Mercurius, bcrypt или env.

---

## Где DDD, CQRS, IaC

### DDD

| Концепция                                        | Где в коде                                                                                                                                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Value Object с приватным конструктором + factory | [`domain/value-objects/email.ts`](src/modules/auth/domain/value-objects/email.ts), [`password.ts`](src/modules/auth/domain/value-objects/password.ts), [`reset-token.ts`](src/modules/auth/domain/value-objects/reset-token.ts) |
| Entity с фабриками и инвариантами                | [`domain/entities/user.ts`](src/modules/auth/domain/entities/user.ts), [`password-reset-token.ts`](src/modules/auth/domain/entities/password-reset-token.ts)                                                                    |
| Tell-Don't-Ask guard метод                       | [`PasswordResetToken.ensureUsable()`](src/modules/auth/domain/entities/password-reset-token.ts)                                                                                                                                 |
| Типизированные доменные ошибки                   | [`domain/errors.ts`](src/modules/auth/domain/errors.ts) — `DomainError` базовый класс с `code`                                                                                                                                  |
| Hexagonal Ports & Adapters                       | [`application/ports/`](src/modules/auth/application/ports/) — все интерфейсы; `infrastructure/` — реализации                                                                                                                    |
| Repository возвращает доменные сущности, не rows | [`infrastructure/db/user-mapper.ts`](src/modules/auth/infrastructure/db/user-mapper.ts)                                                                                                                                         |

### CQRS

Реализован **прагматичный CQRS**:

- **Command side**: на каждый use case — отдельная пара `Command` + `Handler` ([`application/commands/`](src/modules/auth/application/commands/)). Команды проходят через домен и инварианты.
- **Query side**: пока пуст — нет use case'ов на чтение в текущем скоупе. Когда появится `getCurrentUser` или `listMyResetTokens`, query-handlers пойдут в `application/queries/` и смогут ходить в обход домена (плоский DTO напрямую из БД), потому что для read-моделей доменные инварианты избыточны.

### IaC

- [`docker-compose.yml`](docker-compose.yml) — Postgres 16-alpine, env читается из `.env`, persistent volume.
- [`src/infrastructure/database/migrations/`](src/infrastructure/database/migrations/) — миграции как код (Knex), обратимые (`up`/`down`).
- [`.env`](`.env`) — все рантайм-конфиги. Жёстко закодированных секретов в коде нет.

---

## Тесты

59 тестов, ~2 секунды. Структура:

- **Domain (35 тестов)**: VO (email/password/reset-token), entity (user/password-reset-token).

- **Application (24 теста)**: handlers с in-memory fakes

```bash
npm test           # один прогон
npm run test:watch # watch-режим
```

---

## Trade-offs

Намеренно упрощено для рамок challenge'а:

1. **Нет HTTP-level rate limiting (`@fastify/rate-limit`).** Доменный rate-limit на reset есть, но грубый brute-force на login открыт. Ставится одной строкой плагина — не успел вписать корректно для GraphQL-эндпоинта.

2. **Нет SMTP-имплементации.** `SmtpEmailSender` — стаб, throws. В dev работает `ConsoleEmailSender`, который логирует ссылку и возвращает её через `devResetLink` поле в GraphQL response. В проде это поле всегда `null`. Реальная отправка через nodemailer — next step.

3. **GraphQL ошибки через `extensions.code`, не union types.** Для challenge'а выбрал extensions — проще, контракт всё равно явный.

4. **VO `PasswordHash` и `ResetTokenHash` — лёгкие обёртки над `string`.** Без валидации, только type-safety на сигнатурах методов (нельзя случайно перепутать raw и hash). Альтернатива — branded types `string & { __brand: "PasswordHash" }`. Оставил классы для консистентности с `Email` / `Password`.

5. **`User.register()` и `User.restore()` возвращают `UserEntity` (interface), а не сам класс `User`.** Сделано чтобы держать репозиторные сигнатуры на одном плоском типе. Цена — теряется поведение entity (методы недоступны после restore). Для текущего скоупа методов на User'е и не нужно. `PasswordResetToken.restore()` сделан иначе (возвращает class instance), потому что нужен `ensureUsable()`.

6. **Нет integration-тестов.** Все тесты — unit с fakes. Полный E2E через GraphQL + поднятый Postgres делается через testcontainers — в next steps.

7. **Логирование минимальное.** `AppLogger` (обёртка над pino) есть и используется в `errorFormatter` и `ConsoleEmailSender`. В handler'ы пока не инжектил — следующая итерация.

---

## Что бы сделал в production-версии

В порядке приоритета:

- **`@fastify/rate-limit`** на GraphQL endpoint, distributed через Redis для multi-instance.
- **Account lockout**: колонки `failed_login_count` + `locked_until` на `users`, обнуление на успешный логин. Защита от brute-force на конкретный аккаунт.
- **Refresh-токены** в отдельной таблице с rotation.
- **Per-request DI scope** через `@fastify/awilix` — корректные transactions, correlation-IDs в логах.
- **Structured logging** с correlation ID на каждый request, OpenTelemetry-трейсинг между слоями.
- **Реальный `SmtpEmailSender`** через nodemailer / SES.
- **Typed GraphQL errors** через union types — лучший DX для клиента.
- **Integration tests** через testcontainers, e2e через supertest на GraphQL.
- **CI** (GitHub Actions): lint + test + типы + security audit.
