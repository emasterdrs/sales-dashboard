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

// 품목 유형명 설정
export const TYPE_NAMES = ['새 유형1', '새 유형2', '새 유형3', '새 유형4', '새 유형5', '새 유형6'];

// 1500개 품목 생성
const generateProducts = () => {
    const products = [];
    const typeCounts = [250, 250, 250, 250, 250, 300]; // 총 1550개
    const baseNames = {
        '새 유형1': ['모짜렐라', '체다', '고다', '파마산', '크림치즈', '까망베르', '토마토소스', '크림소스', '페스토'],
        '새 유형2': ['페퍼로니피자', '콤비네이션피자', '불고기피자', '피자도우', '휘핑크림', '생크림', '티라미수'],
        '새 유형3': ['드라이이스트', '생이스트', '냉동이스트', '크림도넛', '트위스트도넛', '야채빵', '붕어빵'],
        '새 유형4': ['피자밀키트', '파스타밀키트', '뇨끼밀키트', '부리또밀키트', '스테이크밀키트'],
        '새 유형5': ['프렌치프라이', '웨지감자', '해시브라운', '토네이도감자', '알감자'],
        '새 유형6': ['파스타면', '버터', '헤이즐넛', '꿀', '국내산쌀', '설탕', '된장', '쇠고기']
    };

    TYPE_NAMES.forEach((type, idx) => {
        const count = typeCounts[idx];
        const bases = baseNames[type];
        for (let i = 1; i <= count; i++) {
            const base = bases[i % bases.length];
            const code = `${type.replace('새 유형', 'T')}-${String(i).padStart(4, '0')}`;
            const name = `${base} ${i}호`;
            const unitPrice = 5000 + Math.floor(Math.random() * 50000);
            products.push({ code, name, unitPrice, type });
        }
    });
    return products;
};

export const ALL_PRODUCTS = generateProducts();

// 거래처 생성 (영업사원 당 50~55개)
export function generateCustomersForSalesperson(salespersonId, salespersonName) {
    const customers = [];
    const count = 50 + Math.floor(Math.random() * 6); // 50~55개
    const baseNames = [
        '한국식품', '글로벌푸드', '프레시마트', '프리미엄식자재', '동네슈퍼',
        '대형마트', '편의점체인', '레스토랑그룹', '호텔식자재', '카페체인',
        '베이커리', '패밀리레스토랑', '패스트푸드', '뷔페', '이탈리안레스토랑',
        '일식당', '중식당', '한식당', '분식집', '치킨전문점',
        '피자전문점', '햄버거전문점', '샌드위치전문점', '도시락전문점', '급식업체'
    ];

    for (let i = 0; i < count; i++) {
        const code = `${salespersonId}-C${String(i + 1).padStart(3, '0')}`;
        const name = `${salespersonName}거래처 ${i + 1}호`;
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
