# 토스 Frontend Developer 면접 과제 🔥

## Getting started

```sh
yarn start
```

## Testing

아래 명령어로 더미 데이터에 기반한 구현을 테스트할 수 있습니다.

```sh
yarn test
```

### 회의실 예약,

1. 모아 놓자.
2. 날짜 선택에서 궁금한건 뭘까. 선택된날짜, 최소시작, onChange정도로 생각됨.

```
 <DatePicker selectedDate={date} minDate={formatDate(new Date())} onChange={e => setDate(e.target.value)} />
```

3. 예약현황은 시간, 룸네임, 타임라인 3가지가 한번에 보인다면 내부를 보지 않을 것 같다. UI가 그 3개로 나누어져 있기 때문에.

- HOUR_LABELS를 우리가 알아야할까? 시간 라벨인데 관련 변수인데. 우리는 시작과 끝 이외에 알아야할 필요성은 안 느껴진다.

```
  <TimeLineHeader start={9} end={20} />
```
