// 식품 유통 회사 데이터 구조

// 팀 구성
export const TEAMS = ['영업1팀', '영업2팀', '영업3팀', '영업4팀', '영업5팀'];

// 영업사원 30명
export const SALESPERSONS = [
    { id: 'SP001', name: '새 사원1', team: '영업1팀' },
    { id: 'SP002', name: '새 사원2', team: '영업1팀' },
    { id: 'SP003', name: '새 사원3', team: '영업1팀' },
    { id: 'SP004', name: '새 사원4', team: '영업1팀' },
    { id: 'SP005', name: '새 사원5', team: '영업1팀' },
    { id: 'SP006', name: '새 사원6', team: '영업1팀' },
    { id: 'SP007', name: '새 사원7', team: '영업2팀' },
    { id: 'SP008', name: '새 사원8', team: '영업2팀' },
    { id: 'SP009', name: '새 사원9', team: '영업2팀' },
    { id: 'SP010', name: '새 사원10', team: '영업2팀' },
    { id: 'SP011', name: '새 사원11', team: '영업2팀' },
    { id: 'SP012', name: '새 사원12', team: '영업2팀' },
    { id: 'SP013', name: '새 사원13', team: '영업3팀' },
    { id: 'SP014', name: '새 사원14', team: '영업3팀' },
    { id: 'SP015', name: '새 사원15', team: '영업3팀' },
    { id: 'SP016', name: '새 사원16', team: '영업3팀' },
    { id: 'SP017', name: '새 사원17', team: '영업3팀' },
    { id: 'SP018', name: '새 사원18', team: '영업3팀' },
    { id: 'SP019', name: '새 사원19', team: '영업4팀' },
    { id: 'SP020', name: '새 사원20', team: '영업4팀' },
    { id: 'SP021', name: '새 사원21', team: '영업4팀' },
    { id: 'SP022', name: '새 사원22', team: '영업4팀' },
    { id: 'SP023', name: '새 사원23', team: '영업4팀' },
    { id: 'SP024', name: '새 사원24', team: '영업4팀' },
    { id: 'SP025', name: '새 사원25', team: '영업5팀' },
    { id: 'SP026', name: '새 사원26', team: '영업5팀' },
    { id: 'SP027', name: '새 사원27', team: '영업5팀' },
    { id: 'SP028', name: '새 사원28', team: '영업5팀' },
    { id: 'SP029', name: '새 사원29', team: '영업5팀' },
    { id: 'SP030', name: '새 사원30', team: '영업5팀' },
];

// 품목 유형별 품목 (요청에 따라 6개 유형으로 재구성)
export const PRODUCT_TYPES = {
    '새 유형1': [ // 치즈 + 소스
        { code: 'CH001', name: '모짜렐라 치즈 1kg', unitPrice: 12000 },
        { code: 'CH002', name: '체다 치즈 슬라이스 500g', unitPrice: 8500 },
        { code: 'CH003', name: '고다 치즈 블록 1kg', unitPrice: 15000 },
        { code: 'CH004', name: '파마산 치즈 가루 200g', unitPrice: 9800 },
        { code: 'CH005', name: '크림 치즈 1kg', unitPrice: 11000 },
        { code: 'CH008', name: '까망베르 치즈 250g', unitPrice: 14500 },
        { code: 'SC001', name: '토마토 파스타 소스 1L', unitPrice: 5500 },
        { code: 'SC002', name: '크림 파스타 소스 1L', unitPrice: 6800 },
        { code: 'SC003', name: '페스토 소스 500ml', unitPrice: 8500 },
        { code: 'SC009', name: '바질 토마토 소스 1L', unitPrice: 6200 },
        { code: 'SC025', name: '발사믹 크림 소스 500ml', unitPrice: 10500 },
    ],
    '새 유형2': [ // 피자 + 빵크림
        { code: 'PZ001', name: '냉동 페퍼로니 피자 12인치', unitPrice: 8500 },
        { code: 'PZ002', name: '냉동 콤비네이션 피자 12인치', unitPrice: 9200 },
        { code: 'PZ004', name: '냉동 불고기 피자 12인치', unitPrice: 9800 },
        { code: 'PZ017', name: '피자 도우 14인치 10개입', unitPrice: 18000 },
        { code: 'BC001', name: '휘핑크림 1L', unitPrice: 8500 },
        { code: 'BC002', name: '생크림 1L', unitPrice: 9200 },
        { code: 'BC016', name: '티라미수 크림 1kg', unitPrice: 11500 },
        { code: 'BC028', name: '샹티 크림 1kg', unitPrice: 9800 },
    ],
    '새 유형3': [ // 이스트 + 유탕류
        { code: 'YS001', name: '인스턴트 드라이 이스트 500g', unitPrice: 5500 },
        { code: 'YS003', name: '생이스트 1kg', unitPrice: 4800 },
        { code: 'YS006', name: '냉동 이스트 1kg', unitPrice: 8500 },
        { code: 'DF001', name: '크림도넛 10개입', unitPrice: 12000 },
        { code: 'DF005', name: '트위스트 도넛 10개입', unitPrice: 10800 },
        { code: 'DF010', name: '야채빵 10개입', unitPrice: 11500 },
        { code: 'DF030', name: '붕어빵 10개입', unitPrice: 11000 },
    ],
    '새 유형4': [ // 밀키트
        { code: 'MK001', name: '피자 밀키트 세트', unitPrice: 25000 },
        { code: 'MK002', name: '파스타 밀키트 세트', unitPrice: 18000 },
        { code: 'MK005', name: '뇨끼 밀키트 세트', unitPrice: 20000 },
        { code: 'MK020', name: '부리또 밀키트', unitPrice: 17000 },
    ],
    '새 유형5': [ // 냉동감자
        { code: 'FP001', name: '프렌치프라이 2.5kg', unitPrice: 8500 },
        { code: 'FP002', name: '웨지 감자 2kg', unitPrice: 9200 },
        { code: 'FP003', name: '해시브라운 2kg', unitPrice: 10500 },
        { code: 'FP007', name: '토네이도 감자 1kg', unitPrice: 13500 },
    ],
    '새 유형6': [ // 소싱 상품류
        { code: 'IS001', name: '이탈리아 파스타면 5kg', unitPrice: 18000 },
        { code: 'IS003', name: '프랑스 버터 5kg', unitPrice: 55000 },
        { code: 'IS009', name: '터키 헤이즐넛 3kg', unitPrice: 35000 },
        { code: 'IS030', name: '뉴질랜드 꿀 5kg', unitPrice: 78000 },
        { code: 'DS001', name: '국내산 쌀 20kg', unitPrice: 65000 },
        { code: 'DS003', name: '국내산 설탕 10kg', unitPrice: 28000 },
        { code: 'DS009', name: '국내산 된장 10kg', unitPrice: 75000 },
        { code: 'DS030', name: '국내산 쇠고기 10kg', unitPrice: 185000 },
    ],
};

// 모든 품목을 하나의 배열로 합치기
export const ALL_PRODUCTS = Object.entries(PRODUCT_TYPES).flatMap(([type, products]) =>
    products.map(p => ({ ...p, type }))
);

// 거래처 생성 함수 (영업사원당 55개)
export function generateCustomersForSalesperson(salespersonId, salespersonName) {
    const customers = [];
    const baseNames = [
        '한국식품', '글로벌푸드', '프레시마트', '프리미엄식자재', '동네슈퍼',
        '대형마트', '편의점체인', '레스토랑그룹', '호텔식자재', '카페체인',
        '베이커리', '패밀리레스토랑', '패스트푸드', '뷔페', '이탈리안레스토랑',
        '일식당', '중식당', '한식당', '분식집', '치킨전문점',
        '피자전문점', '햄버거전문점', '샌드위치전문점', '도시락전문점', '급식업체',
        '케이터링', '식품제조', '제과점', '제빵소', '떡집',
        '도매상', '유통센터', '물류센터', '식자재마트', '온라인몰',
        '배달전문점', '포장마차', '푸드트럭', '카페테리아', '구내식당',
        '학교급식', '병원급식', '회사급식', '군부대납품', '관공서납품',
        '요양원', '어린이집', '유치원', '학원', '기숙사',
        '스포츠센터', '골프장', '리조트', '펜션', '모텔'
    ];

    for (let i = 0; i < 55; i++) {
        const code = `${salespersonId}-C${String(i + 1).padStart(3, '0')}`;
        const name = `${baseNames[i % baseNames.length]}${Math.floor(i / baseNames.length) + 1}`;
        customers.push({ code, name, salespersonId, salespersonName });
    }

    return customers;
}

// 모든 거래처 생성
export const ALL_CUSTOMERS = SALESPERSONS.flatMap(sp =>
    generateCustomersForSalesperson(sp.id, sp.name)
);

console.log(`총 영업사원: ${SALESPERSONS.length}명`);
console.log(`총 거래처: ${ALL_CUSTOMERS.length}개`);
console.log(`총 품목: ${ALL_PRODUCTS.length}개`);
