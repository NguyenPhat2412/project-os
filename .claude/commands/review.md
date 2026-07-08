# Review code theo checklist chuẩn của ProjectOS. Phân tích kỹ và đưa ra nhận xét có severity level rõ ràng

**File/module cần review:** $ARGUMENTS

---

## Quy trình review

Đọc `.claude/agents/code-reviewer.md` để biết đầy đủ checklist và format output.

### Bước 1 — Đọc code

Đọc file(s) được chỉ định. Nếu không chỉ định cụ thể, đọc các file đã thay đổi gần nhất (dùng `git diff` hoặc `git status`).

### Bước 2 — Review theo 10 tiêu chí

Kiểm tra lần lượt:

1. **TypeScript & Type Safety** — có `any` không? Dùng `WithId<T>` đúng chỗ không? Types đầy đủ không?
2. **Firebase & Data Access** — có gọi raw Firestore SDK trong component không? Collection dùng `createSubcollection` pattern chưa? `PROJECT_ID` import từ `@/lib/project` chưa?
3. **Security** — XSS, exposed secrets, thiếu Zod validation không?
4. **React Patterns** — `'use client'`, stable keys, không gọi mutation trong render...
5. **Component Architecture** — Modal dùng ModalShell chưa? Mutations nhận qua props từ hook không?
6. **Performance** — filter/sort không có useMemo, fetch thừa, không dùng `isLoading`...
7. **UI & Styling** — hardcoded colors (bg-white, text-black), thiếu `isLoading → Spinner`, thiếu empty state...
8. **Form & Validation** — có Zod + RHF không? Error messages dùng helper functions không?
9. **Error Handling** — mutations có `.mutateAsync()` trong try/catch không? Toast notification sau action không?
10. **Code Style** — naming conventions, dead code, import order, file size < 200 lines...

### Bước 3 — Output theo format

```markdown
## Review: {tên file(s)}

### 🔴 Critical (phải fix ngay)
- Line X: [vấn đề cụ thể] → [cách sửa]

### 🟠 Major (cần fix trước merge)
- ...

### 🟡 Minor (nên fix)
- ...

### 🔵 Suggestions (optional)
- ...

### ✅ Điểm tốt
- ...

**Kết luận:** Approve / Request Changes
**Tổng: X critical, X major, X minor issues**
```

---

## Lưu ý

- Chỉ flag issues thực sự có trong code, không flag hypothetical problems
- Kèm line number cụ thể khi có thể
- Giải thích ngắn gọn TẠI SAO là vấn đề, không chỉ nói "sai"
- Đề xuất cách sửa cụ thể (code snippet nếu cần)
