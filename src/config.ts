export const invitation = {
  couple: {
    groom: {
      name: '이상혁',
      shortName: '상혁',
      parents: ['이현우', '길은희'],
      relation: '장남',
    },
    bride: {
      name: '이서윤',
      shortName: '서윤',
      parents: ['이성철', '고재미'],
      relation: '장녀',
    },
  },
  wedding: {
    date: {
      dateOnly: '2026-11-01',
      display: '2026년 11월 1일 일요일 오후 2시',
    },
    venue: {
      name: '더채플앳논현',
      hall: '5층 라메르홀',
      address: '서울특별시 강남구 논현로 549',
      transport: '지하철 9호선 언주역 7번 출구 도보 3분',
    },
    greeting: [
      '11월의 첫날,',
      '따뜻한 햇살과 깊은 하늘을 닮은 두 사람이 만나',
      '평생의 계절을 함께하려고 합니다.',
      '늘 곁에서 아껴주신 소중한 분들을 모시오니',
      '귀한 걸음으로 자리를 빛내주시기 바랍니다.',
    ],
  },
  gallery: {
    previewFiles: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '11.jpg'],
  },
  accounts: [
    {
      label: '신랑 측',
      bank: '국민은행',
      number: '445302-04-127854',
      holder: '이상혁',
    },
    {
      label: '신부 측',
      bank: '하나은행',
      number: '203-910528-23707',
      holder: '이서윤',
    }
  ],
  share: {
    title: '상혁 ❤️ 서윤 결혼합니다',
  },
} as const

export const calendarDays: Array<number | null> = [
  1, 2, 3, 4, 5, 6, 7,
  8, 9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28,
  29, 30, null, null, null, null, null,
]

const locationQuery = encodeURIComponent(invitation.wedding.venue.address)
export const naverMapUrl = `https://map.naver.com/p/search/${locationQuery}`
export const kakaoMapUrl = `https://map.kakao.com/link/search/${locationQuery}`
export const tmapAndroidMapUrl = `tmap://search?name=${locationQuery}`
export const tmapIosMapUrl = `tmap://?search=${locationQuery}`
