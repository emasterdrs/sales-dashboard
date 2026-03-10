---
description: 개발 완료 후 불필요한 파일 정리 및 배포를 수행하는 워크플로우
---

# 🚀 개발 완료 및 배포 워크플로우

이 워크플로우는 코드를 최신화하고, 불필요한 파일을 제거하며, 마지막으로 서버(GitHub Pages)에 배포합니다.

## 1. 불필요한 임시 파일 및 로그 삭제
// turbo
```powershell
Remove-Item -Path build_*.txt, mybuildout.txt, debug-build.js, babel_out.txt, *.log -ErrorAction SilentlyContinue
```

## 2. 빌드 상태 점검
// turbo
```powershell
npm run build
```

## 3. GitHub Pages 배포
// turbo
```powershell
npm run deploy
```

## 4. 최종 폴더 구조 정리 점검
배포 성공 후 `dist` 폴더 외에 생성된 임시 파일이 없는지 확인합니다.
