# T003A. First screen product-purpose copy 보강

- Issue: #6
- Branch: `codex/issues-6-8`
- Status: Needs Review

## Before

- 첫 화면의 설명은 "긴 스토리라인을 검토 가능한 슬라이드 단위로 정리"하는 일반 설명만 있었다.
- 최종 납품용 완성 deck이 아니라 참고용 skeleton deck이라는 한계가 첫 viewport에서 분리되어 보이지 않았다.

## After

- 첫 화면 hero copy에 대상 사용자를 "전체 프리젠테이션/제안서/리포트 스토리라인을 이미 가지고 있는 사람"으로 명시했다.
- warning icon이 있는 caution notice를 추가해 "완성 deck을 만들 수 없습니다"와 "참고용 skeleton deck" 의미를 한두 줄로 표시했다.
- README_KO의 제품 목적/한계 문구와 의미상 일치하도록 짧게 압축했다.

## Acceptance Criteria

- 대상 사용자 설명: covered.
- 완성 deck이 아니라 초기 skeleton deck 참고자료라는 경고: covered.
- 한두 줄 수준의 간결한 목적/한계 copy: covered.
- warning icon/equivalent visual treatment: covered with `AlertTriangle` caution notice.
- README/README_KO 제품 목적과 의미상 일관성: covered.
- 한국어 UI 원칙: covered.
- desktop/mobile visual check: covered.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: passed, 9 files / 30 tests.
- Browser desktop check at `http://localhost:3002/`: purpose copy and caution copy were visible in first viewport.
- Browser mobile check at 390x844: purpose copy and caution copy were present; first screen remains readable without text overlap.
