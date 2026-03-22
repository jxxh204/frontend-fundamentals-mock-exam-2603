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

- 룸은 무엇으로 반복되는지, 어디에 노출되는지 확인하고 싶다. map은 그대로 두고 css, html만 숨겨서 룸이름이 잘 보이도록 개선한다.

```
 <TimeLineRoom name={room.name} />
```

- 타임라인의 툴팁의 ui는 시간, 명수, 기기 종류 모두 잘 보이지만 Css는 세부사항이므로 Tooltip 컴포넌트로 분리한다.

```
  <Tooltip>
    <>
      <div>
        {res.start} ~ {res.end}
      </div>
      <div>{res.attendees}명</div>
      {res.equipment.length > 0 && (
        <div>{res.equipment.map((e: string) => EQUIPMENT_LABELS[e]).join(', ')}</div>
      )}
    </>
  </Tooltip>
```

- TimeLineTrack 컴포넌트로 UI가 더 눈에 띄도록 변경, 예약 현황의 예약과 내 예약 모두 나의 예약이다. 내 예약 코드를 보고 판단해야할듯.
