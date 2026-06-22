# Claude Code 규칙

## Git 워크플로우

- 작업은 지정된 feature 브랜치에서 진행한다.
- 작업 완료 후 반드시 main에 머지하고 push한다.

```bash
git checkout main
git merge <feature-branch>
git push origin main
```
