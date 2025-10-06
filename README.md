# 약속장소 추천 앱 (Vibe Coding)

카카오맵 SDK를 활용해 여러 참여자의 위치를 기반으로 최적의 만남 장소를 제안하는 프론트엔드 MVP입니다. React + Vite + TailwindCSS로 구성되어 있으며, 중앙점 계산(평균/중앙값/Minimax)과 주변 장소 추천 기능을 제공합니다.

## 주요 기능

- **참여자 관리**: 이름, 가중치, 위치(위도/경도)를 입력하거나 지도에서 직접 선택
- **추천 기준 선택**: 평균(Mean), 기하 중앙값(Median), Minimax 중 선택해 중앙좌표 계산
- **이동거리 요약**: 각 참여자별 이동거리, 총합, 최소/최대 거리 표시
- **후보 장소 TOP3**: 중앙좌표 반경 1km 내 카카오 장소 검색 결과 상위 3개 노출
- **카카오맵 연동**: 추천 좌표 또는 후보 장소를 카카오맵 링크로 바로 열기

## 환경 변수

프로젝트 루트에 `.env` 파일을 만들고 카카오 앱 키를 주입하세요. 저장소에는 템플릿으로 사용할 수 있는 `.env.example`이 포함되어 있습니다.

```bash
cp .env.example .env
# 기본으로 제공되는 키(\`f0c6ee831104d4f7be33e73418785693\`)를 그대로 사용하거나 필요 시 교체하세요.
```

> 카카오 개발자 콘솔에서 로컬 도메인(`http://localhost:5173`)과 배포 도메인을 허용 목록에 등록해야 합니다. Vite는 `import.meta.env.VITE_KAKAO_APP_KEY`를 통해 이 값을 읽어 Kakao Maps SDK를 초기화합니다.

## 개발 환경

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

## 빌드

```bash
npm run build
npm run preview
```

## 폴더 구조

```
src/
 ├─ components/    # UI 컴포넌트
 ├─ hooks/         # Kakao SDK 및 계산 훅
 ├─ types/         # 공용 타입 정의
 └─ utils/         # 거리 계산 유틸리티
```

## 참고

- 카카오맵 SDK는 클라이언트에서 로드되므로 앱 키가 노출됩니다. 반드시 도메인 제한을 설정하세요.
- Weiszfeld 알고리즘을 통해 기하 중앙값을 근사하며, Minimax는 1km 격자 탐색으로 구현되었습니다.
