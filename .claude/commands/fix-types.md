# Tìm và sửa TypeScript type errors trong ProjectOS. Chạy type-check, phân tích lỗi và đưa ra fix chính xác

**Phạm vi cần fix (tùy chọn):** $ARGUMENTS

---

## Quy trình

### Bước 1 — Chạy type-check

```bash
npm run type-check
```

Capture toàn bộ output lỗi.

### Bước 2 — Phân loại lỗi

Nhóm các lỗi theo loại:

| Loại | Dấu hiệu | Cách fix |
| ---- | -------- | -------- |
| Missing type | `Parameter 'x' implicitly has an 'any' type` | Thêm type annotation |
| Missing interface field | `Property 'x' does not exist on type 'Y'` | Thêm field vào interface |
| Type mismatch | `Type 'X' is not assignable to type 'Y'` | Sửa type hoặc data |
| Missing import | `Cannot find name 'X'` | Thêm import |
| Null safety | `Object is possibly 'null' or 'undefined'` | Thêm null check |
| Return type | `Type 'X' is not assignable to return type` | Sửa return type |

### Bước 3 — Fix theo thứ tự ưu tiên

1. **Sửa types trong `src/lib/types/`** — các changes ở đây lan ra toàn app
2. **Sửa service functions** — đảm bảo return types đúng
3. **Sửa hooks** — đảm bảo destructure types đúng
4. **Sửa components** — props và state types

### Bước 4 — Nguyên tắc fix

```typescript
// ❌ KHÔNG fix bằng cách bỏ qua type (type assertion không an toàn)
const data = response as any; // ❌
const data = response as unknown as Task; // ❌

// ✅ Fix bằng cách khai báo type đúng
const data: Task = { id: doc.id, ...doc.data() as Omit<Task, 'id'> }; // ✅

// ❌ KHÔNG tắt TypeScript
// @ts-ignore // ❌
// @ts-expect-error // ❌ (trừ khi có lý do thực sự)

// ✅ Thêm null safety đúng cách
if (!user) return null; // ✅ guard clause
const name = user?.displayName ?? 'Unknown'; // ✅ optional chaining + fallback
```

### Bước 5 — Kiểm tra sau fix

```bash
npm run type-check  # Phải pass không có lỗi
npm run lint        # Không có lint errors mới
```

---

## Lưu ý với ProjectOS

### Vị trí types

- Types chính: `src/modules/{module}/types/{module}.ts` (từng module tự quản lý)
- Barrel export: `src/lib/types/index.ts` — re-export từ tất cả modules
- Shared utility types: `src/lib/firestore-rq/types/` (`WithId<T>`, `QueryOptions`...)

Khi thêm field mới vào interface, phải cập nhật **tất cả** nơi dùng:

- `src/modules/{module}/collections/{collection}.ts` — transform function
- `src/modules/{module}/hooks/use{Module}.ts` — destructure/memo
- `src/modules/{module}/components/` — props và form schema
- `src/modules/{module}/mock.ts` — mock data

### WithId pattern

```typescript
// Firestore docs trả về không có id trong data — dùng WithId<T>
import type { WithId } from '@/lib/firestore-rq';

// ✅ Đúng
const { data } = bugsCollection.useList();
const bugs = data as WithId<Bug>[];

// ❌ Sai — Bug không có id
const bugs: Bug[] = data;
```

---

## Output

Với mỗi lỗi tôi sẽ cung cấp:

- File + line number
- Lỗi cụ thể
- Code fix hoàn chỉnh, sẵn sàng apply
- Giải thích ngắn tại sao đây là fix đúng
