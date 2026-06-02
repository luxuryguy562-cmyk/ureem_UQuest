# API_SPEC.md

## 인증

```text
POST /auth/login
POST /auth/logout
```

---

## 미션

```text
GET /missions
POST /mission/complete
```

---

## 타격

```text
POST /tree/hit
GET /tree/result
```

---

## 인벤토리

```text
GET /inventory
POST /inventory/use
```

---

## 상점

```text
GET /shop
POST /shop/redeem
```

---

## 관리자

```text
GET /admin/economy
POST /admin/economy/update
POST /admin/reward/create
POST /admin/mission/create
```

---

## 앱 설정 스냅샷

```text
GET /app-config/current
POST /admin/app-config/rebuild
```

현재 Next 구현에서는 API 라우트 대신 서버 컴포넌트의 `getUQuestAppConfig()`가 Supabase `app_config_snapshots`를 직접 읽는다. 추후 외부 클라이언트나 앱이 생기면 위 API를 추가한다.

---

## 변경 이력

### 2026-05-28

- 화면 렌더링용 설정 스냅샷 API 후보를 추가했다.
